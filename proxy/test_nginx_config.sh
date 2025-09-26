#!/bin/bash

# Nginx配置测试脚本

echo "=== Nginx配置测试 ==="

# 测试函数
test_nginx_config() {
    local test_name="$1"
    local expected_result="$2"
    local command="$3"
    
    echo "测试: $test_name"
    
    if eval "$command" >/dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            echo "✓ 通过: $test_name"
            return 0
        else
            echo "✗ 失败: $test_name (应该失败但成功了)"
            return 1
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo "✓ 通过: $test_name (按预期失败)"
            return 0
        else
            echo "✗ 失败: $test_name (应该成功但失败了)"
            return 1
        fi
    fi
}

# 测试Nginx配置语法
echo "1. 测试Nginx配置语法..."
test_nginx_config "配置语法检查" "success" "nginx -t"

# 测试配置文件存在
echo "2. 测试配置文件..."
test_nginx_config "主配置文件存在" "success" "[ -f /etc/nginx/nginx.conf ]"
test_nginx_config "MIME类型文件存在" "success" "[ -f /etc/nginx/mime.types ]"

# 测试关键配置项
echo "3. 测试关键配置项..."
test_nginx_config "包含upstream frontend" "success" "grep -q 'upstream frontend' /etc/nginx/nginx.conf"
test_nginx_config "包含upstream backend" "success" "grep -q 'upstream backend' /etc/nginx/nginx.conf"
test_nginx_config "包含location /" "success" "grep -q 'location /' /etc/nginx/nginx.conf"
test_nginx_config "包含location /api/" "success" "grep -q 'location /api/' /etc/nginx/nginx.conf"
test_nginx_config "包含location /health" "success" "grep -q 'location /health' /etc/nginx/nginx.conf"

# 测试Gzip配置
echo "4. 测试Gzip配置..."
test_nginx_config "启用Gzip压缩" "success" "grep -q 'gzip on' /etc/nginx/nginx.conf"
test_nginx_config "包含Gzip类型" "success" "grep -q 'gzip_types' /etc/nginx/nginx.conf"

# 测试日志配置
echo "5. 测试日志配置..."
test_nginx_config "配置访问日志" "success" "grep -q 'access_log' /etc/nginx/nginx.conf"
test_nginx_config "配置错误日志" "success" "grep -q 'error_log' /etc/nginx/nginx.conf"

# 测试端口配置
echo "6. 测试端口配置..."
test_nginx_config "监听80端口" "success" "grep -q 'listen 80' /etc/nginx/nginx.conf"

# 测试代理头配置
echo "7. 测试代理头配置..."
test_nginx_config "配置Host头" "success" "grep -q 'proxy_set_header Host' /etc/nginx/nginx.conf"
test_nginx_config "配置X-Real-IP头" "success" "grep -q 'proxy_set_header X-Real-IP' /etc/nginx/nginx.conf"
test_nginx_config "配置X-Forwarded-For头" "success" "grep -q 'proxy_set_header X-Forwarded-For' /etc/nginx/nginx.conf"

# 测试超时配置
echo "8. 测试超时配置..."
test_nginx_config "配置连接超时" "success" "grep -q 'proxy_connect_timeout' /etc/nginx/nginx.conf"
test_nginx_config "配置发送超时" "success" "grep -q 'proxy_send_timeout' /etc/nginx/nginx.conf"
test_nginx_config "配置读取超时" "success" "grep -q 'proxy_read_timeout' /etc/nginx/nginx.conf"

echo "=== Nginx配置测试完成 ==="

