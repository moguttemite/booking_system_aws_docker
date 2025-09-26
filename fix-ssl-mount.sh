#!/bin/bash

# 修复SSL证书挂载问题

echo "🔧 修复SSL证书挂载..."

# 停止服务
echo "🛑 停止服务..."
docker compose -f docker-compose.ssl-only.yml down

# 检查证书文件
echo "📁 检查证书文件..."
if [ ! -f "ssl_certs/cert.pem" ] || [ ! -f "ssl_certs/key.pem" ]; then
    echo "❌ SSL证书文件不存在，重新生成..."
    rm -rf ssl_certs/*
    EC2_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl_certs/key.pem \
        -out ssl_certs/cert.pem \
        -subj "/C=JP/ST=Tokyo/L=Tokyo/O=BookingSystem/OU=IT/CN=$EC2_IP" \
        -addext "subjectAltName=IP:$EC2_IP,DNS:localhost"
    echo "✅ SSL证书重新生成完成"
else
    echo "✅ SSL证书文件存在"
fi

# 检查证书权限
echo "🔐 设置证书权限..."
chmod 644 ssl_certs/cert.pem
chmod 600 ssl_certs/key.pem

# 重新启动服务
echo "🚀 重新启动服务..."
docker compose -f docker-compose.ssl-only.yml up -d

# 等待启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查状态
echo "📊 检查状态..."
docker compose -f docker-compose.ssl-only.yml ps

# 测试连接
echo "🔍 测试连接..."
curl -k -v https://localhost/health
