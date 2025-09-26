#!/bin/bash

# AWS环境配置脚本
# 用于配置AWS CloudWatch、IAM角色等

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

# 检查AWS CLI
check_aws_cli() {
    log_info "检查AWS CLI..."
    
    if ! command -v aws > /dev/null 2>&1; then
        log_info "安装AWS CLI..."
        case $(uname -s) in
            "Linux")
                curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
                unzip awscliv2.zip
                sudo ./aws/install
                rm -rf aws awscliv2.zip
                ;;
            "Darwin")
                curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
                sudo installer -pkg AWSCLIV2.pkg -target /
                rm AWSCLIV2.pkg
                ;;
            *)
                log_error "不支持的操作系统"
                exit 1
                ;;
        esac
    fi
    
    if aws --version > /dev/null 2>&1; then
        log_success "AWS CLI已安装: $(aws --version)"
    else
        log_error "AWS CLI安装失败"
        exit 1
    fi
}

# 配置AWS凭证
setup_aws_credentials() {
    log_info "配置AWS凭证..."
    
    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
        log_warning "未设置AWS凭证环境变量"
        log_info "请设置以下环境变量："
        echo "  export AWS_ACCESS_KEY_ID=your_access_key"
        echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
        echo "  export AWS_DEFAULT_REGION=ap-northeast-1"
        echo ""
        log_info "或者运行 'aws configure' 进行配置"
        
        read -p "是否现在配置AWS凭证？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws configure
        else
            log_warning "跳过AWS凭证配置"
            return 0
        fi
    fi
    
    # 测试AWS连接
    if aws sts get-caller-identity > /dev/null 2>&1; then
        log_success "AWS凭证配置成功"
        aws sts get-caller-identity
    else
        log_error "AWS凭证配置失败"
        exit 1
    fi
}

# 创建CloudWatch日志组
create_cloudwatch_logs() {
    log_info "创建CloudWatch日志组..."
    
    local region=${AWS_DEFAULT_REGION:-ap-northeast-1}
    local log_groups=(
        "booking-system/database"
        "booking-system/backend"
        "booking-system/frontend"
        "booking-system/proxy"
        "booking-system/certbot"
    )
    
    for log_group in "${log_groups[@]}"; do
        if aws logs describe-log-groups --log-group-name-prefix "$log_group" --region "$region" | grep -q "$log_group"; then
            log_info "日志组 $log_group 已存在"
        else
            log_info "创建日志组: $log_group"
            aws logs create-log-group \
                --log-group-name "$log_group" \
                --region "$region" || log_warning "创建日志组失败: $log_group"
        fi
    done
    
    log_success "CloudWatch日志组配置完成"
}

# 创建IAM策略
create_iam_policy() {
    log_info "创建IAM策略..."
    
    local policy_document='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "arn:aws:logs:*:*:log-group:booking-system/*"
            }
        ]
    }'
    
    # 检查策略是否已存在
    if aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/BookingSystemCloudWatchPolicy" > /dev/null 2>&1; then
        log_info "IAM策略已存在"
    else
        log_info "创建IAM策略: BookingSystemCloudWatchPolicy"
        aws iam create-policy \
            --policy-name "BookingSystemCloudWatchPolicy" \
            --policy-document "$policy_document" || log_warning "创建IAM策略失败"
    fi
    
    log_success "IAM策略配置完成"
}

# 创建EC2实例配置文件
create_instance_profile() {
    log_info "创建EC2实例配置文件..."
    
    local instance_profile_name="BookingSystemInstanceProfile"
    local role_name="BookingSystemRole"
    
    # 检查角色是否已存在
    if aws iam get-role --role-name "$role_name" > /dev/null 2>&1; then
        log_info "IAM角色已存在: $role_name"
    else
        log_info "创建IAM角色: $role_name"
        
        # 创建信任策略
        local trust_policy='{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }'
        
        aws iam create-role \
            --role-name "$role_name" \
            --assume-role-policy-document "$trust_policy" || log_warning "创建IAM角色失败"
        
        # 附加策略
        aws iam attach-role-policy \
            --role-name "$role_name" \
            --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/BookingSystemCloudWatchPolicy" || log_warning "附加策略失败"
    fi
    
    # 检查实例配置文件是否已存在
    if aws iam get-instance-profile --instance-profile-name "$instance_profile_name" > /dev/null 2>&1; then
        log_info "实例配置文件已存在: $instance_profile_name"
    else
        log_info "创建实例配置文件: $instance_profile_name"
        aws iam create-instance-profile --instance-profile-name "$instance_profile_name"
        aws iam add-role-to-instance-profile \
            --instance-profile-name "$instance_profile_name" \
            --role-name "$role_name" || log_warning "添加角色到实例配置文件失败"
    fi
    
    log_success "EC2实例配置文件创建完成"
    log_info "请将此实例配置文件附加到您的EC2实例："
    echo "  aws ec2 associate-iam-instance-profile --instance-id <instance-id> --iam-instance-profile Name=$instance_profile_name"
}

