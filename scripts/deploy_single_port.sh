#!/bin/bash
# 单端口部署脚本 - 通过 8080 端口访问所有服务

set -e

echo "=========================================="
echo "单端口部署脚本 (8080)"
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
cat > /etc/nginx/sites-available/tts-app << 'EOF'
server {
    listen 8080;
    server_name _;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 后端 API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # WebSocket
    location /_next/webpack-hmr {
        proxy_pass http://localhost:3000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
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

# 4. 启动后端 (8888 端口)
echo ""
echo "步骤 4: 启动后端服务 (端口 8888)..."
cd /root/index-tts-airp
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8888 > logs/backend.log 2>&1 &
echo "✓ 后端服务已启动"

# 5. 构建并启动前端 (3000 端口)
echo ""
echo "步骤 5: 构建并启动前端 (端口 3000)..."
cd /root/index-tts-airp/frontend

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
if curl -s http://localhost:8888/ > /dev/null; then
    echo "✓ 后端 API (8888): 运行中"
else
    echo "✗ 后端 API (8888): 未运行"
fi

# 检查前端
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✓ 前端 (3000): 运行中"
else
    echo "✗ 前端 (3000): 未运行"
fi

# 检查 8080 端口
if curl -s http://localhost:8080/ > /dev/null; then
    echo "✓ Nginx 代理 (8080): 运行中"
else
    echo "✗ Nginx 代理 (8080): 未运行"
fi

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端界面: http://你的公网地址:8080/"
echo "  后端 API: http://你的公网地址:8080/api/"
echo ""
echo "日志文件:"
echo "  后端: /root/index-tts-airp/logs/backend.log"
echo "  前端: /root/index-tts-airp/logs/frontend.log"
echo "  Nginx: /var/log/nginx/error.log"
echo ""
echo "管理命令:"
echo "  查看后端日志: tail -f /root/index-tts-airp/logs/backend.log"
echo "  查看前端日志: tail -f /root/index-tts-airp/logs/frontend.log"
echo "  重启 Nginx: sudo systemctl restart nginx"
echo "  停止所有服务: sudo /root/index-tts-airp/scripts/stop_all_services.sh"
echo ""
