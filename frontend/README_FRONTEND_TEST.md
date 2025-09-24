# 前端服务测试说明

## 📋 概述

本文档说明如何测试前端 Docker 容器的运行状态和功能。

## 🚀 快速开始

### 1. 基础测试
```powershell
# 运行基础测试
.\test_frontend.ps1
```

### 2. 详细测试
```powershell
# 运行详细测试
.\test_frontend_detailed.ps1
```

## 📁 文件结构

```
frontend/
├── Dockerfile                 # 前端 Docker 镜像构建文件
├── docker-compose.yml         # 前端服务 Docker Compose 配置
├── test_frontend.ps1          # 基础测试脚本 (PowerShell)
├── test_frontend_detailed.ps1 # 详细测试脚本 (PowerShell)
├── test_frontend.sh           # 基础测试脚本 (Bash)
└── nextjs/                    # 前端源代码目录
    ├── package.json           # 项目依赖配置
    ├── next.config.ts         # Next.js 配置
    ├── src/                   # 源代码目录
    └── public/                # 静态资源目录
```

## 🔧 配置说明

### Docker 配置
- **基础镜像**: `node:18-alpine`
- **包管理器**: pnpm
- **构建模式**: standalone (生产优化)
- **端口**: 3000
- **用户**: nextjs (非 root)

### 环境变量
- `NEXT_PUBLIC_API_BASE_URL`: 后端 API 基础 URL
- `NODE_ENV`: 运行环境 (production)
- `NEXT_TELEMETRY_DISABLED`: 禁用遥测

## 🧪 测试内容

### 基础测试 (`test_frontend.ps1`)
1. **容器清理**: 清理现有容器和镜像
2. **后端检查**: 检查后端服务状态
3. **服务启动**: 构建并启动前端服务
4. **健康检查**: 验证容器健康状态
5. **页面测试**: 测试首页访问
6. **内容检查**: 检查页面内容

### 详细测试 (`test_frontend_detailed.ps1`)
1. **容器管理**: 完整的清理和重建流程
2. **服务状态**: 详细的服务状态检查
3. **页面功能**: 测试页面标题、元数据、组件
4. **静态资源**: 测试图片、CSS 等静态资源
5. **API 连接**: 测试与后端的 API 连接
6. **性能测试**: 测试页面加载时间
7. **日志分析**: 显示详细的容器日志

## 📊 测试结果

### ✅ 成功指标
- 容器正常启动并健康
- 前端页面可正常访问
- 页面包含正确的标题和内容
- 静态资源可正常加载
- 与后端 API 连接正常

### ⚠️ 警告情况
- 后端服务未运行（前端仍可启动）
- 某些 API 调用失败（需要认证）
- 静态资源加载失败

### ❌ 错误情况
- 容器启动失败
- 前端页面无法访问
- 健康检查失败

## 🔍 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 检查构建日志
docker-compose build --no-cache

# 检查容器日志
docker-compose logs
```

#### 2. 页面无法访问
```bash
# 检查端口是否被占用
netstat -an | findstr :3000

# 检查容器状态
docker-compose ps
```

#### 3. 后端连接失败
```bash
# 确保后端服务正在运行
cd ../backend
docker-compose up -d

# 检查后端健康状态
curl http://localhost:8000/health
```

#### 4. 静态资源加载失败
```bash
# 检查 public 目录是否正确复制
docker exec -it booking_frontend_test ls -la /app/public
```

## 🌐 访问地址

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8000/api
- **API 文档**: http://localhost:8000/docs

## 📝 注意事项

1. **依赖关系**: 前端需要后端服务提供 API 支持
2. **环境变量**: 确保 `NEXT_PUBLIC_API_BASE_URL` 正确配置
3. **网络配置**: 使用 `host.docker.internal` 访问宿主机服务
4. **构建优化**: 使用 standalone 模式减少镜像大小
5. **安全配置**: 使用非 root 用户运行应用

## 🔄 开发流程

### 1. 修改代码后重新测试
```powershell
# 停止服务
docker-compose down

# 重新构建并测试
.\test_frontend.ps1
```

### 2. 调试模式
```powershell
# 查看实时日志
docker-compose logs -f

# 进入容器调试
docker exec -it booking_frontend_test sh
```

### 3. 清理环境
```powershell
# 完全清理
docker-compose down -v
docker rmi frontend-frontend -f
docker image prune -f
```

## 📈 性能优化

### 构建优化
- 使用多阶段构建减少镜像大小
- 使用 Alpine Linux 基础镜像
- 启用 standalone 模式

### 运行时优化
- 使用非 root 用户提高安全性
- 配置健康检查确保服务稳定
- 设置日志轮转避免磁盘空间问题

## 🎯 下一步

前端服务测试完成后，可以：
1. 测试与后端的集成
2. 配置 Nginx 代理
3. 部署到生产环境
4. 设置 CI/CD 流程



