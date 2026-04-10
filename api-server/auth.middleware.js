/**
 * DA Key 认证中间件
 *
 * 调用方在请求头中携带 DA Key（二选一）：
 *   Authorization: Bearer da-xxxxxxxxxxxxxxxxxxxxxxxx
 *   X-API-Key: da-xxxxxxxxxxxxxxxxxxxxxxxx
 *
 * Key 从 keys.json 文件读取验证，支持热更新（无需重启服务）。
 */

import { isValidKey } from './keys.store.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const xApiKey = req.headers['x-api-key'] || '';

  let providedKey = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    providedKey = authHeader.slice(7).trim();
  } else if (xApiKey) {
    providedKey = xApiKey.trim();
  }

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: { code: 'MISSING_KEY', message: '请提供 DA Key（Authorization: Bearer da-xxx）' },
    });
  }

  if (!isValidKey(providedKey)) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_KEY', message: 'DA Key 无效或已被吊销' },
    });
  }

  next();
};