import { useState, useEffect, useCallback, useRef } from 'react';
import type { HistoryItem } from '../types';

const DB_NAME = 'designAnalyzerDB';
const DB_VERSION = 2;
const STORE_NAME = 'history';
const MAX_HISTORY = 20; // #2: 最多保留20条

// #13: 复用单例 db 实例，避免每次操作重新 open
let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      // 连接关闭时清除缓存
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
};

const idbReq = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const useIndexedDB = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const load = async () => {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const all = await idbReq<HistoryItem[]>(tx.objectStore(STORE_NAME).getAll());
        setHistory(all.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };
    load();
  }, []);

  const addHistory = useCallback(async (item: HistoryItem) => {
    try {
      const db = await openDB();

      // #2: 超出上限时淘汰最旧记录
      const txRead = db.transaction(STORE_NAME, 'readonly');
      const all = await idbReq<HistoryItem[]>(txRead.objectStore(STORE_NAME).getAll());
      const sorted = all.sort((a, b) => b.timestamp - a.timestamp);

      if (sorted.length >= MAX_HISTORY) {
        const toDelete = sorted.slice(MAX_HISTORY - 1); // 保留 MAX-1 条，再加新的一条
        const txDel = db.transaction(STORE_NAME, 'readwrite');
        await Promise.all(toDelete.map(old => idbReq(txDel.objectStore(STORE_NAME).delete(old.id))));
        setHistory(prev => prev.filter(h => !toDelete.find(d => d.id === h.id)));
      }

      const txWrite = db.transaction(STORE_NAME, 'readwrite');
      await idbReq(txWrite.objectStore(STORE_NAME).add(item));
      setHistory(prev => [item, ...prev.filter(h => !sorted.slice(MAX_HISTORY - 1).find(d => d.id === h.id))]);
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }, []);

  const deleteHistory = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await idbReq(tx.objectStore(STORE_NAME).delete(id));
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete history:', err);
    }
  }, []);

  const clearAllHistory = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await idbReq(tx.objectStore(STORE_NAME).clear());
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }, []);

  return { history, addHistory, deleteHistory, clearAllHistory };
};