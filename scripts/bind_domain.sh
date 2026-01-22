#!/bin/bash
# Cloudflare Tunnel 域名绑定脚本

set -e

echo "================================"
echo "🌐 Cloudflare Tunnel 域名绑定"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared 未安装${NC}"
    echo ""
    echo "请先运行以下命令之一:"
    echo "  ./scripts/setup_cloudflare_tunnel.sh  # 完整配置"
    echo "  ./scripts/quick_tunnel.sh             # 快速测试"
    exit 1
fi

echo -e "${GREEN}✓ cloudflared 已安装${NC}"
echo ""

# 获取隧道列表
echo "📋 现有隧道列表:"
echo "================================"
cloudflared tunnel list
echo "================================"
echo ""

# 检查是否有隧道
TUNNEL_COUNT=$(cloudflared tunnel list | tail -n +2 | wc -l)
if [ "$TUNNEL_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ 未找到任何隧道${NC}"
    echo ""
    echo "请先创建隧道:"
    echo "  ./scripts/setup_cloudflare_tunnel.sh"
    exit 1
fi

# 获取隧道名称
echo -e "${BLUE}请输入隧道名称（NAME 列）:${NC}"
read -p "> " TUNNEL_NAME

if [ -z "$TUNNEL_NAME" ]; then
    echo -e "${RED}❌ 隧道名称不能为空${NC}"
    exit 1
fi

# 验证隧道是否存在
if ! cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo -e "${RED}❌ 隧道 '$TUNNEL_NAME' 不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 隧道验证成功${NC}"
echo ""

# 获取域名
echo -e "${BLUE}请输入要绑定的域名:${NC}"
echo "示例: api.example.com 或 tts.yourdomain.com"
read -p "> " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ 域名不能为空${NC}"
    exit 1
fi

# 验证域名格式
if ! echo "$DOMAIN" | grep -qE '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'; then
    echo -e "${RED}❌ 域名格式不正确${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 域名格式正确${NC}"
echo ""

# 确认信息
echo "================================"
echo "📌 配置信息"
echo "================================"
echo -e "隧道名称: ${GREEN}$TUNNEL_NAME${NC}"
echo -e "绑定域名: ${GREEN}$DOMAIN${NC}"
echo "================================"
echo ""

read -p "确认绑定? (y/N) " -n 1 -r
echo
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消绑定"
    exit 0
fi

# 绑定域名
echo "🔧 正在绑定域名..."
if cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN; then
    echo ""
    echo -e "${GREEN}✅ 域名绑定成功！${NC}"
    echo ""
    
    # 更新配置文件提示
    CONFIG_FILE="$HOME/.cloudflared/config.yml"
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${YELLOW}⚠️  提示: 需要更新配置文件${NC}"
        echo ""
        echo "当前配置文件: $CONFIG_FILE"
        echo ""
        echo "请确保配置文件包含以下内容:"
        echo "================================"
        cat << EOF
ingress:
  - hostname: $DOMAIN
    service: http://localhost:5050
  - service: http_status:404
EOF
        echo "================================"
        echo ""
        read -p "是否自动更新配置文件? (y/N) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # 备份配置文件
            cp $CONFIG_FILE ${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)
            echo -e "${GREEN}✓ 已备份配置文件${NC}"
            
            # 获取隧道 ID
            TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
            
            # 创建新配置
            cat > $CONFIG_FILE << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:5050
  - service: http_status:404
EOF
            echo -e "${GREEN}✓ 配置文件已更新${NC}"
            echo ""
            
            # 提示重启隧道
            echo -e "${YELLOW}⚠️  需要重启隧道使配置生效${NC}"
            echo ""
            read -p "是否立即重启隧道? (y/N) " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                # 检查是否使用 systemd
                if systemctl is-active --quiet cloudflared-tunnel 2>/dev/null; then
                    echo "重启 systemd 服务..."
                    sudo systemctl restart cloudflared-tunnel
                    echo -e "${GREEN}✓ 隧道已重启${NC}"
                else
                    echo -e "${YELLOW}⚠️  请手动重启隧道:${NC}"
                    echo "  cloudflared tunnel run $TUNNEL_NAME"
                fi
            fi
        fi
    fi
    
    echo ""
    echo "================================"
    echo "📌 下一步"
    echo "================================"
    echo "1. 等待 DNS 生效（通常 1-5 分钟）"
    echo ""
    echo "2. 验证 DNS 解析:"
    echo "   nslookup $DOMAIN"
    echo ""
    echo "3. 测试 HTTP 访问:"
    echo "   curl https://$DOMAIN"
    echo ""
    echo "4. 浏览器访问:"
    echo "   https://$DOMAIN/docs"
    echo ""
    echo "5. 运行完整测试:"
    echo "   export PUBLIC_URL=https://$DOMAIN"
    echo "   python test_public_api.py"
    echo ""
    echo "================================"
    echo "🔍 管理命令"
    echo "================================"
    echo "查看所有路由:"
    echo "  cloudflared tunnel route dns list"
    echo ""
    echo "删除路由:"
    echo "  cloudflared tunnel route dns delete $TUNNEL_NAME $DOMAIN"
    echo ""
    echo "查看隧道状态:"
    echo "  cloudflared tunnel info $TUNNEL_NAME"
    echo ""
    echo "================================"
    
else
    echo ""
    echo -e "${RED}❌ 域名绑定失败${NC}"
    echo ""
    echo "可能的原因:"
    echo "1. 域名未托管在 Cloudflare"
    echo "2. 域名状态不是 Active"
    echo "3. 账号权限不足"
    echo ""
    echo "解决方法:"
    echo "1. 登录 Cloudflare Dashboard 检查域名状态"
    echo "   https://dash.cloudflare.com/"
    echo ""
    echo "2. 或使用 Dashboard 手动绑定:"
    echo "   Zero Trust → Tunnels → $TUNNEL_NAME → Public Hostname"
    echo ""
    exit 1
fi
