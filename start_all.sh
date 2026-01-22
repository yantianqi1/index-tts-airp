#!/bin/bash

# 启动前后端服务的便捷脚本

echo "🚀 启动 TTS 聊天应用..."
echo ""

# 检查是否在正确的目录
if [ ! -f "app/main.py" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 Python 环境
if ! command -v python &> /dev/null; then
    echo "❌ 错误: 未找到 Python"
    exit 1
fi

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    exit 1
fi

# 启动后端
echo "📡 启动后端 TTS 服务 (端口 8080)..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend
    npm install
    cd ..
fi

# 启动前端
echo "🎨 启动前端服务 (端口 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo "   前端 PID: $FRONTEND_PID"

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📍 访问地址:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8080"
echo "   API 文档: http://localhost:8080/docs"
echo ""
echo "⏹️  停止服务: Ctrl+C 或运行 ./stop_all.sh"
echo ""

# 保存 PID 到文件
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# 等待用户中断
wait
