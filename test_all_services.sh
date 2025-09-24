#!/bin/bash

# 所有服务测试脚本

echo "=== 讲义予约システム - 全サービステスト ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试函数
test_service() {
    local service_name=$1
    local service_dir=$2
    local test_script=$3
    
    echo -e "${BLUE}=== 测试 $service_name 服务 ===${NC}"
    
    if [ -d "$service_dir" ]; then
        cd "$service_dir"
        
        if [ -f "$test_script" ]; then
            chmod +x "$test_script"
            ./"$test_script"
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ $service_name 测试完成${NC}"
            else
                echo -e "${RED}✗ $service_name 测试失败${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ $service_name 测试脚本不存在${NC}"
        fi
        
        cd ..
    else
        echo -e "${RED}✗ $service_name 目录不存在${NC}"
    fi
    
    echo ""
}

# 清理函数
cleanup() {
    echo -e "${YELLOW}清理所有测试容器...${NC}"
    
    # 停止并删除所有测试容器
    docker-compose -f database/docker-compose.yml down 2>/dev/null
    docker-compose -f backend/docker-compose.yml down 2>/dev/null
    docker-compose -f frontend/docker-compose.yml down 2>/dev/null
    docker-compose -f proxy/docker-compose.yml down 2>/dev/null
    
    echo -e "${GREEN}清理完成${NC}"
}

# 主菜单
show_menu() {
    echo -e "${BLUE}请选择测试选项:${NC}"
    echo "1. 测试数据库服务"
    echo "2. 测试后端服务"
    echo "3. 测试前端服务"
    echo "4. 测试代理服务"
    echo "5. 测试所有服务（按顺序）"
    echo "6. 清理所有测试容器"
    echo "7. 退出"
    echo ""
    read -p "请输入选项 (1-7): " choice
}

# 主循环
while true; do
    show_menu
    
    case $choice in
        1)
            test_service "数据库" "database" "test_database.sh"
            ;;
        2)
            test_service "后端" "backend" "test_backend.sh"
            ;;
        3)
            test_service "前端" "frontend" "test_frontend.sh"
            ;;
        4)
            test_service "代理" "proxy" "test_proxy.sh"
            ;;
        5)
            echo -e "${BLUE}=== 开始测试所有服务 ===${NC}"
            test_service "数据库" "database" "test_database.sh"
            sleep 5
            test_service "后端" "backend" "test_backend.sh"
            sleep 5
            test_service "前端" "frontend" "test_frontend.sh"
            sleep 5
            test_service "代理" "proxy" "test_proxy.sh"
            echo -e "${GREEN}=== 所有服务测试完成 ===${NC}"
            ;;
        6)
            cleanup
            ;;
        7)
            echo -e "${GREEN}退出测试脚本${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项，请重新选择${NC}"
            ;;
    esac
    
    echo ""
    read -p "按回车键继续..."
    echo ""
done
