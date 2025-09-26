#!/bin/bash

# 简单的EC2部署脚本 - 无需AWS配置
# 适用于：在EC2上快速部署Docker容器

set -e

echo "🚀 开始简单EC2部署..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 创建简单的环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cat > .env << EOF
# 数据库配置
POSTGRES_DB=lecture_booking
POSTGRES_USER=lecture_admin
POSTGRES_PASSWORD=postgresroot
POSTGRES_SERVER=database
POSTGRES_PORT=5432

# 后端配置
SECRET_KEY=dev-change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=Admin#12345

# 前端配置
NEXT_PUBLIC_API_BASE_URL=/api
NODE_ENV=production

# 代理配置
FRONTEND_HOST=frontend
FRONTEND_PORT=3000
BACKEND_HOST=backend
BACKEND_PORT=8000
NGINX_LOG_LEVEL=info
EOF
    echo "✅ 环境变量文件创建完成"
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker compose -f docker-compose.ubuntu.yml down 2>/dev/null || true

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose -f docker-compose.ubuntu.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker compose -f docker-compose.ubuntu.yml ps

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 访问信息："
echo "   🌐 前端: http://$(curl -s ifconfig.me)/"
echo "   🔧 后端API: http://$(curl -s ifconfig.me)/api/"
echo "   💾 数据库: 内部访问 (端口5432)"
echo ""
echo "📝 管理命令："
echo "   查看日志: docker compose -f docker-compose.ubuntu.yml logs -f"
echo "   停止服务: docker compose -f docker-compose.ubuntu.yml down"
echo "   重启服务: docker compose -f docker-compose.ubuntu.yml restart"
echo ""
echo "⚠️  注意："
echo "   - 默认管理员: admin@example.com / Admin#12345"
echo "   - 生产环境请修改默认密码"
echo "   - 如需HTTPS，请配置域名和SSL证书"
