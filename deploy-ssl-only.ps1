# SSL-only部署脚本 (Windows版本)
# 功能：在Windows上部署带SSL的Docker容器，用于本地测试

param(
    [string]$Action = "start",
    [switch]$Force = $false
)

Write-Host "🔒 开始SSL-only部署..." -ForegroundColor Green

# 检查Docker环境
try {
    docker --version | Out-Null
    docker compose version | Out-Null
    Write-Host "✅ Docker环境检查通过" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未安装或未运行，请先安装Docker Desktop" -ForegroundColor Red
    exit 1
}

# 获取本地IP
$LocalIP = "localhost"
Write-Host "🌐 使用本地地址: $LocalIP" -ForegroundColor Cyan

# 创建环境变量文件
if (-not (Test-Path ".env") -or $Force) {
    Write-Host "📝 创建环境变量文件..." -ForegroundColor Yellow
    
    $envContent = @"
# 数据库配置
POSTGRES_DB=lecture_booking
POSTGRES_USER=lecture_admin
POSTGRES_PASSWORD=postgresroot
POSTGRES_SERVER=database
POSTGRES_PORT=5432

# 后端配置
SECRET_KEY=dev-change-me-in-production-$(Get-Date -Format 'yyyyMMddHHmmss')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=Admin#12345
CORS_ORIGINS=https://$LocalIP,http://$LocalIP

# 前端配置
NEXT_PUBLIC_API_BASE_URL=/api
NODE_ENV=production

# 代理配置
NGINX_LOG_LEVEL=info
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ 环境变量文件创建完成" -ForegroundColor Green
}

# 创建SSL证书目录
Write-Host "🔐 准备SSL证书..." -ForegroundColor Yellow
if (-not (Test-Path "ssl_certs")) {
    New-Item -ItemType Directory -Path "ssl_certs" | Out-Null
}

# 生成自签名SSL证书（用于测试）
if (-not (Test-Path "ssl_certs/cert.pem") -or -not (Test-Path "ssl_certs/key.pem") -or $Force) {
    Write-Host "📜 生成自签名SSL证书..." -ForegroundColor Yellow
    
    # 检查是否有OpenSSL
    try {
        openssl version | Out-Null
        $hasOpenSSL = $true
    } catch {
        $hasOpenSSL = $false
    }
    
    if ($hasOpenSSL) {
        # 使用OpenSSL生成证书
        $opensslCmd = "openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl_certs/key.pem -out ssl_certs/cert.pem -subj `/`"C=JP/ST=Tokyo/L=Tokyo/O=BookingSystem/OU=IT/CN=$LocalIP`/`" -addext `/`"subjectAltName=IP:$LocalIP,DNS:localhost`/`""
        Invoke-Expression $opensslCmd
        Write-Host "✅ 自签名SSL证书生成完成" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OpenSSL未安装，将使用PowerShell生成证书..." -ForegroundColor Yellow
        
        # 使用PowerShell生成自签名证书
        $cert = New-SelfSignedCertificate -DnsName $LocalIP, "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddDays(365)
        
        # 导出证书
        $certPath = "ssl_certs/cert.pem"
        $keyPath = "ssl_certs/key.pem"
        
        # 导出为PEM格式
        $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
        $certPem = "-----BEGIN CERTIFICATE-----`n"
        $certPem += [System.Convert]::ToBase64String($certBytes) -replace ".{64}", "`$&`n"
        $certPem += "`n-----END CERTIFICATE-----"
        $certPem | Out-File -FilePath $certPath -Encoding ASCII
        
        # 导出私钥（需要特殊处理）
        $keyBytes = $cert.PrivateKey.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
        $keyPem = "-----BEGIN PRIVATE KEY-----`n"
        $keyPem += [System.Convert]::ToBase64String($keyBytes) -replace ".{64}", "`$&`n"
        $keyPem += "`n-----END PRIVATE KEY-----"
        $keyPem | Out-File -FilePath $keyPath -Encoding ASCII
        
        Write-Host "✅ PowerShell SSL证书生成完成" -ForegroundColor Green
    }
} else {
    Write-Host "✅ SSL证书已存在" -ForegroundColor Green
}

# 根据操作类型执行不同命令
switch ($Action.ToLower()) {
    "start" {
        # 停止现有容器
        Write-Host "🛑 停止现有容器..." -ForegroundColor Yellow
        docker compose -f docker-compose.ssl-only.yml down 2>$null
        
        # 构建并启动服务
        Write-Host "🔨 构建并启动服务..." -ForegroundColor Yellow
        docker compose -f docker-compose.ssl-only.yml up -d --build
        
        # 等待服务启动
        Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        # 检查服务状态
        Write-Host "📊 检查服务状态..." -ForegroundColor Yellow
        docker compose -f docker-compose.ssl-only.yml ps
        
        # 测试SSL连接
        Write-Host "🔍 测试SSL连接..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "https://localhost/health" -SkipCertificateCheck -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ HTTPS连接测试成功" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  HTTPS连接测试失败，请检查配置" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "🎉 SSL部署完成！" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 访问信息：" -ForegroundColor Cyan
        Write-Host "   🌐 HTTP (自动重定向到HTTPS): http://$LocalIP/" -ForegroundColor White
        Write-Host "   🔒 HTTPS: https://$LocalIP/" -ForegroundColor White
        Write-Host "   🔧 后端API: https://$LocalIP/api/" -ForegroundColor White
        Write-Host "   💾 数据库: 内部访问 (端口5432)" -ForegroundColor White
        Write-Host ""
        Write-Host "🔐 SSL证书信息：" -ForegroundColor Cyan
        Write-Host "   - 使用自签名证书（浏览器会显示安全警告）" -ForegroundColor White
        Write-Host "   - 证书有效期：365天" -ForegroundColor White
        Write-Host "   - 支持IP: $LocalIP" -ForegroundColor White
        Write-Host "   - 支持域名: localhost" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 管理命令：" -ForegroundColor Cyan
        Write-Host "   查看日志: docker compose -f docker-compose.ssl-only.yml logs -f" -ForegroundColor White
        Write-Host "   停止服务: docker compose -f docker-compose.ssl-only.yml down" -ForegroundColor White
        Write-Host "   重启服务: docker compose -f docker-compose.ssl-only.yml restart" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  重要提示：" -ForegroundColor Yellow
        Write-Host "   - 默认管理员: admin@example.com / Admin#12345" -ForegroundColor White
        Write-Host "   - 生产环境请修改默认密码" -ForegroundColor White
        Write-Host "   - 浏览器会显示SSL安全警告，点击'高级'->'继续访问'" -ForegroundColor White
        Write-Host "   - 如需正式SSL证书，请配置域名后使用Let's Encrypt" -ForegroundColor White
    }
    
    "stop" {
        Write-Host "🛑 停止SSL服务..." -ForegroundColor Yellow
        docker compose -f docker-compose.ssl-only.yml down
        Write-Host "✅ SSL服务已停止" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 重启SSL服务..." -ForegroundColor Yellow
        docker compose -f docker-compose.ssl-only.yml restart
        Write-Host "✅ SSL服务已重启" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "📋 显示SSL服务日志..." -ForegroundColor Yellow
        docker compose -f docker-compose.ssl-only.yml logs -f
    }
    
    "status" {
        Write-Host "📊 SSL服务状态：" -ForegroundColor Yellow
        docker compose -f docker-compose.ssl-only.yml ps
    }
    
    default {
        Write-Host "❌ 未知操作: $Action" -ForegroundColor Red
        Write-Host "可用操作: start, stop, restart, logs, status" -ForegroundColor Yellow
        exit 1
    }
}
