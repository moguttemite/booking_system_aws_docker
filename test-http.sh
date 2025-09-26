#!/bin/bash

# 测试HTTP版本（无SSL）

echo "🧪 测试HTTP版本..."

# 停止SSL版本
echo "🛑 停止SSL版本..."
docker compose -f docker-compose.ssl-only.yml down

# 启动HTTP测试版本
echo "🚀 启动HTTP测试版本..."
docker compose -f docker-compose.test.yml up -d --build

# 等待启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查状态
echo "📊 检查状态..."
docker compose -f docker-compose.test.yml ps

# 测试连接
echo "🔍 测试连接..."
curl -v http://localhost/health
echo ""
curl -v http://52.195.16.145/health
