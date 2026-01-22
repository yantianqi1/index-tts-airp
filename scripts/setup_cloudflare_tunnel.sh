#!/bin/bash
# Cloudflare Tunnel 一键配置脚本

set -e

echo "🚀 开始配置 Cloudflare Tunnel..."

# 检查是否已安装 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "📦 安装 cloudflared..."
    
    # 根据系统类型安装
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install cloudflare/cloudflare/cloudflared
    else
        echo "❌ 不支持的操作系统"
        exit 1
    fi
fi

echo "✅ cloudflared 已安装"

# 登录 Cloudflare（首次使用需要）
echo ""
echo "📝 请按照提示登录 Cloudflare 账号..."
cloudflared tunnel login

# 创建隧道
TUNNEL_NAME="indextts-api-$(date +%s)"
echo ""
echo "🔧 创建隧道: $TUNNEL_NAME"
cloudflared tunnel create $TUNNEL_NAME

# 获取隧道 ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo "✅ 隧道 ID: $TUNNEL_ID"

# 创建配置文件
CONFIG_FILE="$HOME/.cloudflared/config.yml"
echo ""
echo "📝 创建配置文件: $CONFIG_FILE"

cat > $CONFIG_FILE <<EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: "*"
    service: http://localhost:8080
  - service: http_status:404
EOF

echo "✅ 配置文件已创建"

# 路由隧道到域名（可选）
echo ""
echo "🌐 如果你有域名，可以运行以下命令绑定："
echo "cloudflared tunnel route dns $TUNNEL_NAME your-domain.com"
echo ""

# 启动隧道
echo "🚀 启动隧道..."
echo "你可以选择："
echo "1. 临时测试（无需域名）: cloudflared tunnel --url http://localhost:8080"
echo "2. 持久运行: cloudflared tunnel run $TUNNEL_NAME"
echo ""

# 提供快速启动命令
cat > scripts/start_tunnel.sh <<SCRIPT
#!/bin/bash
# 启动 Cloudflare Tunnel

echo "🚀 启动 Cloudflare Tunnel..."
cloudflared tunnel run $TUNNEL_NAME
SCRIPT

chmod +x scripts/start_tunnel.sh

echo "✅ 配置完成！"
echo ""
echo "📌 快速启动命令："
echo "  临时测试: cloudflared tunnel --url http://localhost:8080"
echo "  持久运行: ./scripts/start_tunnel.sh"
