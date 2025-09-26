#!/bin/bash

# SSL部署调试脚本

echo "🔍 SSL部署调试..."

# 检查容器状态
echo "📊 容器状态："
docker compose -f docker-compose.ssl-only.yml ps

echo ""
echo "🔍 检查SSL证书："
if [ -f "ssl_certs/cert.pem" ] && [ -f "ssl_certs/key.pem" ]; then
    echo "✅ SSL证书文件存在"
    ls -la ssl_certs/
else
    echo "❌ SSL证书文件不存在"
fi

echo ""
echo "🔍 检查端口占用："
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

echo ""
echo "🔍 检查防火墙："
sudo systemctl status firewalld --no-pager

echo ""
echo "🔍 检查proxy容器日志："
docker compose -f docker-compose.ssl-only.yml logs proxy

echo ""
echo "🔍 测试本地连接："
curl -k -v http://localhost/health 2>&1 | head -10

echo ""
echo "🔍 检查容器内部："
docker exec booking_proxy_ssl ls -la /etc/nginx/ssl/ 2>/dev/null || echo "无法访问容器内部"
