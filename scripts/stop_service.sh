#!/bin/bash

# 停止服务脚本

echo "停止 IndexTTS API 服务..."

# 从 PID 文件读取
if [ -f "logs/app.pid" ]; then
    PID=$(cat logs/app.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        echo "✓ 服务已停止 (PID: $PID)"
        rm logs/app.pid
    else
        echo "⚠️  进程不存在 (PID: $PID)"
        rm logs/app.pid
    fi
else
    # 通过端口查找
    PORT="${PORT:-8080}"
    PID=$(lsof -t -i:"$PORT")
    if [ ! -z "$PID" ]; then
        kill $PID
        echo "✓ 服务已停止 (PID: $PID, port: $PORT)"
    else
        echo "⚠️  未找到运行中的服务"
    fi
fi
