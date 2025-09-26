#!/bin/bash

# 前端服务测试脚本
# 用于测试前端容器的独立运行

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否运行
check_docker() {
    log_info "检查Docker状态..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker未运行，请先启动Docker"
        exit 1
    fi
    log_success "Docker运行正常"
}

# 清理现有容器
cleanup() {
    log_info "清理现有容器..."
    docker-compose down --remove-orphans 2>/dev/null || true
    log_success "清理完成"
}

# 构建镜像
build_image() {
    log_info "构建前端镜像..."
    docker-compose build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_service() {
    log_info "启动前端服务..."
    docker-compose up -d
    log_success "前端服务启动完成"
}

# 等待服务启动
wait_for_service() {
    log_info "等待服务启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            log_success "前端服务已启动"
            return 0
        fi
        
        log_info "等待服务启动... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "服务启动超时"
    return 1
}

# 检查服务状态
check_service_status() {
    log_info "检查服务状态..."
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        log_success "容器运行正常"
    else
        log_error "容器未正常运行"
        return 1
    fi
    
    # 检查健康状态
    local container_id=$(docker-compose ps -q)
    if docker inspect --format='{{.State.Health.Status}}' $container_id | grep -q "healthy"; then
        log_success "健康检查通过"
    else
        log_warning "健康检查未通过，但服务可能仍在运行"
    fi
}

# 测试API连接
test_api_connection() {
    log_info "测试API连接..."
    
    # 检查后端API是否可访问
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "后端API连接正常"
    else
        log_warning "后端API不可访问，前端将无法正常工作"
    fi
}

# 显示访问信息
show_access_info() {
    log_info "访问信息："
    echo "  前端地址: http://localhost:3000"
    echo "  后端API: http://localhost:8000"
    echo "  API文档: http://localhost:8000/docs"
    echo ""
    log_info "容器信息："
    docker-compose ps
}

# 显示日志
show_logs() {
    log_info "显示服务日志..."
    docker-compose logs --tail=20
}

# 主函数
main() {
    log_info "开始前端服务测试..."
    
    check_docker
    cleanup
    build_image
    start_service
    
    if wait_for_service; then
        check_service_status
        test_api_connection
        show_access_info
        log_success "前端服务测试完成！"
    else
        log_error "前端服务测试失败"
        show_logs
        exit 1
    fi
}

# 脚本参数处理
case "${1:-}" in
    "logs")
        show_logs
        ;;
    "status")
        check_service_status
        ;;
    "cleanup")
        cleanup
        ;;
    "restart")
        cleanup
        start_service
        wait_for_service
        ;;
    *)
        main
        ;;
esac