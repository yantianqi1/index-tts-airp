#!/bin/bash

echo "🚀 启动 Voice AI Workbench 开发服务器..."
echo ""

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    npm install
    echo ""
fi

# 启动开发服务器
echo "✨ 启动 Next.js 开发服务器..."
echo "🌐 访问: http://localhost:3000"
echo ""
echo "💡 提示:"
echo "  - 首次使用请先访问 /settings 配置 LLM 和 TTS"
echo "  - 按 Ctrl+C 停止服务器"
echo ""

npm run dev
