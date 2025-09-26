# 使用官方Nginx镜像作为基础镜像
FROM nginx:alpine

# 设置环境变量
ENV NGINX_ENVSUBST_TEMPLATE_DIR=/etc/nginx/templates
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d

# 安装必要的工具
RUN apk add --no-cache \
    wget \
    curl \
    gettext \
    && rm -rf /var/cache/apk/*

# 创建必要的目录
RUN mkdir -p /var/log/nginx \
    && mkdir -p /etc/nginx/templates \
    && mkdir -p /etc/nginx/conf.d \
    && mkdir -p /usr/share/nginx/html \
    && mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp

# 复制Nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 复制配置模板
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY nginx-simple.conf.template /etc/nginx/nginx-simple.conf.template
COPY nginx-ssl.conf.template /etc/nginx/nginx-ssl.conf.template

# 复制SSL证书（如果有的话）
# COPY ssl/ /etc/nginx/ssl/

# 复制自定义错误页面
COPY error-pages/ /usr/share/nginx/html/

# 设置权限
RUN chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /etc/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chmod -R 755 /usr/share/nginx/html \
    && chmod -R 755 /etc/nginx \
    && chmod -R 755 /var/cache/nginx

# 暴露端口
EXPOSE 80
EXPOSE 443

# 健康检查 - 使用wget而不是curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 使用nginx用户
USER nginx

# 启动Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]