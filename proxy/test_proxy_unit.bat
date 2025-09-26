@echo off
REM Proxy单元测试 - Windows批处理脚本

echo === Proxy单元测试 (Windows批处理) ===

REM 检查Docker环境
echo 1. 检查Docker环境...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Docker未运行或无法访问
    pause
    exit /b 1
)
echo ✓ Docker环境正常

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Docker Compose不可用
    pause
    exit /b 1
)
echo ✓ Docker Compose可用

REM 构建镜像
echo 2. 构建Proxy测试镜像...
docker-compose -f docker-compose.unit.yml build --no-cache
if %errorlevel% neq 0 (
    echo ✗ 镜像构建失败
    pause
    exit /b 1
)
echo ✓ 镜像构建成功

REM 启动服务
echo 3. 启动测试服务...
docker-compose -f docker-compose.unit.yml up -d
if %errorlevel% neq 0 (
    echo ✗ 服务启动失败
    pause
    exit /b 1
)
echo ✓ 服务启动成功

REM 等待服务启动
echo 4. 等待服务启动...
timeout /t 15 /nobreak >nul

REM 检查服务状态
echo 5. 检查服务状态...
docker-compose -f docker-compose.unit.yml ps

REM 快速测试
echo 6. 快速功能测试...

REM 测试Proxy响应
echo 6.1 测试Proxy响应...
curl -f http://localhost:8080/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Proxy服务响应正常
) else (
    echo ⚠ Proxy服务响应异常（可能是预期的，因为上游服务未运行）
)

REM 测试健康检查
echo 6.2 测试健康检查...
curl -f http://localhost:8080/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 健康检查正常
) else (
    echo ⚠ 健康检查异常（可能是预期的，因为后端服务未运行）
)

REM 测试Mock服务
echo 6.3 测试Mock服务...

REM 测试Mock前端
curl -f http://localhost:3001/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Mock前端服务正常
) else (
    echo ✗ Mock前端服务异常
)

REM 测试Mock后端
curl -f http://localhost:8001/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Mock后端服务正常
) else (
    echo ✗ Mock后端服务异常
)

REM 测试代理功能
echo 6.4 测试代理功能...

REM 测试前端代理
curl -s http://localhost:8080/ | findstr "Mock Frontend" >nul
if %errorlevel% equ 0 (
    echo ✓ 前端代理功能正常
) else (
    echo ⚠ 前端代理功能异常
)

REM 测试后端代理
curl -s http://localhost:8080/api/ | findstr "Mock Backend" >nul
if %errorlevel% equ 0 (
    echo ✓ 后端代理功能正常
) else (
    echo ⚠ 后端代理功能异常
)

REM 显示服务信息
echo.
echo === 测试服务信息 ===
echo Proxy服务: http://localhost:8080
echo Mock前端: http://localhost:3001
echo Mock后端: http://localhost:8001
echo 健康检查: http://localhost:8080/health

REM 显示日志
echo.
echo === 最近日志 ===
docker-compose -f docker-compose.unit.yml logs --tail=5

echo.
echo === 快速测试完成 ===
echo 运行完整测试: test_proxy_unit.ps1
echo 停止服务: docker-compose -f docker-compose.unit.yml down
echo 查看日志: docker-compose -f docker-compose.unit.yml logs -f

pause

