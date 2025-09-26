# 🔒 SSL部署脚本使用指南

## 📋 脚本功能

`deploy-ssl-only.sh` 是一个统一的SSL部署和管理脚本，支持以下操作：

- **start** - 首次部署（默认）
- **update** - 更新项目代码并重新部署
- **stop** - 停止所有服务
- **restart** - 重启所有服务
- **logs** - 查看服务日志
- **status** - 查看服务状态

## 🚀 使用方法

### 首次部署
```bash
# 克隆项目
git clone https://github.com/moguttemite/booking_system_aws_docker.git
cd booking_system_aws_docker

# 设置执行权限
chmod +x deploy-ssl-only.sh

# 首次部署
./deploy-ssl-only.sh
# 或
./deploy-ssl-only.sh start
```

### 更新项目
```bash
# 更新代码并重新部署
./deploy-ssl-only.sh update
```

### 管理服务
```bash
# 查看服务状态
./deploy-ssl-only.sh status

# 查看日志
./deploy-ssl-only.sh logs

# 重启服务
./deploy-ssl-only.sh restart

# 停止服务
./deploy-ssl-only.sh stop
```

## 📋 访问信息

部署完成后：
- 🌐 **HTTP**: `http://your-ec2-ip/` (自动重定向到HTTPS)
- 🔒 **HTTPS**: `https://your-ec2-ip/`
- 🔧 **API**: `https://your-ec2-ip/api/`

## 🔑 默认账户
- **邮箱**: admin@example.com
- **密码**: Admin#12345

## ⚠️ 重要提示

1. **Docker Compose**: 需要安装Docker Compose v2插件
   ```bash
   # Amazon Linux 2
   sudo yum install -y docker-compose-plugin
   
   # Ubuntu
   sudo apt-get install docker-compose-plugin
   ```

2. **SSL证书**: 使用自签名证书，浏览器会显示安全警告
3. **生产环境**: 请修改默认密码
4. **防火墙**: 确保80和443端口已开放

## 🔧 故障排除

### Docker Compose未安装
```bash
# 检查Docker Compose
docker compose version

# 如果未安装，运行安装命令
sudo yum install -y docker-compose-plugin  # Amazon Linux 2
sudo apt-get install docker-compose-plugin  # Ubuntu
```

### 端口冲突
```bash
# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### 查看详细日志
```bash
# 查看所有服务日志
./deploy-ssl-only.sh logs

# 查看特定服务日志
docker compose -f docker-compose.ssl-only.yml logs -f database
docker compose -f docker-compose.ssl-only.yml logs -f backend
docker compose -f docker-compose.ssl-only.yml logs -f frontend
docker compose -f docker-compose.ssl-only.yml logs -f proxy
```
