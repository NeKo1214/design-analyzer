import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './auth.middleware.js';
import promptsRouter from './routes/prompts.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3100;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Secret'],
}));
app.use(express.json({ limit: '1mb' }));

// 健康检查（无需认证）
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '3.0.0', timestamp: new Date().toISOString() });
});

// 核心接口：需 DA Key 认证
app.use('/api/prompts', authMiddleware, promptsRouter);

// 管理接口：需 Admin Secret 或本地访问
app.use('/api/admin', adminRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '接口不存在' } });
});

// 全局错误
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

app.listen(PORT, () => {
  console.log(`\n✅ Design Analyzer API Server 启动成功`);
  console.log(`   地址:          http://localhost:${PORT}`);
  console.log(`   健康检查:       GET  /api/health`);
  console.log(`   获取分析Prompt: POST /api/prompts/analyze  (需 DA Key)`);
  console.log(`   获取重写Prompt: POST /api/prompts/rewrite  (需 DA Key)`);
  console.log(`   生成 DA Key:    POST /api/admin/keys       (需 Admin Secret)`);
  console.log(`   查看 DA Key:    GET  /api/admin/keys       (需 Admin Secret)`);
  console.log(`   吊销 DA Key:    DELETE /api/admin/keys/:key (需 Admin Secret)\n`);
});