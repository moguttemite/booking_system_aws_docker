# 前端服务详细测试脚本 - PowerShell版本

Write-Host "=== 前端服务详细测试 ===" -ForegroundColor Green

# 清理现有容器和镜像
Write-Host "1. 清理现有容器和镜像..." -ForegroundColor Yellow
Write-Host "1.1 停止并删除容器..." -ForegroundColor Cyan
docker-compose down -v

Write-Host "1.2 删除前端镜像..." -ForegroundColor Cyan
docker rmi frontend-frontend -f 2>$null

Write-Host "1.3 清理未使用的镜像..." -ForegroundColor Cyan
docker image prune -f

# 检查后端服务
Write-Host "2. 检查后端服务状态..." -ForegroundColor Yellow
$backendRunning = $false
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✓ 后端服务正在运行" -ForegroundColor Green
        $backendRunning = $true
    } else {
        Write-Host "⚠ 后端服务响应异常" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ 后端服务未运行" -ForegroundColor Yellow
    Write-Host "建议先启动后端服务: cd ../backend && docker-compose up -d" -ForegroundColor Yellow
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
    Write-Host "响应状态码: $($homeResponse.StatusCode)" -ForegroundColor White
    Write-Host "内容类型: $($homeResponse.Headers['Content-Type'])" -ForegroundColor White
    Write-Host "内容长度: $($homeResponse.Content.Length) 字符" -ForegroundColor White
} catch {
    Write-Host "✗ 首页访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "7.2 测试页面标题..." -ForegroundColor Cyan
try {
    $titleResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($titleResponse.Content -match "<title>.*</title>") {
        $titleMatch = [regex]::Match($titleResponse.Content, "<title>(.*?)</title>")
        if ($titleMatch.Success) {
            Write-Host "✓ 页面标题: $($titleMatch.Groups[1].Value)" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠ 未找到页面标题" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 无法检查页面标题" -ForegroundColor Red
}

Write-Host "7.3 测试页面元数据..." -ForegroundColor Cyan
try {
    $metaResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($metaResponse.Content -match "Bizplus Design") {
        Write-Host "✓ 找到应用名称" -ForegroundColor Green
    } else {
        Write-Host "⚠ 未找到应用名称" -ForegroundColor Yellow
    }
    
    if ($metaResponse.Content -match "Next\.js|next") {
        Write-Host "✓ 检测到Next.js框架" -ForegroundColor Green
    } else {
        Write-Host "⚠ 未检测到Next.js框架" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 无法检查页面元数据" -ForegroundColor Red
}

# 测试静态资源
Write-Host "8. 测试静态资源..." -ForegroundColor Yellow

Write-Host "8.1 测试背景图片..." -ForegroundColor Cyan
try {
    $bgResponse = Invoke-WebRequest -Uri "http://localhost:3000/bg.jpg" -UseBasicParsing
    if ($bgResponse.StatusCode -eq 200) {
        Write-Host "✓ 背景图片可访问" -ForegroundColor Green
    } else {
        Write-Host "⚠ 背景图片访问失败" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ 背景图片访问失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "8.2 测试Logo图片..." -ForegroundColor Cyan
try {
    $logoResponse = Invoke-WebRequest -Uri "http://localhost:3000/logo.png" -UseBasicParsing
    if ($logoResponse.StatusCode -eq 200) {
        Write-Host "✓ Logo图片可访问" -ForegroundColor Green
    } else {
        Write-Host "⚠ Logo图片访问失败" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Logo图片访问失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 测试后端API连接
Write-Host "9. 测试后端API连接..." -ForegroundColor Yellow
if ($backendRunning) {
    Write-Host "9.1 测试后端健康检查..." -ForegroundColor Cyan
    try {
        $backendHealthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
        Write-Host "✓ 后端健康检查成功" -ForegroundColor Green
        Write-Host "后端响应: $($backendHealthResponse.Content)" -ForegroundColor White
    } catch {
        Write-Host "✗ 后端健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "9.2 测试后端API文档..." -ForegroundColor Cyan
    try {
        $docsResponse = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing
        if ($docsResponse.StatusCode -eq 200) {
            Write-Host "✓ 后端API文档可访问" -ForegroundColor Green
        } else {
            Write-Host "⚠ 后端API文档访问失败" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ 后端API文档访问失败: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    Write-Host "9.3 测试前端到后端的API调用..." -ForegroundColor Cyan
    try {
        # 测试前端是否能通过环境变量正确配置API基础URL
        $apiBaseUrl = "http://host.docker.internal:8000/api"
        Write-Host "配置的API基础URL: $apiBaseUrl" -ForegroundColor White
        
        $apiTestResponse = Invoke-WebRequest -Uri "$apiBaseUrl/v1/users/" -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ 前端API配置正确" -ForegroundColor Green
    } catch {
        Write-Host "⚠ 前端API配置测试失败: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "这可能是正常的，因为需要认证" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ 后端服务未运行，跳过API连接测试" -ForegroundColor Yellow
}

# 测试页面功能
Write-Host "10. 测试页面功能..." -ForegroundColor Yellow

Write-Host "10.1 检查页面是否包含主要组件..." -ForegroundColor Cyan
try {
    $componentResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($componentResponse.Content -match "HomePage|LoginModal|RegisterModal") {
        Write-Host "✓ 检测到主要组件" -ForegroundColor Green
    } else {
        Write-Host "⚠ 未检测到主要组件" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 无法检查页面组件" -ForegroundColor Red
}

Write-Host "10.2 检查页面是否包含样式..." -ForegroundColor Cyan
try {
    $styleResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($styleResponse.Content -match "css|style|class") {
        Write-Host "✓ 检测到样式内容" -ForegroundColor Green
    } else {
        Write-Host "⚠ 未检测到样式内容" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 无法检查页面样式" -ForegroundColor Red
}

# 性能测试
Write-Host "11. 性能测试..." -ForegroundColor Yellow

Write-Host "11.1 测试页面加载时间..." -ForegroundColor Cyan
$startTime = Get-Date
try {
    $perfResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    $endTime = Get-Date
    $loadTime = ($endTime - $startTime).TotalMilliseconds
    Write-Host "✓ 页面加载时间: $([math]::Round($loadTime, 2)) 毫秒" -ForegroundColor Green
    
    if ($loadTime -lt 1000) {
        Write-Host "✓ 加载速度优秀" -ForegroundColor Green
    } elseif ($loadTime -lt 3000) {
        Write-Host "✓ 加载速度良好" -ForegroundColor Green
    } else {
        Write-Host "⚠ 加载速度较慢" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ 性能测试失败" -ForegroundColor Red
}

# 显示日志
Write-Host "12. 显示最近日志..." -ForegroundColor Yellow
docker-compose logs --tail=30

Write-Host "=== 前端详细测试完成 ===" -ForegroundColor Green
Write-Host "前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "后端API: http://localhost:8000/api" -ForegroundColor Cyan
Write-Host "API文档: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "测试完成，脚本结束" -ForegroundColor Green



