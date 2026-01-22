#!/bin/bash

# 一键重启脚本 - 重启所有服务并显示后端实时日志
# 使用方法: bash restart_and_watch.sh

set -e

PROJECT_DIR="$HOME/index-tts-airp"
LOG_DIR="$PROJECT_DIR/logs"

echo "=========================================="
echo "🔄 开始重启所有服务..."
echo "=========================================="

# 1. 停止所有服务
echo ""
echo "📛 步骤 1/4: 停止现有服务..."
pkill -f "uvicorn app.main:app" || true
pkill -f "next dev" || true
pkill -9 nginx || true
sleep 3

# 确保端口完全释放
echo "🔍 检查端口占用..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  端口 8080 被占用，强制清理..."
    lsof -ti :8080 | xargs kill -9 || true
    sleep 1
fi

if lsof -i :8888 > /dev/null 2>&1; then
    echo "⚠️  端口 8888 被占用，强制清理..."
    lsof -ti :8888 | xargs kill -9 || true
    sleep 1
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  端口 3000 被占用，强制清理..."
    lsof -ti :3000 | xargs kill -9 || true
    sleep 1
fi

echo "✓ 所有端口已清理"
sleep 1

# 2. 确保日志目录存在
mkdir -p "$LOG_DIR"

# 3. 启动 Nginx
echo ""
echo "🌐 步骤 2/4: 启动 Nginx (端口 8080)..."
nginx -c "$PROJECT_DIR/nginx_8080.conf"
sleep 1

if pgrep -f "nginx.*8080" > /dev/null; then
    echo "✓ Nginx 启动成功"
else
    echo "✗ Nginx 启动失败"
    exit 1
fi

# 4. 启动后端
echo ""
echo "🚀 步骤 3/4: 启动后端服务 (端口 8888)..."
cd "$PROJECT_DIR"
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8888 > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 3

if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "✓ 后端启动成功 (PID: $BACKEND_PID)"
else
    echo "✗ 后端启动失败，查看日志:"
    tail -20 "$LOG_DIR/backend.log"
    exit 1
fi

# 5. 启动前端
echo ""
echo "🎨 步骤 4/4: 启动前端服务 (端口 3000)..."
cd "$PROJECT_DIR/frontend"

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 3

if pgrep -f "next dev" > /dev/null; then
    echo "✓ 前端启动成功 (PID: $FRONTEND_PID)"
else
    echo "✗ 前端启动失败，查看日志:"
    tail -20 "$LOG_DIR/frontend.log"
    exit 1
fi

# 6. 验证服务状态
echo ""
echo "=========================================="
echo "✅ 所有服务启动完成！"
echo "=========================================="
echo ""
echo "📊 服务状态:"
echo "  • Nginx:   $(pgrep -f 'nginx.*8080' > /dev/null && echo '✓ 运行中' || echo '✗ 未运行')"
echo "  • 后端:    $(pgrep -f 'uvicorn app.main:app' > /dev/null && echo '✓ 运行中' || echo '✗ 未运行')"
echo "  • 前端:    $(pgrep -f 'next dev' > /dev/null && echo '✓ 运行中' || echo '✗ 未运行')"
echo ""
echo "🌍 访问地址:"
echo "  • 公网: http://i-2.gpushare.com:35808/"
echo "  • 本地: http://localhost:8080/"
echo ""
echo "📝 日志文件:"
echo "  • 后端: $LOG_DIR/backend.log"
echo "  • 前端: $LOG_DIR/frontend.log"
echo ""
echo "=========================================="
echo "📡 正在显示后端实时日志..."
echo "   (按 Ctrl+C 退出日志查看，服务会继续运行)"
echo "=========================================="
echo ""

# 等待 2 秒让用户看到状态信息
sleep 2

# 7. 显示后端实时日志
tail -f "$LOG_DIR/backend.log"
