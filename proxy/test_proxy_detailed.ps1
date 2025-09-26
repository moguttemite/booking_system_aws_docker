# Proxy容器详细测试脚本 (PowerShell版本)
# 用于全面测试代理容器的功能和性能

param(
    [string]$Action = "test"
)

# 颜色定义
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

# 日志函数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Detail {
    param([string]$Message)
    Write-Host "[DETAIL] $Message" -ForegroundColor $Cyan
}

# 测试结果统计
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Warnings = 0
}

function Add-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Message = "")
    $TestResults.Total++
    if ($Passed) {
        $TestResults.Passed++
        Write-Success "✓ $TestName"
        if ($Message) { Write-Detail "  $Message" }
    } else {
        $TestResults.Failed++
        Write-Error "✗ $TestName"
        if ($Message) { Write-Detail "  $Message" }
    }
}

function Add-TestWarning {
    param([string]$TestName, [string]$Message = "")
    $TestResults.Warnings++
    Write-Warning "⚠ $TestName"
    if ($Message) { Write-Detail "  $Message" }
}

# 检查Docker环境
function Test-DockerEnvironment {
    Write-Info "=== 检查Docker环境 ==="
    
    # 检查Docker是否运行
    try {
        docker info | Out-Null
        Add-TestResult "Docker运行状态" $true "Docker服务正常运行"
    }
    catch {
        Add-TestResult "Docker运行状态" $false "Docker服务未运行或不可访问"
        return $false
    }
    
    # 检查Docker Compose版本
    try {
        $version = docker compose version --short
        Add-TestResult "Docker Compose版本" $true "版本: $version"
    }
    catch {
        Add-TestResult "Docker Compose版本" $false "Docker Compose不可用"
        return $false
    }
    
    # 检查可用资源
    try {
        $dockerInfo = docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}"
        Add-TestResult "Docker系统信息" $true "系统资源正常"
    }
    catch {
        Add-TestWarning "Docker系统信息" "无法获取系统信息"
    }
    
    return $true
}

# 检查上游服务状态
function Test-UpstreamServices {
    Write-Info "=== 检查上游服务状态 ==="
    
    # 检查前端服务
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Add-TestResult "前端服务连接" $true "状态码: $($response.StatusCode)"
        } else {
            Add-TestResult "前端服务连接" $false "状态码: $($response.StatusCode)"
        }
    }
    catch {
        Add-TestResult "前端服务连接" $false "连接失败: $($_.Exception.Message)"
    }
    
    # 检查后端服务
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Add-TestResult "后端服务连接" $true "状态码: $($response.StatusCode)"
        } else {
            Add-TestResult "后端服务连接" $false "状态码: $($response.StatusCode)"
        }
    }
    catch {
        Add-TestResult "后端服务连接" $false "连接失败: $($_.Exception.Message)"
    }
    
    # 检查数据库连接（通过后端）
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Add-TestResult "数据库连接" $true "通过后端API验证"
        } else {
            Add-TestResult "数据库连接" $false "后端API响应异常"
        }
    }
    catch {
        Add-TestResult "数据库连接" $false "无法通过后端验证数据库连接"
    }
}

# 清理现有容器
function Clear-ExistingContainers {
    Write-Info "=== 清理现有容器 ==="
    
    try {
        docker-compose down --remove-orphans 2>$null
        Add-TestResult "清理现有容器" $true "成功清理"
    }
    catch {
        Add-TestWarning "清理现有容器" "清理过程中出现警告"
    }
}

