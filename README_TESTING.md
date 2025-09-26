# 讲义予约システム - 独立服务测试指南

## 概述

本文档提供了每个服务的独立测试方法，方便您逐步验证每个组件的运行情况。

## 服务架构

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   代理服务   │    │   前端服务   │    │   后端服务   │
│   (Nginx)   │    │  (Next.js)  │    │  (FastAPI)  │
│   Port: 80  │    │  Port: 3000 │    │  Port: 8000 │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                   ┌─────────────┐
                   │   数据库服务  │
                   │ (PostgreSQL)│
                   │  Port: 5432 │
                   └─────────────┘
```

## 独立测试方法

### 1. 数据库服务测试

**目录**: `database/`

**启动命令**:
```bash
cd database
docker compose up -d
```

**测试命令**:
```bash
cd database
chmod +x test_database.sh
./test_database.sh
```

**访问信息**:
- 端口: `localhost:5432`
- 用户名: `lecture_admin`
- 密码: `postgresroot`
- 数据库: `lecture_booking`

**验证步骤**:
1. 检查容器状态
2. 验证数据库连接
3. 检查表结构
4. 验证管理员用户

### 2. 后端服务测试

**目录**: `backend/`

**前置条件**: 数据库服务必须运行

**启动命令**:
```bash
cd backend
docker compose up -d
```

**测试命令**:
```bash
cd backend
chmod +x test_backend.sh
./test_backend.sh
```

**访问信息**:
- API文档: `http://localhost:8000/docs`
- 健康检查: `http://localhost:8000/health`
- OpenAPI: `http://localhost:8000/openapi.json`

**验证步骤**:
1. 检查数据库连接
2. 验证健康状态
3. 测试API端点
4. 测试用户注册

### 3. 前端服务测试

**目录**: `frontend/`

**前置条件**: 后端服务建议运行（可选）

**启动命令**:
```bash
cd frontend
docker compose up -d
```

**测试命令**:
```bash
cd frontend
chmod +x test_frontend.sh
./test_frontend.sh
```

**访问信息**:
- 前端地址: `http://localhost:3000`
- API基础URL: `http://localhost:8000/api`

**验证步骤**:
1. 检查容器状态
2. 验证页面加载
3. 测试API连接
4. 检查页面内容

### 4. 代理服务测试

**目录**: `proxy/`

**前置条件**: 前端和后端服务建议运行

**启动命令**:
```bash
cd proxy
docker compose up -d
```

**测试命令**:
```bash
cd proxy
chmod +x test_proxy.sh
./test_proxy.sh
```

**访问信息**:
- 代理地址: `http://localhost`
- 前端代理: `http://localhost/`
- 后端API代理: `http://localhost/api/`
- 健康检查: `http://localhost/health`

**验证步骤**:
1. 检查依赖服务
2. 验证代理路由
3. 测试HTTP头信息
4. 检查Gzip压缩

## 一键测试所有服务

**使用总体测试脚本**:
```bash
chmod +x test_all_services.sh
./test_all_services.sh
```

**功能**:
- 交互式菜单选择
- 按顺序测试所有服务
- 自动清理测试容器
- 彩色输出和状态提示

## 测试顺序建议

### 推荐测试顺序:
1. **数据库服务** - 基础数据存储
2. **后端服务** - API和业务逻辑
3. **前端服务** - 用户界面
4. **代理服务** - 统一入口

### 快速验证顺序:
```bash
# 1. 启动数据库
cd database && docker compose up -d

# 2. 启动后端
cd ../backend && docker compose up -d

# 3. 启动前端
cd ../frontend && docker compose up -d

# 4. 启动代理
cd ../proxy && docker compose up -d
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 检查端口是否被占用
   - 修改docker-compose.yml中的端口映射

2. **服务依赖问题**
   - 确保依赖服务已启动
   - 检查服务间网络连接

3. **容器启动失败**
   - 查看容器日志: `docker compose logs`
   - 检查Dockerfile和配置文件

4. **数据库连接失败**
   - 验证数据库服务状态
   - 检查连接参数

### 清理命令

```bash
# 清理所有测试容器
docker compose -f database/docker-compose.yml down
docker compose -f backend/docker-compose.yml down
docker compose -f frontend/docker-compose.yml down
docker compose -f proxy/docker-compose.yml down

# 清理所有相关容器
docker ps -a | grep booking | awk '{print $1}' | xargs docker rm -f

# 清理测试数据卷
docker volume ls | grep test | awk '{print $2}' | xargs docker volume rm
```

## 生产环境部署

完成独立测试后，可以使用主docker compose文件进行生产部署:

```bash
# 生产环境
docker compose up -d

# 开发环境
docker compose -f docker-compose.dev.yml up -d

# 生产环境（推荐，包含SSL和安全配置）
docker compose -f docker-compose.prod.yml up -d
```

## 注意事项

1. **网络配置**: 独立测试使用`host.docker.internal`访问宿主机服务
2. **数据持久化**: 每个服务使用独立的数据卷
3. **日志管理**: 所有服务都配置了日志轮转
4. **健康检查**: 每个服务都有相应的健康检查机制
5. **安全考虑**: 生产环境请修改默认密码和密钥
