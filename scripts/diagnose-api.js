#!/usr/bin/env node

/**
 * DA API 配置诊断脚本
 * 运行: node scripts/diagnose-api.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiServerDir = path.join(__dirname, '..', 'api-server');

console.log('🔍 DA API 配置诊断工具\n');

// 1. 检查 API Server 目录是否存在
console.log('1. 检查 API Server 目录...');
if (fs.existsSync(apiServerDir)) {
  console.log('✅ API Server 目录存在');
} else {
  console.log('❌ API Server 目录不存在');
  console.log('   路径:', apiServerDir);
  process.exit(1);
}

// 2. 检查 .env 文件
console.log('\n2. 检查环境配置...');
const envPath = path.join(apiServerDir, '.env');
const envExamplePath = path.join(apiServerDir, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env 文件存在');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const adminSecret = envContent.match(/ADMIN_SECRET=(.*)/)?.[1];
  if (adminSecret && adminSecret !== 'your-admin-secret-here') {
    console.log('✅ ADMIN_SECRET 已配置');
  } else {
    console.log('⚠️  ADMIN_SECRET 未配置或使用了默认值');
  }
} else {
  console.log('❌ .env 文件不存在');
  console.log('   建议: 复制 .env.example 为 .env 并配置');
  if (fs.existsSync(envExamplePath)) {
    console.log('   模板文件存在，可以复制使用');
  }
}

// 3. 检查 package.json
console.log('\n3. 检查 API Server 依赖...');
const packagePath = path.join(apiServerDir, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json 存在');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  console.log('   名称:', pkg.name);
  console.log('   版本:', pkg.version);
} else {
  console.log('❌ package.json 不存在');
}

// 4. 检查 keys.json 文件
console.log('\n4. 检查密钥存储...');
const keysPath = path.join(apiServerDir, 'keys.json');
if (fs.existsSync(keysPath)) {
  console.log('✅ keys.json 文件存在');
  try {
    const keys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
    const keyCount = Object.keys(keys).length;
    console.log(`   已存储密钥数量: ${keyCount}`);
  } catch (e) {
    console.log('❌ keys.json 文件格式错误');
  }
} else {
  console.log('ℹ️  keys.json 文件不存在（首次运行时会自动创建）');
}

// 5. 检查关键文件
console.log('\n5. 检查关键文件...');
const criticalFiles = ['index.js', 'auth.middleware.js', 'keys.store.js', 'routes/admin.js'];
criticalFiles.forEach(file => {
  const filePath = path.join(apiServerDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.log(`❌ ${file} 不存在`);
  }
});

console.log('\n📋 诊断完成！');
console.log('\n💡 使用建议:');
console.log('1. 如果需要启动 API Server，请在 api-server 目录下运行:');
console.log('   npm install');
console.log('   npm start');
console.log('\n2. 对于本地开发，建议配置:');
console.log('   API Server 地址: http://localhost:3100');
console.log('   Admin Secret: 留空（本地模式）');