# 🔒 SSL-Only 部署指南

这是一个**简化的SSL部署方案**，专门为只需要SSL功能而不需要域名和复杂AWS配置的用户设计。

## 🎯 功能特点

- ✅ **SSL/HTTPS支持** - 自动生成自签名证书
- ✅ **HTTP自动重定向** - 所有HTTP请求自动重定向到HTTPS
- ✅ **无需域名** - 支持IP地址访问
- ✅ **无需AWS配置** - 不依赖AWS服务
- ✅ **一键部署** - 简单的部署脚本
- ✅ **生产就绪** - 包含安全头和最佳实践

## 🚀 快速开始

### 在EC2 Linux上部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd aws_docker

# 2. 运行SSL部署脚本
chmod +x deploy-ssl-only.sh
./deploy-ssl-only.sh
```

### 在Windows上部署（本地测试）

```powershell
# 1. 克隆项目
git clone <your-repo-url>
cd aws_docker

# 2. 运行SSL部署脚本
.\deploy-ssl-only.ps1 -Action start
```

## 📋 访问信息

部署完成后，您可以通过以下地址访问：

- 🌐 **HTTP**: `http://your-ec2-ip/` (自动重定向到HTTPS)
- 🔒 **HTTPS**: `https://your-ec2-ip/`
- 🔧 **API**: `https://your-ec2-ip/api/`
- 💾 **数据库**: 内部访问 (端口5432)

## 🔐 SSL证书说明

### 自签名证书
- 使用自签名SSL证书，浏览器会显示安全警告
- 证书有效期：365天
- 支持IP地址和localhost访问
- 点击"高级" -> "继续访问"即可正常使用

### 升级到正式证书
如果您有域名，可以升级到Let's Encrypt正式证书：

```bash
# 1. 配置域名DNS指向您的EC2 IP
# 2. 修改.env文件中的DOMAIN_NAME
# 3. 使用Let's Encrypt申请正式证书
```

## 🛠️ 管理命令

### Linux/EC2
```bash
# 查看日志
docker compose -f docker-compose.ssl-only.yml logs -f

# 停止服务
docker compose -f docker-compose.ssl-only.yml down

# 重启服务
docker compose -f docker-compose.ssl-only.yml restart

# 更新SSL证书
rm ssl_certs/cert.pem ssl_certs/key.pem
./deploy-ssl-only.sh
```

### Windows
```powershell
# 查看日志
.\deploy-ssl-only.ps1 -Action logs

# 停止服务
.\deploy-ssl-only.ps1 -Action stop

# 重启服务
.\deploy-ssl-only.ps1 -Action restart

# 查看状态
.\deploy-ssl-only.ps1 -Action status
```

## 🔧 配置说明

### 环境变量 (.env)
```env
# 数据库配置
POSTGRES_DB=lecture_booking
POSTGRES_USER=lecture_admin
POSTGRES_PASSWORD=postgresroot

# 后端配置
SECRET_KEY=dev-change-me-in-production
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=Admin#12345

# 前端配置
NEXT_PUBLIC_API_BASE_URL=/api
NODE_ENV=production

# 代理配置
DOMAIN_NAME=your-ec2-ip
```

### 默认账户
- **邮箱**: admin@example.com
- **密码**: Admin#12345

⚠️ **生产环境请务必修改默认密码！**

## 🔒 安全特性

- **强制HTTPS** - 所有HTTP请求自动重定向到HTTPS
- **安全头** - 包含HSTS、XSS保护、内容类型保护等
- **网络隔离** - 后端网络与公网隔离
- **资源限制** - 容器资源使用限制
- **只读文件系统** - 容器文件系统只读保护

## 🐛 故障排除

### 常见问题

1. **SSL证书警告**
   - 这是正常的，因为使用自签名证书
   - 点击"高级" -> "继续访问"即可

2. **服务启动失败**
   ```bash
   # 查看详细日志
   docker compose -f docker-compose.ssl-only.yml logs
   ```

3. **端口冲突**
   - 确保80和443端口未被占用
   - 检查防火墙设置

4. **数据库连接失败**
   - 等待数据库完全启动（约30秒）
   - 检查数据库健康状态

### 日志查看
```bash
# 查看所有服务日志
docker compose -f docker-compose.ssl-only.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.ssl-only.yml logs -f database
docker compose -f docker-compose.ssl-only.yml logs -f backend
docker compose -f docker-compose.ssl-only.yml logs -f frontend
docker compose -f docker-compose.ssl-only.yml logs -f proxy
```

## 📊 服务架构

```
Internet
    ↓
[Proxy/Nginx] ← SSL证书
    ↓
[Frontend/Next.js] ← 端口3000
    ↓
[Backend/FastAPI] ← 端口8000
    ↓
[Database/PostgreSQL] ← 端口5432
```

## 🔄 升级路径

当您需要更多功能时，可以升级到：

1. **完整生产环境** - 使用 `docker-compose.prod.yml`
2. **AWS集成** - 使用 `deploy-aws-production.sh`
3. **域名+正式SSL** - 配置域名后使用Let's Encrypt

## 📞 支持

如果遇到问题，请检查：
1. Docker和Docker Compose是否正确安装
2. 端口80和443是否可用
3. 防火墙设置是否正确
4. 查看服务日志获取详细错误信息
