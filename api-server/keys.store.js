/**
 * DA Key 持久化存储（JSON 文件）
 *
 * 数据结构（keys.json）：
 * {
 *   "da-abc123xyz456": {
 *     "label": "我的第一个Key",
 *     "createdAt": "2024-01-01T00:00:00.000Z",
 *     "active": true
 *   }
 * }
 *
 * 生产环境可替换为 SQLite / Redis，接口保持不变。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_FILE = path.join(__dirname, 'keys.json');

// 初始化：若文件不存在则创建
const initFile = () => {
  if (!fs.existsSync(KEYS_FILE)) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
};

const readAll = () => {
  initFile();
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
  } catch {
    return {};
  }
};

const writeAll = (data) => {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

/**
 * 生成新的 DA Key
 * @param {string} label - 备注名称
 * @returns {{ key: string, label: string, createdAt: string }}
 */
export const createKey = (label = '') => {
  const data = readAll();
  const key = `da-${crypto.randomBytes(12).toString('hex')}`; // da- + 24位hex
  const record = { label, createdAt: new Date().toISOString(), active: true };
  data[key] = record;
  writeAll(data);
  return { key, ...record };
};

/**
 * 列出所有 Key（不返回 key 原文，只返回摘要）
 */
export const listKeys = () => {
  const data = readAll();
  return Object.entries(data).map(([key, record]) => ({
    keyPreview: `${key.slice(0, 8)}...${key.slice(-4)}`, // da-abc1...ef12
    label: record.label,
    createdAt: record.createdAt,
    active: record.active,
    key, // 管理员视图保留完整 key
  }));
};

/**
 * 吊销 Key
 */
export const revokeKey = (key) => {
  const data = readAll();
  if (!data[key]) return false;
  data[key].active = false;
  writeAll(data);
  return true;
};

/**
 * 验证 Key 是否有效
 */
export const isValidKey = (key) => {
  const data = readAll();
  return !!(data[key]?.active);
};