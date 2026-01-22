#!/bin/bash
# 停止所有服务（无 systemd 版本）

echo "停止所有服务..."

# 停止 Nginx
sudo pkill nginx && echo "✓ Nginx 已停止" || echo "Nginx 未运行"

# 停止后端
pkill -f "uvicorn app.main:app" && echo "✓ 后端已停止" || echo "后端未运行"

# 停止前端
pkill -f "next" && echo "✓ 前端已停止" || echo "前端未运行"

echo "所有服务已停止"
