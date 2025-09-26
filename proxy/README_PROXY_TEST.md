# 代理服务测试指南

## 概述

本文档提供了代理服务的独立测试方法，包括生产环境和开发环境的配置。代理服务使用Nginx作为反向代理，提供负载均衡、静态文件缓存、SSL终止等功能。

## 项目结构

```
proxy/
├── docker-compose.yml          # 生产环境配置
├── docker-compose.dev.yml      # 开发环境配置
├── Dockerfile                  # 生产环境镜像
├── Dockerfile.dev              # 开发环境镜像
├── nginx.conf.template         # Nginx配置模板
├── docker-entrypoint.sh        # 启动脚本
├── test_proxy.sh               # Linux/Mac测试脚本
├── test_proxy.ps1              # Windows PowerShell测试脚本
├── error-pages/                # 自定义错误页面
│   └── 50x.html
└── mock-*/                     # Mock服务（用于单元测试）
```

## 快速开始

### 1. 生产环境测试

```bash
# Linux/Mac
chmod +x test_proxy.sh
./test_proxy.sh

# Windows PowerShell
.\test_proxy.ps1
```

### 2. 开发环境测试

```bash
# 使用开发环境配置
docker-compose -f docker-compose.dev.yml up -d
```

## 环境配置

### 生产环境 (docker-compose.yml)

- **基础镜像**: Nginx Alpine
- **端口**: 80 (HTTP), 443 (HTTPS)
- **上游服务**: 通过环境变量配置
- **健康检查**: 使用wget检查/health端点
- **资源限制**: 内存256M, CPU 0.5核

### 开发环境 (docker-compose.dev.yml)

- **基础镜像**: Nginx Alpine + 开发工具
- **端口**: 80 (HTTP), 443 (HTTPS)
- **热重载**: 挂载配置文件
- **调试模式**: 详细日志输出
- **资源限制**: 内存512M, CPU 1.0核

## 核心功能

### 1. 反向代理

- **前端代理**: `/` → `http://frontend:3000`
- **后端API代理**: `/api/` → `http://backend:8000/`
- **健康检查**: `/health` → 直接响应

### 2. 负载均衡

- 支持多后端实例
- 健康检查和故障转移
- 连接保持和复用

### 3. 静态文件缓存

- 静态资源缓存1年
- 设置适当的缓存头
- 支持Gzip压缩

### 4. 安全特性

- 安全头设置
- 请求限流
- 隐藏文件访问控制
- SSL/TLS支持

### 5. 监控和日志

- 结构化访问日志
- 错误日志记录
- 健康检查监控
- 性能指标收集

## 配置说明

### 环境变量

```bash
# 上游服务配置
FRONTEND_HOST=host.docker.internal
FRONTEND_PORT=3000
BACKEND_HOST=host.docker.internal
BACKEND_PORT=8000

# 日志配置
NGINX_LOG_LEVEL=info

# 开发环境配置
WAIT_FOR_UPSTREAM=true
```

### Nginx配置特性

1. **上游服务器配置**:
   - 使用环境变量动态配置
   - 支持连接保持
   - 健康检查集成

2. **限流配置**:
   - API请求限流: 10req/s
   - 静态文件限流: 30req/s
   - 突发处理支持

3. **缓存配置**:
   - 静态文件长期缓存
   - 适当的缓存头设置
   - 缓存失效策略

4. **安全配置**:
   - 安全头设置
   - 隐藏文件保护
   - 请求大小限制

## 测试脚本功能

### test_proxy.sh / test_proxy.ps1

**功能**:
- 检查Docker环境
- 检查上游服务状态
- 构建和启动代理服务
- 测试代理功能
- 负载均衡测试
- 显示访问信息

**参数**:
- `test` (默认): 完整测试流程
- `logs`: 显示服务日志
- `status`: 检查服务状态
- `cleanup`: 清理容器
- `restart`: 重启服务

## 访问信息

### 服务地址

- **代理地址**: http://localhost
- **前端代理**: http://localhost/
- **后端API代理**: http://localhost/api/
- **健康检查**: http://localhost/health

### 路由规则

```
/health          → 直接响应 "healthy"
/api/*           → http://backend:8000/*
/                → http://frontend:3000/
```

## 故障排除

### 常见问题

1. **上游服务不可访问**
   ```bash
   # 检查上游服务状态
   curl http://localhost:3000  # 前端
   curl http://localhost:8000/health  # 后端
   
   # 检查网络连接
   docker-compose exec proxy ping host.docker.internal
   ```

2. **代理配置错误**
   ```bash
   # 检查Nginx配置
   docker-compose exec proxy nginx -t
   
   # 查看配置生成
   docker-compose exec proxy cat /etc/nginx/nginx.conf
   ```

3. **SSL证书问题**
   ```bash
   # 检查证书文件
   ls -la ssl/
   
   # 验证证书
   openssl x509 -in ssl/cert.pem -text -noout
   ```

4. **性能问题**
   ```bash
   # 检查资源使用
   docker stats
   
   # 查看访问日志
   docker-compose logs proxy
   ```

### 调试命令

```bash
# 进入容器调试
docker-compose exec proxy sh

# 查看实时日志
docker-compose logs -f proxy

# 测试配置
docker-compose exec proxy nginx -t

# 重新加载配置
docker-compose exec proxy nginx -s reload
```

## 性能优化

### 1. 缓存优化

- 静态文件长期缓存
- 适当的缓存头设置
- 缓存失效策略

### 2. 压缩优化

- Gzip压缩启用
- 压缩级别优化
- 压缩类型配置

### 3. 连接优化

- 连接保持启用
- 上游连接池
- 超时配置优化

### 4. 资源优化

- 工作进程数配置
- 内存使用优化
- CPU使用优化

## 安全考虑

### 1. 网络安全

- 安全头设置
- 请求限流
- 隐藏文件保护

### 2. 访问控制

- IP白名单支持
- 用户认证集成
- 权限控制

### 3. SSL/TLS

- 证书管理
- 协议版本控制
- 加密套件配置

## 监控和日志

### 日志管理

```bash
# 查看访问日志
docker-compose exec proxy tail -f /var/log/nginx/access.log

# 查看错误日志
docker-compose exec proxy tail -f /var/log/nginx/error.log

# 日志轮转配置
# 在docker-compose.yml中配置logging选项
```

### 健康检查

```bash
# 检查代理健康状态
curl http://localhost/health

# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' <container_id>
```

## 部署建议

### 生产部署

1. 配置SSL证书
2. 设置适当的资源限制
3. 配置日志轮转
4. 设置监控告警
5. 配置备份策略

### 扩展性

- 使用负载均衡器
- 配置CDN
- 数据库连接池
- 缓存策略

## 相关文档

- [Nginx官方文档](https://nginx.org/en/docs/)
- [Docker官方文档](https://docs.docker.com/)
- [项目架构文档](../SYSTEM_ARCHITECTURE.md)
- [前端测试文档](../frontend/README_FRONTEND_TEST.md)
- [后端测试文档](../backend/README_BACKEND_TEST.md)