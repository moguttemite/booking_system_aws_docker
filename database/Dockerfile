# 使用官方PostgreSQL 15镜像作为基础镜像
FROM postgres:15-alpine

# 设置环境变量
ENV POSTGRES_DB=lecture_booking
ENV POSTGRES_USER=lecture_admin
ENV POSTGRES_PASSWORD=postgresroot
ENV POSTGRES_INITDB_ARGS="--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
# PostgreSQL 15 的 PGDATA 路径
ENV PGDATA=/var/lib/postgresql/data/pgdata

# 创建必要的目录
RUN mkdir -p /var/lib/postgresql/data/pgdata && \
    mkdir -p /var/log/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /var/log/postgresql

# 复制初始化脚本到正确位置
COPY initdb/init.sql /docker-entrypoint-initdb.d/

# 设置权限
RUN chmod 644 /docker-entrypoint-initdb.d/init.sql && \
    chown postgres:postgres /docker-entrypoint-initdb.d/init.sql

# 安装额外的PostgreSQL扩展和工具
RUN apk add --no-cache \
    postgresql-contrib \
    postgresql-dev \
    && rm -rf /var/cache/apk/*

# 设置PostgreSQL 15配置优化
RUN echo "shared_preload_libraries = 'pg_stat_statements'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "pg_stat_statements.track = all" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "log_statement = 'all'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "log_destination = 'stderr'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "logging_collector = on" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "log_directory = '/var/log/postgresql'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "log_rotation_age = 1d" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "log_rotation_size = 10MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "max_connections = 200" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "shared_buffers = 256MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "effective_cache_size = 1GB" >> /usr/local/share/postgresql/postgresql.conf.sample

# 暴露端口
EXPOSE 5432

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1

# 使用默认的PostgreSQL启动命令
