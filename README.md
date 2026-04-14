# Design Analyzer - 竞品设计分析工具

AI 驱动的竞品设计分析工具，支持单图深度分析和多图竞品对比。

## 🚀 快速开始

### 前端启动
```bash
npm install
npm run dev
```

### API Server 启动（可选，用于分享功能）
```bash
# 一键启动脚本
./scripts/start-api.sh

# 或手动启动
cd api-server
npm install
npm start
```

## 🛠️ 核心功能

### 分析模式
- **单图深度分析**: 对单个设计图进行全方位专业分析
- **多图竞品对比**: 最多支持4张图片的横向对比分析

### 市场方向
- **自动识别**: AI 自动判断页面类型和行业
- **国内本土**: 对标微信/美团等国内产品
- **国际化**: 对标 Apple/Google 等国际产品

### 分析维度
- **综合总览**: 整体产品定位和商业价值评估
- **产品功能**: 功能完整性和商业转化力分析
- **交互体验**: 用户体验和交互合理性评估
- **设计样式**: 视觉设计和品牌一致性分析

## 🔧 配置说明

### API 配置
1. 点击右上角「配置 API」按钮
2. 选择模型提供商（OpenAI、DeepSeek等）
3. 输入对应的 API Key
4. （可选）配置自定义模型和 API 地址

### 分享功能配置（可选）
1. 点击右上角「分享能力」按钮
2. 配置 DA API Server 地址（默认: `http://localhost:3100`）
3. 配置 Admin Secret（本地可留空）
4. 生成 DA Key 并分享给他人使用

## 🌐 API Server 配置

### 环境变量
复制 `api-server/.env.example` 为 `api-server/.env`：

```env
# 服务端口
PORT=3100

# 管理员密钥（用于生成/吊销 DA Key）
ADMIN_SECRET=your-admin-secret-here

# CORS 允许来源
CORS_ORIGIN=*
```

### 本地开发
- API Server 地址: `http://localhost:3100`
- Admin Secret: 留空（允许本地访问）
- 无需额外配置即可使用

### 生产部署
- 设置强密码的 ADMIN_SECRET
- 配置 CORS_ORIGIN 为具体域名
- 使用 HTTPS 部署

## 🔍 故障排查

### DA Key 生成失败
1. 检查 API Server 是否运行
2. 检查 API Server 地址配置是否正确
3. 检查 Admin Secret 是否匹配
4. 查看 `TROUBLESHOOTING.md` 获取详细排查指南

### 分析失败
1. 检查 API Key 是否有效
2. 检查网络连接
3. 查看控制台错误信息

## 📁 项目结构

```
design-analyzer/
├── src/                 # 前端源码
│   ├── components/      # React 组件
│   ├── constants/       # 常量配置
│   ├── hooks/           # 自定义 Hooks
│   ├── services/        # API 服务
│   ├── types/           # TypeScript 类型
│   └── utils/           # 工具函数
├── api-server/          # API Server（可选）
│   ├── routes/          # API 路由
│   └── keys.store.js    # 密钥存储
├── scripts/             # 脚本工具
└── public/              # 静态资源
```

## 🛡️ 隐私与安全

- **API Key 安全**: 所有 API Key 仅存储在浏览器本地，不会上传到任何服务器
- **数据隐私**: 分析过程直接在浏览器中进行，图片和提示词不会泄露给第三方
- **密钥管理**: DA Key 采用加密存储，支持吊销和删除

## 📄 许可证

MIT License