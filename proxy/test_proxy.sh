#!/bin/bash

# 代理服务测试脚本

echo "=== 代理服务测试 ==="

# 检查前端和后端是否运行
echo "1. 检查依赖服务..."
echo "1.1 检查前端服务..."
curl -f http://localhost:3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ 前端服务运行正常"
else
    echo "✗ 前端服务未运行，建议先启动: cd ../frontend && docker-compose up -d"
fi

echo "1.2 检查后端服务..."
curl -f http://localhost:8000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ 后端服务运行正常"
else
    echo "✗ 后端服务未运行，建议先启动: cd ../backend && docker-compose up -d"
fi

# 启动代理服务
echo "2. 启动代理服务..."
docker-compose up -d

# 等待代理启动
echo "3. 等待代理启动..."
sleep 10

# 检查容器状态
echo "4. 检查容器状态..."
docker-compose ps

# 检查健康状态
echo "5. 检查健康状态..."
curl -f http://localhost/health > /dev/null && echo "✓ 代理服务健康" || echo "✗ 代理服务不健康"

# 测试代理路由
echo "6. 测试代理路由..."
echo "6.1 测试根路径（应该代理到前端）..."
curl -s http://localhost/ | head -5

echo "6.2 测试API路径（应该代理到后端）..."
curl -s http://localhost/api/health || echo "API代理测试失败"

echo "6.3 测试健康检查端点..."
curl -s http://localhost/health || echo "健康检查端点测试失败"

# 测试HTTP头信息
echo "7. 测试HTTP头信息..."
echo "7.1 检查X-Real-IP头..."
curl -I http://localhost/ 2>/dev/null | grep -i "x-real-ip" || echo "未找到X-Real-IP头"

echo "7.2 检查X-Forwarded-For头..."
curl -I http://localhost/ 2>/dev/null | grep -i "x-forwarded-for" || echo "未找到X-Forwarded-For头"

# 测试Gzip压缩
echo "8. 测试Gzip压缩..."
curl -H "Accept-Encoding: gzip" -I http://localhost/ 2>/dev/null | grep -i "content-encoding" || echo "未检测到Gzip压缩"

# 显示日志
echo "9. 显示最近日志..."
docker-compose logs --tail=20

echo "=== 代理测试完成 ==="
echo "代理地址: http://localhost"
echo "前端代理: http://localhost/"
echo "后端API代理: http://localhost/api/"
echo "健康检查: http://localhost/health"
