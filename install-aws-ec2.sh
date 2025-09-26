#!/bin/bash

# AWS EC2 部署脚本 - 2025年更新版本
# 支持 Amazon Linux 2/2023 和 Ubuntu 20.04/22.04

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

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    log_info "检测到操作系统: $OS $VERSION"
}

# 更新系统包
update_system() {
    log_info "更新系统包..."
    
    case $OS in
        "amzn")
            if [[ $VERSION == "2" ]]; then
                # Amazon Linux 2
                sudo yum update -y
                sudo amazon-linux-extras install -y docker
            else
                # Amazon Linux 2023
                sudo dnf update -y
                sudo dnf install -y docker
            fi
            ;;
        "ubuntu")
            sudo apt-get update
            sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
            ;;
        *)
            log_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac
    
    log_success "系统包更新完成"
}

# 安装Docker
install_docker() {
    log_info "安装Docker..."
    
    case $OS in
        "amzn")
            if [[ $VERSION == "2" ]]; then
                # Amazon Linux 2 - 使用Amazon Linux Extras
                sudo amazon-linux-extras install -y docker
            else
                # Amazon Linux 2023 - 使用dnf
                sudo dnf install -y docker
            fi
            ;;
        "ubuntu")
            # Ubuntu - 使用Docker官方仓库
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
    esac
    
    # 启动Docker服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 将当前用户添加到docker组
    sudo usermod -aG docker $USER
    
    log_success "Docker安装完成"
}

# 验证Docker安装
verify_docker() {
    log_info "验证Docker安装..."
    
    # 检查Docker版本
    docker --version
    docker compose version
    
    # 测试Docker运行
    sudo docker run --rm hello-world
    
    log_success "Docker验证通过"
}

# 安装必要的工具
install_tools() {
    log_info "安装必要工具..."
    
    case $OS in
        "amzn")
            if [[ $VERSION == "2" ]]; then
                sudo yum install -y git htop vim wget curl
            else
                sudo dnf install -y git htop vim wget curl
            fi
            ;;
        "ubuntu")
            sudo apt-get install -y git htop vim wget curl
            ;;
    esac
    
    log_success "工具安装完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    case $OS in
        "amzn")
            # Amazon Linux 使用iptables
            sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
            sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
            sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
            sudo service iptables save
            ;;
        "ubuntu")
            # Ubuntu 使用ufw
            sudo ufw allow 22/tcp
            sudo ufw allow 80/tcp
            sudo ufw allow 443/tcp
            sudo ufw --force enable
            ;;
    esac
    
    log_success "防火墙配置完成"
}

# 创建应用目录
create_app_directory() {
    log_info "创建应用目录..."
    
    sudo mkdir -p /opt/booking-system
    sudo chown $USER:$USER /opt/booking-system
    
    log_success "应用目录创建完成"
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
WorkingDirectory=/opt/booking-system
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable booking-system.service
    
    log_success "systemd服务创建完成"
}

# 创建日志轮转配置
create_logrotate() {
    log_info "创建日志轮转配置..."
    
    sudo tee /etc/logrotate.d/booking-system > /dev/null <<EOF
/opt/booking-system/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        /usr/bin/docker compose -f /opt/booking-system/docker-compose.prod.yml restart proxy
    endscript
}
EOF

    log_success "日志轮转配置创建完成"
}

# 创建监控脚本
create_monitoring_script() {
    log_info "创建监控脚本..."
    
    sudo tee /opt/booking-system/monitor.sh > /dev/null <<'EOF'
#!/bin/bash

# 监控脚本
LOG_FILE="/opt/booking-system/logs/monitor.log"
mkdir -p /opt/booking-system/logs

# 检查容器状态
check_containers() {
    cd /opt/booking-system
    docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}" | grep -v "Up" | wc -l
}

# 检查磁盘空间
check_disk_space() {
    df /opt/booking-system | awk 'NR==2 {print $5}' | sed 's/%//'
}

# 检查内存使用
check_memory() {
    free | awk 'NR==2{printf "%.2f", $3*100/$2}'
}

# 记录监控数据
echo "$(date): Containers down: $(check_containers), Disk usage: $(check_disk_space)%, Memory usage: $(check_memory)%" >> $LOG_FILE

# 如果容器异常，尝试重启
if [ $(check_containers) -gt 0 ]; then
    echo "$(date): Restarting containers..." >> $LOG_FILE
    cd /opt/booking-system
    docker compose -f docker-compose.prod.yml restart
fi
EOF

    sudo chmod +x /opt/booking-system/monitor.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/booking-system/monitor.sh") | crontab -
    
    log_success "监控脚本创建完成"
}

# 主函数
main() {
    log_info "开始AWS EC2部署配置..."
    
    detect_os
    update_system
    install_docker
    verify_docker
    install_tools
    configure_firewall
    create_app_directory
    create_systemd_service
    create_logrotate
    create_monitoring_script
    
    log_success "AWS EC2部署配置完成！"
    log_info "请执行以下步骤完成部署："
    echo "1. 将项目文件复制到 /opt/booking-system"
    echo "2. 配置环境变量和密钥文件"
    echo "3. 运行: sudo systemctl start booking-system"
    echo "4. 检查状态: sudo systemctl status booking-system"
    echo ""
    log_warning "注意：需要重新登录以使docker组权限生效"
}

# 执行主函数
main "$@"
