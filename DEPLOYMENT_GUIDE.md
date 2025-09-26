# 生产环境部署指南

## 概述

本指南提供了完整的生产环境部署流程，包括AWS EC2部署、安全配置、SSL证书管理、监控和备份策略。

## 部署前准备

### 1. 环境要求

- **操作系统**: Amazon Linux 2/2023, Ubuntu 20.04/22.04
- **内存**: 最少2GB，推荐4GB+
- **存储**: 最少20GB，推荐50GB+
- **网络**: 开放端口80, 443, 22

### 2. 域名和SSL证书

- 准备域名并配置DNS解析到EC2实例
- 确保域名可以正常解析

## 快速部署

### 1. 运行安装脚本

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/your-repo/booking-system/main/install-aws-ec2.sh | bash

# 或者手动下载
wget https://raw.githubusercontent.com/your-repo/booking-system/main/install-aws-ec2.sh
chmod +x install-aws-ec2.sh
sudo ./install-aws-ec2.sh
```

### 2. 部署应用

```bash
# 进入应用目录
cd /opt/booking-system

# 克隆项目（或上传文件）
git clone https://github.com/your-repo/booking-system.git .

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置生产环境变量

# 配置密钥文件
mkdir -p secrets
# 创建密钥文件（参考下面的密钥配置部分）

# 启动服务
sudo systemctl start booking-system
```

## 详细配置

### 1. 环境变量配置

创建 `.env` 文件：

```bash
# 生产环境配置
DOMAIN_NAME=your-domain.com
ADMIN_EMAIL=admin@your-domain.com
AWS_REGION=ap-northeast-1
CORS_ORIGINS=https://your-domain.com

# 数据库配置
POSTGRES_DB=lecture_booking
POSTGRES_USER=lecture_admin
# POSTGRES_PASSWORD=从secrets文件读取

# 后端配置
# SECRET_KEY=从secrets文件读取
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
# FIRST_SUPERUSER=从环境变量读取
# FIRST_SUPERUSER_PASSWORD=从secrets文件读取

# 前端配置
NEXT_PUBLIC_API_BASE_URL=/api
NODE_ENV=production
```

### 2. 密钥文件配置

**⚠️ 重要：生产环境必须修改所有默认密钥！**

```bash
# 创建密钥目录
mkdir -p secrets

# 生成PostgreSQL密码
echo "your_strong_postgres_password_here" > secrets/postgres_password.txt

# 生成JWT密钥（32字符以上）
openssl rand -hex 32 > secrets/secret_key.txt

# 生成超级管理员密码
echo "your_strong_superuser_password_here" > secrets/superuser_password.txt

