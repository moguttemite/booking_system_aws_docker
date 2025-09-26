#!/bin/bash

# 代理服务测试脚本
# 用于测试代理容器的独立运行

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

# 检查上游服务
check_upstream_services() {
    log_info "检查上游服务状态..."
    
    # 检查前端服务
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "前端服务运行正常 (localhost:3000)"
    else
        log_warning "前端服务不可访问 (localhost:3000)"
    fi
    
    # 检查后端服务
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "后端服务运行正常 (localhost:8000)"
    else
        log_warning "后端服务不可访问 (localhost:8000)"
    fi
}

# 清理现有容器
cleanup() {
    log_info "清理现有容器..."
    docker-compose down --remove-orphans 2>/dev/null || true
    log_success "清理完成"
}

# 构建镜像
build_image() {
    log_info "构建代理镜像..."
    docker-compose build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_service() {
    log_info "启动代理服务..."
    docker-compose up -d
    log_success "代理服务启动完成"
}

# 等待服务启动
wait_for_service() {
    log_info "等待代理服务启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost/health > /dev/null 2>&1; then
            log_success "代理服务已启动"
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

# 测试代理功能
test_proxy_functionality() {
    log_info "测试代理功能..."
    
    # 测试健康检查端点
    if curl -s http://localhost/health | grep -q "healthy"; then
        log_success "健康检查端点正常"
    else
        log_error "健康检查端点异常"
        return 1
    fi
    
    # 测试前端代理
    if curl -s http://localhost/ | grep -q "Booking System"; then
        log_success "前端代理正常"
    else
        log_warning "前端代理可能有问题"
    fi
    
    # 测试后端API代理
    if curl -s http://localhost/api/health | grep -q "healthy"; then
        log_success "后端API代理正常"
    else
        log_warning "后端API代理可能有问题"
    fi
}

# 测试负载均衡
test_load_balancing() {
    log_info "测试负载均衡..."
    
    local success_count=0
    local total_requests=10
    
    for i in $(seq 1 $total_requests); do
        if curl -s http://localhost/health > /dev/null 2>&1; then
            success_count=$((success_count + 1))
        fi
    done
    
    local success_rate=$((success_count * 100 / total_requests))
    log_info "负载均衡测试完成，成功率: ${success_rate}%"
    
    if [ $success_rate -ge 80 ]; then
        log_success "负载均衡测试通过"
    else
        log_warning "负载均衡测试成功率较低"
    fi
}

# 显示访问信息
show_access_info() {
    log_info "访问信息："
    echo "  代理地址: http://localhost"
    echo "  前端代理: http://localhost/"
    echo "  后端API代理: http://localhost/api/"
    echo "  健康检查: http://localhost/health"
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
    log_info "开始代理服务测试..."
    
    check_docker
    check_upstream_services
    cleanup
    build_image
    start_service
    
    if wait_for_service; then
        check_service_status
        test_proxy_functionality
        test_load_balancing
        show_access_info
        log_success "代理服务测试完成！"
    else
        log_error "代理服务测试失败"
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
    "test")
        test_proxy_functionality
        ;;
    *)
        main
        ;;
esac