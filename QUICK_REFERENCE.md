# VoiceNexus 快速参考

一页纸快速参考指南，包含最常用的命令和配置。

## 🚀 快速启动

```bash
# 一键启动（推荐）
./scripts/quick_start.sh

# 手动启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📡 API 端点

### 健康检查
```bash
curl http://localhost:5050/
```

### 获取音色列表
```bash
curl http://localhost:5050/v1/voices
```

### 语音合成（基础）
```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "你好世界", "voice": "default"}' \
  --output output.wav
```

### 语音合成（完整参数）
```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "indextts-2.0",
    "input": "你好，这是测试文本",
    "voice": "default",
    "emotion": "happy",
    "response_format": "wav",
    "speed": 1.0
  }' \
  --output output.wav
```

### 上传音色
```bash
curl -X POST http://localhost:5050/v1/voices/upload \
  -F "file=@my_voice.wav" \
  -F "voice_id=my_speaker" \
  -F "emotion=default"
```

## 🐍 Python 客户端

```python
import requests

# 语音合成
def synthesize(text, voice="default", emotion="default"):
    response = requests.post(
        "http://localhost:5050/v1/audio/speech",
        json={
            "input": text,
            "voice": voice,
            "emotion": emotion
        }
    )
    
    with open("output.wav", "wb") as f:
        f.write(response.content)

# 使用
synthesize("你好，世界！")
```

## ⚙️ 常用配置

### 环境变量 (.env)

```bash
# 服务配置
PORT=5050
DEVICE=cuda

# 路径配置
WEIGHTS_DIR=/app/weights
PRESETS_DIR=/app/presets

# 智能情感分析（可选）
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_API_KEY=sk-xxx
SENTIMENT_LLM_MODEL=gpt-4o-mini
```

### Docker Compose

```yaml
# 修改端口
ports:
  - "8080:5050"  # 宿主机:容器

# 修改 GPU
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1  # GPU 数量
```

## 📁 目录结构

```
weights/          # 模型权重（需下载）
presets/          # 音色库
  ├── speaker1/
  │   ├── default.wav
  │   ├── happy.wav
  │   └── sad.wav
logs/             # 日志文件
```

## 🛠️ 常用命令

### Docker 管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps

# 重新构建
docker-compose up -d --build

# 进入容器
docker-compose exec voicenexus bash
```

### 模型管理

```bash
# 下载模型（HuggingFace）
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights

# 下载模型（ModelScope，国内推荐）
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights

# 检查模型
ls -la weights/
```

### 音色管理

```bash
# 创建默认音色
python scripts/create_default_voice.py

# 查看音色列表
ls -la presets/

# 添加新音色（新结构）
mkdir -p presets/my_speaker
cp my_voice.wav presets/my_speaker/default.wav
```

### 测试和诊断

```bash
# API 测试
python test_api.py

# 安装检查
python scripts/test_indextts_installation.py

# 情感分析测试
python scripts/test_smart_sentiment.py

# 示例代码
python examples/api_examples.py
```

## 🔍 故障排除

### 服务无法启动

```bash
# 查看日志
docker-compose logs

# 检查端口占用
lsof -i :5050

# 重新构建
docker-compose down
docker-compose up -d --build
```

### GPU 不可用

```bash
# 检查 NVIDIA 驱动
nvidia-smi

# 检查 Docker GPU 支持
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# 重启 Docker
sudo systemctl restart docker
```

### 模型加载失败

```bash
# 检查模型文件
ls -la weights/config.yaml

# 查看日志
docker-compose logs | grep "模型"

# 重新下载模型
rm -rf weights/*
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights
```

### 音色不存在

```bash
# 检查音色目录
ls -la presets/

# 创建默认音色
python scripts/create_default_voice.py

# 查看可用音色
curl http://localhost:5050/v1/voices
```

## 📊 性能优化

### 启用 FP16（节省显存）

修改 `app/core/inference.py`:
```python
self.model = IndexTTS2(
    use_fp16=True,  # 启用 FP16
    ...
)
```

### 启用 CUDA 加速

```python
self.model = IndexTTS2(
    use_cuda_kernel=True,  # 启用 CUDA
    ...
)
```

## 🌐 公网访问

### 使用 Cloudflare Tunnel

```bash
# 安装 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 启动隧道
cloudflared tunnel --url localhost:5050
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📚 文档索引

| 文档 | 用途 | 适合人群 |
|------|------|---------|
| README.md | 项目概述 | 所有人 |
| COMPLETE_GUIDE.md | 完整教程 | 新手 |
| INTEGRATION_GUIDE.md | 模型集成 | 开发者 |
| CHECKLIST.md | 部署清单 | 运维 |
| QUICK_REFERENCE.md | 快速参考 | 所有人 |

## 🆘 获取帮助

### 在线资源

- **API 文档**: http://localhost:5050/docs
- **项目仓库**: GitHub
- **IndexTTS 官方**: https://github.com/index-tts/index-tts

### 社区支持

- **QQ 群**: 663272642
- **Discord**: https://discord.gg/uT32E7KDmy
- **Email**: indexspeech@bilibili.com

### 常见问题

1. **Q: 如何添加新音色？**  
   A: 使用 API 上传或直接复制文件到 `presets/` 目录

2. **Q: 如何启用智能情感分析？**  
   A: 在 `.env` 中配置 `SENTIMENT_LLM_API_KEY`

3. **Q: 显存不足怎么办？**  
   A: 启用 FP16 推理，确保只有一个请求在处理

4. **Q: 如何暴露到公网？**  
   A: 使用 Cloudflare Tunnel 或 Nginx 反向代理

## 💡 最佳实践

1. **使用新的音色结构**（支持多情感）
2. **启用 FP16 推理**（节省显存）
3. **定期备份模型和音色**
4. **监控日志和性能**
5. **使用环境变量配置**

## 🎯 快速测试

```bash
# 1. 启动服务
docker-compose up -d

# 2. 等待启动
sleep 10

# 3. 测试 API
curl http://localhost:5050/

# 4. 语音合成
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "测试"}' \
  --output test.wav

# 5. 检查结果
file test.wav
```

---

**提示**: 将此页面打印或保存为书签，方便随时查阅。

**最后更新**: 2026-01-22
