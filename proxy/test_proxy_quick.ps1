# Proxy快速测试 - PowerShell脚本 (Windows)

Write-Host "=== Proxy快速测试 (Windows) ===" -ForegroundColor Blue

# 颜色定义
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# 检查Docker环境
Write-Host "1. 检查Docker环境..." -ForegroundColor $Blue
try {
    docker info | Out-Null
    Write-Host "✓ Docker环境正常" -ForegroundColor $Green
} catch {
    Write-Host "✗ Docker未运行或无法访问" -ForegroundColor $Red
    exit 1
}

# 检查Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✓ Docker Compose可用" -ForegroundColor $Green
} catch {
    Write-Host "✗ Docker Compose不可用" -ForegroundColor $Red
    exit 1
}

# 构建镜像
Write-Host "2. 构建Proxy测试镜像..." -ForegroundColor $Blue
try {
    docker-compose -f docker-compose.unit.yml build --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 镜像构建成功" -ForegroundColor $Green
    } else {
        Write-Host "✗ 镜像构建失败" -ForegroundColor $Red
        exit 1
    }
} catch {
    Write-Host "✗ 镜像构建失败: $($_.Exception.Message)" -ForegroundColor $Red
    exit 1
}

# 启动服务
Write-Host "3. 启动测试服务..." -ForegroundColor $Blue
try {
    docker-compose -f docker-compose.unit.yml up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 服务启动成功" -ForegroundColor $Green
    } else {
        Write-Host "✗ 服务启动失败" -ForegroundColor $Red
        exit 1
    }
} catch {
    Write-Host "✗ 服务启动失败: $($_.Exception.Message)" -ForegroundColor $Red
    exit 1
}

# 等待服务启动
Write-Host "4. 等待服务启动..." -ForegroundColor $Blue
Start-Sleep -Seconds 10

# 检查服务状态
Write-Host "5. 检查服务状态..." -ForegroundColor $Blue
docker-compose -f docker-compose.unit.yml ps

# 快速测试
Write-Host "6. 快速功能测试..." -ForegroundColor $Blue

# 测试Proxy响应
Write-Host "6.1 测试Proxy响应..." -ForegroundColor $Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 10 -ErrorAction SilentlyContinue
    Write-Host "✓ Proxy服务响应正常" -ForegroundColor $Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 502) {
        Write-Host "⚠ Proxy服务响应异常（可能是预期的，因为上游服务未运行）" -ForegroundColor $Yellow
    } else {
        Write-Host "✗ Proxy服务响应异常" -ForegroundColor $Red
    }
}

# 测试健康检查
Write-Host "6.2 测试健康检查..." -ForegroundColor $Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
    Write-Host "✓ 健康检查正常" -ForegroundColor $Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 502) {
        Write-Host "⚠ 健康检查异常（可能是预期的，因为后端服务未运行）" -ForegroundColor $Yellow
    } else {
        Write-Host "✗ 健康检查异常" -ForegroundColor $Red
    }
}

# 测试Mock服务
Write-Host "6.3 测试Mock服务..." -ForegroundColor $Yellow

# 测试Mock前端
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Mock前端服务正常" -ForegroundColor $Green
    } else {
        Write-Host "✗ Mock前端服务异常" -ForegroundColor $Red
    }
} catch {
    Write-Host "✗ Mock前端服务异常" -ForegroundColor $Red
}

# 测试Mock后端
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Mock后端服务正常" -ForegroundColor $Green
    } else {
        Write-Host "✗ Mock后端服务异常" -ForegroundColor $Red
    }
} catch {
    Write-Host "✗ Mock后端服务异常" -ForegroundColor $Red
}

# 测试代理功能
Write-Host "6.4 测试代理功能..." -ForegroundColor $Yellow

# 测试前端代理
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.Content -like "*Mock Frontend*") {
        Write-Host "✓ 前端代理功能正常" -ForegroundColor $Green
    } else {
        Write-Host "⚠ 前端代理功能异常" -ForegroundColor $Yellow
    }
} catch {
    Write-Host "⚠ 前端代理功能异常" -ForegroundColor $Yellow
}

# 测试后端代理
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.Content -like "*Mock Backend*") {
        Write-Host "✓ 后端代理功能正常" -ForegroundColor $Green
    } else {
        Write-Host "⚠ 后端代理功能异常" -ForegroundColor $Yellow
    }
} catch {
    Write-Host "⚠ 后端代理功能异常" -ForegroundColor $Yellow
}

# 显示服务信息
Write-Host ""
Write-Host "=== 测试服务信息 ===" -ForegroundColor $Blue
Write-Host "Proxy服务: http://localhost:8080" -ForegroundColor $Yellow
Write-Host "Mock前端: http://localhost:3001" -ForegroundColor $Yellow
Write-Host "Mock后端: http://localhost:8001" -ForegroundColor $Yellow
Write-Host "健康检查: http://localhost:8080/health" -ForegroundColor $Yellow

# 显示日志
Write-Host ""
Write-Host "=== 最近日志 ===" -ForegroundColor $Blue
docker-compose -f docker-compose.unit.yml logs --tail=5

Write-Host ""
Write-Host "=== 快速测试完成 ===" -ForegroundColor $Blue
Write-Host "运行完整测试: .\test_proxy_unit.ps1" -ForegroundColor $Yellow
Write-Host "停止服务: docker-compose -f docker-compose.unit.yml down" -ForegroundColor $Yellow
Write-Host "查看日志: docker-compose -f docker-compose.unit.yml logs -f" -ForegroundColor $Yellow

