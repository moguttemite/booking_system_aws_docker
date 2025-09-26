#!/bin/sh

# 代理服务启动脚本
# 处理环境变量替换和配置生成

set -e

# 日志函数
log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1" >&2
}

# 检查必要的环境变量
check_env_vars() {
    log_info "检查环境变量..."
    
    # 如果配置文件已经存在且不是模板，跳过环境变量检查
    if [ -f "/etc/nginx/nginx.conf" ] && [ ! -f "/etc/nginx/nginx-simple.conf.template" ]; then
        log_info "使用现有配置文件，跳过环境变量检查"
        return 0
    fi
    
    if [ -z "$FRONTEND_HOST" ]; then
        log_error "FRONTEND_HOST 环境变量未设置"
        exit 1
    fi
    
    if [ -z "$FRONTEND_PORT" ]; then
        log_error "FRONTEND_PORT 环境变量未设置"
        exit 1
    fi
    
    if [ -z "$BACKEND_HOST" ]; then
        log_error "BACKEND_HOST 环境变量未设置"
        exit 1
    fi
    
    if [ -z "$BACKEND_PORT" ]; then
        log_error "BACKEND_PORT 环境变量未设置"
        exit 1
    fi
    
    log_info "环境变量检查通过"
}

# 生成配置文件
generate_config() {
    log_info "生成Nginx配置文件..."
    
    # 如果配置文件已经存在且不是模板，跳过生成
    if [ -f "/etc/nginx/nginx.conf" ] && [ ! -f "/etc/nginx/nginx-simple.conf.template" ]; then
        log_info "使用现有配置文件，跳过生成"
        return 0
    fi
    
    # 检查是否有写权限
    if [ ! -w "/etc/nginx/nginx.conf" ]; then
        log_info "配置文件为只读，跳过生成"
        return 0
    fi
    
    # 使用envsubst替换模板中的环境变量
    envsubst '${FRONTEND_HOST} ${FRONTEND_PORT} ${BACKEND_HOST} ${BACKEND_PORT} ${DOMAIN_NAME}' \
        < /etc/nginx/nginx-ssl.conf.template \
        > /etc/nginx/nginx.conf
    
    log_info "配置文件生成完成"
}

# 测试配置文件
test_config() {
    log_info "测试Nginx配置..."
    
    if nginx -t; then
        log_info "Nginx配置测试通过"
    else
        log_error "Nginx配置测试失败"
        exit 1
    fi
}

# 等待上游服务
wait_for_upstream() {
    log_info "等待上游服务启动..."
    
    # 等待前端服务
    log_info "等待前端服务: $FRONTEND_HOST:$FRONTEND_PORT"
    while ! nc -z $FRONTEND_HOST $FRONTEND_PORT; do
        log_info "等待前端服务启动..."
        sleep 2
    done
    log_info "前端服务已启动"
    
    # 等待后端服务
    log_info "等待后端服务: $BACKEND_HOST:$BACKEND_PORT"
    while ! nc -z $BACKEND_HOST $BACKEND_PORT; do
        log_info "等待后端服务启动..."
        sleep 2
    done
    log_info "后端服务已启动"
}

# 主函数
main() {
    log_info "启动代理服务..."
    
    check_env_vars
    generate_config
    test_config
    
    # 如果设置了WAIT_FOR_UPSTREAM环境变量，则等待上游服务
    if [ "$WAIT_FOR_UPSTREAM" = "true" ]; then
        wait_for_upstream
    fi
    
    log_info "代理服务启动完成"
}

# 执行主函数
main

# 执行传入的命令
exec "$@"
