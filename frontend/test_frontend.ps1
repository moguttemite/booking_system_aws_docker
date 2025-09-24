# 前端服务测试脚本 - PowerShell版本

Write-Host "=== 前端服务测试 ===" -ForegroundColor Green

# 清理现有容器和镜像
Write-Host "1. 清理现有容器和镜像..." -ForegroundColor Yellow
Write-Host "1.1 停止并删除容器..." -ForegroundColor Cyan
docker-compose down -v

Write-Host "1.2 删除前端镜像..." -ForegroundColor Cyan
docker rmi frontend-frontend -f 2>$null

Write-Host "1.3 清理未使用的镜像..." -ForegroundColor Cyan
docker image prune -f

# 检查后端是否运行
Write-Host "2. 检查后端服务..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✓ 后端服务正在运行" -ForegroundColor Green
    } else {
        Write-Host "⚠ 后端服务响应异常" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ 后端服务未运行，前端可能无法正常工作" -ForegroundColor Yellow
    Write-Host "建议先启动后端服务: cd ../backend && docker-compose up -d" -ForegroundColor Yellow
    Write-Host "继续启动前端服务..." -ForegroundColor Cyan
}

# 重新构建并启动前端服务
Write-Host "3. 重新构建并启动前端服务..." -ForegroundColor Yellow
Write-Host "3.1 构建镜像..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host "3.2 启动服务..." -ForegroundColor Cyan
docker-compose up -d

# 等待前端启动
Write-Host "4. 等待前端启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

# 检查容器状态
Write-Host "5. 检查容器状态..." -ForegroundColor Yellow
docker-compose ps

# 验证容器是否正常启动
Write-Host "5.1 验证容器启动状态..." -ForegroundColor Cyan
$containerStatus = docker-compose ps --format "table {{.Name}}\t{{.Status}}"
if ($containerStatus -match "Up.*healthy") {
    Write-Host "✓ 容器正常启动并健康" -ForegroundColor Green
} else {
    Write-Host "✗ 容器启动异常" -ForegroundColor Red
    Write-Host "容器状态:" -ForegroundColor Yellow
    Write-Host $containerStatus -ForegroundColor White
}

# 检查健康状态
Write-Host "6. 检查健康状态..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✓ 前端服务健康" -ForegroundColor Green
    } else {
        Write-Host "✗ 前端服务不健康" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试前端页面
Write-Host "7. 测试前端页面..." -ForegroundColor Yellow

Write-Host "7.1 测试首页..." -ForegroundColor Cyan
try {
    $homeResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    Write-Host "✓ 首页可访问" -ForegroundColor Green
    Write-Host "首页内容预览: $($homeResponse.Content.Substring(0, [Math]::Min(200, $homeResponse.Content.Length)))..." -ForegroundColor White
} catch {
    Write-Host "✗ 首页访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "7.2 测试API连接..." -ForegroundColor Cyan
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ API连接正常" -ForegroundColor Green
} catch {
    Write-Host "⚠ API连接测试失败（这是正常的，因为前端没有API路由）" -ForegroundColor Yellow
}

# 检查页面内容
Write-Host "8. 检查页面内容..." -ForegroundColor Yellow

Write-Host "8.1 检查是否包含Next.js内容..." -ForegroundColor Cyan
try {
    $contentResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($contentResponse.Content -match "next|Next\.js|React") {
        Write-Host "✓ 找到Next.js相关内容" -ForegroundColor Green
    } else {
        Write-Host "⚠ 未找到Next.js相关内容" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 无法检查页面内容" -ForegroundColor Red
}

Write-Host "8.2 检查页面标题..." -ForegroundColor Cyan
try {
    $titleResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($titleResponse.Content -match "<title>.*</title>") {
        Write-Host "✓ 找到页面标题" -ForegroundColor Green
        $titleMatch = [regex]::Match($titleResponse.Content, "<title>(.*?)</title>")
        if ($titleMatch.Success) {
            Write-Host "页面标题: $($titleMatch.Groups[1].Value)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠ 未找到页面标题" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 无法检查页面标题" -ForegroundColor Red
}

# 测试后端API连接
Write-Host "9. 测试后端API连接..." -ForegroundColor Yellow
try {
    $backendApiResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($backendApiResponse.StatusCode -eq 200) {
        Write-Host "✓ 后端API连接正常" -ForegroundColor Green
        Write-Host "后端API响应: $($backendApiResponse.Content)" -ForegroundColor White
    } else {
        Write-Host "⚠ 后端API响应异常" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ 后端API连接失败: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "前端将无法正常与后端通信" -ForegroundColor Yellow
}

# 显示日志
Write-Host "10. 显示最近日志..." -ForegroundColor Yellow
docker-compose logs --tail=20

Write-Host "=== 前端测试完成 ===" -ForegroundColor Green
Write-Host "前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "后端API: http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "注意: 确保后端服务正在运行以获得完整功能" -ForegroundColor Yellow
Write-Host ""
Write-Host "测试完成，脚本结束" -ForegroundColor Green



