#!/bin/bash

# Proxy单元测试启动脚本

echo "=== 启动Proxy单元测试环境 ==="

# 检查Nginx配置
echo "1. 检查Nginx配置..."
nginx -t
if [ $? -ne 0 ]; then
    echo "错误: Nginx配置无效"
    exit 1
fi

# 启动Nginx
echo "2. 启动Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# 等待Nginx启动
echo "3. 等待Nginx启动..."
sleep 5

# 检查Nginx是否运行
if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "错误: Nginx启动失败"
    exit 1
fi

echo "4. Nginx已启动，PID: $NGINX_PID"

# 运行单元测试
echo "5. 运行单元测试..."
cd /opt/tests

# 运行配置测试
echo "5.1 运行Nginx配置测试..."
./test_nginx_config.sh

# 运行代理路由测试
echo "5.2 运行代理路由测试..."
./test_proxy_routing.sh

# 运行完整单元测试
echo "5.3 运行完整单元测试..."
./test_proxy_unit.sh

echo "=== Proxy单元测试环境已就绪 ==="
echo "Nginx运行在端口80"
echo "测试脚本位于 /opt/tests/"
echo "日志位于 /var/log/nginx/"

# 保持容器运行
wait $NGINX_PID

