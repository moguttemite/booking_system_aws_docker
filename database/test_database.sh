@echo off
REM 数据库服务测试脚本 - Windows版本

echo === 数据库服务测试 ===

REM 检查secrets文件是否存在
if not exist ".\secrets\postgres_password.txt" (
    echo 错误: secrets\postgres_password.txt 文件不存在
    echo 请确保密码文件存在
    pause
    exit /b 1
)

REM 启动数据库服务
echo 1. 启动数据库服务...
docker-compose up -d

REM 等待数据库启动
echo 2. 等待数据库启动...
timeout /t 30 /nobreak >nul

REM 检查容器状态
echo 3. 检查容器状态...
docker-compose ps

REM 检查健康状态
echo 4. 检查健康状态...
docker-compose exec postgres pg_isready -U lecture_admin -d lecture_booking

REM 测试数据库连接
echo 5. 测试数据库连接...
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT version();"

REM 显示PostgreSQL版本信息
echo 5.1 PostgreSQL版本信息...
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT version() as postgresql_version;"

REM 检查表结构
echo 6. 检查表结构...
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "\dt"

REM 检查管理员用户
echo 7. 检查管理员用户...
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT name, email, role FROM user_infos WHERE role = 'admin';"

REM 显示日志
echo 8. 显示最近日志...
docker-compose logs --tail=20

echo === 数据库测试完成 ===
echo 数据库端口: localhost:5433 (绑定到回环地址)
echo 用户名: lecture_admin
echo 密码: postgresroot (存储在secrets中)
echo 数据库: lecture_booking
echo PostgreSQL版本: 18 (最新版本)
echo 注意: 端口5433是为了避免与系统其他PostgreSQL实例冲突
echo.
pause
