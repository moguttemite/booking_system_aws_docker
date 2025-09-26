# Proxy单元测试 - PowerShell脚本 (Windows)

Write-Host "=== Proxy单元测试 (Windows) ===" -ForegroundColor Blue

# 颜色定义
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# 测试结果统计
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# 测试函数
function Test-ProxyFunction {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand
    )
    
    Write-Host "运行测试: $TestName" -ForegroundColor $Blue
    $script:TotalTests++
    
    try {
        $result = & $TestCommand
        if ($result) {
            Write-Host "✓ 通过: $TestName" -ForegroundColor $Green
            $script:PassedTests++
            return $true
        } else {
            Write-Host "✗ 失败: $TestName" -ForegroundColor $Red
            $script:FailedTests++
            return $false
        }
    } catch {
        Write-Host "✗ 失败: $TestName - $($_.Exception.Message)" -ForegroundColor $Red
        $script:FailedTests++
        return $false
    }
}

# 检查Docker环境
Write-Host "1. 检查Docker环境..." -ForegroundColor $Blue
Test-ProxyFunction "Docker运行状态" {
    try {
        docker info | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 检查Docker Compose
Test-ProxyFunction "Docker Compose可用性" {
    try {
        docker-compose --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 构建测试镜像
Write-Host "2. 构建测试镜像..." -ForegroundColor $Blue
Write-Host "构建Proxy单元测试镜像..."
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

# 启动测试服务
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
Start-Sleep -Seconds 15

# 检查服务状态
Write-Host "5. 检查服务状态..." -ForegroundColor $Blue
docker-compose -f docker-compose.unit.yml ps

# 测试Proxy服务
Write-Host "6. 测试Proxy服务..." -ForegroundColor $Blue

# 测试基本连接
Test-ProxyFunction "Proxy服务响应" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $true
    } catch {
        # 502错误是预期的，因为上游服务可能未运行
        if ($_.Exception.Response.StatusCode -eq 502) {
            return $true
        }
        return $false
    }
}

# 测试健康检查
Test-ProxyFunction "健康检查端点" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 502) {
            return $true
        }
        return $false
    }
}

# 测试API代理
Test-ProxyFunction "API代理端点" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 502) {
            return $true
        }
        return $false
    }
}

# 测试Mock服务
Write-Host "7. 测试Mock服务..." -ForegroundColor $Blue

# 测试Mock前端
Test-ProxyFunction "Mock前端服务" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# 测试Mock后端
Test-ProxyFunction "Mock后端服务" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# 测试Mock后端健康检查
Test-ProxyFunction "Mock后端健康检查" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# 测试代理路由
Write-Host "8. 测试代理路由..." -ForegroundColor $Blue

# 测试根路径代理到前端
Test-ProxyFunction "根路径代理" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $response.Content -like "*Mock Frontend*"
    } catch {
        return $false
    }
}

# 测试API路径代理到后端
Test-ProxyFunction "API路径代理" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $response.Content -like "*Mock Backend*"
    } catch {
        return $false
    }
}

# 测试健康检查代理
Test-ProxyFunction "健康检查代理" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $response.Content -like "*healthy*"
    } catch {
        return $false
    }
}

# 测试HTTP头设置
Write-Host "9. 测试HTTP头设置..." -ForegroundColor $Blue

Test-ProxyFunction "HTTP响应头" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        return $response.Headers.Count -gt 0
    } catch {
        return $false
    }
}

# 测试性能
Write-Host "10. 测试性能..." -ForegroundColor $Blue

Test-ProxyFunction "响应时间测试" {
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "http://localhost:8080/" -TimeoutSec 10 -ErrorAction SilentlyContinue
        $stopwatch.Stop()
        $responseTime = $stopwatch.Elapsed.TotalSeconds
        Write-Host "响应时间: $responseTime 秒" -ForegroundColor $Yellow
        return $responseTime -lt 5.0
    } catch {
        return $false
    }
}

# 测试容器健康检查
Write-Host "11. 测试容器健康检查..." -ForegroundColor $Blue

Test-ProxyFunction "Proxy容器健康" {
    try {
        $containerInfo = docker inspect booking_proxy_unit_test | ConvertFrom-Json
        return $containerInfo.State.Health.Status -eq "healthy"
    } catch {
        return $false
    }
}

# 显示日志
Write-Host "12. 显示服务日志..." -ForegroundColor $Blue
Write-Host "Proxy服务日志:" -ForegroundColor $Yellow
docker-compose -f docker-compose.unit.yml logs --tail=10 proxy-unit

Write-Host ""
Write-Host "Mock前端日志:" -ForegroundColor $Yellow
docker-compose -f docker-compose.unit.yml logs --tail=5 mock-frontend

Write-Host ""
Write-Host "Mock后端日志:" -ForegroundColor $Yellow
docker-compose -f docker-compose.unit.yml logs --tail=5 mock-backend

# 显示测试结果
Write-Host ""
Write-Host "=== 测试结果统计 ===" -ForegroundColor $Blue
Write-Host "总测试数: $TotalTests" -ForegroundColor $Blue
Write-Host "通过测试: $PassedTests" -ForegroundColor $Green
Write-Host "失败测试: $FailedTests" -ForegroundColor $Red

# 计算成功率
if ($TotalTests -gt 0) {
    $successRate = [math]::Round(($PassedTests * 100 / $TotalTests), 2)
    Write-Host "成功率: $successRate%" -ForegroundColor $Blue
}

if ($FailedTests -eq 0) {
    Write-Host "✓ 所有测试通过！" -ForegroundColor $Green
    Write-Host ""
    Write-Host "=== 测试服务信息 ===" -ForegroundColor $Blue
    Write-Host "Proxy服务: http://localhost:8080" -ForegroundColor $Yellow
    Write-Host "Mock前端: http://localhost:3001" -ForegroundColor $Yellow
    Write-Host "Mock后端: http://localhost:8001" -ForegroundColor $Yellow
    Write-Host "健康检查: http://localhost:8080/health" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "停止服务命令:" -ForegroundColor $Yellow
    Write-Host "docker-compose -f docker-compose.unit.yml down" -ForegroundColor $Yellow
} else {
    Write-Host "✗ 有 $FailedTests 个测试失败" -ForegroundColor $Red
    Write-Host ""
    Write-Host "故障排除建议:" -ForegroundColor $Yellow
    Write-Host "1. 检查Docker服务是否运行" -ForegroundColor $Yellow
    Write-Host "2. 检查端口是否被占用" -ForegroundColor $Yellow
    Write-Host "3. 查看详细日志: docker-compose -f docker-compose.unit.yml logs" -ForegroundColor $Yellow
    Write-Host "4. 重新构建镜像: docker-compose -f docker-compose.unit.yml build --no-cache" -ForegroundColor $Yellow
}

Write-Host ""
Write-Host "=== Proxy单元测试完成 ===" -ForegroundColor $Blue