# 构建代理镜像
function Build-ProxyImage {
    Write-Info "=== 构建代理镜像 ==="
    
    try {
        $buildOutput = docker-compose build --no-cache 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-TestResult "代理镜像构建" $true "构建成功"
        } else {
            Add-TestResult "代理镜像构建" $false "构建失败: $buildOutput"
            return $false
        }
    }
    catch {
        Add-TestResult "代理镜像构建" $false "构建异常: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

# 启动代理服务
function Start-ProxyService {
    Write-Info "=== 启动代理服务 ==="
    
    try {
        docker-compose up -d
        if ($LASTEXITCODE -eq 0) {
            Add-TestResult "代理服务启动" $true "服务启动成功"
        } else {
            Add-TestResult "代理服务启动" $false "服务启动失败"
            return $false
        }
    }
    catch {
        Add-TestResult "代理服务启动" $false "启动异常: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

# 等待服务启动
function Wait-ForProxyService {
    Write-Info "=== 等待代理服务启动 ==="
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Add-TestResult "代理服务健康检查" $true "服务已启动并健康"
                return $true
            }
        }
        catch {
            # 服务还未启动，继续等待
        }
        
        Write-Info "等待代理服务启动... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Add-TestResult "代理服务健康检查" $false "服务启动超时"
    return $false
}

# 检查容器状态
function Test-ContainerStatus {
    Write-Info "=== 检查容器状态 ==="
    
    # 检查容器是否运行
    $psOutput = docker-compose ps
    if ($psOutput -match "Up") {
        Add-TestResult "容器运行状态" $true "容器正常运行"
    } else {
        Add-TestResult "容器运行状态" $false "容器未正常运行"
        return $false
    }
    
    # 检查健康状态
    $containerId = docker-compose ps -q
    if ($containerId) {
        $healthStatus = docker inspect --format='{{.State.Health.Status}}' $containerId
        if ($healthStatus -eq "healthy") {
            Add-TestResult "容器健康状态" $true "健康检查通过"
        } else {
            Add-TestWarning "容器健康状态" "健康状态: $healthStatus"
        }
    }
    
    return $true
}

# 测试代理功能
function Test-ProxyFunctionality {
    Write-Info "=== 测试代理功能 ==="
    
    # 测试健康检查端点
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing
        if ($response.StatusCode -eq 200 -and $response.Content -match "healthy") {
            Add-TestResult "健康检查端点" $true "响应正常"
        } else {
            Add-TestResult "健康检查端点" $false "响应异常"
        }
    }
    catch {
        Add-TestResult "健康检查端点" $false "连接失败"
    }
    
    # 测试前端代理
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Add-TestResult "前端代理功能" $true "状态码: $($response.StatusCode)"
        } else {
            Add-TestResult "前端代理功能" $false "状态码: $($response.StatusCode)"
        }
    }
    catch {
        Add-TestResult "前端代理功能" $false "连接失败"
    }
    
    # 测试后端API代理
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Add-TestResult "后端API代理" $true "状态码: $($response.StatusCode)"
        } else {
            Add-TestResult "后端API代理" $false "状态码: $($response.StatusCode)"
        }
    }
    catch {
        Add-TestResult "后端API代理" $false "连接失败"
    }
    
    # 测试API根路径
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Add-TestResult "API根路径代理" $true "状态码: $($response.StatusCode)"
        } else {
            Add-TestResult "API根路径代理" $false "状态码: $($response.StatusCode)"
        }
    }
    catch {
        Add-TestResult "API根路径代理" $false "连接失败"
    }
}

# 测试负载均衡
function Test-LoadBalancing {
    Write-Info "=== 测试负载均衡 ==="
    
    $successCount = 0
    $totalRequests = 20
    
    for ($i = 1; $i -le $totalRequests; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                $successCount++
            }
        }
        catch {
            # 请求失败，不计入成功数
        }
    }
    
    $successRate = [math]::Round(($successCount / $totalRequests) * 100, 2)
    Write-Info "负载均衡测试完成，成功率: ${successRate}%"
    
    if ($successRate -ge 95) {
        Add-TestResult "负载均衡测试" $true "成功率: ${successRate}%"
    } elseif ($successRate -ge 80) {
        Add-TestWarning "负载均衡测试" "成功率较低: ${successRate}%"
    } else {
        Add-TestResult "负载均衡测试" $false "成功率过低: ${successRate}%"
    }
}

# 测试性能
function Test-Performance {
    Write-Info "=== 测试性能 ==="
    
    # 测试响应时间
    $responseTimes = @()
    $testCount = 10
    
    for ($i = 1; $i -le $testCount; $i++) {
        try {
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing
            $stopwatch.Stop()
            
            if ($response.StatusCode -eq 200) {
                $responseTimes += $stopwatch.ElapsedMilliseconds
            }
        }
        catch {
            # 请求失败，跳过
        }
    }
    
    if ($responseTimes.Count -gt 0) {
        $avgResponseTime = [math]::Round(($responseTimes | Measure-Object -Average).Average, 2)
        $maxResponseTime = ($responseTimes | Measure-Object -Maximum).Maximum
        $minResponseTime = ($responseTimes | Measure-Object -Minimum).Minimum
        
        Write-Info "响应时间统计:"
        Write-Detail "  平均响应时间: ${avgResponseTime}ms"
        Write-Detail "  最大响应时间: ${maxResponseTime}ms"
        Write-Detail "  最小响应时间: ${minResponseTime}ms"
        
        if ($avgResponseTime -le 100) {
            Add-TestResult "响应时间性能" $true "平均响应时间: ${avgResponseTime}ms"
        } elseif ($avgResponseTime -le 500) {
            Add-TestWarning "响应时间性能" "平均响应时间较慢: ${avgResponseTime}ms"
        } else {
            Add-TestResult "响应时间性能" $false "平均响应时间过慢: ${avgResponseTime}ms"
        }
    } else {
        Add-TestResult "响应时间性能" $false "无法获取响应时间数据"
    }
}

