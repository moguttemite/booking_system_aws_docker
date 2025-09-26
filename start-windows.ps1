# Windows 11 一键启动脚本
# 适用于开发环境

param(
    [string]$Action = "start",
    [switch]$Force
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
        Write-Error "Docker未运行，请先启动Docker Desktop"
        return $false
    }
}

# 检查Docker Compose版本
function Test-DockerCompose {
    Write-Info "检查Docker Compose版本..."
    try {
        $version = docker compose version
        Write-Success "Docker Compose版本: $version"
        return $true
    }
    catch {
        Write-Error "Docker Compose不可用，请确保Docker Desktop已安装"
        return $false
    }
}

# 清理现有容器
function Clear-Containers {
    Write-Info "清理现有容器..."
    try {
        docker compose -f docker-compose.windows.yml down --remove-orphans 2>$null
        Write-Success "清理完成"
    }
    catch {
        Write-Warning "清理过程中出现警告，但继续执行"
    }
}

# 构建镜像
function Build-Images {
    Write-Info "构建Docker镜像..."
    try {
        docker compose -f docker-compose.windows.yml build --no-cache
        Write-Success "镜像构建完成"
    }
    catch {
        Write-Error "镜像构建失败"
        throw
    }
}

# 启动服务
function Start-Services {
    Write-Info "启动服务..."
    try {
        docker compose -f docker-compose.windows.yml up -d
        Write-Success "服务启动完成"
    }
    catch {
        Write-Error "服务启动失败"
        throw
    }
}

# 等待服务启动
function Wait-ForServices {
    Write-Info "等待服务启动..."
    $maxAttempts = 60
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        $allHealthy = $true
        
        # 检查数据库
        try {
            $dbStatus = docker inspect --format='{{.State.Health.Status}}' booking_database_win 2>$null
            if ($dbStatus -ne "healthy") {
                $allHealthy = $false
            }
        }
        catch {
            $allHealthy = $false
        }
        
        # 检查后端
        try {
            $backendStatus = docker inspect --format='{{.State.Health.Status}}' booking_backend_win 2>$null
            if ($backendStatus -ne "healthy") {
                $allHealthy = $false
            }
        }
        catch {
            $allHealthy = $false
        }
        
        # 检查前端
        try {
            $frontendStatus = docker inspect --format='{{.State.Health.Status}}' booking_frontend_win 2>$null
            if ($frontendStatus -ne "healthy") {
                $allHealthy = $false
            }
        }
        catch {
            $allHealthy = $false
        }
        
        if ($allHealthy) {
            Write-Success "所有服务已启动并健康"
            return $true
        }
        
        Write-Info "等待服务启动... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 5
        $attempt++
    }
    
    Write-Warning "服务启动超时，但可能仍在运行"
    return $false
}

# 显示服务状态
function Show-ServiceStatus {
    Write-Info "服务状态："
    docker compose -f docker-compose.windows.yml ps
    
    Write-Info "访问信息："
    Write-Host "  前端应用: http://localhost:3000" -ForegroundColor $Green
    Write-Host "  后端API: http://localhost:8000" -ForegroundColor $Green
    Write-Host "  代理服务: http://localhost:8080" -ForegroundColor $Green
    Write-Host "  数据库: localhost:5433" -ForegroundColor $Green
    Write-Host ""
    Write-Host "  健康检查:" -ForegroundColor $Yellow
    Write-Host "    前端: http://localhost:3000" -ForegroundColor $Yellow
    Write-Host "    后端: http://localhost:8000/health" -ForegroundColor $Yellow
    Write-Host "    代理: http://localhost:8080/health" -ForegroundColor $Yellow
}

# 显示日志
function Show-Logs {
    param([string]$Service = "")
    
    if ($Service) {
        Write-Info "显示 $Service 服务日志..."
        docker compose -f docker-compose.windows.yml logs -f $Service
    }
    else {
        Write-Info "显示所有服务日志..."
        docker compose -f docker-compose.windows.yml logs -f
    }
}

# 停止服务
function Stop-Services {
    Write-Info "停止服务..."
    try {
        docker compose -f docker-compose.windows.yml down
        Write-Success "服务已停止"
    }
    catch {
        Write-Error "停止服务失败"
    }
}

# 重启服务
function Restart-Services {
    Write-Info "重启服务..."
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
    Wait-ForServices
}

# 测试服务
function Test-Services {
    Write-Info "测试服务连接..."
    
    # 测试前端
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "前端服务正常"
        }
    }
    catch {
        Write-Warning "前端服务连接失败"
    }
    
    # 测试后端
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "后端服务正常"
        }
    }
    catch {
        Write-Warning "后端服务连接失败"
    }
    
    # 测试代理
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "代理服务正常"
        }
    }
    catch {
        Write-Warning "代理服务连接失败"
    }
}

# 主函数
function Start-Main {
    Write-Info "开始Windows开发环境部署..."
    
    if (-not (Test-Docker)) {
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        exit 1
    }
    
    if ($Force) {
        Clear-Containers
    }
    
    Build-Images
    Start-Services
    
    if (Wait-ForServices) {
        Show-ServiceStatus
        Test-Services
        Write-Success "Windows开发环境部署完成！"
    }
    else {
        Write-Warning "服务启动可能有问题，请检查日志"
        Show-ServiceStatus
    }
}

# 脚本参数处理
switch ($Action.ToLower()) {
    "start" {
        Start-Main
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
    }
    "status" {
        Show-ServiceStatus
    }
    "logs" {
        Show-Logs
    }
    "test" {
        Test-Services
    }
    "build" {
        Build-Images
    }
    "clean" {
        Clear-Containers
    }
    default {
        Write-Error "未知参数: $Action"
        Write-Host "可用参数: start, stop, restart, status, logs, test, build, clean"
        Write-Host "示例: .\start-windows.ps1 -Action start -Force"
        exit 1
    }
}
