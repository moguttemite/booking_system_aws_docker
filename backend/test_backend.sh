#!/bin/bash

# 后端服务测试脚本

echo "=== 后端服务测试 ==="

# 检查数据库是否运行
echo "1. 检查数据库连接..."
docker run --rm --network host postgres:15-alpine pg_isready -h localhost -p 5433 -U lecture_admin -d lecture_booking

if [ $? -ne 0 ]; then
    echo "错误: 数据库未运行或无法连接"
    echo "请先启动数据库服务: cd ../database && docker-compose up -d"
    exit 1
fi

# 启动后端服务
echo "2. 启动后端服务..."
docker-compose up -d

# 等待后端启动
echo "3. 等待后端启动..."
sleep 30

# 检查容器状态
echo "4. 检查容器状态..."
docker-compose ps

# 检查健康状态
echo "5. 检查健康状态..."
curl -f http://localhost:8000/health || echo "健康检查失败"

# 测试API端点
echo "6. 测试API端点..."
echo "6.1 测试根路径..."
curl -s http://localhost:8000/ | head -5

echo "6.2 测试文档页面..."
curl -s http://localhost:8000/docs | head -5

echo "6.3 测试OpenAPI规范..."
curl -s http://localhost:8000/openapi.json | head -5

# 测试用户注册
echo "7. 测试用户注册..."
curl -X POST "http://localhost:8000/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }' || echo "用户注册测试失败"

# 测试用户登录
echo "8. 测试用户登录..."
curl -X POST "http://localhost:8000/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin1234"
  }' || echo "用户登录测试失败"

# 显示日志
echo "9. 显示最近日志..."
docker-compose logs --tail=20

echo "=== 后端测试完成 ==="
echo "API文档: http://localhost:8000/docs"
echo "健康检查: http://localhost:8000/health"
echo "OpenAPI: http://localhost:8000/api/v1/openapi.json"
