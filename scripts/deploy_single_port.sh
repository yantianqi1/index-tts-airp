#!/bin/bash
# 单端口部署脚本 - 通过 8080 端口访问所有服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_PORT="${PUBLIC_PORT:-8080}"
BACKEND_PORT="${BACKEND_PORT:-8888}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

echo "=========================================="
echo "单端口部署脚本 ($PUBLIC_PORT)"
echo "=========================================="

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 1. 安装 Nginx
echo ""
echo "步骤 1: 安装 Nginx..."
apt-get update
apt-get install -y nginx

# 2. 配置 Nginx
echo ""
echo "步骤 2: 配置 Nginx..."
cat > /etc/nginx/sites-available/tts-app << EOF
server {
    listen ${PUBLIC_PORT};
    server_name _;
    client_max_body_size 100M;

    # 前端
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # 后端 API（通过 /api 访问）
    location /api/ {
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 后端 API（直接路径访问，兼容文档/脚本）
    location /v1/ {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location = /docs {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /openapi.json {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /redoc {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /_next/webpack-hmr {
        proxy_pass http://localhost:${FRONTEND_PORT}/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/tts-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx

echo "✓ Nginx 配置完成"

# 3. 停止旧服务
echo ""
echo "步骤 3: 停止旧服务..."
pkill -f "uvicorn app.main:app" || true
pkill -f "next" || true

# 4. 启动后端 (端口 $BACKEND_PORT)
echo ""
echo "步骤 4: 启动后端服务 (端口 $BACKEND_PORT)..."
cd "$PROJECT_DIR"
PORT="$BACKEND_PORT" nohup python -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" > logs/backend.log 2>&1 &
echo "✓ 后端服务已启动"

# 5. 构建并启动前端 (3000 端口)
echo ""
echo "步骤 5: 构建并启动前端 (端口 $FRONTEND_PORT)..."
cd "$PROJECT_DIR/frontend"

# 确保使用正确的 Node 版本
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18

# 构建前端
npm run build

# 启动前端
nohup npm start > ../logs/frontend.log 2>&1 &
echo "✓ 前端服务已启动"

# 6. 等待服务启动
echo ""
echo "等待服务启动..."
sleep 5

# 7. 检查服务状态
echo ""
echo "=========================================="
echo "服务状态检查"
echo "=========================================="

# 检查 Nginx
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx: 运行中"
else
    echo "✗ Nginx: 未运行"
fi

# 检查后端
if curl -s http://localhost:$BACKEND_PORT/ > /dev/null; then
    echo "✓ 后端 API ($BACKEND_PORT): 运行中"
else
    echo "✗ 后端 API ($BACKEND_PORT): 未运行"
fi

# 检查前端
if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null; then
    echo "✓ 前端 ($FRONTEND_PORT): 运行中"
else
    echo "✗ 前端 ($FRONTEND_PORT): 未运行"
fi

# 检查 8080 端口
if curl -s http://localhost:$PUBLIC_PORT/ > /dev/null; then
    echo "✓ Nginx 代理 ($PUBLIC_PORT): 运行中"
else
    echo "✗ Nginx 代理 ($PUBLIC_PORT): 未运行"
fi

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端界面: http://你的公网地址:$PUBLIC_PORT/"
echo "  后端 API: http://你的公网地址:$PUBLIC_PORT/v1/ (或 /api/v1/)"
echo ""
echo "日志文件:"
echo "  后端: $PROJECT_DIR/logs/backend.log"
echo "  前端: $PROJECT_DIR/logs/frontend.log"
echo "  Nginx: /var/log/nginx/error.log"
echo ""
echo "管理命令:"
echo "  查看后端日志: tail -f $PROJECT_DIR/logs/backend.log"
echo "  查看前端日志: tail -f $PROJECT_DIR/logs/frontend.log"
echo "  重启 Nginx: sudo systemctl restart nginx"
echo "  停止所有服务: sudo $PROJECT_DIR/scripts/stop_all_services.sh"
echo ""
