#!/bin/bash

# AWS快速部署脚本
# 一键部署到AWS Linux生产环境

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

# 显示欢迎信息
show_welcome() {
    echo ""
    echo "=========================================="
    echo "🚀 Booking System AWS 快速部署"
    echo "=========================================="
    echo ""
    echo "此脚本将帮助您快速部署预订系统到AWS Linux环境"
    echo ""
}

# 收集部署信息
collect_deployment_info() {
    log_info "收集部署信息..."
    
    # 域名
    read -p "请输入您的域名 (例如: booking.example.com) [回车跳过]: " DOMAIN_NAME
    if [[ -z "$DOMAIN_NAME" ]]; then
        DOMAIN_NAME="localhost"
        log_warning "使用localhost作为域名，将无法使用HTTPS"
    fi
    
    # 管理员邮箱
    read -p "请输入管理员邮箱 (用于SSL证书) [admin@example.com]: " ADMIN_EMAIL
    if [[ -z "$ADMIN_EMAIL" ]]; then
        ADMIN_EMAIL="admin@example.com"
    fi
    
    # AWS区域
    read -p "请输入AWS区域 [ap-northeast-1]: " AWS_REGION
    if [[ -z "$AWS_REGION" ]]; then
        AWS_REGION="ap-northeast-1"
    fi
    
    # 是否配置AWS CloudWatch
    read -p "是否配置AWS CloudWatch日志？(y/n) [y]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        CONFIGURE_CLOUDWATCH=false
    else
        CONFIGURE_CLOUDWATCH=true
    fi
    
    # 是否配置SSL
    if [[ "$DOMAIN_NAME" != "localhost" ]]; then
        read -p "是否配置SSL证书？(y/n) [y]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            CONFIGURE_SSL=false
        else
            CONFIGURE_SSL=true
        fi
    else
        CONFIGURE_SSL=false
    fi
    
    # 显示配置摘要
    echo ""
    echo "=========================================="
    echo "📋 部署配置摘要"
    echo "=========================================="
    echo "域名: $DOMAIN_NAME"
    echo "管理员邮箱: $ADMIN_EMAIL"
    echo "AWS区域: $AWS_REGION"
    echo "CloudWatch日志: $CONFIGURE_CLOUDWATCH"
    echo "SSL证书: $CONFIGURE_SSL"
    echo "=========================================="
    echo ""
    
    read -p "确认开始部署？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
}

# 设置环境变量
setup_environment_variables() {
    log_info "设置环境变量..."
    
    export DOMAIN_NAME="$DOMAIN_NAME"
    export ADMIN_EMAIL="$ADMIN_EMAIL"
    export AWS_REGION="$AWS_REGION"
    export CORS_ORIGINS="https://$DOMAIN_NAME"
    
    # 创建.env文件
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

# 生产环境配置
DOMAIN_NAME=$DOMAIN_NAME
ADMIN_EMAIL=$ADMIN_EMAIL
AWS_REGION=$AWS_REGION
CORS_ORIGINS=$CORS_ORIGINS
EOF

    log_success "环境变量设置完成"
}

# 配置AWS环境
configure_aws_environment() {
    if [[ "$CONFIGURE_CLOUDWATCH" == "true" ]]; then
        log_info "配置AWS环境..."
        
        if [[ -f setup-aws-environment.sh ]]; then
            chmod +x setup-aws-environment.sh
            ./setup-aws-environment.sh "$DOMAIN_NAME"
        else
            log_warning "AWS环境配置脚本不存在，跳过AWS配置"
        fi
    else
        log_info "跳过AWS环境配置"
    fi
}

# 部署服务
deploy_services() {
    log_info "部署服务..."
    
    # 使用AWS专用的Docker Compose文件
    if [[ -f docker-compose.aws.yml ]]; then
        log_info "使用AWS专用配置部署..."
        
        # 停止现有服务
        if docker compose -f docker-compose.aws.yml ps -q | grep -q .; then
            log_info "停止现有服务..."
            docker compose -f docker-compose.aws.yml down
        fi
        
        # 构建和启动服务
        log_info "构建Docker镜像..."
        docker compose -f docker-compose.aws.yml build --no-cache
        
        log_info "启动服务..."
        docker compose -f docker-compose.aws.yml up -d
        
        # 等待服务启动
        log_info "等待服务启动..."
        sleep 30
        
        # 检查服务状态
        docker compose -f docker-compose.aws.yml ps
        
    else
        log_warning "AWS专用配置文件不存在，使用通用配置..."
        
        if [[ -f deploy-aws-production.sh ]]; then
            chmod +x deploy-aws-production.sh
            ./deploy-aws-production.sh deploy
        else
            log_error "部署脚本不存在"
            exit 1
        fi
    fi
}

# 配置SSL证书
configure_ssl() {
    if [[ "$CONFIGURE_SSL" == "true" && "$DOMAIN_NAME" != "localhost" ]]; then
        log_info "配置SSL证书..."
        
        # 等待代理服务启动
        log_info "等待代理服务启动..."
        sleep 10
        
        # 获取SSL证书
        log_info "获取Let's Encrypt SSL证书..."
        docker exec booking_certbot_aws certbot certonly \
            --webroot -w /var/www/certbot \
            -d "$DOMAIN_NAME" \
            --agree-tos \
            -m "$ADMIN_EMAIL" \
            --non-interactive || log_warning "SSL证书获取失败，请检查域名配置"
        
        # 重启代理服务以加载SSL证书
        log_info "重启代理服务..."
        docker compose -f docker-compose.aws.yml restart proxy
        
        log_success "SSL证书配置完成"
    else
        log_info "跳过SSL证书配置"
    fi
}

# 测试部署
test_deployment() {
    log_info "测试部署..."
    
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

# 显示部署结果
show_deployment_result() {
    local server_ip=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')
    
    echo ""
    echo "=========================================="
    echo "🎉 部署完成！"
    echo "=========================================="
    echo ""
    echo "访问地址："
    if [[ "$DOMAIN_NAME" != "localhost" && "$CONFIGURE_SSL" == "true" ]]; then
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
    echo "  查看状态: docker compose -f docker-compose.aws.yml ps"
    echo "  查看日志: docker compose -f docker-compose.aws.yml logs -f"
    echo "  重启服务: docker compose -f docker-compose.aws.yml restart"
    echo "  停止服务: docker compose -f docker-compose.aws.yml down"
    echo ""
    echo "重要文件："
    echo "  配置文件: $(pwd)/.env"
    echo "  Secrets: $(pwd)/secrets/"
    echo "  日志目录: /opt/booking-system/logs/"
    echo ""
    echo "=========================================="
}

# 主函数
main() {
    show_welcome
    collect_deployment_info
    setup_environment_variables
    configure_aws_environment
    deploy_services
    configure_ssl
    test_deployment
    show_deployment_result
    
    log_success "AWS快速部署完成！"
}

# 执行主函数
main "$@"
