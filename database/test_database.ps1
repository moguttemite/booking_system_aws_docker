# 数据库服务测试脚本 - PowerShell版本

Write-Host "=== 数据库服务测试 ===" -ForegroundColor Green

# 检查secrets文件是否存在
if (-not (Test-Path ".\secrets\postgres_password.txt")) {
    Write-Host "错误: secrets\postgres_password.txt 文件不存在" -ForegroundColor Red
    Write-Host "请确保密码文件存在" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 启动数据库服务
Write-Host "1. 启动数据库服务..." -ForegroundColor Yellow
docker-compose up -d

# 等待数据库启动
Write-Host "2. 等待数据库启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 检查容器状态
Write-Host "3. 检查容器状态..." -ForegroundColor Yellow
docker-compose ps

# 检查健康状态
Write-Host "4. 检查健康状态..." -ForegroundColor Yellow
docker-compose exec postgres pg_isready -U lecture_admin -d lecture_booking

# 测试数据库连接
Write-Host "5. 测试数据库连接..." -ForegroundColor Yellow
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT version();"

# 显示PostgreSQL版本信息
Write-Host "5.1 PostgreSQL版本信息..." -ForegroundColor Yellow
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT version() as postgresql_version;"

# 检查表结构
Write-Host "6. 检查表结构..." -ForegroundColor Yellow
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "\dt"

# 检查管理员用户
Write-Host "7. 检查管理员用户..." -ForegroundColor Yellow
docker-compose exec postgres psql -U lecture_admin -d lecture_booking -c "SELECT name, email, role FROM user_infos WHERE role = 'admin';"

# 显示日志
Write-Host "8. 显示最近日志..." -ForegroundColor Yellow
docker-compose logs --tail=20

Write-Host "=== 数据库测试完成 ===" -ForegroundColor Green
Write-Host "数据库端口: localhost:5433 (绑定到回环地址)" -ForegroundColor Cyan
Write-Host "用户名: lecture_admin" -ForegroundColor Cyan
Write-Host "密码: postgresroot (存储在secrets中)" -ForegroundColor Cyan
Write-Host "数据库: lecture_booking" -ForegroundColor Cyan
Write-Host "PostgreSQL版本: 17 (稳定版本)" -ForegroundColor Cyan
Write-Host "注意: 端口5433是为了避免与系统其他PostgreSQL实例冲突" -ForegroundColor Yellow
Write-Host ""
Read-Host "按回车键退出"
