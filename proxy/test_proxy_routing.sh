#!/bin/bash

# 代理路由测试脚本

echo "=== 代理路由测试 ==="

# 测试函数
test_route() {
    local route="$1"
    local expected_status="$2"
    local description="$3"
    
    echo "测试路由: $route ($description)"
    
    # 发送HTTP请求并获取状态码
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost$route" 2>/dev/null)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✓ 通过: $route 返回状态码 $status_code"
        return 0
    else
        echo "✗ 失败: $route 期望状态码 $expected_status，实际 $status_code"
        return 1
    fi
}

# 测试HTTP头
test_headers() {
    local route="$1"
    local header_name="$2"
    local description="$3"
    
    echo "测试头信息: $route ($description)"
    
    local header_value=$(curl -s -I "http://localhost$route" 2>/dev/null | grep -i "$header_name" | head -1)
    
    if [ -n "$header_value" ]; then
        echo "✓ 通过: $route 包含头 $header_name: $header_value"
        return 0
    else
        echo "✗ 失败: $route 缺少头 $header_name"
        return 1
    fi
}

# 等待Nginx启动
echo "1. 等待Nginx启动..."
sleep 3

# 测试基本路由
echo "2. 测试基本路由..."
test_route "/" "502" "根路径（前端代理，期望502因为前端未运行）"
test_route "/api/" "502" "API路径（后端代理，期望502因为后端未运行）"
test_route "/health" "502" "健康检查路径（后端代理，期望502因为后端未运行）"

# 测试不存在的路由
echo "3. 测试不存在的路由..."
test_route "/nonexistent" "404" "不存在的路径"

# 测试HTTP头信息
echo "4. 测试HTTP头信息..."
test_headers "/" "server" "检查Server头"
test_headers "/" "content-type" "检查Content-Type头"

# 测试Gzip压缩
echo "5. 测试Gzip压缩..."
echo "测试Gzip压缩支持..."
local gzip_response=$(curl -s -H "Accept-Encoding: gzip" -I "http://localhost/" 2>/dev/null | grep -i "content-encoding")
if [ -n "$gzip_response" ]; then
    echo "✓ 通过: 支持Gzip压缩"
else
    echo "✗ 失败: 不支持Gzip压缩"
fi

# 测试代理头设置
echo "6. 测试代理头设置..."
# 这些测试需要后端服务运行才能看到效果
echo "注意: 代理头测试需要后端服务运行才能验证"

# 测试错误页面
echo "7. 测试错误页面..."
test_route "/50x.html" "404" "错误页面路径"

# 测试静态文件处理
echo "8. 测试静态文件处理..."
test_route "/favicon.ico" "404" "Favicon请求"

# 测试HTTP方法
echo "9. 测试HTTP方法..."
echo "测试GET方法..."
test_route "/" "502" "GET请求"

echo "测试POST方法..."
local post_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost/" 2>/dev/null)
echo "POST请求状态码: $post_status"

echo "测试OPTIONS方法..."
local options_status=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "http://localhost/" 2>/dev/null)
echo "OPTIONS请求状态码: $options_status"

# 测试并发请求
echo "10. 测试并发请求..."
echo "发送5个并发请求..."
for i in {1..5}; do
    curl -s -o /dev/null "http://localhost/" &
done
wait
echo "并发请求完成"

# 测试性能
echo "11. 测试性能..."
echo "测试响应时间..."
local response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost/" 2>/dev/null)
echo "响应时间: ${response_time}秒"

echo "=== 代理路由测试完成 ==="