# 配置Route 53（如果提供域名）
setup_route53() {
    local domain_name="$1"
    
    if [[ -z "$domain_name" || "$domain_name" == "localhost" ]]; then
        log_info "未提供域名，跳过Route 53配置"
        return 0
    fi
    
    log_info "配置Route 53..."
    
    # 获取EC2实例的公网IP
    local public_ip=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    
    if [[ -z "$public_ip" ]]; then
        log_warning "无法获取公网IP，跳过Route 53配置"
        return 0
    fi
    
    # 获取域名的主机区域
    local hosted_zone_id=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='${domain_name}.'].Id" --output text | cut -d'/' -f3)
    
    if [[ -z "$hosted_zone_id" ]]; then
        log_warning "未找到域名 $domain_name 的托管区域"
        log_info "请在Route 53中创建托管区域，或手动配置DNS记录"
        return 0
    fi
    
    # 创建DNS记录
    local change_batch='{
        "Changes": [
            {
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": "'$domain_name'",
                    "Type": "A",
                    "TTL": 300,
                    "ResourceRecords": [
                        {
                            "Value": "'$public_ip'"
                        }
                    ]
                }
            }
        ]
    }'
    
    log_info "创建DNS记录: $domain_name -> $public_ip"
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$hosted_zone_id" \
        --change-batch "$change_batch" || log_warning "创建DNS记录失败"
    
    log_success "Route 53配置完成"
}

# 创建备份脚本
create_backup_script() {
    log_info "创建备份脚本..."
    
    cat > backup-database.sh << 'EOF'
#!/bin/bash

# 数据库备份脚本
# 每天自动备份数据库到S3

set -e

# 配置
BACKUP_DIR="/opt/booking-system/backups"
S3_BUCKET="${S3_BACKUP_BUCKET:-booking-system-backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="booking_system_backup_${DATE}.sql"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份数据库
echo "开始备份数据库..."
docker exec booking_database_aws pg_dump -U lecture_admin -d lecture_booking > "$BACKUP_DIR/$BACKUP_FILE"

# 压缩备份文件
gzip "$BACKUP_DIR/$BACKUP_FILE"

# 上传到S3
if [[ -n "$S3_BACKUP_BUCKET" ]]; then
    echo "上传备份到S3..."
    aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "s3://$S3_BUCKET/database/"
    
    # 删除本地备份文件（保留最近7天）
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
fi

echo "备份完成: ${BACKUP_FILE}.gz"
EOF

    chmod +x backup-database.sh
    
    # 创建cron任务
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup-database.sh") | crontab -
    
    log_success "备份脚本创建完成"
}

# 创建监控脚本
create_monitoring_script() {
    log_info "创建监控脚本..."
    
    cat > monitor-services.sh << 'EOF'
#!/bin/bash

# 服务监控脚本
# 检查服务状态并发送告警

set -e

# 配置
WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL="${ADMIN_EMAIL:-admin@example.com}"

# 检查服务状态
check_service() {
    local service_name="$1"
    local container_name="$2"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        if [[ "$status" == "healthy" ]]; then
            echo "✅ $service_name: 健康"
            return 0
        else
            echo "❌ $service_name: 不健康 (状态: $status)"
            return 1
        fi
    else
        echo "❌ $service_name: 未运行"
        return 1
    fi
}

# 发送告警
send_alert() {
    local message="$1"
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Booking System Alert: $message\"}" \
            "$WEBHOOK_URL"
    fi
    
    if command -v mail > /dev/null 2>&1; then
        echo "$message" | mail -s "Booking System Alert" "$EMAIL"
    fi
}

# 检查所有服务
echo "检查服务状态..."
failed_services=()

check_service "数据库" "booking_database_aws" || failed_services+=("数据库")
check_service "后端" "booking_backend_aws" || failed_services+=("后端")
check_service "前端" "booking_frontend_aws" || failed_services+=("前端")
check_service "代理" "booking_proxy_aws" || failed_services+=("代理")

# 发送告警
if [[ ${#failed_services[@]} -gt 0 ]]; then
    send_alert "以下服务异常: ${failed_services[*]}"
    exit 1
else
    echo "所有服务运行正常"
fi
EOF

    chmod +x monitor-services.sh
    
    # 创建cron任务（每5分钟检查一次）
    (crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/monitor-services.sh") | crontab -
    
    log_success "监控脚本创建完成"
}

# 主函数
main() {
    local domain_name="$1"
    
    log_info "开始AWS环境配置..."
    
    check_aws_cli
    setup_aws_credentials
    create_cloudwatch_logs
    create_iam_policy
    create_instance_profile
    setup_route53 "$domain_name"
    create_backup_script
    create_monitoring_script
    
    log_success "AWS环境配置完成！"
    
    echo ""
    echo "=========================================="
    echo "📋 后续步骤："
    echo "=========================================="
    echo "1. 将IAM实例配置文件附加到EC2实例"
    echo "2. 设置环境变量："
    echo "   export DOMAIN_NAME=$domain_name"
    echo "   export ADMIN_EMAIL=your-email@example.com"
    echo "   export AWS_REGION=ap-northeast-1"
    echo "3. 运行部署脚本："
    echo "   ./deploy-aws-production.sh deploy"
    echo "=========================================="
}

# 执行主函数
main "$@"
