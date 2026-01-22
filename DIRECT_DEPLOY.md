# IndexTTS API 直接部署指南

无需 Docker，直接在服务器上运行 IndexTTS API。

## 快速开始

### 1. 一键部署

```bash
# 赋予执行权限
chmod +x scripts/deploy_direct.sh scripts/stop_service.sh

# 运行部署脚本
./scripts/deploy_direct.sh
```

脚本会自动：
- ✓ 检查 Python 环境
- ✓ 安装依赖
- ✓ 下载模型（使用魔搭 ModelScope）
- ✓ 创建默认音色
- ✓ 启动服务

### 2. 手动部署

如果自动脚本有问题，可以手动执行：

```bash
# 1. 创建目录
mkdir -p weights presets logs

# 2. 安装依赖
pip install -r requirements.txt

# 3. 下载模型
pip install modelscope
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights

# 4. 创建默认音色
python3 scripts/create_default_voice.py

# 5. 创建配置文件
cp .env.example .env

# 6. 启动服务
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5050 > logs/app.log 2>&1 &
```

## 服务管理

### 查看服务状态

```bash
# 查看进程
ps aux | grep uvicorn

# 查看日志
tail -f logs/app.log

# 实时查看日志（带颜色）
tail -f logs/app.log | grep --color=auto -E "ERROR|WARNING|INFO|$"
```

### 停止服务

```bash
# 使用脚本停止
./scripts/stop_service.sh

# 或手动停止
kill $(cat logs/app.pid)

# 或通过端口停止
kill $(lsof -t -i:5050)
```

### 重启服务

```bash
# 停止服务
./scripts/stop_service.sh

# 重新启动
./scripts/deploy_direct.sh
```

## 访问服务

- **API 地址**: http://your-server-ip:5050
- **API 文档**: http://your-server-ip:5050/docs
- **健康检查**: http://your-server-ip:5050/health

## 测试 API

```bash
# 运行测试脚本
python test_api.py

# 或使用 curl
curl http://localhost:5050/health
```

## 常见问题

### 1. 端口被占用

```bash
# 查看占用端口的进程
lsof -i:5050

# 停止占用进程
kill $(lsof -t -i:5050)
```

### 2. 模型下载失败

```bash
# 手动下载（魔搭）
pip install modelscope
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights

# 或使用 Python
python3 << 'EOF'
from modelscope import snapshot_download
model_dir = snapshot_download('IndexTeam/Index-TTS-2', cache_dir='./weights')
print(f"模型已下载到: {model_dir}")
EOF
```

### 3. 依赖安装失败

```bash
# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或升级 pip
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. 查看详细错误

```bash
# 查看完整日志
cat logs/app.log

# 查看最后 50 行
tail -n 50 logs/app.log

# 实时监控错误
tail -f logs/app.log | grep ERROR
```

## 性能优化

### 使用多进程

```bash
# 启动 4 个 worker 进程
nohup python3 -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 5050 \
  --workers 4 \
  > logs/app.log 2>&1 &
```

### 后台运行（使用 screen）

```bash
# 创建 screen 会话
screen -S indextts

# 启动服务
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5050

# 按 Ctrl+A+D 退出 screen

# 重新连接
screen -r indextts
```

### 使用 systemd 服务

创建 `/etc/systemd/system/indextts.service`:

```ini
[Unit]
Description=IndexTTS API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/index-tts-airp
ExecStart=/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5050
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable indextts
sudo systemctl start indextts
sudo systemctl status indextts
```

## 安全建议

1. **使用反向代理**（Nginx）
2. **配置防火墙**（只开放必要端口）
3. **使用 HTTPS**（配置 SSL 证书）
4. **限制访问**（IP 白名单）

## 监控和日志

```bash
# 监控 CPU 和内存使用
top -p $(cat logs/app.pid)

# 查看磁盘使用
du -sh weights/ presets/ logs/

# 日志轮转（防止日志文件过大）
# 添加到 crontab
0 0 * * * cd /root/index-tts-airp && mv logs/app.log logs/app.log.$(date +\%Y\%m\%d) && touch logs/app.log
```

## 更新代码

```bash
# 拉取最新代码
git pull origin main

# 停止服务
./scripts/stop_service.sh

# 更新依赖
pip install -r requirements.txt --upgrade

# 重新启动
./scripts/deploy_direct.sh
```
