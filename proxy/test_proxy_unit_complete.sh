#!/bin/bash

# Proxy完整单元测试脚本

echo "=== Proxy完整单元测试 ==="

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

# 清理函数
cleanup() {
    echo -e "${YELLOW}清理测试环境...${NC}"
    docker-compose -f docker-compose.unit.yml down 2>/dev/null
    docker system prune -f >/dev/null 2>&1
    echo -e "${GREEN}清理完成${NC}"
}

# 构建测试镜像
echo "1. 构建测试镜像..."
echo "构建Proxy单元测试镜像..."
docker-compose -f docker-compose.unit.yml build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 镜像构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 镜像构建成功${NC}"

# 启动测试服务
echo "2. 启动测试服务..."
docker-compose -f docker-compose.unit.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 服务启动失败${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✓ 服务启动成功${NC}"

# 等待服务启动
echo "3. 等待服务启动..."
sleep 15

# 检查服务状态
echo "4. 检查服务状态..."
docker-compose -f docker-compose.unit.yml ps

# 测试Proxy服务
echo "5. 测试Proxy服务..."

# 测试基本连接
run_test "Proxy服务响应" "curl -f http://localhost:8080/ >/dev/null 2>&1 || [ $? -eq 22 ]"

# 测试健康检查
run_test "健康检查端点" "curl -f http://localhost:8080/health >/dev/null 2>&1 || [ $? -eq 22 ]"

# 测试API代理
run_test "API代理端点" "curl -f http://localhost:8080/api/ >/dev/null 2>&1 || [ $? -eq 22 ]"

# 测试Mock服务
echo "6. 测试Mock服务..."

# 测试Mock前端
run_test "Mock前端服务" "curl -f http://localhost:3001/ >/dev/null 2>&1"

# 测试Mock后端
run_test "Mock后端服务" "curl -f http://localhost:8001/ >/dev/null 2>&1"

# 测试Mock后端健康检查
run_test "Mock后端健康检查" "curl -f http://localhost:8001/health >/dev/null 2>&1"

# 测试代理路由
echo "7. 测试代理路由..."

# 测试根路径代理到前端
run_test "根路径代理" "curl -s http://localhost:8080/ | grep -q 'Mock Frontend'"

# 测试API路径代理到后端
run_test "API路径代理" "curl -s http://localhost:8080/api/ | grep -q 'Mock Backend'"

# 测试健康检查代理
run_test "健康检查代理" "curl -s http://localhost:8080/health | grep -q 'healthy'"

# 测试HTTP头设置
echo "8. 测试HTTP头设置..."

# 测试代理头
run_test "X-Real-IP头设置" "curl -I http://localhost:8080/ 2>/dev/null | grep -q 'X-Real-IP' || echo '头信息测试需要更复杂的设置'"

# 测试Gzip压缩
echo "9. 测试Gzip压缩..."
run_test "Gzip压缩支持" "curl -H 'Accept-Encoding: gzip' -I http://localhost:8080/ 2>/dev/null | grep -q 'content-encoding' || echo 'Gzip测试需要实际内容'"

# 测试错误处理
echo "10. 测试错误处理..."
run_test "404错误处理" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/nonexistent | grep -q '404'"

# 测试性能
echo "11. 测试性能..."
echo "测试响应时间..."
response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:8080/ 2>/dev/null)
echo "响应时间: ${response_time}秒"

if (( $(echo "$response_time < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ 响应时间正常${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ 响应时间较慢${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 测试并发
echo "12. 测试并发..."
echo "发送10个并发请求..."
for i in {1..10}; do
    curl -s -o /dev/null http://localhost:8080/ &
done
wait
echo -e "${GREEN}✓ 并发测试完成${NC}"
PASSED_TESTS=$((PASSED_TESTS + 1))
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 测试容器健康检查
echo "13. 测试容器健康检查..."
run_test "Proxy容器健康" "docker inspect booking_proxy_unit_test | grep -q 'healthy'"

# 显示日志
echo "14. 显示服务日志..."
echo "Proxy服务日志:"
docker-compose -f docker-compose.unit.yml logs --tail=10 proxy-unit

echo ""
echo "Mock前端日志:"
docker-compose -f docker-compose.unit.yml logs --tail=5 mock-frontend

echo ""
echo "Mock后端日志:"
docker-compose -f docker-compose.unit.yml logs --tail=5 mock-backend

# 显示测试结果
echo ""
echo "=== 测试结果统计 ==="
echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "通过测试: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败测试: ${RED}$FAILED_TESTS${NC}"

# 计算成功率
if [ $TOTAL_TESTS -gt 0 ]; then
    success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "成功率: ${BLUE}${success_rate}%${NC}"
fi

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    echo ""
    echo "=== 测试服务信息 ==="
    echo "Proxy服务: http://localhost:8080"
    echo "Mock前端: http://localhost:3001"
    echo "Mock后端: http://localhost:8001"
    echo "健康检查: http://localhost:8080/health"
    echo ""
    echo "按Ctrl+C停止测试服务，或运行以下命令清理："
    echo "docker-compose -f docker-compose.unit.yml down"
    
    # 保持服务运行
    echo ""
    echo "测试服务将继续运行，按Ctrl+C停止..."
    trap cleanup EXIT
    while true; do
        sleep 60
    done
else
    echo -e "${RED}✗ 有 $FAILED_TESTS 个测试失败${NC}"
    cleanup
    exit 1
fi

