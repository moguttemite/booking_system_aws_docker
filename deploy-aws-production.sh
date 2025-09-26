#!/bin/bash

# AWS Linux 生产环境部署脚本
# 适用于Amazon Linux 2023 / Amazon Linux 2

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用root用户运行此脚本"
        log_info "请使用具有sudo权限的普通用户运行"
        exit 1
    fi
}

# 检查系统类型
check_system() {
    log_info "检查系统类型..."
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        log_info "检测到系统: $NAME $VERSION"
        
        case $ID in
            "amzn")
                if [[ $VERSION_ID == "2023" ]]; then
                    log_success "Amazon Linux 2023 检测成功"
                    SYSTEM_TYPE="amazon-linux-2023"
                elif [[ $VERSION_ID == "2" ]]; then
                    log_success "Amazon Linux 2 检测成功"
                    SYSTEM_TYPE="amazon-linux-2"
                else
                    log_warning "未知的Amazon Linux版本: $VERSION_ID"
                    SYSTEM_TYPE="amazon-linux"
                fi
                ;;
            "ubuntu")
                log_success "Ubuntu 检测成功"
                SYSTEM_TYPE="ubuntu"
                ;;
            "centos"|"rhel")
                log_success "CentOS/RHEL 检测成功"
                SYSTEM_TYPE="centos"
                ;;
            *)
                log_warning "未识别的系统类型: $ID"
                SYSTEM_TYPE="unknown"
                ;;
        esac
    else
        log_error "无法检测系统类型"
        exit 1
    fi
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    local total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ $total_mem -lt 4096 ]; then
        log_warning "系统内存不足4GB，建议至少4GB内存用于生产环境"
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
    
    # 检查CPU核心数
    local cpu_cores=$(nproc)
    log_info "CPU核心数: $cpu_cores"
}

# 安装Docker和Docker Compose
install_docker() {
    log_info "安装Docker和Docker Compose..."
    
    case $SYSTEM_TYPE in
        "amazon-linux-2023")
            # Amazon Linux 2023
            sudo dnf update -y
            sudo dnf install -y docker
            sudo systemctl enable docker
            sudo systemctl start docker
            sudo usermod -aG docker $USER
            ;;
        "amazon-linux-2")
            # Amazon Linux 2
            sudo yum update -y
            sudo amazon-linux-extras install docker -y
            sudo systemctl enable docker
            sudo systemctl start docker
            sudo usermod -aG docker $USER
            ;;
        "ubuntu")
            # Ubuntu
            sudo apt-get update
            sudo apt-get install -y docker.io docker-compose-plugin
            sudo systemctl enable docker
            sudo systemctl start docker
            sudo usermod -aG docker $USER
            ;;
        "centos")
            # CentOS/RHEL
            sudo yum update -y
            sudo yum install -y docker
            sudo systemctl enable docker
            sudo systemctl start docker
            sudo usermod -aG docker $USER
            ;;
        *)
            log_error "不支持的系统类型: $SYSTEM_TYPE"
            exit 1
            ;;
    esac
    
    # 验证Docker安装
    if docker --version > /dev/null 2>&1; then
        log_success "Docker安装成功: $(docker --version)"
    else
        log_error "Docker安装失败"
        exit 1
    fi
    
    # 验证Docker Compose安装
    if docker compose version > /dev/null 2>&1; then
        log_success "Docker Compose安装成功: $(docker compose version --short)"
    else
        log_error "Docker Compose安装失败"
        exit 1
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 检查firewalld
    if systemctl is-active --quiet firewalld; then
        log_info "配置firewalld防火墙..."
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --reload
        log_success "firewalld配置完成"
    # 检查ufw
    elif command -v ufw > /dev/null 2>&1; then
        if ufw status | grep -q "Status: active"; then
            log_info "配置ufw防火墙..."
            sudo ufw allow 22/tcp
            sudo ufw allow 80/tcp
            sudo ufw allow 443/tcp
            log_success "ufw配置完成"
        else
            log_info "ufw未启用，跳过配置"
        fi
    # 检查iptables
    elif command -v iptables > /dev/null 2>&1; then
        log_info "配置iptables防火墙..."
        sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
        sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
        sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
        sudo iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
        log_success "iptables配置完成"
    else
        log_warning "未检测到防火墙，请手动配置端口22、80、443"
    fi
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    sudo mkdir -p /opt/booking-system
    sudo mkdir -p /opt/booking-system/secrets
    sudo mkdir -p /opt/booking-system/logs
    sudo mkdir -p /opt/booking-system/backups
    sudo mkdir -p /opt/booking-system/ssl
    
    # 设置权限
    sudo chown -R $USER:$USER /opt/booking-system
    sudo chmod 755 /opt/booking-system
    sudo chmod 700 /opt/booking-system/secrets
    
    log_success "目录创建完成"
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    # 检查是否已有.env文件
    if [[ -f .env ]]; then
        log_info "发现现有.env文件，备份为.env.backup"
        cp .env .env.backup
    fi
    
    # 创建生产环境.env文件
    cat > .env << EOF
