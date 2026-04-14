#!/bin/bash

# Design Analyzer API Server 启动脚本

echo "🚀 启动 Design Analyzer API Server..."
echo ""

# 检查是否在正确的目录
if [ ! -d "api-server" ]; then
    echo "❌ 错误: 未找到 api-server 目录"
    echo "请确保在 design-analyzer 根目录下运行此脚本"
    exit 1
fi

# 进入 api-server 目录
cd api-server

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，使用 .env.example 作为模板"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请根据需要修改配置"
    else
        echo "❌ 未找到 .env.example 文件"
        exit 1
    fi
fi

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
fi

# 启动服务器
echo "🟢 启动服务器..."
echo "📝 配置文件: $(pwd)/.env"
echo "🌐 服务地址: http://localhost:3100"
echo "📋 管理接口: /api/admin/keys (需要 Admin Secret)"
echo ""

# 读取配置
if [ -f ".env" ]; then
    source .env
    echo "🔑 Admin Secret: ${ADMIN_SECRET:-未配置（仅允许本地访问）}"
fi

echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm start