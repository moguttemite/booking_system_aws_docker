# 前端服务测试指南

## 概述

本文档提供了前端服务的独立测试方法，包括生产环境和开发环境的配置。

## 项目结构

```
frontend/
├── docker-compose.yml          # 生产环境配置
├── docker-compose.dev.yml      # 开发环境配置
├── Dockerfile                  # 生产环境镜像
├── Dockerfile.dev              # 开发环境镜像
├── test_frontend.sh            # Linux/Mac测试脚本
├── test_frontend.ps1           # Windows PowerShell测试脚本
├── test_frontend_detailed.ps1  # 详细测试脚本
└── nextjs/                     # Next.js应用代码
    ├── package.json
    ├── next.config.ts
    └── src/
```

## 快速开始

### 1. 生产环境测试

```bash
# Linux/Mac
chmod +x test_frontend.sh
./test_frontend.sh

# Windows PowerShell
.\test_frontend.ps1
```

### 2. 开发环境测试

```bash
# 使用开发环境配置
docker-compose -f docker-compose.dev.yml up -d
```

### 3. 详细测试

```bash
# Windows PowerShell详细测试
.\test_frontend_detailed.ps1 -Action full -Verbose
```

## 环境配置

### 生产环境 (docker-compose.yml)

- **基础镜像**: Node.js 18 Alpine
- **构建方式**: 多阶段构建，优化镜像大小
- **运行用户**: 非root用户 (nextjs:nodejs)
- **端口**: 3000
- **健康检查**: 使用原生Node.js HTTP模块

### 开发环境 (docker-compose.dev.yml)

- **基础镜像**: Node.js 18 Alpine
- **构建方式**: 单阶段构建，包含开发工具
- **热重载**: 挂载源代码目录
- **端口**: 3000
- **环境变量**: NODE_ENV=development

## 测试脚本功能

### test_frontend.sh / test_frontend.ps1

**功能**:
- 检查Docker环境
- 清理现有容器
- 构建镜像
- 启动服务
- 健康检查
- 显示访问信息

**参数**:
- `test` (默认): 完整测试流程
- `logs`: 显示服务日志
- `status`: 检查服务状态
- `cleanup`: 清理容器
- `restart`: 重启服务

### test_frontend_detailed.ps1

**功能**:
- 系统环境检查
- 项目文件验证
- Docker配置分析
- 镜像构建分析
- 性能测试
- 资源使用监控
- 生成测试报告

**参数**:
- `full` (默认): 完整测试流程
- `quick`: 快速测试
- `cleanup`: 清理资源
- `status`: 检查状态
- `logs`: 显示日志

## 访问信息

### 服务地址

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

### 环境变量

```bash
# 前端配置
NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:8000/api
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEBUG=true
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -an | findstr :3000
   
   # 修改端口映射
   # 在docker-compose.yml中修改 ports: "3001:3000"
   ```

2. **构建失败**
   ```bash
   # 清理构建缓存
   docker-compose build --no-cache
   
   # 检查Dockerfile语法
   docker build --dry-run .
   ```

3. **服务无法启动**
   ```bash
   # 查看详细日志
   docker-compose logs --tail=50
   
   # 检查容器状态
   docker-compose ps
   ```

4. **API连接失败**
   ```bash
   # 确保后端服务运行
   curl http://localhost:8000/health
   
   # 检查网络连接
   docker-compose exec frontend ping host.docker.internal
   ```

### 调试命令

```bash
# 进入容器调试
docker-compose exec frontend sh

# 查看容器资源使用
docker stats

# 查看网络配置
docker network ls
docker network inspect frontend_default
```

## 开发指南

### 本地开发

1. **安装依赖**
   ```bash
   cd nextjs
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm run dev
   ```

3. **构建生产版本**
   ```bash
   pnpm run build
   pnpm run start
   ```

### 容器开发

1. **开发环境启动**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **查看日志**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. **重启服务**
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```

## 性能优化

### 镜像优化

- 使用Alpine Linux基础镜像
- 多阶段构建减少镜像大小
- 使用非root用户提高安全性
- 配置健康检查

### 应用优化

- Next.js standalone输出
- 静态文件缓存
- Gzip压缩
- 图片优化

## 安全考虑

### 容器安全

- 使用非root用户运行
- 最小化基础镜像
- 定期更新依赖
- 配置资源限制

### 应用安全

- 环境变量管理
- API密钥保护
- CORS配置
- 输入验证

## 监控和日志

### 日志管理

```bash
# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs frontend

# 限制日志大小
# 在docker-compose.yml中配置logging选项
```

### 健康检查

```bash
# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' <container_id>

# 手动健康检查
curl http://localhost:3000
```

## 部署建议

### 生产部署

1. 修改默认配置
2. 配置SSL证书
3. 设置资源限制
4. 配置日志轮转
5. 设置监控告警

### 扩展性

- 使用负载均衡器
- 配置CDN
- 数据库连接池
- 缓存策略

## 相关文档

- [Docker官方文档](https://docs.docker.com/)
- [Next.js部署指南](https://nextjs.org/docs/deployment)
- [Docker Compose参考](https://docs.docker.com/compose/)
- [项目架构文档](../SYSTEM_ARCHITECTURE.md)