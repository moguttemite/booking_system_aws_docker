#!/bin/bash

# 快速更新脚本 - 仅拉取代码并重启服务

echo "⚡ 快速更新..."

# 拉取最新代码
git pull origin master

# 重启服务
docker compose -f docker-compose.ssl-only.yml restart

echo "✅ 快速更新完成！"
