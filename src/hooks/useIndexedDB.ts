import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem } from '../types';

const DB_NAME = 'designAnalyzerDB';
const DB_VERSION = 2;
const STORE_NAME = 'history';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
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

  // 初始化加载历史记录
  useEffect(() => {
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
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await idbReq(tx.objectStore(STORE_NAME).add(item));
      setHistory(prev => [item, ...prev]);
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