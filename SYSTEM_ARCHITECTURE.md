# 讲座预订系统架构文档

## 系统概述

这是一个基于 Next.js + FastAPI + PostgreSQL + Nginx 的讲座预订系统，采用微服务架构，支持Docker容器化部署。系统实现了用户管理、讲师管理、讲座管理、预约管理等功能。

## 技术栈

### 前端 (Frontend)
- **框架**: Next.js 15.3.5
- **语言**: TypeScript
- **包管理器**: pnpm
- **UI框架**: 
  - Mantine 8.1.3 (主要UI组件)
  - Ant Design 5.26.4 (辅助组件)
  - Tailwind CSS 4 (样式框架)
- **状态管理**: Zustand 5.0.6
- **动画**: Framer Motion 12.23.3
- **拖拽**: @hello-pangea/dnd 18.0.1
- **轮播**: @mantine/carousel 8.1.3

### 后端 (Backend)
- **框架**: FastAPI 0.104.1
- **语言**: Python 3.11
- **服务器**: Uvicorn 0.24.0
- **数据库ORM**: SQLAlchemy 2.0.23
- **数据库**: PostgreSQL 15 (统一版本)
- **认证**: JWT (python-jose)
- **密码加密**: bcrypt (passlib)
- **数据验证**: Pydantic 2.5.0

### 数据库 (Database)
- **类型**: PostgreSQL 15
- **扩展**: uuid-ossp, pg_trgm
- **字符集**: UTF-8

### 代理 (Proxy)
- **服务器**: Nginx Alpine
- **功能**: 负载均衡、静态文件缓存、CORS支持

## 系统架构

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

## 前端架构详解

### 目录结构
```
booking_system/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # 管理员页面
│   │   ├── api/               # API路由
│   │   ├── bookings/          # 预约页面
│   │   ├── teacher/           # 讲师页面
│   │   └── layout.tsx         # 根布局
│   ├── components/            # 组件库
│   │   ├── admin/             # 管理员组件
│   │   ├── teacher/           # 讲师组件
│   │   └── *.tsx              # 通用组件
│   ├── hooks/                 # 自定义Hooks
│   ├── lib/                   # 工具库
│   │   ├── api.ts             # API调用
│   │   ├── auth.ts            # 认证相关
│   │   └── *.ts               # 其他工具
│   ├── store/                 # 状态管理
│   └── types/                 # TypeScript类型定义
├── public/                    # 静态资源
├── package.json
└── next.config.ts
```

### 核心功能模块

#### 1. 用户认证系统
- **登录/注册**: 支持邮箱密码登录
- **JWT认证**: 基于Token的身份验证
- **会话管理**: 自动处理Token过期
- **权限控制**: 基于角色的访问控制

#### 2. 用户角色
- **学生 (student)**: 可以预约讲座
- **讲师 (teacher)**: 可以创建和管理讲座
- **管理员 (admin)**: 可以管理所有内容

#### 3. 主要页面
- **首页**: 讲座展示和预约
- **管理员页面**: 用户管理、讲座审批、轮播管理
- **讲师页面**: 讲座创建、时间安排、预约管理
- **个人中心**: 个人信息、预约记录

#### 4. 核心组件
- **HomePage**: 主页组件，展示讲座列表
- **TeacherCard**: 讲师卡片组件
- **BookingCard**: 预约卡片组件
- **LoginModal**: 登录弹窗
- **ErrorBoundary**: 错误边界组件

### 技术特性
- **响应式设计**: 支持移动端和桌面端
- **错误处理**: 完善的错误边界和错误处理机制
- **状态管理**: 使用Zustand进行状态管理
- **类型安全**: 完整的TypeScript类型定义
- **性能优化**: 使用Next.js的优化特性

## 后端架构详解

### 目录结构
```
booking_system/booking_backend/fastapi/
├── app/
│   ├── api/
│   │   └── api_v1/
│   │       ├── api.py              # 主路由
│   │       └── endpoints/          # API端点
│   │           ├── users.py        # 用户管理
│   │           ├── teachers.py     # 讲师管理
│   │           ├── lectures.py     # 讲座管理
│   │           ├── bookings.py     # 预约管理
│   │           └── schedules.py    # 时间安排
│   ├── core/
│   │   ├── config.py               # 配置管理
│   │   └── security.py             # 安全相关
│   ├── db/
│   │   └── database.py             # 数据库连接
│   ├── models/                     # 数据模型
│   │   ├── user.py
│   │   ├── teacher.py
│   │   ├── lecture.py
│   │   └── booking.py
│   ├── schemas/                    # Pydantic模式
│   └── utils/
│       └── jwt.py                  # JWT工具
├── main.py                         # 应用入口
├── start.py                        # 开发启动脚本
└── requirements.txt
```

