"""
FastAPI 主应用入口
講義予約システム バックエンド API
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router

# 创建 FastAPI 应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="講義予約システム バックエンド API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 设置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 根路径健康检查
@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "Booking System API", 
        "status": "running",
        "version": "1.0.0"
    }

# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}


# 独立的认证状态检查端点
@app.get("/check-auth-status", response_model=dict)
async def check_auth_status_independent(request: Request):
    """
    独立的用户认证状态检查API
    
    Args:
        request: HTTP请求对象
    
    Returns:
        dict: 包含登录状态的响应，无论成功与否都返回is_authenticated字段
    """
    try:
        # 手动获取Authorization头
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return {"is_authenticated": False}
        
        token = auth_header.split(" ")[1]
        if not token:
            return {"is_authenticated": False}
        
        # 验证token
        from app.utils.jwt import verify_token
        token_payload = verify_token(token)
        
        if not token_payload:
            return {"is_authenticated": False}
        
        # 检查token是否过期
        from datetime import datetime, timezone
        if datetime.now(timezone.utc) > token_payload.exp:
            return {"is_authenticated": False}
        
        # 返回登录状态
        return {"is_authenticated": True}
        
    except Exception as e:
        # 即使发生错误，也返回认证失败状态
        return {"is_authenticated": False}


