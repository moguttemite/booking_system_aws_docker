# 后端服务独立测试配置

## 概述

这个配置用于独立测试 FastAPI 后端服务，包含完整的用户管理、认证和数据库连接功能。

## 配置特点

### 🚀 技术栈
- **FastAPI**: 现代、快速的 Python Web 框架
- **SQLAlchemy**: Python SQL 工具包和 ORM
- **PostgreSQL**: 关系型数据库
- **JWT**: JSON Web Token 认证
- **Pydantic**: 数据验证和序列化

### 🔐 安全特性
- **JWT 认证**: 安全的用户认证机制
- **密码哈希**: 使用 bcrypt 进行密码加密
- **数据验证**: 严格的输入验证和清理
- **非 root 用户**: 容器内使用非特权用户运行

### 📁 文件结构
```
backend/
├── docker-compose.yml          # 独立测试配置
├── Dockerfile                  # 后端镜像构建
├── test_backend.ps1           # PowerShell 测试脚本
├── test_backend.sh            # Linux/macOS 测试脚本
├── test_backend_detailed.ps1  # 详细测试脚本
├── .dockerignore              # Docker 忽略文件
├── requirements.txt           # Python 依赖（根目录）
└── fastapi/                   # FastAPI 应用代码
    ├── main.py               # 应用入口
    ├── requirements.txt      # 实际依赖文件
    ├── app/                  # 应用代码
    │   ├── api/             # API 路由
    │   ├── core/            # 核心配置
    │   ├── db/              # 数据库配置
    │   ├── models/          # 数据模型
    │   ├── schemas/         # Pydantic 模型
    │   └── utils/           # 工具函数
    └── start.py             # 开发启动脚本
```

### 🐳 容器配置
- **基础镜像**: `python:3.11-slim`
- **容器名称**: `booking_backend_test`
- **端口**: `8000:8000`
- **启动命令**: `uvicorn main:app --host 0.0.0.0 --port 8000`

## 使用方法

### 1. 启动后端服务
```powershell
cd backend
docker-compose up -d
```

### 2. 运行测试脚本

#### Windows 环境
```powershell
# 基础测试
.\test_backend.ps1

# 详细测试（推荐）
.\test_backend_detailed.ps1
```

#### Linux/macOS 环境
```bash
chmod +x test_backend.sh
./test_backend.sh
```

### 3. 手动测试 API

#### 用户注册
```bash
curl -X POST "http://localhost:8000/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPassword123"}'
```

#### 用户登录
```bash
curl -X POST "http://localhost:8000/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin1234"}'
```

#### 健康检查
```bash
curl http://localhost:8000/health
```

## API 端点

### 🔗 主要端点
- **根路径**: `GET /`
- **健康检查**: `GET /health`
- **API 文档**: `GET /docs`
- **OpenAPI 规范**: `GET /api/v1/openapi.json`

### 👥 用户管理
- **用户注册**: `POST /api/v1/users/register`
- **用户登录**: `POST /api/v1/users/login`
- **获取用户信息**: `GET /api/v1/users/{user_id}`
- **获取所有用户**: `GET /api/v1/users/` (管理员)
- **更新用户角色**: `PATCH /api/v1/users/{user_id}/role` (管理员)
- **更改密码**: `PATCH /api/v1/users/password`
- **删除用户**: `DELETE /api/v1/users/{user_id}` (管理员)
- **更新用户资料**: `PATCH /api/v1/users/profile`
- **检查认证状态**: `GET /api/v1/users/check-auth`

### 🎓 讲师管理
- **讲师相关端点**: `/api/v1/teachers/`

### 📚 讲座管理
- **讲座相关端点**: `/api/v1/lectures/`

### 📅 预约管理
- **预约相关端点**: `/api/v1/bookings/`

### ⏰ 时间安排
- **时间安排端点**: `/api/v1/schedules/`

## 环境变量

### 数据库配置
- `POSTGRES_SERVER`: 数据库服务器地址
- `POSTGRES_PORT`: 数据库端口
- `POSTGRES_USER`: 数据库用户名
- `POSTGRES_PASSWORD`: 数据库密码
- `POSTGRES_DB`: 数据库名称

### 应用配置
- `SECRET_KEY`: JWT 密钥
- `ALGORITHM`: JWT 算法
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token 过期时间
- `FIRST_SUPERUSER`: 超级用户邮箱
- `FIRST_SUPERUSER_PASSWORD`: 超级用户密码

## 数据模型

### 用户注册 (UserCreate)
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

### 用户登录 (UserLogin)
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

### 登录响应 (UserLoginResponse)
```json
{
  "id": 1,
  "name": "用户名",
  "role": "student",
  "token": "jwt_token_here"
}
```

## 密码要求

- 最少 8 个字符
- 必须包含大写字母
- 必须包含小写字母
- 必须包含数字

## 故障排除

### 💡 常见问题
1. **422 错误**: 检查 JSON 格式和字段名称
2. **数据库连接失败**: 确保数据库服务正在运行
3. **权限错误**: 检查 JWT token 是否有效

### 🔍 调试命令
- **查看容器日志**: `docker-compose logs backend`
- **检查容器状态**: `docker-compose ps`
- **进入容器**: `docker-compose exec backend bash`

## 版本信息
- **Python**: 3.11
- **FastAPI**: 0.104.1
- **SQLAlchemy**: 2.0.23
- **PostgreSQL**: 17-alpine

