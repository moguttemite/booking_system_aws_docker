# 使用官方Nginx镜像作为基础镜像
FROM nginx:alpine

# 安装wget用于健康检查
RUN apk add --no-cache wget

# 复制Nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 复制SSL证书（如果有的话）
# COPY ssl/ /etc/nginx/ssl/

# 创建日志目录
RUN mkdir -p /var/log/nginx

# 设置权限
RUN chown -R nginx:nginx /var/log/nginx

# 暴露端口
EXPOSE 80
EXPOSE 443

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
