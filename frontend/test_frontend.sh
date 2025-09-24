#!/bin/bash

# 前端服务测试脚本

echo "=== 前端服务测试 ==="

# 检查后端是否运行
echo "1. 检查后端服务..."
curl -f http://localhost:8000/health > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "警告: 后端服务未运行，前端可能无法正常工作"
    echo "建议先启动后端服务: cd ../backend && docker-compose up -d"
    echo "继续启动前端服务..."
fi

# 启动前端服务
echo "2. 启动前端服务..."
docker-compose up -d

# 等待前端启动
echo "3. 等待前端启动..."
sleep 30

# 检查容器状态
echo "4. 检查容器状态..."
docker-compose ps

# 检查健康状态
echo "5. 检查健康状态..."
curl -f http://localhost:3000 > /dev/null && echo "前端服务健康" || echo "前端服务不健康"

# 测试前端页面
echo "6. 测试前端页面..."
echo "6.1 测试首页..."
curl -s http://localhost:3000 | head -10

echo "6.2 测试API连接..."
curl -s http://localhost:3000/api/health 2>/dev/null || echo "API连接测试失败"

# 检查页面内容
echo "7. 检查页面内容..."
echo "7.1 检查是否包含Next.js内容..."
curl -s http://localhost:3000 | grep -i "next" || echo "未找到Next.js相关内容"

echo "7.2 检查页面标题..."
curl -s http://localhost:3000 | grep -i "<title>" || echo "未找到页面标题"

# 显示日志
echo "8. 显示最近日志..."
docker-compose logs --tail=20

echo "=== 前端测试完成 ==="
echo "前端地址: http://localhost:3000"
echo "API基础URL: http://localhost:8000/api"
echo "注意: 确保后端服务正在运行以获得完整功能"
