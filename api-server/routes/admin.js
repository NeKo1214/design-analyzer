/**
 * DA Key 管理接口（仅内部管理员使用）
 *
 * 所有接口需携带管理员密钥：
 *   X-Admin-Secret: <ADMIN_SECRET 环境变量值>
 *
 * POST   /api/admin/keys          生成新 DA Key
 * GET    /api/admin/keys          列出所有 DA Key
 * DELETE /api/admin/keys/:key     吊销指定 DA Key
 * POST   /api/admin/keys/:key/reactivate 重新激活 DA Key
 */

import { Router } from 'express';
import { createKey, listKeys, revokeKey, reactivateKey, deleteKey } from '../keys.store.js';

const router = Router();

// 管理员鉴权中间件
const adminAuth = (req, res, next) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    // 未配置 ADMIN_SECRET 时，仅允许本地 localhost 访问
    const ip = req.ip || req.connection?.remoteAddress || '';
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '请配置 ADMIN_SECRET 环境变量以启用远程管理' },
      });
    }
    return next();
  }
  const provided = req.headers['x-admin-secret'] || '';
  if (provided !== secret) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin Secret 错误' },
    });
  }
  next();
};

router.use(adminAuth);

// POST /api/admin/keys — 生成新 DA Key
router.post('/keys', (req, res) => {
  const { label = '' } = req.body;
  const result = createKey(label);
  res.json({
    success: true,
    data: result,
    tip: '⚠️ 请立即复制 key 字段，后续接口不再返回完整 Key',
  });
});

// GET /api/admin/keys — 列出所有 DA Key
router.get('/keys', (_req, res) => {
  const keys = listKeys();
  res.json({
    success: true,
    data: {
      total: keys.length,
      active: keys.filter(k => k.active).length,
      keys,
    },
  });
});

// DELETE /api/admin/keys/:key — 吊销 DA Key
router.delete('/keys/:key', (req, res) => {
  const { key } = req.params;
  const ok = revokeKey(key);
  if (!ok) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Key 不存在' },
    });
  }
  res.json({ success: true, message: `DA Key 已吊销` });
});

// POST /api/admin/keys/:key/reactivate — 重新激活 DA Key
router.post('/keys/:key/reactivate', (req, res) => {
  const { key } = req.params;
  const ok = reactivateKey(key);
  if (!ok) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Key 不存在' },
    });
  }
  res.json({ success: true, message: `DA Key 已重新激活` });
});

// DELETE /api/admin/keys/:key/permanent — 永久删除 DA Key（仅已吊销）
router.delete('/keys/:key/permanent', (req, res) => {
  const { key } = req.params;
  const ok = deleteKey(key);
  if (!ok) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Key 不存在' },
    });
  }
  res.json({ success: true, message: `DA Key 已永久删除` });
});

export default router;