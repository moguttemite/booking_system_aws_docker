#!/bin/bash

# SSL部署和更新脚本
# 功能：在EC2上部署/更新带SSL的Docker容器，无需域名和AWS配置
# 用法：./deploy-ssl-only.sh [start|update|stop|restart|logs|status]

set -e

ACTION=${1:-start}

echo "🔒 SSL部署脚本 - 操作: $ACTION"

# 检查Docker环境
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    echo "安装命令："
    echo "  Amazon Linux 2: sudo yum install -y docker-compose-plugin"
    echo "  Ubuntu: sudo apt-get install docker-compose-plugin"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 根据操作类型执行不同逻辑
case $ACTION in
    "start")
        echo "🚀 开始部署..."
        ;;
    "update")
        echo "🔄 开始更新..."
        # 备份环境变量
        if [ -f ".env" ]; then
            cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
            echo "📋 环境变量已备份"
        fi
        # 停止现有服务
        docker compose -f docker-compose.ssl-only.yml down 2>/dev/null || true
        # 拉取最新代码
        if [ -d ".git" ]; then
            git pull origin master
            echo "📥 代码已更新"
        fi
        ;;
    "stop")
        echo "🛑 停止服务..."
        docker compose -f docker-compose.ssl-only.yml down
        echo "✅ 服务已停止"
        exit 0
        ;;
    "restart")
        echo "🔄 重启服务..."
        docker compose -f docker-compose.ssl-only.yml restart
        echo "✅ 服务已重启"
        exit 0
        ;;
    "logs")
        echo "📋 显示服务日志..."
        docker compose -f docker-compose.ssl-only.yml logs -f
        exit 0
        ;;
    "status")
        echo "📊 服务状态："
        docker compose -f docker-compose.ssl-only.yml ps
        exit 0
        ;;
    *)
        echo "❌ 未知操作: $ACTION"
        echo "可用操作: start, update, stop, restart, logs, status"
        exit 1
        ;;
esac

# 获取EC2公网IP
EC2_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
echo "🌐 检测到EC2 IP: $EC2_IP"

# 创建环境变量文件（仅在start操作时）
if [ "$ACTION" = "start" ] && [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cat > .env << EOF
# 数据库配置
POSTGRES_DB=lecture_booking
POSTGRES_USER=lecture_admin
POSTGRES_PASSWORD=postgresroot
POSTGRES_SERVER=database
POSTGRES_PORT=5432

# 后端配置
SECRET_KEY=dev-change-me-in-production-$(date +%s)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=Admin#12345
CORS_ORIGINS=https://$EC2_IP,http://$EC2_IP

# 前端配置
NEXT_PUBLIC_API_BASE_URL=/api
NODE_ENV=production

# 代理配置
NGINX_LOG_LEVEL=info
EOF
    echo "✅ 环境变量文件创建完成"
fi

# 创建SSL证书目录
echo "🔐 准备SSL证书..."
mkdir -p ssl_certs

# 生成自签名SSL证书（仅在start操作时）
if [ "$ACTION" = "start" ] && ([ ! -f ssl_certs/cert.pem ] || [ ! -f ssl_certs/key.pem ]); then
    echo "📜 生成自签名SSL证书..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl_certs/key.pem \
        -out ssl_certs/cert.pem \
        -subj "/C=JP/ST=Tokyo/L=Tokyo/O=BookingSystem/OU=IT/CN=$EC2_IP" \
        -addext "subjectAltName=IP:$EC2_IP,DNS:localhost"
    echo "✅ 自签名SSL证书生成完成"
else
    echo "✅ SSL证书已存在"
fi

# 停止现有容器（仅在start操作时）
if [ "$ACTION" = "start" ]; then
    echo "🛑 停止现有容器..."
    docker compose -f docker-compose.ssl-only.yml down 2>/dev/null || true
fi

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose -f docker-compose.ssl-only.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker compose -f docker-compose.ssl-only.yml ps

# 测试SSL连接
echo "🔍 测试SSL连接..."
if curl -k -s https://localhost/health > /dev/null; then
    echo "✅ HTTPS连接测试成功"
else
    echo "⚠️  HTTPS连接测试失败，请检查配置"
fi

echo ""
if [ "$ACTION" = "start" ]; then
    echo "🎉 SSL部署完成！"
elif [ "$ACTION" = "update" ]; then
    echo "🎉 SSL更新完成！"
fi
echo ""
echo "📋 访问信息："
echo "   🌐 HTTP (自动重定向到HTTPS): http://$EC2_IP/"
echo "   🔒 HTTPS: https://$EC2_IP/"
echo "   🔧 后端API: https://$EC2_IP/api/"
echo "   💾 数据库: 内部访问 (端口5432)"
echo ""
echo "🔐 SSL证书信息："
echo "   - 使用自签名证书（浏览器会显示安全警告）"
echo "   - 证书有效期：365天"
echo "   - 支持IP: $EC2_IP"
echo "   - 支持域名: localhost"
echo ""
echo "📝 管理命令："
echo "   查看日志: ./deploy-ssl-only.sh logs"
echo "   停止服务: ./deploy-ssl-only.sh stop"
echo "   重启服务: ./deploy-ssl-only.sh restart"
echo "   查看状态: ./deploy-ssl-only.sh status"
echo "   更新项目: ./deploy-ssl-only.sh update"
echo ""
echo "⚠️  重要提示："
echo "   - 默认管理员: admin@example.com / Admin#12345"
echo "   - 生产环境请修改默认密码"
echo "   - 浏览器会显示SSL安全警告，点击'高级'->'继续访问'"
echo "   - 如需正式SSL证书，请配置域名后使用Let's Encrypt"
