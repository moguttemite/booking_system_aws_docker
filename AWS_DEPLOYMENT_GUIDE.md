# AWS Linux 生产环境部署指南

本指南将帮助您在AWS Linux环境中部署预订系统到生产环境。

## 📋 前置要求

### 系统要求
- **操作系统**: Amazon Linux 2023 / Amazon Linux 2 / Ubuntu 20.04+
- **内存**: 至少 4GB RAM
- **存储**: 至少 20GB 可用空间
- **网络**: 公网IP地址，开放端口 22, 80, 443

### AWS服务要求
- **EC2实例**: t3.medium 或更高配置
- **IAM权限**: CloudWatch Logs, Route 53 (可选)
- **域名**: 用于SSL证书 (可选)

## 🚀 快速部署

### 方法1: 一键部署脚本

```bash
# 下载并运行快速部署脚本
chmod +x quick-deploy-aws.sh
./quick-deploy-aws.sh
```

脚本将引导您完成：
- 域名配置
- 管理员邮箱设置
- AWS区域选择
- CloudWatch日志配置
- SSL证书配置

### 方法2: 分步部署

#### 1. 配置AWS环境

```bash
# 设置环境变量
export DOMAIN_NAME="your-domain.com"
export ADMIN_EMAIL="admin@your-domain.com"
export AWS_REGION="ap-northeast-1"

# 配置AWS环境
chmod +x setup-aws-environment.sh
./setup-aws-environment.sh $DOMAIN_NAME
```

#### 2. 部署服务

```bash
# 运行部署脚本
chmod +x deploy-aws-production.sh
./deploy-aws-production.sh deploy
```

## 🔧 详细配置

### 环境变量配置

创建 `.env` 文件：

```bash
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
DOMAIN_NAME=your-domain.com
ADMIN_EMAIL=admin@your-domain.com
AWS_REGION=ap-northeast-1
CORS_ORIGINS=https://your-domain.com
```

### Secrets配置

系统会自动生成以下secrets文件：

```bash
secrets/
├── postgres_password.txt    # PostgreSQL密码
├── secret_key.txt          # JWT密钥
└── superuser_password.txt  # 超级用户密码
```

### SSL证书配置

如果配置了域名，系统会自动获取Let's Encrypt SSL证书：

```bash
# 手动获取证书
docker exec booking_certbot_aws certbot certonly \
    --webroot -w /var/www/certbot \
    -d your-domain.com \
    --agree-tos \
    -m admin@your-domain.com \
    --non-interactive

# 重启代理服务
docker compose -f docker-compose.aws.yml restart proxy
```

## 📊 监控和日志

### CloudWatch日志

系统会自动配置CloudWatch日志组：

- `booking-system/database` - 数据库日志
- `booking-system/backend` - 后端API日志
- `booking-system/frontend` - 前端日志
- `booking-system/proxy` - Nginx代理日志
- `booking-system/certbot` - SSL证书日志

### 服务监控

自动监控脚本会每5分钟检查服务状态：

```bash
# 手动运行监控
./monitor-services.sh

# 查看监控日志
tail -f /var/log/cron
```

### 数据库备份

自动备份脚本会每天凌晨2点备份数据库：

```bash
# 手动运行备份
./backup-database.sh

# 查看备份文件
ls -la /opt/booking-system/backups/
```

## 🛠️ 管理命令

### 服务管理

```bash
# 查看服务状态
docker compose -f docker-compose.aws.yml ps

# 查看服务日志
docker compose -f docker-compose.aws.yml logs -f

# 重启服务
docker compose -f docker-compose.aws.yml restart

# 停止服务
docker compose -f docker-compose.aws.yml down

# 更新服务
docker compose -f docker-compose.aws.yml pull
docker compose -f docker-compose.aws.yml up -d
```

### 系统管理

```bash
# 查看系统资源
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
netstat -tlnp
```

### 日志管理

```bash
# 查看应用日志
docker compose -f docker-compose.aws.yml logs -f backend
docker compose -f docker-compose.aws.yml logs -f frontend
docker compose -f docker-compose.aws.yml logs -f proxy

# 查看系统日志
journalctl -u docker
journalctl -u booking-system
```

## 🔒 安全配置

### 防火墙配置

系统会自动配置防火墙规则：

```bash
# 检查防火墙状态
sudo firewall-cmd --list-all

# 手动配置防火墙
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### SSL/TLS配置

Nginx配置了以下安全特性：

- TLS 1.2+ 支持
- 强加密套件
- HSTS 头
- 安全头配置
- 隐藏服务器信息

### 容器安全

所有容器都配置了：

- 非root用户运行
- 只读文件系统
- 无新权限
- 资源限制
- 健康检查

## 📈 性能优化

### 资源限制

每个服务都配置了资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: "1.0"
      memory: 1g
    reservations:
      cpus: "0.5"
      memory: 512m
```

### 缓存配置

Nginx配置了静态文件缓存：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 数据库优化

PostgreSQL配置了生产环境优化：

- 连接池配置
- 内存优化
- 日志配置
- 备份策略

## 🚨 故障排除

### 常见问题

#### 1. 服务无法启动

```bash
# 检查Docker状态
sudo systemctl status docker

# 检查容器日志
docker compose -f docker-compose.aws.yml logs

# 检查端口占用
sudo netstat -tlnp | grep :80
```

#### 2. SSL证书问题

```bash
# 检查证书状态
docker exec booking_certbot_aws certbot certificates

# 手动续期证书
docker exec booking_certbot_aws certbot renew

# 检查Nginx配置
docker exec booking_proxy_aws nginx -t
```

#### 3. 数据库连接问题

```bash
# 检查数据库状态
docker exec booking_database_aws pg_isready -U lecture_admin

# 检查数据库日志
docker compose -f docker-compose.aws.yml logs database

# 连接数据库
docker exec -it booking_database_aws psql -U lecture_admin -d lecture_booking
```

#### 4. 内存不足

```bash
# 检查内存使用
free -h
docker stats

# 清理Docker缓存
docker system prune -a

# 重启服务
docker compose -f docker-compose.aws.yml restart
```

### 日志分析

```bash
# 查看错误日志
docker compose -f docker-compose.aws.yml logs | grep ERROR

# 查看访问日志
docker exec booking_proxy_aws tail -f /var/log/nginx/access.log

# 查看系统日志
journalctl -f
```

## 📞 支持

如果遇到问题，请：

1. 检查日志文件
2. 运行诊断脚本
3. 查看系统资源使用
4. 联系技术支持

### 有用的命令

```bash
# 系统信息
uname -a
cat /etc/os-release
docker --version
docker compose version

# 网络信息
curl -s http://169.254.169.254/latest/meta-data/public-ipv4
hostname -I

# 服务状态
systemctl status docker
systemctl status booking-system
```

## 📚 相关文档

- [Docker Compose文档](https://docs.docker.com/compose/)
- [AWS CloudWatch文档](https://docs.aws.amazon.com/cloudwatch/)
- [Let's Encrypt文档](https://letsencrypt.org/docs/)
- [Nginx文档](https://nginx.org/en/docs/)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
