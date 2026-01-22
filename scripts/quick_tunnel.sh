#!/bin/bash
# 快速启动临时隧道（无需配置）

echo "🚀 启动临时 Cloudflare Tunnel..."
echo "⚠️  这是临时链接，关闭后失效"
echo ""

# 检查服务是否运行
if ! curl -s http://localhost:5050 > /dev/null; then
    echo "❌ 服务未运行，请先启动 IndexTTS 服务"
    echo "运行: ./scripts/deploy_direct.sh"
    exit 1
fi

# 检查 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "📦 安装 cloudflared..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    else
        echo "请手动安装: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
fi

echo "✅ 正在创建公网访问链接..."
echo ""
cloudflared tunnel --url http://localhost:5050