# 生产环境配置
NODE_ENV=production

# 数据库配置
POSTGRES_DB=lecture_booking
POSTGRES_USER=lecture_admin
POSTGRES_SERVER=database
POSTGRES_PORT=5432

# 后端配置
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 前端配置
NEXT_PUBLIC_API_BASE_URL=/api

# 代理配置
FRONTEND_HOST=frontend
FRONTEND_PORT=3000
BACKEND_HOST=backend
BACKEND_PORT=8000
NGINX_LOG_LEVEL=info

# 生产环境必须设置
DOMAIN_NAME=${DOMAIN_NAME:-localhost}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@localhost}
AWS_REGION=${AWS_REGION:-ap-northeast-1}
CORS_ORIGINS=https://${DOMAIN_NAME:-localhost}
EOF

    log_success "环境变量配置完成"
}

# 配置secrets
setup_secrets() {
    log_info "配置secrets..."
    
    # 检查secrets目录
    if [[ ! -d secrets ]]; then
        mkdir -p secrets
    fi
    
    # 生成或检查PostgreSQL密码
    if [[ ! -f secrets/postgres_password.txt ]]; then
        log_info "生成PostgreSQL密码..."
        openssl rand -base64 32 > secrets/postgres_password.txt
        log_success "PostgreSQL密码已生成"
    else
        log_info "使用现有PostgreSQL密码"
    fi
    
    # 生成或检查JWT密钥
    if [[ ! -f secrets/secret_key.txt ]]; then
        log_info "生成JWT密钥..."
        openssl rand -base64 64 > secrets/secret_key.txt
        log_success "JWT密钥已生成"
    else
        log_info "使用现有JWT密钥"
    fi
    
    # 生成或检查超级用户密码
    if [[ ! -f secrets/superuser_password.txt ]]; then
        log_info "生成超级用户密码..."
        openssl rand -base64 16 > secrets/superuser_password.txt
        log_success "超级用户密码已生成"
    else
        log_info "使用现有超级用户密码"
    fi
    
    # 设置权限
    chmod 600 secrets/*.txt
    
    log_success "Secrets配置完成"
}

# 配置SSL证书
setup_ssl() {
    log_info "配置SSL证书..."
    
    if [[ -n "$DOMAIN_NAME" && "$DOMAIN_NAME" != "localhost" ]]; then
        log_info "配置Let's Encrypt SSL证书..."
        
        # 安装certbot
        case $SYSTEM_TYPE in
            "amazon-linux-2023"|"amazon-linux-2")
                sudo dnf install -y certbot python3-certbot-nginx 2>/dev/null || \
                sudo yum install -y certbot python3-certbot-nginx 2>/dev/null || \
                log_warning "无法安装certbot，请手动安装"
                ;;
            "ubuntu")
                sudo apt-get install -y certbot python3-certbot-nginx
                ;;
            "centos")
                sudo yum install -y certbot python3-certbot-nginx
                ;;
        esac
        
        log_info "SSL证书将在首次启动时自动配置"
    else
        log_warning "未设置DOMAIN_NAME，跳过SSL配置"
    fi
}

# 构建和启动服务
deploy_services() {
    log_info "部署服务..."
    
    # 停止现有服务
    if docker compose -f docker-compose.prod.yml ps -q | grep -q .; then
        log_info "停止现有服务..."
        docker compose -f docker-compose.prod.yml down
    fi
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker compose -f docker-compose.prod.yml up -d
    
    log_success "服务部署完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local all_healthy=true
        
        # 检查数据库
        local db_status=$(docker inspect --format='{{.State.Health.Status}}' booking_database_prod 2>/dev/null || echo "unhealthy")
        if [ "$db_status" != "healthy" ]; then
            all_healthy=false
        fi
        
        # 检查后端
        local backend_status=$(docker inspect --format='{{.State.Health.Status}}' booking_backend_prod 2>/dev/null || echo "unhealthy")
        if [ "$backend_status" != "healthy" ]; then
            all_healthy=false
        fi
        
        # 检查前端
        local frontend_status=$(docker inspect --format='{{.State.Health.Status}}' booking_frontend_prod 2>/dev/null || echo "unhealthy")
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

# 配置systemd服务
setup_systemd() {
    log_info "配置systemd服务..."
    
    sudo tee /etc/systemd/system/booking-system.service > /dev/null <<EOF
[Unit]
Description=Booking System Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable booking-system.service
    log_success "systemd服务配置完成"
}

# 配置日志轮转
setup_logrotate() {
    log_info "配置日志轮转..."
    
    sudo tee /etc/logrotate.d/booking-system > /dev/null <<EOF
/opt/booking-system/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker compose -f $(pwd)/docker-compose.prod.yml restart proxy > /dev/null 2>&1 || true
    endscript
}
EOF

    log_success "日志轮转配置完成"
}

# 显示部署信息
show_deployment_info() {
    log_info "部署信息："
    
    # 获取服务器IP
    local server_ip=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')
    
    echo ""
    echo "=========================================="
    echo "🎉 生产环境部署完成！"
    echo "=========================================="
    echo ""
    echo "访问地址："
    if [[ -n "$DOMAIN_NAME" && "$DOMAIN_NAME" != "localhost" ]]; then
        echo "  前端应用: https://$DOMAIN_NAME"
        echo "  后端API: https://$DOMAIN_NAME/api"
        echo "  健康检查: https://$DOMAIN_NAME/health"
    else
        echo "  前端应用: http://$server_ip"
        echo "  后端API: http://$server_ip/api"
        echo "  健康检查: http://$server_ip/health"
    fi
    echo ""
    echo "管理命令："
    echo "  查看状态: docker compose -f docker-compose.prod.yml ps"
    echo "  查看日志: docker compose -f docker-compose.prod.yml logs -f"
    echo "  重启服务: sudo systemctl restart booking-system"
    echo "  停止服务: sudo systemctl stop booking-system"
    echo ""
    echo "重要文件："
    echo "  配置文件: $(pwd)/.env"
    echo "  Secrets: $(pwd)/secrets/"
    echo "  日志目录: /opt/booking-system/logs/"
    echo "  备份目录: /opt/booking-system/backups/"
    echo ""
    echo "=========================================="
}

# 测试服务
test_services() {
    log_info "测试服务连接..."
    
    local server_ip=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')
    
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

# 主函数
main() {
    local action="${1:-deploy}"
    
    case "$action" in
        "deploy")
            log_info "开始AWS Linux生产环境部署..."
            check_root
            check_system
            check_system_resources
            install_docker
            configure_firewall
            create_directories
            setup_environment
            setup_secrets
            setup_ssl
            deploy_services
            
            if wait_for_services; then
                setup_systemd
                setup_logrotate
                test_services
                show_deployment_info
                log_success "AWS Linux生产环境部署完成！"
            else
                log_warning "服务启动可能有问题，请检查日志"
                docker compose -f docker-compose.prod.yml ps
            fi
            ;;
        "update")
            log_info "更新服务..."
            deploy_services
            wait_for_services
            test_services
            log_success "服务更新完成"
            ;;
        "stop")
            log_info "停止服务..."
            docker compose -f docker-compose.prod.yml down
            log_success "服务已停止"
            ;;
        "restart")
            log_info "重启服务..."
            docker compose -f docker-compose.prod.yml restart
            wait_for_services
            test_services
            log_success "服务重启完成"
            ;;
        "status")
            docker compose -f docker-compose.prod.yml ps
            ;;
        "logs")
            docker compose -f docker-compose.prod.yml logs -f "${2:-}"
            ;;
        "test")
            test_services
            ;;
        *)
            log_error "未知参数: $action"
            echo "可用参数: deploy, update, stop, restart, status, logs, test"
            echo "示例: ./deploy-aws-production.sh deploy"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
