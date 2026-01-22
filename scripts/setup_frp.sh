#!/bin/bash
# FRP 内网穿透配置脚本（需要自己的服务器）

set -e

echo "🚀 配置 FRP 客户端..."

# 下载 FRP
FRP_VERSION="0.52.3"
echo "📦 下载 FRP v${FRP_VERSION}..."

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    wget https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz
    tar -xzf frp_${FRP_VERSION}_linux_amd64.tar.gz
    mv frp_${FRP_VERSION}_linux_amd64 frp
    rm frp_${FRP_VERSION}_linux_amd64.tar.gz
else
    echo "请手动下载: https://github.com/fatedier/frp/releases"
    exit 1
fi

# 创建配置文件
echo "📝 创建 FRP 配置文件..."
cat > frp/frpc.ini <<EOF
[common]
server_addr = YOUR_SERVER_IP
server_port = 7000
token = YOUR_TOKEN

[indextts-api]
type = tcp
local_ip = 127.0.0.1
local_port = 5050
remote_port = 5050
EOF

echo "✅ FRP 客户端已配置"
echo ""
echo "⚠️  请编辑 frp/frpc.ini 填入你的服务器信息："
echo "  - server_addr: 你的服务器 IP"
echo "  - server_port: FRP 服务端口（默认 7000）"
echo "  - token: 连接密钥"
echo ""
echo "启动命令: ./frp/frpc -c frp/frpc.ini"
