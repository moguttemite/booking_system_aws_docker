# 前端服务测试脚本 (PowerShell版本)
# 用于测试前端容器的独立运行

param(
    [string]$Action = "test"
)

# 颜色定义
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

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

# 检查Docker是否运行
function Test-Docker {
    Write-Info "检查Docker状态..."
    try {
        docker info | Out-Null
        Write-Success "Docker运行正常"
        return $true
    }
    catch {
        Write-Error "Docker未运行，请先启动Docker"
        return $false
    }
}

# 清理现有容器
function Clear-Containers {
    Write-Info "清理现有容器..."
    try {
        docker-compose down --remove-orphans 2>$null
        Write-Success "清理完成"
    }
    catch {
        Write-Warning "清理过程中出现警告，但继续执行"
    }
}

# 构建镜像
function Build-Image {
    Write-Info "构建前端镜像..."
    try {
        docker-compose build --no-cache
        Write-Success "镜像构建完成"
    }
    catch {
        Write-Error "镜像构建失败"
        throw
    }
}

# 启动服务
function Start-Service {
    Write-Info "启动前端服务..."
    try {
        docker-compose up -d
        Write-Success "前端服务启动完成"
    }
    catch {
        Write-Error "前端服务启动失败"
        throw
    }
}

# 等待服务启动
function Wait-ForService {
    Write-Info "等待服务启动..."
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "前端服务已启动"
                return $true
            }
        }
        catch {
            # 服务还未启动，继续等待
        }
        
        Write-Info "等待服务启动... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Write-Error "服务启动超时"
    return $false
}

# 检查服务状态
function Test-ServiceStatus {
    Write-Info "检查服务状态..."
    
    # 检查容器状态
    $psOutput = docker-compose ps
    if ($psOutput -match "Up") {
        Write-Success "容器运行正常"
    }
    else {
        Write-Error "容器未正常运行"
        return $false
    }
    
    # 检查健康状态
    $containerId = docker-compose ps -q
    $healthStatus = docker inspect --format='{{.State.Health.Status}}' $containerId
    if ($healthStatus -eq "healthy") {
        Write-Success "健康检查通过"
    }
    else {
        Write-Warning "健康检查未通过，但服务可能仍在运行"
    }
    
    return $true
}

# 测试API连接
function Test-ApiConnection {
    Write-Info "测试API连接..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "后端API连接正常"
        }
    }
    catch {
        Write-Warning "后端API不可访问，前端将无法正常工作"
    }
}

# 显示访问信息
function Show-AccessInfo {
    Write-Info "访问信息："
    Write-Host "  前端地址: http://localhost:3000" -ForegroundColor $Green
    Write-Host "  后端API: http://localhost:8000" -ForegroundColor $Green
    Write-Host "  API文档: http://localhost:8000/docs" -ForegroundColor $Green
    Write-Host ""
    Write-Info "容器信息："
    docker-compose ps
}

# 显示日志
function Show-Logs {
    Write-Info "显示服务日志..."
    docker-compose logs --tail=20
}

# 主函数
function Start-Test {
    Write-Info "开始前端服务测试..."
    
    if (-not (Test-Docker)) {
        exit 1
    }
    
    Clear-Containers
    Build-Image
    Start-Service
    
    if (Wait-ForService) {
        Test-ServiceStatus
        Test-ApiConnection
        Show-AccessInfo
        Write-Success "前端服务测试完成！"
    }
    else {
        Write-Error "前端服务测试失败"
        Show-Logs
        exit 1
    }
}

# 脚本参数处理
switch ($Action.ToLower()) {
    "logs" {
        Show-Logs
    }
    "status" {
        Test-ServiceStatus
    }
    "cleanup" {
        Clear-Containers
    }
    "restart" {
        Clear-Containers
        Start-Service
        Wait-ForService
    }
    "test" {
        Start-Test
    }
    default {
        Write-Error "未知参数: $Action"
        Write-Host "可用参数: test, logs, status, cleanup, restart"
        exit 1
    }
}