### API设计

#### 1. 用户管理 API (`/api/v1/users`)
- `POST /login` - 用户登录
- `GET /` - 获取用户列表
- `GET /{user_id}` - 获取用户详情
- `PATCH /{user_id}` - 更新用户信息
- `PATCH /profile` - 更新个人资料
- `PATCH /password` - 修改密码

#### 2. 讲师管理 API (`/api/v1/teachers`)
- `GET /` - 获取讲师列表
- `GET /{teacher_id}` - 获取讲师详情
- `PATCH /{teacher_id}/profile` - 更新讲师资料

#### 3. 讲座管理 API (`/api/v1/lectures`)
- `GET /` - 获取讲座列表
- `POST /` - 创建讲座
- `GET /{lecture_id}` - 获取讲座详情
- `PUT /{lecture_id}/update` - 更新讲座信息
- `PUT /{lecture_id}/approval` - 更新审批状态
- `DELETE /{lecture_id}` - 删除讲座
- `GET /my-lectures` - 获取我的讲座
- `GET /carousel` - 获取轮播图数据
- `PUT /carousel/batch` - 批量更新轮播图

#### 4. 预约管理 API (`/api/v1/bookings`)
- `GET /my-bookings` - 获取我的预约
- `POST /` - 创建预约
- `PUT /cancel/{booking_id}` - 取消预约
- `GET /lecture/{lecture_id}` - 获取讲座预约列表

#### 5. 时间安排 API (`/api/v1/schedules`)
- `GET /lecture/{lecture_id}` - 获取讲座时间安排
- `POST /lecture-schedules` - 创建时间安排
- `DELETE /{schedule_id}` - 删除时间安排

### 安全特性
- **JWT认证**: 基于Token的身份验证
- **密码加密**: 使用bcrypt加密密码
- **CORS支持**: 跨域请求支持
- **输入验证**: 使用Pydantic进行数据验证
- **SQL注入防护**: 使用SQLAlchemy ORM

## 数据库架构详解

### 数据库设计

#### 1. 用户信息表 (user_infos)
```sql
CREATE TABLE user_infos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP
);
```

#### 2. 讲师信息表 (teacher_profiles)
```sql
CREATE TABLE teacher_profiles (
  id INTEGER PRIMARY KEY,
  phone TEXT,
  bio TEXT,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES user_infos(id) ON DELETE CASCADE
);
```

#### 3. 讲座信息表 (lectures)
```sql
CREATE TABLE lectures (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  lecture_title TEXT NOT NULL,
  lecture_description TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE
);
```

#### 4. 讲座时间安排表 (lecture_schedules)
```sql
CREATE TABLE lecture_schedules (
  id SERIAL PRIMARY KEY,
  lecture_id INTEGER NOT NULL,
  date DATE NOT NULL,
  start TIME NOT NULL,
  end TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  CHECK (start < end),
  UNIQUE (lecture_id, date, start, end),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);
```

#### 5. 讲座预约表 (lecture_bookings)
```sql
CREATE TABLE lecture_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  lecture_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled')
  ),
  date DATE NOT NULL,
  start TIME NOT NULL,
  end TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_expired BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES user_infos(id) ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);
```

#### 6. 轮播图表 (carousel)
```sql
CREATE TABLE carousel (
  lecture_id INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);
```

### 索引优化
- 用户邮箱索引: `idx_user_infos_email`
- 用户角色索引: `idx_user_infos_role`
- 讲座讲师索引: `idx_lectures_teacher_id`
- 讲座状态索引: `idx_lectures_approval_status`
- 预约用户索引: `idx_lecture_bookings_user_id`
- 预约讲座索引: `idx_lecture_bookings_lecture_id`

## 部署架构

### Docker容器化
- **前端容器**: Next.js应用，端口3000
- **后端容器**: FastAPI应用，端口8000
- **数据库容器**: PostgreSQL，端口5432
- **代理容器**: Nginx，端口80/443

