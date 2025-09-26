# 一键启动指南

本指南提供了在Windows 11开发机器和Ubuntu 2024测试VPS上的一键启动方法。

## 环境要求

### Windows 11 开发环境
- Docker Desktop for Windows
- PowerShell 5.1+ 或 PowerShell Core 7+
- 至少4GB内存
- 至少10GB可用磁盘空间

### Ubuntu 2024 测试VPS
- Docker Engine 20.10+
- Docker Compose v2
- 至少2GB内存
- 至少20GB可用磁盘空间
- 开放端口：22, 80, 443

## 快速启动

### Windows 11 开发环境

#### 1. 一键启动
```powershell
# 启动所有服务
.\start-windows.ps1

# 强制重新构建并启动
.\start-windows.ps1 -Action start -Force

# 查看服务状态
.\start-windows.ps1 -Action status

# 查看日志
.\start-windows.ps1 -Action logs

# 停止服务
.\start-windows.ps1 -Action stop
```

#### 2. 手动启动
```powershell
# 使用Windows专用配置
docker compose -f docker-compose.windows.yml up -d

# 查看状态
docker compose -f docker-compose.windows.yml ps

# 查看日志
docker compose -f docker-compose.windows.yml logs -f
```

#### 3. 访问地址
- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **代理服务**: http://localhost:8080
- **数据库**: localhost:5433

### Ubuntu 2024 测试VPS

#### 1. 一键启动
```bash
# 启动所有服务
./start-ubuntu.sh start

# 查看服务状态
./start-ubuntu.sh status

# 查看日志
./start-ubuntu.sh logs

# 停止服务
./start-ubuntu.sh stop

# 重启服务
./start-ubuntu.sh restart
```

#### 2. 手动启动
```bash
# 使用Ubuntu专用配置
docker compose -f docker-compose.ubuntu.yml up -d

# 查看状态
docker compose -f docker-compose.ubuntu.yml ps

# 查看日志
docker compose -f docker-compose.ubuntu.yml logs -f
```

#### 3. 访问地址
- **前端应用**: http://your-server-ip
- **后端API**: http://your-server-ip/api
- **健康检查**: http://your-server-ip/health

## 配置文件说明

### docker-compose.windows.yml
- **用途**: Windows 11开发环境
- **特点**:
  - 暴露所有端口用于调试
  - 使用不同端口避免冲突（5433, 8080）
  - 网络隔离关闭，便于开发调试
  - 详细日志输出

### docker-compose.ubuntu.yml
- **用途**: Ubuntu 2024测试VPS
- **特点**:
  - 只暴露必要端口（80, 443）
  - 网络隔离启用，提高安全性
  - 生产级配置
  - 自动创建systemd服务

### docker-compose.yml
- **用途**: 通用生产环境
- **特点**:
  - 完整的生产配置
  - 网络隔离
  - 健康检查
  - 资源限制

### docker-compose.dev.yml
- **用途**: 开发环境
- **特点**:
  - 暴露调试端口
  - 开发模式配置
  - 热重载支持

### docker-compose.prod.yml
- **用途**: 生产环境
- **特点**:
  - Secrets管理
  - SSL证书支持
  - 监控和日志
  - 安全配置

## 常用命令

### Windows PowerShell
```powershell
# 启动服务
.\start-windows.ps1 -Action start

# 停止服务
.\start-windows.ps1 -Action stop

# 重启服务
.\start-windows.ps1 -Action restart

# 查看状态
.\start-windows.ps1 -Action status

# 查看日志
.\start-windows.ps1 -Action logs

# 测试服务
.\start-windows.ps1 -Action test

# 重新构建
.\start-windows.ps1 -Action build

# 清理容器
.\start-windows.ps1 -Action clean
```

### Ubuntu Bash
```bash
# 启动服务
./start-ubuntu.sh start

# 停止服务
./start-ubuntu.sh stop

# 重启服务
./start-ubuntu.sh restart

# 查看状态
./start-ubuntu.sh status

# 查看日志
./start-ubuntu.sh logs

# 测试服务
./start-ubuntu.sh test

# 重新构建
./start-ubuntu.sh build

# 清理容器
./start-ubuntu.sh clean
```

## 故障排除

### Windows 11 常见问题

#### 1. Docker Desktop未启动
```powershell
# 检查Docker状态
docker info

# 启动Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

#### 2. 端口冲突
```powershell
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :8080

# 停止占用端口的进程
taskkill /PID <进程ID> /F
```

#### 3. 权限问题
```powershell
# 以管理员身份运行PowerShell
# 或者设置执行策略
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Ubuntu 2024 常见问题

#### 1. Docker未安装
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose v2
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### 2. 权限问题
```bash
# 将用户添加到docker组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker
```

#### 3. 防火墙问题
```bash
# 检查防火墙状态
sudo ufw status

# 开放必要端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### 4. 内存不足
```bash
# 检查内存使用
free -h

# 清理Docker缓存
docker system prune -a

# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 监控和维护

### 查看服务状态
```bash
# 查看容器状态
docker compose -f docker-compose.windows.yml ps  # Windows
docker compose -f docker-compose.ubuntu.yml ps   # Ubuntu

# 查看资源使用
docker stats
```

### 查看日志
```bash
# 查看所有服务日志
docker compose -f docker-compose.windows.yml logs -f  # Windows
docker compose -f docker-compose.ubuntu.yml logs -f   # Ubuntu

# 查看特定服务日志
docker compose -f docker-compose.windows.yml logs -f backend
```

### 更新服务
```bash
# 重新构建并启动
docker compose -f docker-compose.windows.yml up -d --build  # Windows
docker compose -f docker-compose.ubuntu.yml up -d --build   # Ubuntu
```

## 安全注意事项

### Windows 开发环境
- 仅用于开发，不要在生产环境使用
- 默认密钥仅用于开发，生产环境必须修改
- 端口暴露仅用于调试

### Ubuntu 测试环境
- 配置防火墙规则
- 定期更新系统
- 监控资源使用
- 备份重要数据

## 下一步

启动成功后，您可以：

1. **访问应用**: 使用上述访问地址
2. **查看文档**: 阅读 `README.md` 了解详细功能
3. **生产部署**: 参考 `DEPLOYMENT_GUIDE.md` 进行生产部署
4. **测试功能**: 使用 `README_TESTING.md` 中的测试方法

---

**注意**: 如果遇到问题，请查看日志输出或参考故障排除部分。对于生产环境部署，请使用 `docker-compose.prod.yml` 配置。
