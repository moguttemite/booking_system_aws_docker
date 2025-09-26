# 讲座预订系统 Docker 部署

这是一个基于 Next.js + FastAPI + PostgreSQL + Nginx 的讲座预订系统，使用 Docker 进行容器化部署。

## 项目结构

```
├── booking_system/
│   ├── frontend/          # Next.js 前端
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── src/
│   └── booking_backend/
│       └── fastapi/       # FastAPI 后端
│           ├── Dockerfile
│           ├── requirements.txt
│           ├── main.py
│           └── app/
├── database/              # PostgreSQL 数据库
│   ├── Dockerfile
│   └── init.sql
├── proxy/                 # Nginx 代理
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml     # Docker Compose 编排文件
├── env.example           # 环境变量示例
└── README.md
```

## 快速开始

### 1. 环境准备

确保已安装以下软件：
- Docker
- Docker Compose

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，修改相应的配置值。

### ⚠️ 生产环境安全警告

**部署到生产环境前，必须完成以下安全配置：**

1. **修改默认密钥**：
   ```bash
   # 创建密钥文件
   mkdir -p secrets
   echo "your_strong_password" > secrets/postgres_password.txt
   echo "your_jwt_secret_key" > secrets/secret_key.txt
   echo "your_superuser_password" > secrets/superuser_password.txt
   chmod 600 secrets/*.txt
   ```

2. **配置域名和SSL**：
   ```bash
   # 设置域名
   export DOMAIN_NAME=your-domain.com
   export ADMIN_EMAIL=admin@your-domain.com
   ```

3. **使用生产配置**：
   ```bash
   # 使用生产环境配置
   docker compose -f docker-compose.prod.yml up -d
   ```

详细的生产部署指南请参考：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### 3. 构建和启动服务

#### 生产环境（推荐）
```bash
# 构建所有镜像
docker-compose build

# 启动所有服务（只暴露Nginx端口）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 开发环境（调试用）
```bash
# 使用开发环境配置（暴露所有端口用于调试）
docker-compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

### 4. 访问应用

#### 生产环境
- 前端应用：http://localhost
- 后端API：http://localhost/api
- 数据库：仅内部访问（通过Nginx代理）

#### 开发环境
- 前端应用：http://localhost:3000
- 后端API：http://localhost:8000
- 数据库：localhost:5432
- 代理服务：http://localhost

### 5. 默认账户

- 管理员账户：admin@example.com / admin123
- 学生账户：student@example.com / (密码在数据库中)
- 讲师账户：teacher@example.com / (密码在数据库中)

### 6. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 服务说明

### 前端 (Next.js)
- 内部端口：3000
- 包管理器：pnpm
- UI框架：Mantine + Ant Design + Tailwind CSS
- 构建：多阶段构建，优化镜像大小
- 特性：支持静态文件缓存、健康检查、standalone输出

### 后端 (FastAPI)
- 内部端口：8000
- 数据库：PostgreSQL (lecture_booking)
- 启动方式：使用start.py进行开发模式启动
- 特性：自动重连、健康检查、非root用户运行、JWT认证

### 数据库 (PostgreSQL 15)
- 内部端口：5432
- 数据库名：lecture_booking
- 用户：lecture_admin
- 数据持久化：使用Docker卷
- 特性：自动初始化、健康检查、完整的讲座预订系统表结构、统一版本管理

### 代理 (Nginx)
- 外部端口：80, 443
- 功能：负载均衡、静态文件缓存、CORS支持
- 特性：Gzip压缩、健康检查、支持HTTP和HTTPS

## 端口配置说明

### 生产环境（docker-compose.yml）
- **只暴露Nginx端口**：80, 443
- **内部服务端口**：使用`expose`而非`ports`
- **安全性**：外部无法直接访问数据库和后端服务
- **访问方式**：所有请求通过Nginx代理转发

### 开发环境（docker-compose.dev.yml）
- **暴露所有端口**：便于调试和开发
- **直接访问**：可以绕过代理直接访问各服务
- **调试友好**：支持热重载和实时调试

## 健康检查优化

### 原生语言健康检查
- **后端**：使用Python的`urllib.request`模块
- **前端**：使用Node.js的`http`模块
- **代理**：使用wget（Nginx Alpine镜像需要）

### 优势
- **减少依赖**：不需要安装额外的工具（curl/wget）
- **更轻量**：镜像体积更小
- **更可靠**：使用语言原生模块，兼容性更好
- **更安全**：减少攻击面

## 网络安全隔离

### 网络架构设计
```
┌─────────────────┐    ┌─────────────────┐
│   public_net    │    │   backend_net   │
│                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │
│  │  frontend │  │    │  │  database │  │
│  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │
│  │   proxy   │  │    │  │  backend  │  │
│  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘
```

### 安全隔离策略
- **数据库**：仅限 `backend_net`，只有后端服务可访问
- **后端**：同时连接 `backend_net` 和 `public_net`
- **前端**：仅限 `public_net`，无法直接访问数据库
- **代理**：仅限 `public_net`，作为统一入口

### 安全优势
- **数据库隔离**：前端和代理无法直接访问数据库
- **最小权限**：每个服务只能访问必要的网络
- **攻击面减少**：即使某个服务被攻破，也无法直接访问数据库
- **合规性**：符合安全最佳实践和合规要求

## 开发模式

如果需要开发模式运行：

```bash
# 开发模式启动（挂载本地代码）
docker-compose -f docker-compose.dev.yml up -d
```

## 故障排除

### 查看服务日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs frontend
docker-compose logs backend
docker-compose logs database
docker-compose logs proxy
```

### 进入容器调试
```bash
# 进入后端容器
docker-compose exec backend bash

# 进入数据库容器
docker-compose exec database psql -U booking_user -d booking_system
```

### 重新构建服务
```bash
# 重新构建特定服务
docker-compose build frontend

# 重新构建所有服务
docker-compose build --no-cache
```

## 生产部署建议

1. 修改默认密码和密钥
2. 配置SSL证书
3. 设置适当的资源限制
4. 配置日志轮转
5. 设置监控和告警
6. 定期备份数据库
