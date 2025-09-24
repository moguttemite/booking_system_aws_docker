# 讲座预订系统数据库说明

## 概述

本数据库系统为讲座预订平台提供数据存储支持，采用 PostgreSQL 作为主数据库，支持用户管理、讲座管理、时间安排、预约管理等功能。

## 数据库结构

### 核心表

#### 1. 用户管理
- **`user_infos`** - 用户基础信息表
- **`teacher_profiles`** - 讲师档案表（与用户表一对一关系）

#### 2. 讲座管理
- **`lectures`** - 讲座信息表
- **`lecture_teachers`** - 讲座-讲师关联表（多讲师讲座支持）
- **`carousel`** - 首页轮播图配置表

#### 3. 时间安排与预约
- **`lecture_schedules`** - 讲座时间安排表
- **`lecture_bookings`** - 讲座预约表

## 表结构详解

### user_infos（用户信息表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 用户ID（自增主键） |
| name | TEXT | NOT NULL | 用户姓名 |
| email | TEXT | NOT NULL, UNIQUE | 邮箱地址（唯一） |
| hashed_password | TEXT | NOT NULL | 加密后的密码 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'student' | 用户角色（student/teacher/admin） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 软删除标记 |
| deleted_at | TIMESTAMP | NULL | 删除时间 |

### teacher_profiles（讲师档案表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 讲师ID（与user_infos.id相同） |
| phone | TEXT | NULL | 联系电话 |
| bio | TEXT | NULL | 个人简介 |
| profile_image | TEXT | NULL | 头像图片URL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### lectures（讲座信息表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 讲座ID（自增主键） |
| teacher_id | INTEGER | NOT NULL | 主讲讲师ID |
| lecture_title | TEXT | NOT NULL | 讲座标题 |
| lecture_description | TEXT | NULL | 讲座描述 |
| approval_status | VARCHAR(20) | DEFAULT 'pending' | 审批状态（pending/approved/rejected） |
| is_multi_teacher | BOOLEAN | DEFAULT FALSE | 是否多讲师讲座 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 软删除标记 |
| deleted_at | TIMESTAMP | NULL | 删除时间 |

### lecture_schedules（讲座时间安排表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 时间安排ID |
| lecture_id | INTEGER | NOT NULL | 讲座ID |
| teacher_id | INTEGER | NOT NULL | 讲师ID |
| booking_date | DATE | NOT NULL | 可预约日期 |
| start_time | TIME | NOT NULL | 开始时间 |
| end_time | TIME | NOT NULL | 结束时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| is_expired | BOOLEAN | DEFAULT FALSE | 是否过期 |

### lecture_bookings（讲座预约表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | SERIAL | PRIMARY KEY | 预约ID |
| user_id | INTEGER | NOT NULL | 用户ID |
| lecture_id | INTEGER | NOT NULL | 讲座ID |
| teacher_id | INTEGER | NOT NULL | 讲师ID |
| status | VARCHAR(20) | DEFAULT 'pending' | 预约状态（pending/confirmed/cancelled） |
| booking_date | DATE | NOT NULL | 预约日期 |
| start_time | TIME | NOT NULL | 开始时间 |
| end_time | TIME | NOT NULL | 结束时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| is_expired | BOOLEAN | DEFAULT FALSE | 是否过期 |

### lecture_teachers（讲座-讲师关联表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| lecture_id | INTEGER | NOT NULL | 讲座ID |
| teacher_id | INTEGER | NOT NULL | 讲师ID |

### carousel（轮播图表）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| lecture_id | INTEGER | NOT NULL | 讲座ID |
| display_order | INTEGER | NOT NULL | 显示顺序 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否激活 |

## 数据关系

```
user_infos (1) ←→ (1) teacher_profiles
    ↓                    ↓
    ↓                    ↓
lecture_bookings    lectures (1) ←→ (N) lecture_schedules
    ↓                    ↓
    ↓                    ↓
    └────────────────────┘
                    ↓
            lecture_teachers (N:N)
                    ↓
            carousel (1:1)
```

## Docker 部署与操作

### 快速开始

#### 1. 启动数据库
```powershell
# 进入数据库目录
cd booking_backend\database\docker

# 启动数据库容器
docker-compose up -d

# 查看容器状态
docker-compose ps
```

#### 2. 停止数据库
```powershell
# 停止数据库容器
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

#### 3. 重启数据库
```powershell
# 重启数据库容器
docker-compose restart
```

### 数据库连接信息

- **数据库类型**: PostgreSQL
- **容器名称**: booking_postgresql
- **端口映射**: 127.0.0.1:5433 → 5432
- **数据库名**: lecture_booking
- **用户名**: lecture_admin
- **密码**: postgresroot

### 连接字符串

```
postgresql://lecture_admin:postgresroot@localhost:5433/lecture_booking
```

## 数据库操作命令（PowerShell）

### 1. 进入数据库命令行

```powershell
# 进入数据库目录
cd booking_backend\database\docker

# 进入数据库命令行
docker-compose exec postgres psql -U lecture_admin -d lecture_booking
```

### 2. 查看数据库状态

```powershell
# 检查容器是否运行
docker-compose ps

# 检查数据库连接
docker-compose exec postgres pg_isready -U lecture_admin -d lecture_booking

# 查看数据库大小
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT pg_size_pretty(pg_database_size('lecture_booking'));"

# 查看当前连接数
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT count(*) as current_connections FROM pg_stat_activity;"
```

### 3. 查看表结构

```powershell
# 查看所有表
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "\dt"

