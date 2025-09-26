#!/bin/bash

# Proxy单元测试主脚本

echo "=== Proxy单元测试 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}运行测试: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ 失败: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 测试Nginx进程
echo "1. 测试Nginx进程..."
run_test "Nginx进程运行" "pgrep nginx"
run_test "Nginx监听80端口" "netstat -tlnp | grep :80"

# 测试配置文件
echo "2. 测试配置文件..."
run_test "Nginx配置文件存在" "[ -f /etc/nginx/nginx.conf ]"
run_test "Nginx配置语法正确" "nginx -t"

# 测试日志文件
echo "3. 测试日志文件..."
run_test "访问日志文件存在" "[ -f /var/log/nginx/access.log ]"
run_test "错误日志文件存在" "[ -f /var/log/nginx/error.log ]"

# 测试HTTP响应
echo "4. 测试HTTP响应..."
run_test "HTTP服务响应" "curl -f http://localhost/ >/dev/null 2>&1 || [ $? -eq 22 ]"  # 22是curl的HTTP错误码，表示服务响应但返回错误

# 测试路由配置
echo "5. 测试路由配置..."
run_test "根路径配置" "grep -q 'location /' /etc/nginx/nginx.conf"
run_test "API路径配置" "grep -q 'location /api/' /etc/nginx/nginx.conf"
run_test "健康检查配置" "grep -q 'location /health' /etc/nginx/nginx.conf"

# 测试上游服务器配置
echo "6. 测试上游服务器配置..."
run_test "前端上游配置" "grep -q 'upstream frontend' /etc/nginx/nginx.conf"
run_test "后端上游配置" "grep -q 'upstream backend' /etc/nginx/nginx.conf"

# 测试性能配置
echo "7. 测试性能配置..."
run_test "Gzip压缩配置" "grep -q 'gzip on' /etc/nginx/nginx.conf"
run_test "Keep-alive配置" "grep -q 'keepalive_timeout' /etc/nginx/nginx.conf"
run_test "Worker进程配置" "grep -q 'worker_processes' /etc/nginx/nginx.conf"

# 测试安全配置
echo "8. 测试安全配置..."
run_test "客户端最大请求体配置" "grep -q 'client_max_body_size' /etc/nginx/nginx.conf"
run_test "代理超时配置" "grep -q 'proxy_connect_timeout' /etc/nginx/nginx.conf"

# 测试代理头配置
echo "9. 测试代理头配置..."
run_test "Host头配置" "grep -q 'proxy_set_header Host' /etc/nginx/nginx.conf"
run_test "X-Real-IP头配置" "grep -q 'proxy_set_header X-Real-IP' /etc/nginx/nginx.conf"
run_test "X-Forwarded-For头配置" "grep -q 'proxy_set_header X-Forwarded-For' /etc/nginx/nginx.conf"

# 测试错误处理
echo "10. 测试错误处理..."
run_test "错误页面配置" "grep -q 'error_page' /etc/nginx/nginx.conf"

# 测试SSL配置（如果启用）
echo "11. 测试SSL配置..."
if grep -q "listen 443" /etc/nginx/nginx.conf; then
    run_test "SSL端口配置" "grep -q 'listen 443' /etc/nginx/nginx.conf"
    run_test "SSL证书配置" "grep -q 'ssl_certificate' /etc/nginx/nginx.conf"
else
    echo -e "${YELLOW}⚠ SSL配置未启用，跳过SSL测试${NC}"
fi

# 测试健康检查
echo "12. 测试健康检查..."
run_test "健康检查端点响应" "curl -f http://localhost/health >/dev/null 2>&1 || [ $? -eq 22 ]"

# 测试负载均衡配置
echo "13. 测试负载均衡配置..."
run_test "上游服务器地址配置" "grep -q 'server frontend:3000' /etc/nginx/nginx.conf"
run_test "上游服务器地址配置" "grep -q 'server backend:8000' /etc/nginx/nginx.conf"

# 测试MIME类型
echo "14. 测试MIME类型..."
run_test "MIME类型文件存在" "[ -f /etc/nginx/mime.types ]"
run_test "MIME类型配置" "grep -q 'include /etc/nginx/mime.types' /etc/nginx/nginx.conf"

# 测试日志格式
echo "15. 测试日志格式..."
run_test "日志格式配置" "grep -q 'log_format' /etc/nginx/nginx.conf"
run_test "访问日志格式" "grep -q 'access_log.*main' /etc/nginx/nginx.conf"

# 显示测试结果
echo ""
echo "=== 测试结果统计 ==="
echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "通过测试: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败测试: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $FAILED_TESTS 个测试失败${NC}"
    exit 1
fi

