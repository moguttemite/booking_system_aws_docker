#!/bin/bash

# Ubuntu 2024 一键启动脚本
# 适用于测试VPS环境

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

# 检查Docker Compose版本
check_docker_compose() {
    log_info "检查Docker Compose版本..."
    if ! docker compose version > /dev/null 2>&1; then
        log_error "Docker Compose不可用，请安装Docker Compose v2"
        exit 1
    fi
    local version=$(docker compose version --short)
    log_success "Docker Compose版本: $version"
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    local total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ $total_mem -lt 2048 ]; then
        log_warning "系统内存不足2GB，可能影响性能"
    else
        log_success "系统内存: ${total_mem}MB"
    fi
    
    # 检查磁盘空间
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -gt 80 ]; then
        log_warning "磁盘使用率过高: ${disk_usage}%"
    else
        log_success "磁盘使用率: ${disk_usage}%"
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 检查ufw状态
    if command -v ufw > /dev/null 2>&1; then
        if ufw status | grep -q "Status: active"; then
            log_info "防火墙已启用，配置端口规则..."
            sudo ufw allow 22/tcp
            sudo ufw allow 80/tcp
            sudo ufw allow 443/tcp
            log_success "防火墙配置完成"
        else
            log_info "防火墙未启用，跳过配置"
        fi
    else
        log_info "未安装ufw，跳过防火墙配置"
    fi
}

# 清理现有容器
cleanup() {
    log_info "清理现有容器..."
    docker compose -f docker-compose.ubuntu.yml down --remove-orphans 2>/dev/null || true
    log_success "清理完成"
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    docker compose -f docker-compose.ubuntu.yml build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker compose -f docker-compose.ubuntu.yml up -d
    log_success "服务启动完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local all_healthy=true
        
        # 检查数据库
        local db_status=$(docker inspect --format='{{.State.Health.Status}}' booking_database_ubuntu 2>/dev/null || echo "unhealthy")
        if [ "$db_status" != "healthy" ]; then
            all_healthy=false
        fi
        
        # 检查后端
        local backend_status=$(docker inspect --format='{{.State.Health.Status}}' booking_backend_ubuntu 2>/dev/null || echo "unhealthy")
        if [ "$backend_status" != "healthy" ]; then
            all_healthy=false
        fi
        
        # 检查前端
        local frontend_status=$(docker inspect --format='{{.State.Health.Status}}' booking_frontend_ubuntu 2>/dev/null || echo "unhealthy")
        if [ "$frontend_status" != "healthy" ]; then
            all_healthy=false
        fi
        
        if [ "$all_healthy" = true ]; then
            log_success "所有服务已启动并健康"
            return 0
        fi
        
        log_info "等待服务启动... ($attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_warning "服务启动超时，但可能仍在运行"
    return 1
}

# 显示服务状态
show_status() {
    log_info "服务状态："
    docker compose -f docker-compose.ubuntu.yml ps
    
    log_info "访问信息："
    echo -e "  前端应用: ${GREEN}http://$(hostname -I | awk '{print $1}'):80${NC}"
    echo -e "  后端API: ${GREEN}http://$(hostname -I | awk '{print $1}'):80/api${NC}"
    echo -e "  健康检查: ${YELLOW}http://$(hostname -I | awk '{print $1}'):80/health${NC}"
    echo ""
    log_info "本地访问："
    echo -e "  前端应用: ${GREEN}http://localhost${NC}"
    echo -e "  后端API: ${GREEN}http://localhost/api${NC}"
    echo -e "  健康检查: ${YELLOW}http://localhost/health${NC}"
}

# 显示日志
show_logs() {
    local service="$1"
    if [ -n "$service" ]; then
        log_info "显示 $service 服务日志..."
        docker compose -f docker-compose.ubuntu.yml logs -f "$service"
    else
        log_info "显示所有服务日志..."
        docker compose -f docker-compose.ubuntu.yml logs -f
    fi
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker compose -f docker-compose.ubuntu.yml down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services
    sleep 2
    start_services
    wait_for_services
}

# 测试服务
test_services() {
    log_info "测试服务连接..."
    
    # 测试代理健康检查
    if curl -s http://localhost/health > /dev/null 2>&1; then
        log_success "代理服务正常"
    else
        log_warning "代理服务连接失败"
    fi
    
    # 测试后端API
    if curl -s http://localhost/api/health > /dev/null 2>&1; then
        log_success "后端API正常"
    else
        log_warning "后端API连接失败"
    fi
    
    # 测试前端
    if curl -s http://localhost/ | grep -q "Booking System"; then
        log_success "前端服务正常"
    else
        log_warning "前端服务连接失败"
    fi
}

# 创建systemd服务
create_systemd_service() {
    log_info "创建systemd服务..."
    
    sudo tee /etc/systemd/system/booking-system.service > /dev/null <<EOF
[Unit]
Description=Booking System Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker compose -f docker-compose.ubuntu.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.ubuntu.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable booking-system.service
    log_success "systemd服务创建完成"
}

# 主函数
main() {
    local action="${1:-start}"
    
    case "$action" in
        "start")
            log_info "开始Ubuntu测试环境部署..."
            check_docker
            check_docker_compose
            check_system_resources
            configure_firewall
            cleanup
            build_images
            start_services
            
            if wait_for_services; then
                show_status
                test_services
                create_systemd_service
                log_success "Ubuntu测试环境部署完成！"
            else
                log_warning "服务启动可能有问题，请检查日志"
                show_status
            fi
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "test")
            test_services
            ;;
        "build")
            build_images
            ;;
        "clean")
            cleanup
            ;;
        *)
            log_error "未知参数: $action"
            echo "可用参数: start, stop, restart, status, logs, test, build, clean"
            echo "示例: ./start-ubuntu.sh start"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