# 查看特定表结构
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "\d user_infos"

# 查看所有表及其行数
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    schemaname,
    tablename,
    n_tup_ins - n_tup_del as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
"@
```

### 4. 数据查询示例

```powershell
# 查看用户统计
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    role,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_deleted = FALSE) as active_count
FROM user_infos 
GROUP BY role;
"@

# 查看讲座统计
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    approval_status,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_multi_teacher = TRUE) as multi_teacher_count
FROM lectures 
GROUP BY approval_status;
"@

# 查看预约统计
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    status,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_expired = FALSE) as active_count
FROM lecture_bookings 
GROUP BY status;
"@

# 查看时间安排统计
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    COUNT(*) as total_schedules,
    COUNT(*) FILTER (WHERE is_expired = FALSE) as active_schedules,
    COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE) as future_schedules
FROM lecture_schedules;
"@
```

### 5. 数据备份与恢复

```powershell
# 备份数据库
$backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
docker-compose exec postgres pg_dump -U lecture_admin -d lecture_booking > "..\$backupFile"
Write-Host "数据库备份完成: $backupFile"

# 恢复数据库
docker-compose exec -T postgres psql -U lecture_admin -d lecture_booking < "backup_file.sql"

# 备份特定表
docker-compose exec postgres pg_dump -U lecture_admin -d lecture_booking -t user_infos -t teacher_profiles > "users_backup.sql"
```

### 6. 查看日志

```powershell
# 查看容器日志
docker-compose logs postgres

# 实时查看日志
docker-compose logs -f postgres

# 查看最近的日志
docker-compose logs --tail=100 postgres
```

### 7. 性能监控

```powershell
# 查看表大小
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"@

# 查看索引使用情况
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
"@

# 查看最活跃的表
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_tup_ins + n_tup_upd + n_tup_del as total_activity
FROM pg_stat_user_tables 
ORDER BY total_activity DESC;
"@
```

### 8. 数据完整性检查

```powershell
# 检查孤立的时间安排
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    'Orphaned Schedules' as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    'Found ' || COUNT(*) || ' schedules without valid lectures' as message
FROM lecture_schedules ls
LEFT JOIN lectures l ON ls.lecture_id = l.id
WHERE l.id IS NULL;
"@

# 检查孤立的预约
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    'Orphaned Bookings' as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    'Found ' || COUNT(*) || ' bookings without valid lectures' as message
FROM lecture_bookings lb
LEFT JOIN lectures l ON lb.lecture_id = l.id
WHERE l.id IS NULL;
"@

# 检查时间冲突
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c @"
SELECT 
    'Time Conflicts' as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    'Found ' || COUNT(*) || ' overlapping time slots' as message
FROM lecture_schedules ls1
JOIN lecture_schedules ls2 ON ls1.teacher_id = ls2.teacher_id
WHERE ls1.id < ls2.id
AND ls1.booking_date = ls2.booking_date
AND NOT (ls1.end_time <= ls2.start_time OR ls1.start_time >= ls2.end_time);
"@
```

## 初始化脚本

数据库初始化脚本位于 `init_database.sql`，包含：

1. **表结构创建** - 所有核心表的创建语句
2. **索引创建** - 性能优化索引
3. **约束设置** - 数据完整性约束
4. **触发器** - 自动更新时间戳
5. **后续更新** - 2025-09-02 的字段添加和约束更新

### 执行初始化

```powershell
# 方法1：通过 Docker 挂载自动执行（推荐）
# 数据库容器启动时会自动执行 initdb/create_database.sql

# 方法2：手动执行初始化脚本
docker-compose exec -T postgres psql -U lecture_admin -d lecture_booking < "..\init_database.sql"
```

## 业务规则

### 用户管理
1. 用户注册时默认为学生角色
2. 讲师需要额外创建讲师档案
3. 支持软删除，保留历史数据

### 讲座管理
1. 讲座创建后默认为待审批状态
2. 只有已审批的讲座可以设置时间安排
3. 支持多讲师讲座模式
4. 讲座可以软删除

### 时间安排
1. 只有讲座的讲师可以设置时间安排
2. 同一讲师不能在同一时间安排多个讲座
3. 时间安排不能重复
4. 支持过期标记

### 预约管理
1. 学生只能预约已审批讲座的时间安排
2. 预约状态包括：待确认、已确认、已取消
3. 支持预约过期标记
4. 预约删除时级联删除相关数据

## 故障排除

### 常见问题

1. **容器启动失败**
   ```powershell
   # 检查端口占用
   netstat -an | findstr :5433
   
   # 查看容器日志
   docker-compose logs postgres
   ```

2. **数据库连接失败**
   ```powershell
   # 检查容器状态
   docker-compose ps
   
   # 测试连接
   docker-compose exec postgres pg_isready -U lecture_admin -d lecture_booking
   ```

3. **数据损坏**
   ```powershell
   # 从备份恢复
   docker-compose exec -T postgres psql -U lecture_admin -d lecture_booking < "backup_file.sql"
   ```

## 版本历史

- **v1.0** - 初始版本，基础表结构
- **v1.1** - 添加多讲师讲座支持
- **v1.2** - 添加轮播图配置
- **v1.3** - 优化时间安排和预约表结构
- **v1.4** - 添加软删除和过期标记，添加 teacher_id 字段

## 联系信息

如有数据库相关问题，请联系开发团队或查看项目文档。