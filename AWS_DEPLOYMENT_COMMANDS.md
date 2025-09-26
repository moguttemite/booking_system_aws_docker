# 🚀 AWS Linux 部署和更新命令

## 📋 首次部署

### 1. 连接到EC2实例
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. 安装Docker和Docker Compose
```bash
# 更新系统
sudo yum update -y

# 安装Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# 安装Docker Compose v2
sudo yum install -y docker-compose-plugin

# 重新登录以应用组权限
exit
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 3. 克隆项目
```bash
# 克隆项目
git clone https://github.com/moguttemite/booking_system_aws_docker.git
cd booking_system_aws_docker

# 设置执行权限
chmod +x *.sh
```

### 4. 首次部署
```bash
# 使用SSL部署脚本
./deploy-ssl-only.sh
```

## 🔄 更新项目

### 方法1：完整更新（推荐）
```bash
# 使用完整更新脚本
./update-aws.sh
```

### 方法2：快速更新
```bash
# 仅拉取代码并重启服务
./quick-update.sh
```

### 方法3：手动更新
```bash
# 1. 停止服务
docker compose -f docker-compose.ssl-only.yml down

# 2. 拉取最新代码
git pull origin master

# 3. 重新构建并启动
docker compose -f docker-compose.ssl-only.yml up -d --build
```

## 🛠️ 常用管理命令

### 查看服务状态
```bash
docker compose -f docker-compose.ssl-only.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker compose -f docker-compose.ssl-only.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.ssl-only.yml logs -f database
docker compose -f docker-compose.ssl-only.yml logs -f backend
docker compose -f docker-compose.ssl-only.yml logs -f frontend
docker compose -f docker-compose.ssl-only.yml logs -f proxy
```

### 重启服务
```bash
# 重启所有服务
docker compose -f docker-compose.ssl-only.yml restart

# 重启特定服务
docker compose -f docker-compose.ssl-only.yml restart backend
```

### 停止服务
```bash
docker compose -f docker-compose.ssl-only.yml down
```

### 清理资源
```bash
# 清理未使用的镜像和容器
docker system prune -f

# 清理所有未使用的资源
docker system prune -a -f
```

## 🔧 故障排除

### 检查端口占用
```bash
# 检查80和443端口
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### 检查防火墙
```bash
# 检查防火墙状态
sudo systemctl status firewalld

# 开放端口（如果需要）
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 检查Docker状态
```bash
# 检查Docker服务
sudo systemctl status docker

# 检查Docker Compose
docker compose version
```

### 查看系统资源
```bash
# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看CPU使用
top
```

## 📊 监控和维护

### 设置自动更新（可选）
```bash
# 创建定时任务
crontab -e

# 添加以下行（每天凌晨2点自动更新）
0 2 * * * cd /home/ec2-user/booking_system_aws_docker && ./quick-update.sh >> /var/log/booking-update.log 2>&1
```

### 备份数据
```bash
# 备份数据库
docker exec booking_database_ssl pg_dump -U lecture_admin lecture_booking > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份SSL证书
cp -r ssl_certs ssl_certs_backup_$(date +%Y%m%d_%H%M%S)
```

### 恢复数据
```bash
# 恢复数据库
docker exec -i booking_database_ssl psql -U lecture_admin lecture_booking < backup_file.sql
```

## 🌐 访问信息

部署完成后，您可以通过以下地址访问：

- **HTTP**: `http://your-ec2-ip/` (自动重定向到HTTPS)
- **HTTPS**: `https://your-ec2-ip/`
- **API**: `https://your-ec2-ip/api/`

## ⚠️ 重要提示

1. **默认账户**: admin@example.com / Admin#12345
2. **生产环境**: 请务必修改默认密码
3. **SSL证书**: 使用自签名证书，浏览器会显示安全警告
4. **防火墙**: 确保80和443端口已开放
5. **备份**: 定期备份数据库和SSL证书

## 📞 支持

如果遇到问题：
1. 检查服务日志：`docker compose -f docker-compose.ssl-only.yml logs`
2. 检查服务状态：`docker compose -f docker-compose.ssl-only.yml ps`
3. 检查系统资源：`free -h` 和 `df -h`
4. 检查网络连接：`curl -k https://localhost/health`