### 网络隔离
- **backend_net**: 数据库和后端专用网络
- **public_net**: 前端和代理公共网络
- **安全隔离**: 前端无法直接访问数据库

### 环境配置
- **生产环境**: 只暴露Nginx端口，内部服务隔离
- **开发环境**: 暴露所有端口，便于调试

## 安全特性

### 1. 网络安全
- **网络隔离**: 数据库仅限后端访问
- **最小权限**: 每个服务只能访问必要的网络
- **端口控制**: 生产环境只暴露必要端口

### 2. 应用安全
- **JWT认证**: 安全的Token认证机制
- **密码加密**: bcrypt加密存储
- **输入验证**: 严格的数据验证
- **CORS配置**: 跨域请求控制

### 3. 数据安全
- **数据加密**: 敏感数据加密存储
- **访问控制**: 基于角色的权限管理
- **审计日志**: 操作记录和追踪

## 性能优化

### 1. 前端优化
- **代码分割**: Next.js自动代码分割
- **静态生成**: 静态页面预生成
- **图片优化**: Next.js图片优化
- **缓存策略**: 合理的缓存配置

### 2. 后端优化
- **数据库索引**: 关键字段建立索引
- **连接池**: 数据库连接池管理
- **异步处理**: FastAPI异步处理
- **缓存机制**: 适当的缓存策略

### 3. 数据库优化
- **索引优化**: 查询性能优化
- **查询优化**: SQL查询优化
- **连接管理**: 连接池配置
- **数据分区**: 大数据量分区策略

## 监控和日志

### 1. 健康检查
- **服务健康检查**: 每个服务都有健康检查端点
- **数据库健康检查**: PostgreSQL连接检查
- **代理健康检查**: Nginx状态检查

### 2. 日志管理
- **应用日志**: 结构化日志记录
- **访问日志**: Nginx访问日志
- **错误日志**: 错误追踪和记录

### 3. 监控指标
- **性能指标**: 响应时间、吞吐量
- **资源指标**: CPU、内存、磁盘使用
- **业务指标**: 用户数、预约数、讲座数

## 开发指南

### 1. 本地开发
```bash
# 开发环境启动
docker-compose -f docker-compose.dev.yml up -d

# 访问地址
# 前端: http://localhost:3000
# 后端: http://localhost:8000
# 数据库: localhost:5432
```

### 2. 生产部署
```bash
# 生产环境启动
docker-compose up -d

# 访问地址
# 应用: http://localhost
# API: http://localhost/api
```

### 3. 环境变量
```bash
# 数据库配置
POSTGRES_DB=lecture_booking
POSTGRES_USER=lecture_admin
POSTGRES_PASSWORD=postgresroot

# 后端配置
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 前端配置
NEXT_PUBLIC_API_BASE_URL=http://proxy/api
```

## 扩展性考虑

### 1. 水平扩展
- **负载均衡**: Nginx负载均衡
- **数据库集群**: PostgreSQL主从复制
- **缓存层**: Redis缓存支持
- **CDN**: 静态资源CDN加速

### 2. 功能扩展
- **多租户**: 支持多机构管理
- **支付集成**: 在线支付功能
- **通知系统**: 邮件/短信通知
- **数据分析**: 数据统计和分析

### 3. 技术升级
- **微服务**: 进一步微服务化
- **容器编排**: Kubernetes部署
- **服务网格**: Istio服务治理
- **云原生**: 云原生架构改造

## 故障排除

### 1. 常见问题
- **端口冲突**: 检查端口占用情况
- **网络连接**: 检查容器网络配置
- **数据库连接**: 检查数据库配置
- **权限问题**: 检查文件权限设置

### 2. 调试方法
- **查看日志**: `docker-compose logs -f [service]`
- **进入容器**: `docker-compose exec [service] bash`
- **检查状态**: `docker-compose ps`
- **重启服务**: `docker-compose restart [service]`

### 3. 性能调优
- **数据库优化**: 调整PostgreSQL配置
- **Nginx优化**: 调整Nginx配置
- **应用优化**: 调整应用配置
- **资源限制**: 设置容器资源限制

---

## 总结

本系统采用现代化的技术栈和架构设计，具有良好的可扩展性、安全性和性能。通过Docker容器化部署，实现了开发和生产环境的一致性，通过网络隔离和权限控制，确保了系统的安全性。系统支持用户管理、讲座管理、预约管理等核心功能，可以满足教育机构的讲座预订需求。
