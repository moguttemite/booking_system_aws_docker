#!/bin/bash

# Proxy快速测试脚本

echo "=== Proxy快速测试 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Docker是否运行
echo "1. 检查Docker环境..."
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}✗ Docker未运行或无法访问${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker环境正常${NC}"

# 构建镜像
echo "2. 构建Proxy测试镜像..."
docker-compose -f docker-compose.unit.yml build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 镜像构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 镜像构建成功${NC}"

# 启动服务
echo "3. 启动测试服务..."
docker-compose -f docker-compose.unit.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 服务启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 服务启动成功${NC}"

# 等待服务启动
echo "4. 等待服务启动..."
sleep 10

# 检查服务状态
echo "5. 检查服务状态..."
docker-compose -f docker-compose.unit.yml ps

# 快速测试
echo "6. 快速功能测试..."

# 测试Proxy响应
echo "6.1 测试Proxy响应..."
if curl -f http://localhost:8080/ >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Proxy服务响应正常${NC}"
else
    echo -e "${YELLOW}⚠ Proxy服务响应异常（可能是预期的，因为上游服务未运行）${NC}"
fi

# 测试健康检查
echo "6.2 测试健康检查..."
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 健康检查正常${NC}"
else
    echo -e "${YELLOW}⚠ 健康检查异常（可能是预期的，因为后端服务未运行）${NC}"
fi

# 测试Mock服务
echo "6.3 测试Mock服务..."
if curl -f http://localhost:3001/ >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Mock前端服务正常${NC}"
else
    echo -e "${RED}✗ Mock前端服务异常${NC}"
fi

if curl -f http://localhost:8001/ >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Mock后端服务正常${NC}"
else
    echo -e "${RED}✗ Mock后端服务异常${NC}"
fi

# 测试代理功能
echo "6.4 测试代理功能..."
if curl -s http://localhost:8080/ | grep -q "Mock Frontend"; then
    echo -e "${GREEN}✓ 前端代理功能正常${NC}"
else
    echo -e "${YELLOW}⚠ 前端代理功能异常${NC}"
fi

if curl -s http://localhost:8080/api/ | grep -q "Mock Backend"; then
    echo -e "${GREEN}✓ 后端代理功能正常${NC}"
else
    echo -e "${YELLOW}⚠ 后端代理功能异常${NC}"
fi

# 显示服务信息
echo ""
echo "=== 测试服务信息 ==="
echo -e "${BLUE}Proxy服务:${NC} http://localhost:8080"
echo -e "${BLUE}Mock前端:${NC} http://localhost:3001"
echo -e "${BLUE}Mock后端:${NC} http://localhost:8001"
echo -e "${BLUE}健康检查:${NC} http://localhost:8080/health"

# 显示日志
echo ""
echo "=== 最近日志 ==="
docker-compose -f docker-compose.unit.yml logs --tail=5

echo ""
echo "=== 快速测试完成 ==="
echo "运行完整测试: ./test_proxy_unit_complete.sh"
echo "停止服务: docker-compose -f docker-compose.unit.yml down"
echo "查看日志: docker-compose -f docker-compose.unit.yml logs -f"

