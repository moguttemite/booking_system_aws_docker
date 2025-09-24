# 数据库服务独立测试配置

## 概述

此配置基于您原来的数据库 docker-compose 文件，保持了相同的安全性和配置风格。现已升级到 PostgreSQL 18，享受最新功能和性能提升。

### 🚀 PostgreSQL 18 新特性
- **性能提升**: 查询优化和索引改进
- **新功能**: 增强的 JSON 支持、改进的分区等
- **安全性**: 最新的安全补丁和修复
- **兼容性**: 完全向后兼容现有应用
- **数据目录结构**: 新的 `/var/lib/postgresql/18/docker` 路径

## 配置特点

### 🔐 安全性
- **Secrets 管理**: 使用 Docker secrets 管理数据库密码
- **端口隔离**: 绑定到 `127.0.0.1:5433` 避免端口冲突
- **只读挂载**: 初始化脚本以只读方式挂载

### 📁 文件结构
```
database/
├── docker-compose.yml          # 数据库独立测试配置
├── test_database.sh           # 测试脚本
├── secrets/
│   └── postgres_password.txt  # 数据库密码文件
├── initdb/
│   └── init.sql              # 数据库初始化脚本
└── README_DATABASE_TEST.md   # 本文档
```

### 🐳 容器配置
- **镜像**: `postgres:18` (PostgreSQL 18 最新版本)
- **容器名**: `booking_postgresql_test`
- **端口**: `127.0.0.1:5433:5432`
- **数据卷**: `postgres-data`
- **网络**: `booking-network`
- **数据目录**: `/var/lib/postgresql/18/docker` (PostgreSQL 18 新结构)

## 使用方法

### 1. 启动数据库服务
```bash
cd database
docker-compose up -d
```

### 2. 运行测试脚本

#### Windows 环境
```cmd
REM 方法1: 使用批处理文件
test_database.bat

REM 方法2: 使用PowerShell脚本 (推荐)
powershell -ExecutionPolicy Bypass -File test_database.ps1
```

#### Linux/macOS 环境
```bash
chmod +x test_database.sh
./test_database.sh
```

### 3. 手动连接数据库
```bash
# 通过容器连接
docker-compose exec postgres psql -U lecture_admin -d lecture_booking

# 通过宿主机连接（需要PostgreSQL客户端）
psql -h 127.0.0.1 -p 5433 -U lecture_admin -d lecture_booking
```

## 环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| POSTGRES_USER | lecture_admin | 数据库用户名 |
| POSTGRES_DB | lecture_booking | 数据库名 |
| PGDATA | /var/lib/postgresql/data/pgdata | 数据目录 |
| POSTGRES_PASSWORD_FILE | /run/secrets/postgres_password | 密码文件路径 |

## 安全说明

### Secrets 管理
- 密码存储在 `secrets/postgres_password.txt` 文件中
- 文件内容: `postgresroot`
- 容器启动时自动挂载到 `/run/secrets/postgres_password`

### 端口安全
- 只绑定到 `127.0.0.1`，外部无法直接访问
- 使用端口 `5433` 避免与系统其他 PostgreSQL 实例冲突

## 数据持久化

### 数据卷
- **名称**: `postgres-data`
- **挂载点**: `/var/lib/postgresql/data`
- **类型**: 本地卷

### 初始化脚本
- **位置**: `initdb/init.sql`
- **挂载点**: `/docker-entrypoint-initdb.d`
- **权限**: 只读 (`:ro`)

## 健康检查

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U lecture_admin -d lecture_booking"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## 日志管理

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

## 故障排除

### 常见问题

1. **Secrets 文件不存在**
   ```bash
   # 创建 secrets 目录和文件
   mkdir -p secrets
   echo "postgresroot" > secrets/postgres_password.txt
   ```

2. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -an | grep 5433
   
   # 修改端口映射
   # 在 docker-compose.yml 中修改 ports 配置
   ```

3. **容器启动失败**
   ```bash
   # 查看容器日志
   docker-compose logs postgres
   
   # 检查容器状态
   docker-compose ps
   ```

4. **数据库连接失败**
   ```bash
   # 检查容器是否运行
   docker-compose ps
   
   # 检查健康状态
   docker-compose exec postgres pg_isready -U lecture_admin -d lecture_booking
   ```

### 清理命令

```bash
# 停止并删除容器
docker-compose down

# 删除数据卷（注意：会丢失所有数据）
docker-compose down -v

# 清理所有相关资源
docker-compose down --volumes --remove-orphans
```

## 与其他服务的集成

### 后端服务连接
后端服务需要连接到 `host.docker.internal:5433` 来访问此数据库。

### 开发环境
在开发环境中，可以使用此独立配置进行数据库测试，而不影响其他服务。

## 生产环境部署

此配置主要用于测试和开发。生产环境请使用主 `docker-compose.yml` 文件中的数据库配置。
