#!/bin/bash

# 检查SSL证书挂载

echo "🔍 检查SSL证书..."

# 检查宿主机证书
echo "📁 宿主机证书："
ls -la ssl_certs/

# 检查容器内证书
echo "📁 容器内证书："
docker exec booking_proxy_ssl ls -la /etc/nginx/ssl/ 2>/dev/null || echo "无法访问容器或证书目录不存在"

# 检查nginx配置
echo "📄 nginx配置："
docker exec booking_proxy_ssl cat /etc/nginx/nginx.conf | head -20

# 检查nginx错误日志
echo "📋 nginx错误日志："
docker exec booking_proxy_ssl cat /var/log/nginx/error.log 2>/dev/null || echo "错误日志不存在或无法访问"
