#!/bin/bash

# AWS Linux 项目更新脚本
# 功能：从GitHub拉取最新代码并重新部署

set -e

echo "🔄 开始更新AWS项目..."

# 检查是否在正确的目录
if [ ! -f "docker-compose.ssl-only.yml" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查Git状态
if [ ! -d ".git" ]; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

# 备份当前环境变量
if [ -f ".env" ]; then
    echo "📋 备份当前环境变量..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 环境变量已备份"
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker compose -f docker-compose.ssl-only.yml down 2>/dev/null || true

# 拉取最新代码
echo "📥 从GitHub拉取最新代码..."
git fetch origin
git reset --hard origin/master
echo "✅ 代码更新完成"

# 恢复环境变量
if [ -f ".env.backup"* ]; then
    echo "📋 恢复环境变量..."
    LATEST_BACKUP=$(ls -t .env.backup.* | head -n1)
    cp "$LATEST_BACKUP" .env
    echo "✅ 环境变量已恢复"
fi

# 重新构建并启动服务
echo "🔨 重新构建并启动服务..."
docker compose -f docker-compose.ssl-only.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker compose -f docker-compose.ssl-only.yml ps

# 测试服务
echo "🔍 测试服务..."
if curl -k -s https://localhost/health > /dev/null; then
    echo "✅ HTTPS服务测试成功"
else
    echo "⚠️  HTTPS服务测试失败，请检查日志"
fi

echo ""
echo "🎉 项目更新完成！"
echo ""
echo "📋 访问信息："
EC2_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
echo "   🌐 HTTP: http://$EC2_IP/ (自动重定向到HTTPS)"
echo "   🔒 HTTPS: https://$EC2_IP/"
echo "   🔧 API: https://$EC2_IP/api/"
echo ""
echo "📝 管理命令："
echo "   查看日志: docker compose -f docker-compose.ssl-only.yml logs -f"
echo "   停止服务: docker compose -f docker-compose.ssl-only.yml down"
echo "   重启服务: docker compose -f docker-compose.ssl-only.yml restart"
echo ""
echo "🔄 下次更新: ./update-aws.sh"
