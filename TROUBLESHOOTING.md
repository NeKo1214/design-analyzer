# DA Key 生成失败排查指南

## 错误信息
"生成 Key 失败，请检查 API Server 地址与 Admin Secret"

## 可能原因及解决方案

### 1. 检查 API Server 配置
- **问题**: API Server URL 配置不正确
- **检查方法**: 
  - 打开设置面板 → 高级设置
  - 查看 "DA API Server 地址" 字段
  - 确保地址格式正确（如 `http://localhost:3100` 或 `https://your-domain.com`）
  - 确保没有多余的斜杠或空格

### 2. 检查 Admin Secret
- **问题**: Admin Secret 配置错误或缺失
- **检查方法**:
  - 打开设置面板 → 高级设置
  - 查看 "Admin Secret（DA Server 管理密钥）" 字段
  - 如果部署在本地且无安全需求，可留空
  - 如果部署在服务器，确保与 DA Server 配置的 ADMIN_SECRET 一致

### 3. 检查网络连接
- **问题**: 无法连接到 API Server
- **检查方法**:
  - 在浏览器中直接访问 `API_SERVER_URL/api/admin/keys`
  - 应该返回 JSON 格式的响应
  - 如果返回 404，说明 API Server 未正确部署
  - 如果返回 401，说明 Admin Secret 错误

### 4. 检查 DA Server 状态
- **问题**: DA Server 未运行或配置错误
- **检查方法**:
  - 确保 DA Server 正在运行
  - 检查 DA Server 的日志输出
  - 查看 DA Server 的环境变量配置

## 本地开发环境配置

### 使用默认本地配置
1. API Server 地址: `http://localhost:3100`
2. Admin Secret: 留空（本地模式）
3. 确保 DA Server 在本地运行

### 检查本地存储
- 打开浏览器开发者工具 → Application → Local Storage
- 检查 `da_apiServerUrl` 和 `da_adminSecret` 的值

## 常见问题

### Q: 如何重置配置？
A: 在设置面板中清空相关字段，或手动清除 localStorage 中的 `da_apiServerUrl` 和 `da_adminSecret`

### Q: 部署在服务器上需要注意什么？
A: 需要在 DA Server 中设置正确的 ADMIN_SECRET 环境变量，并在前端配置相同的值

### Q: 如何验证配置是否生效？
A: 点击设置面板中的「生成 Key」按钮，查看是否能成功创建新的 DA Key