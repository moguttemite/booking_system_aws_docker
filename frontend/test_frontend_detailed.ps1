# 前端服务详细测试脚本 (PowerShell版本)
# 提供更详细的测试和诊断功能

param(
    [string]$Action = "full",
    [switch]$Verbose
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

# 检查系统环境
function Test-SystemEnvironment {
    Write-Info "检查系统环境..."
    
    # 检查Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker版本: $dockerVersion"
    }
    catch {
        Write-Error "Docker未安装或未运行"
        return $false
    }
    
    # 检查Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose版本: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose未安装"
        return $false
    }
    
    return $true
}

# 构建镜像
function Build-Image {
    Write-Info "构建前端镜像..."
    try {
        docker-compose build --no-cache
        Write-Success "镜像构建完成"
        return $true
    }
    catch {
        Write-Error "镜像构建失败"
        return $false
    }
}

# 启动服务
function Start-Service {
    Write-Info "启动前端服务..."
    try {
        docker-compose up -d
        Write-Success "前端服务启动完成"
        return $true
    }
    catch {
        Write-Error "前端服务启动失败"
        return $false
    }
}

# 健康检查
function Test-HealthCheck {
    Write-Info "执行健康检查..."
    
    $maxAttempts = 15
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "HTTP健康检查通过"
                return $true
            }
        }
        catch {
            # 继续尝试
        }
        
        Start-Sleep -Seconds 2
        $attempt++
    }
    
    Write-Error "HTTP健康检查失败"
    return $false
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

# 主测试流程
function Start-FullTest {
    Write-Info "开始完整测试流程..."
    
    if (-not (Test-SystemEnvironment)) {
        Write-Error "系统环境检查失败，终止测试"
        return
    }
    
    if (-not (Build-Image)) {
        Write-Error "镜像构建失败，终止测试"
        return
    }
    
    if (-not (Start-Service)) {
        Write-Error "服务启动失败，终止测试"
        return
    }
    
    if (Test-HealthCheck) {
        Write-Success "前端服务测试完成！"
        Show-AccessInfo
    }
    else {
        Write-Error "健康检查失败"
        docker-compose logs --tail=20
    }
}

# 脚本参数处理
switch ($Action.ToLower()) {
    "full" {
        Start-FullTest
    }
    "cleanup" {
        docker-compose down --remove-orphans
        Write-Success "清理完成"
    }
    "status" {
        docker-compose ps
    }
    "logs" {
        docker-compose logs --tail=20
    }
    default {
        Write-Error "未知参数: $Action"
        Write-Host "可用参数: full, cleanup, status, logs"
        exit 1
    }
}