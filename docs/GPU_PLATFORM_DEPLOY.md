# 显卡租赁平台部署指南

本文档专门针对 AutoDL、恒源云、矩池云等国内显卡租赁平台的部署流程。

## 🎯 核心问题

显卡租赁平台通常**没有公网 IP**，需要通过内网穿透才能从外部访问服务。

## 📋 部署流程

### 1. 创建实例

以 AutoDL 为例：

1. 选择镜像：`PyTorch 2.0+` 或 `Ubuntu 22.04`
2. 显卡配置：RTX 3090/4090（8GB+ 显存）
3. 存储空间：至少 20GB

### 2. 部署服务

```bash
# SSH 连接到实例后

# 克隆项目
git clone https://github.com/yantianqi1/index-tts-airp.git
cd index-tts-airp

# 一键部署
chmod +x scripts/deploy_direct.sh
./scripts/deploy_direct.sh
```

等待模型下载和服务启动（首次约 5-10 分钟）。

### 3. 验证服务

```bash
# 测试本地访问
curl http://localhost:5050

# 应该返回：
# {"service":"IndexTTS API","version":"1.0.0","status":"running"}
```

### 4. 配置内网穿透

现在服务只能在实例内部访问，需要配置内网穿透。

## 🌐 内网穿透方案

### 方案 A：Cloudflare Tunnel（强烈推荐）

**优点：**
- ✅ 完全免费，无流量限制
- ✅ 稳定可靠，全球 CDN
- ✅ 自动 HTTPS 加密
- ✅ 支持自定义域名

**步骤：**

```bash
# 1. 快速启动（临时链接，适合测试）
chmod +x scripts/quick_tunnel.sh
./scripts/quick_tunnel.sh

# 会输出类似：
# https://random-name-1234.trycloudflare.com
```

这个链接就是你的公网访问地址！

**持久化配置（推荐生产环境）：**

```bash
# 1. 完整配置
chmod +x scripts/setup_cloudflare_tunnel.sh
./scripts/setup_cloudflare_tunnel.sh

# 2. 按提示登录 Cloudflare（需要账号，免费注册）

# 3. 启动隧道
./scripts/start_tunnel.sh
```

**绑定自定义域名（可选）：**

```bash
# 如果你有域名（如 api.example.com）
cloudflared tunnel route dns YOUR_TUNNEL_NAME api.example.com
```

### 方案 B：平台自带端口映射

部分平台提供端口映射功能，无需额外工具。

#### AutoDL

1. 进入容器详情页
2. 点击「自定义服务」
3. 添加端口：`5050`
4. 保存后会生成访问地址：`http://region-xxx.autodl.com:xxxxx`

#### 恒源云

1. 实例详情 → 端口映射
2. 内部端口：`5050`
3. 协议：`TCP`
4. 获取外部访问地址

#### 矩池云

1. 容器管理 → 端口转发
2. 容器端口：`5050`
3. 获取映射后的公网地址

### 方案 C：FRP（需要自己的服务器）

如果你有一台有公网 IP 的服务器：

**服务器端（公网服务器）：**

```bash
# 下载 FRP 服务端
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -xzf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 配置 frps.ini
cat > frps.ini <<EOF
[common]
bind_port = 7000
token = your_secret_token
EOF

# 启动服务端
./frps -c frps.ini
```

**客户端（显卡平台）：**

```bash
# 在项目目录
chmod +x scripts/setup_frp.sh
./scripts/setup_frp.sh

# 编辑配置
vim frp/frpc.ini
# 填入你的服务器 IP 和 token

# 启动客户端
./frp/frpc -c frp/frpc.ini
```

访问地址：`http://YOUR_SERVER_IP:5050`

### 方案 D：NATAPP（国内免费）

**优点：**
- 国内访问速度快
- 有免费版本

**缺点：**
- 免费版每次启动域名会变
- 有流量限制

**步骤：**

```bash
# 1. 配置
chmod +x scripts/setup_natapp.sh
./scripts/setup_natapp.sh

# 2. 注册账号
# 访问 https://natapp.cn/ 注册

# 3. 购买免费隧道
# 控制台 → 购买隧道 → 免费隧道

# 4. 获取 authtoken
# 我的隧道 → 复制 authtoken

# 5. 启动
./natapp -authtoken=YOUR_TOKEN -proto=tcp -lport=5050
```

## 🔧 后台运行

使用 `screen` 或 `tmux` 保持服务运行：

```bash
# 使用 screen
screen -S indextts
./scripts/deploy_direct.sh
# 按 Ctrl+A+D 退出（服务继续运行）

# 重新连接
screen -r indextts

# 或使用 tmux
tmux new -s indextts
./scripts/deploy_direct.sh
# 按 Ctrl+B+D 退出

# 重新连接
tmux attach -t indextts
```

**同时运行隧道：**

```bash
# 终端 1：运行服务
screen -S indextts
./scripts/deploy_direct.sh

# 终端 2：运行隧道
screen -S tunnel
./scripts/quick_tunnel.sh
```

## 📊 性能优化

### 显存优化

如果显存不足（< 8GB）：

```bash
# 编辑 .env
echo "CUDA_VISIBLE_DEVICES=0" >> .env
echo "PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128" >> .env
```

### 并发控制

服务已内置请求队列，同时只处理一个请求，避免显存溢出。

## 🧪 测试访问

```bash
# 替换为你的公网地址
PUBLIC_URL="https://your-tunnel-url.com"

# 测试健康检查
curl $PUBLIC_URL

# 测试语音合成
curl -X POST $PUBLIC_URL/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "你好，这是测试",
    "voice": "girl_01",
    "emotion": "default"
  }' \
  --output test.wav
```

## ⚠️ 常见问题

### Q1: 隧道断开怎么办？

**Cloudflare Tunnel：**
```bash
# 重启隧道
./scripts/quick_tunnel.sh
```

**FRP/NATAPP：**
```bash
# 检查进程
ps aux | grep frpc

# 重启
./frp/frpc -c frp/frpc.ini
```

### Q2: 服务占用显存过高？

```bash
# 查看显存使用
nvidia-smi

# 重启服务
./scripts/stop_service.sh
./scripts/deploy_direct.sh
```

### Q3: 平台实例关机后怎么办？

重新开机后需要：

```bash
# 1. 重启服务
cd index-tts-airp
./scripts/deploy_direct.sh

# 2. 重启隧道
./scripts/quick_tunnel.sh
```

建议写成启动脚本：

```bash
cat > ~/startup.sh <<'EOF'
#!/bin/bash
cd ~/index-tts-airp
./scripts/deploy_direct.sh &
sleep 10
./scripts/quick_tunnel.sh
EOF

chmod +x ~/startup.sh
```

### Q4: 如何查看日志？

```bash
# 服务日志
tail -f logs/app.log

# 隧道日志（如果后台运行）
screen -r tunnel
```

## 💰 成本估算

以 AutoDL 为例（RTX 3090）：

- 按量计费：约 ¥2-3/小时
- 包月优惠：约 ¥1000-1500/月

建议：
- 开发测试：按量计费
- 生产环境：包月 + 自动关机策略

## 🚀 生产环境建议

1. **使用 Cloudflare Tunnel + 自定义域名**
2. **配置 HTTPS（Cloudflare 自动提供）**
3. **添加访问认证（API Key）**
4. **监控服务状态**
5. **定期备份音色文件**

## 📞 技术支持

遇到问题？

- GitHub Issues: https://github.com/yantianqi1/index-tts-airp/issues
- 查看日志：`tail -f logs/app.log`
- 测试脚本：`python test_api.py`
