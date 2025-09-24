# 后端服务详细测试脚本 - PowerShell版本

Write-Host "=== 后端服务详细测试 ===" -ForegroundColor Green

# 检查数据库是否运行
Write-Host "1. 检查数据库连接..." -ForegroundColor Yellow
$dbCheck = docker run --rm --network host postgres:17-alpine pg_isready -h localhost -p 5433 -U lecture_admin -d lecture_booking

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 数据库未运行或无法连接" -ForegroundColor Red
    Write-Host "请先启动数据库服务: cd ../database && docker-compose up -d" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 启动后端服务
Write-Host "2. 启动后端服务..." -ForegroundColor Yellow
docker-compose up -d

# 等待后端启动
Write-Host "3. 等待后端启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 检查容器状态
Write-Host "4. 检查容器状态..." -ForegroundColor Yellow
docker-compose ps

# 检查健康状态
Write-Host "5. 检查健康状态..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✓ 后端服务健康" -ForegroundColor Green
    } else {
        Write-Host "✗ 后端服务不健康" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试API端点
Write-Host "6. 测试API端点..." -ForegroundColor Yellow

Write-Host "6.1 测试根路径..." -ForegroundColor Cyan
try {
    $rootResponse = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing
    Write-Host "根路径响应: $($rootResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "根路径测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "6.2 测试API文档页面..." -ForegroundColor Cyan
try {
    $docsResponse = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing
    Write-Host "✓ API文档页面可访问" -ForegroundColor Green
} catch {
    Write-Host "✗ API文档页面访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "6.3 测试OpenAPI规范..." -ForegroundColor Cyan
try {
    $openapiResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/openapi.json" -UseBasicParsing
    Write-Host "✓ OpenAPI规范可访问" -ForegroundColor Green
} catch {
    Write-Host "✗ OpenAPI规范访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试用户注册
Write-Host "7. 测试用户注册..." -ForegroundColor Yellow
try {
    $registerData = @{
        email = "testuser$(Get-Random)@example.com"
        password = "TestPassword123"
    } | ConvertTo-Json -Compress

    $registerResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/users/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    Write-Host "✓ 用户注册测试成功" -ForegroundColor Green
    Write-Host "注册响应: $($registerResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "✗ 用户注册测试失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "错误详情: $($_.Exception.Response)" -ForegroundColor Red
    }
}

# 测试用户登录
Write-Host "8. 测试用户登录..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "admin@example.com"
        password = "Admin1234"
    } | ConvertTo-Json -Compress

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/users/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    Write-Host "✓ 用户登录测试成功" -ForegroundColor Green
    Write-Host "登录响应: $($loginResponse.Content)" -ForegroundColor White
    
    # 解析登录响应获取token
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    $token = $loginResult.token
    Write-Host "获取到Token: $($token.Substring(0, 50))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ 用户登录测试失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "错误详情: $($_.Exception.Response)" -ForegroundColor Red
    }
}

# 测试认证状态检查
Write-Host "9. 测试认证状态检查..." -ForegroundColor Yellow
try {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    $authResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/users/check-auth" -Method GET -Headers $authHeaders -UseBasicParsing
    Write-Host "✓ 认证状态检查成功" -ForegroundColor Green
    Write-Host "认证状态: $($authResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "✗ 认证状态检查失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "错误详情: $($_.Exception.Response)" -ForegroundColor Red
    }
}

 # 测试获取用户信息
Write-Host "10. 测试获取用户信息..." -ForegroundColor Yellow
try {
    $userResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/users/1" -Method GET -Headers $authHeaders -UseBasicParsing
    Write-Host "✓ 获取用户信息成功" -ForegroundColor Green
    Write-Host "用户信息: $($userResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "✗ 获取用户信息失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试获取所有用户（管理员权限）
Write-Host "11. 测试获取所有用户..." -ForegroundColor Yellow
try {
    $allUsersResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/users/" -Method GET -Headers $authHeaders -UseBasicParsing
    Write-Host "✓ 获取所有用户成功" -ForegroundColor Green
    Write-Host "用户列表: $($allUsersResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "✗ 获取所有用户失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 显示日志
Write-Host "12. 显示最近日志..." -ForegroundColor Yellow
docker-compose logs --tail=20

Write-Host "=== 后端详细测试完成 ===" -ForegroundColor Green
Write-Host "API文档: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "健康检查: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "OpenAPI: http://localhost:8000/api/v1/openapi.json" -ForegroundColor Cyan
Write-Host "根路径: http://localhost:8000/" -ForegroundColor Cyan
Write-Host ""
Write-Host "测试完成，脚本结束" -ForegroundColor Green
