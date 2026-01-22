#!/bin/bash

# 创建 logs 目录（如果不存在）
mkdir -p logs

# 停止现有服务
pkill -f "uvicorn app.main:app"

# 等待进程完全停止
sleep 2

# 启动服务
PORT="${PORT:-8080}"
echo "Starting service on port $PORT..."
PORT="$PORT" python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" > logs/service.log 2>&1 &

# 等待服务启动
sleep 3

# 显示日志
echo "Service started. Showing logs..."
tail -f logs/service.log
