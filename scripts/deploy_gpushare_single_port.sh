#!/bin/bash
# GPUShare 单端口部署脚本
# 公网地址: http://i-2.gpushare.com:35808/

set -e

echo "=========================================="
echo "GPUShare 单端口部署"
echo "公网地址: http://i-2.gpushare.com:35808/"
echo "=========================================="

# 获取当前目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLIC_PORT="${PUBLIC_PORT:-8080}"
BACKEND_PORT="${BACKEND_PORT:-8888}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

echo ""
echo "项目目录: $PROJECT_DIR"

# 1. 安装 Nginx（如果未安装）
if ! command -v nginx &> /dev/null; then
    echo ""
    echo "步骤 1: 安装 Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
else
    echo ""
    echo "✓ Nginx 已安装"
fi

# 2. 配置 Nginx
echo ""
echo "步骤 2: 配置 Nginx (监听 $PUBLIC_PORT)..."
sudo tee /etc/nginx/sites-available/tts-app > /dev/null << EOF
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
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 后端 API (通过 /api 访问)
    location /api/ {
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # TTS 生成可能需要较长时间
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

    # Next.js 热重载 WebSocket
    location /_next/webpack-hmr {
        proxy_pass http://localhost:${FRONTEND_PORT}/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/tts-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
echo ""
echo "测试 Nginx 配置..."
sudo nginx -t

# 重启 Nginx
echo ""
echo "重启 Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✓ Nginx 配置完成"

# 3. 停止旧服务
echo ""
echo "步骤 3: 停止旧服务..."
pkill -f "uvicorn app.main:app" || true
pkill -f "next" || true
sleep 2

# 4. 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

# 5. 启动后端 (端口 $BACKEND_PORT)
echo ""
echo "步骤 4: 启动后端服务 (端口 $BACKEND_PORT)..."
cd "$PROJECT_DIR"
PORT="$BACKEND_PORT" nohup python -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

# 6. 启动前端 (3000 端口)
echo ""
echo "步骤 5: 启动前端服务 (端口 $FRONTEND_PORT)..."
cd "$PROJECT_DIR/frontend"

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 使用 Node 18
nvm use 18 || echo "警告: nvm 未找到，使用系统 Node.js"

# 构建前端（生产模式）
echo "构建前端..."
npm run build

# 启动前端
nohup npm start > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "✓ 前端服务已启动 (PID: $FRONTEND_PID)"

# 7. 等待服务启动
echo ""
echo "等待服务启动..."
sleep 8

# 8. 检查服务状态
echo ""
echo "=========================================="
echo "服务状态检查"
echo "=========================================="

# 检查 Nginx
if sudo systemctl is-active --quiet nginx; then
    echo "✓ Nginx ($PUBLIC_PORT): 运行中"
else
    echo "✗ Nginx ($PUBLIC_PORT): 未运行"
fi

# 检查后端
if curl -s http://localhost:$BACKEND_PORT/ > /dev/null 2>&1; then
    echo "✓ 后端 API ($BACKEND_PORT): 运行中"
else
    echo "✗ 后端 API ($BACKEND_PORT): 未运行"
    echo "  查看日志: tail -f $PROJECT_DIR/logs/backend.log"
fi

# 检查前端
if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null 2>&1; then
    echo "✓ 前端 ($FRONTEND_PORT): 运行中"
else
    echo "✗ 前端 ($FRONTEND_PORT): 未运行"
    echo "  查看日志: tail -f $PROJECT_DIR/logs/frontend.log"
fi

# 检查 Nginx 代理
if curl -s http://localhost:$PUBLIC_PORT/ > /dev/null 2>&1; then
    echo "✓ Nginx 代理 ($PUBLIC_PORT): 运行中"
else
    echo "✗ Nginx 代理 ($PUBLIC_PORT): 未运行"
fi

echo ""
echo "=========================================="
echo "🎉 部署完成！"
echo "=========================================="
echo ""
echo "📍 访问地址:"
echo "  前端界面: http://i-2.gpushare.com:35808/"
echo "  后端 API: http://i-2.gpushare.com:35808/v1/ (或 /api/v1/)"
echo ""
echo "📝 在前端设置中，TTS API URL 应该设置为:"
echo "  /api/v1/audio/speech (或 /v1/audio/speech)"
echo ""
echo "📊 日志文件:"
echo "  后端: $PROJECT_DIR/logs/backend.log"
echo "  前端: $PROJECT_DIR/logs/frontend.log"
echo "  Nginx: /var/log/nginx/error.log"
echo ""
echo "🔧 管理命令:"
echo "  查看后端日志: tail -f $PROJECT_DIR/logs/backend.log"
echo "  查看前端日志: tail -f $PROJECT_DIR/logs/frontend.log"
echo "  查看 Nginx 日志: sudo tail -f /var/log/nginx/error.log"
echo "  重启 Nginx: sudo systemctl restart nginx"
echo "  停止所有服务: bash $SCRIPT_DIR/stop_all_services.sh"
echo ""
echo "💡 提示:"
echo "  1. 访问 http://i-2.gpushare.com:35808/"
echo "  2. 点击右上角设置按钮"
echo "  3. TTS API URL 设置为: /api/v1/audio/speech"
echo "  4. 调整参数并保存"
echo "  5. 开始使用！"
echo ""