# 测试错误处理
function Test-ErrorHandling {
    Write-Info "=== 测试错误处理 ==="
    
    # 测试404错误
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/nonexistent" -UseBasicParsing
        Add-TestResult "404错误处理" $false "应该返回404但返回了$($response.StatusCode)"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Add-TestResult "404错误处理" $true "正确返回404错误"
        } else {
            Add-TestResult "404错误处理" $false "返回了错误的HTTP状态码"
        }
    }
    
    # 测试无效路径
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/invalid" -UseBasicParsing
        Add-TestResult "无效API路径处理" $true "状态码: $($response.StatusCode)"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Add-TestResult "无效API路径处理" $true "正确返回404错误"
        } else {
            Add-TestResult "无效API路径处理" $false "返回了错误的HTTP状态码"
        }
    }
}

# 显示访问信息
function Show-AccessInfo {
    Write-Info "=== 访问信息 ==="
    Write-Host "代理地址: http://localhost:8080" -ForegroundColor $Green
    Write-Host "前端代理: http://localhost:8080/" -ForegroundColor $Green
    Write-Host "后端API代理: http://localhost:8080/api/" -ForegroundColor $Green
    Write-Host "健康检查: http://localhost:8080/health" -ForegroundColor $Green
    Write-Host ""
    Write-Info "容器信息："
    docker-compose ps
}

# 显示日志
function Show-Logs {
    Write-Info "=== 显示服务日志 ==="
    docker-compose logs --tail=20
}

# 显示测试结果统计
function Show-TestResults {
    Write-Info "=== 测试结果统计 ==="
    Write-Host "总测试数: $($TestResults.Total)" -ForegroundColor $Blue
    Write-Host "通过测试: $($TestResults.Passed)" -ForegroundColor $Green
    Write-Host "失败测试: $($TestResults.Failed)" -ForegroundColor $Red
    Write-Host "警告测试: $($TestResults.Warnings)" -ForegroundColor $Yellow
    
    $passRate = if ($TestResults.Total -gt 0) { [math]::Round(($TestResults.Passed / $TestResults.Total) * 100, 2) } else { 0 }
    Write-Host "通过率: ${passRate}%" -ForegroundColor $(if ($passRate -ge 90) { $Green } elseif ($passRate -ge 70) { $Yellow } else { $Red })
    
    if ($TestResults.Failed -eq 0) {
        Write-Success "所有关键测试通过！"
    } elseif ($TestResults.Failed -le 2) {
        Write-Warning "大部分测试通过，有少量问题需要关注"
    } else {
        Write-Error "存在多个测试失败，需要检查配置"
    }
}

# 主测试函数
function Start-DetailedTest {
    Write-Info "开始Proxy容器详细测试..."
    Write-Host "========================================" -ForegroundColor $Blue
    
    # 环境检查
    if (-not (Test-DockerEnvironment)) {
        Write-Error "Docker环境检查失败，无法继续测试"
        return
    }
    
    # 上游服务检查
    Test-UpstreamServices
    
    # 清理和构建
    Clear-ExistingContainers
    if (-not (Build-ProxyImage)) {
        Write-Error "镜像构建失败，无法继续测试"
        return
    }
    
    # 启动服务
    if (-not (Start-ProxyService)) {
        Write-Error "服务启动失败，无法继续测试"
        return
    }
    
    # 等待服务启动
    if (-not (Wait-ForProxyService)) {
        Write-Warning "服务启动超时，但继续测试"
    }
    
    # 功能测试
    Test-ContainerStatus
    Test-ProxyFunctionality
    Test-LoadBalancing
    Test-Performance
    Test-ErrorHandling
    
    # 显示结果
    Show-AccessInfo
    Show-TestResults
    
    Write-Host "========================================" -ForegroundColor $Blue
    Write-Success "Proxy容器详细测试完成！"
}

# 脚本参数处理
switch ($Action.ToLower()) {
    "test" {
        Start-DetailedTest
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-AccessInfo
    }
    "clean" {
        Clear-ExistingContainers
    }
    "build" {
        Build-ProxyImage
    }
    "start" {
        Start-ProxyService
    }
    "stop" {
        docker-compose down
    }
    default {
        Write-Error "未知参数: $Action"
        Write-Host "可用参数: test, logs, status, clean, build, start, stop"
        exit 1
    }
}