# 设置文件权限
chmod 600 secrets/*.txt
```

### 3. SSL证书配置

系统会自动使用Let's Encrypt获取SSL证书：

```bash
# 证书会自动获取，无需手动配置
# 证书存储在 /opt/booking-system/letsencrypt/ 目录
```

## 服务管理

### 1. 启动/停止服务

```bash
# 启动服务
sudo systemctl start booking-system

# 停止服务
sudo systemctl stop booking-system

# 重启服务
sudo systemctl restart booking-system

# 查看状态
sudo systemctl status booking-system
```

### 2. 查看日志

```bash
# 查看服务日志
sudo journalctl -u booking-system -f

# 查看容器日志
cd /opt/booking-system
docker compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f proxy
```

### 3. 更新应用

```bash
# 停止服务
sudo systemctl stop booking-system

# 更新代码
cd /opt/booking-system
git pull origin main

# 重新构建镜像
docker compose -f docker-compose.prod.yml build --no-cache

# 启动服务
sudo systemctl start booking-system
```

## 监控和备份

### 1. 监控

系统已配置自动监控：

- **容器状态监控**: 每5分钟检查一次
- **资源使用监控**: 磁盘、内存使用率
- **自动重启**: 容器异常时自动重启

监控日志位置：`/opt/booking-system/logs/monitor.log`

### 2. 数据库备份

```bash
# 创建备份脚本
sudo tee /opt/booking-system/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/booking-system/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker compose -f /opt/booking-system/docker-compose.prod.yml exec -T database pg_dump -U lecture_admin lecture_booking > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
EOF

sudo chmod +x /opt/booking-system/backup.sh

# 添加到crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/booking-system/backup.sh") | crontab -
```

### 3. 日志轮转

系统已配置日志轮转：

- 日志文件每天轮转
- 保留7天的日志
- 自动压缩旧日志

## 安全配置

### 1. 防火墙配置

```bash
# 查看防火墙状态
sudo ufw status  # Ubuntu
sudo iptables -L  # Amazon Linux

# 只允许必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw deny 5432/tcp  # 禁止直接访问数据库
```

### 2. SSH安全配置

```bash
# 编辑SSH配置
sudo vim /etc/ssh/sshd_config

# 建议配置：
# Port 2222                    # 更改默认端口
# PermitRootLogin no           # 禁止root登录
# PasswordAuthentication no    # 禁用密码认证
# PubkeyAuthentication yes     # 启用密钥认证

# 重启SSH服务
sudo systemctl restart sshd
```

### 3. 系统更新

```bash
# 定期更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu
sudo yum update -y                      # Amazon Linux 2
sudo dnf update -y                      # Amazon Linux 2023
```

## 故障排除

### 1. 常见问题

**问题1：容器启动失败**
```bash
# 查看详细错误
docker compose -f docker-compose.prod.yml logs

# 检查配置文件
docker compose -f docker-compose.prod.yml config
```

**问题2：SSL证书获取失败**
```bash
# 检查域名解析
nslookup your-domain.com

# 检查防火墙
sudo ufw status

# 手动获取证书
docker compose -f docker-compose.prod.yml exec certbot certbot certonly --webroot -w /var/www/certbot -d your-domain.com
```

**问题3：数据库连接失败**
```bash
# 检查数据库状态
docker compose -f docker-compose.prod.yml exec database pg_isready -U lecture_admin

# 检查网络连接
docker compose -f docker-compose.prod.yml exec backend ping database
```

### 2. 性能优化

**数据库优化**：
```bash
# 编辑数据库配置
docker compose -f docker-compose.prod.yml exec database psql -U lecture_admin -d lecture_booking -c "SHOW shared_buffers;"
```

**Nginx优化**：
```bash
# 检查Nginx配置
docker compose -f docker-compose.prod.yml exec proxy nginx -t

# 重新加载配置
docker compose -f docker-compose.prod.yml exec proxy nginx -s reload
```

## 扩展部署

### 1. 负载均衡

对于高流量场景，建议使用AWS Application Load Balancer：

```bash
# 创建ALB目标组
aws elbv2 create-target-group \
    --name booking-system-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id vpc-xxxxxxxx \
    --target-type ip

# 创建ALB
aws elbv2 create-load-balancer \
    --name booking-system-alb \
    --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
    --security-groups sg-xxxxxxxx
```

### 2. 数据库集群

对于高可用性需求，建议使用AWS RDS：

```bash
# 创建RDS实例
aws rds create-db-instance \
    --db-instance-identifier booking-system-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username lecture_admin \
    --master-user-password your-password \
    --allocated-storage 20
```

## 维护计划

### 1. 定期维护任务

- **每周**: 检查系统更新
- **每月**: 更新依赖包
- **每季度**: 安全审计
- **每年**: 证书续期检查

### 2. 监控指标

- 容器健康状态
- 系统资源使用率
- 应用响应时间
- 错误率统计

## 联系支持

如遇到问题，请提供以下信息：

1. 系统版本和架构
2. 错误日志
3. 配置文件（脱敏后）
4. 复现步骤

---

**注意**: 本部署指南基于Docker Compose v2和最新的AWS最佳实践。请确保按照指南逐步执行，避免跳过安全配置步骤。
