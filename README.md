# IndexTTS API Service

基于 B站开源的 IndexTTS 2.0 模型构建的高性能语音合成 API 微服务。

## ✨ 特性

- ✅ 基于预设音色的语音合成（无需训练）
- ✅ **智能情感分析**：基于 LLM 自动识别文本情感
- ✅ **多情感支持**：每个音色支持多种情感表达
- ✅ 请求排队机制，保护 8GB 显存
- ✅ 支持流式音频输出
- ✅ Docker 部署 / 直接部署
- ✅ 支持 WAV/MP3 格式输出
- ✅ 音色管理接口

## 📦 快速开始

### 方式 1：直接部署（推荐，无需 Docker）

```bash
# 1. 克隆项目
git clone https://github.com/yantianqi1/index-tts-airp.git
cd index-tts-airp

# 2. 一键部署
chmod +x scripts/deploy_direct.sh
./scripts/deploy_direct.sh
```

脚本会自动：
- 检查 Python 环境
- 安装依赖
- 下载 IndexTTS2 模型（使用魔搭 ModelScope）
- 创建默认音色
- 启动服务

服务启动后访问：
- API 地址: `http://localhost:5050`
- API 文档: `http://localhost:5050/docs`

### 方式 2：Docker 部署

```bash
# 1. 克隆项目
git clone https://github.com/yantianqi1/index-tts-airp.git
cd index-tts-airp

# 2. 下载模型（二选一）
# 方式 A - HuggingFace
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights

# 方式 B - ModelScope（国内推荐）
pip install modelscope
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

## 🎯 API 使用

### 1. 获取音色列表

```bash
curl http://localhost:5050/v1/voices
```

响应示例：
```json
{
  "voices": [
    {
      "id": "girl_01",
      "name": "girl_01",
      "emotions": ["default", "happy", "sad"],
      "has_default": true
    }
  ]
}
```

### 2. 语音合成

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "indextts-2.0",
    "input": "你好，这是测试文本。",
    "voice": "girl_01",
    "emotion": "happy",
    "response_format": "wav",
    "speed": 1.0
  }' \
  --output output.wav
```

**emotion 参数说明：**
- `"auto"`: 使用 LLM 自动分析文本情感（需配置 API Key）
- `"default"`: 使用默认音色
- 其他值: 指定具体情感（如 "happy", "sad", "angry" 等）

### 3. 上传音色

```bash
curl -X POST http://localhost:5050/v1/voices/upload \
  -F "file=@your_audio.wav" \
  -F "voice_id=my_voice" \
  -F "emotion=happy"
```

### 4. Python 示例

```python
import requests

# 语音合成
response = requests.post(
    "http://localhost:5050/v1/audio/speech",
    json={
        "model": "indextts-2.0",
        "input": "你好，世界！",
        "voice": "girl_01",
        "emotion": "happy",
        "response_format": "wav"
    }
)

# 保存音频
with open("output.wav", "wb") as f:
    f.write(response.content)
```

更多示例见 `examples/api_examples.py`

## 🎭 智能情感分析

启用智能情感分析，让 AI 自动识别文本情感：

### 1. 配置 API Key

创建或编辑 `.env` 文件：

```env
# 启用智能情感分析
ENABLE_SMART_SENTIMENT=true

# 选择 LLM 提供商（gemini 或 openai）
SENTIMENT_LLM_PROVIDER=gemini

# 配置 API Key
SENTIMENT_LLM_API_KEY=your-api-key-here

# Gemini 配置（推荐，免费额度大）
SENTIMENT_GEMINI_MODEL=gemini-2.0-flash-exp

# OpenAI 配置
# SENTIMENT_OPENAI_MODEL=gpt-4o-mini
# SENTIMENT_OPENAI_BASE_URL=https://api.openai.com/v1
```

### 2. 获取 API Key

**Gemini（推荐）：**
1. 访问 [Google AI Studio](https://aistudio.google.com/apikey)
2. 创建 API Key
3. 免费额度：每分钟 15 次请求

**OpenAI：**
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建 API Key
3. 需要付费使用

### 3. 使用自动情感分析

```python
response = requests.post(
    "http://localhost:5050/v1/audio/speech",
    json={
        "input": "今天天气真好，心情特别愉快！",
        "voice": "girl_01",
        "emotion": "auto"  # 自动分析情感
    }
)
```

## 📁 音色管理

### 音色目录结构

```
presets/
├── girl_01/
│   ├── default.wav    # 必需：默认音色
│   ├── happy.wav      # 可选：开心情感
│   ├── sad.wav        # 可选：悲伤情感
│   └── angry.wav      # 可选：愤怒情感
└── uncle_li/
    ├── default.wav    # 必需
    └── serious.wav    # 可选
```

### 添加新音色

**方式 1：手动添加**
```bash
# 创建音色目录
mkdir -p presets/my_voice

# 添加音频文件（必须有 default.wav）
cp your_audio.wav presets/my_voice/default.wav
cp your_happy_audio.wav presets/my_voice/happy.wav
```

**方式 2：API 上传**
```bash
curl -X POST http://localhost:5050/v1/voices/upload \
  -F "file=@audio.wav" \
  -F "voice_id=my_voice" \
  -F "emotion=default"
```

### 音频要求

- 格式：WAV（推荐）或其他常见音频格式
- 采样率：建议 24000 Hz
- 时长：3-10 秒为佳
- 内容：清晰的人声，无背景噪音

## 🛠️ 服务管理

### 直接部署方式

```bash
# 查看服务状态
ps aux | grep uvicorn

# 查看日志
tail -f logs/app.log

# 停止服务
./scripts/stop_service.sh

# 重启服务
./scripts/stop_service.sh
./scripts/deploy_direct.sh
```

### Docker 方式

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建
docker-compose up -d --build
```

## 📊 项目结构

```
.
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── core/
│   │   ├── config.py        # 配置管理
│   │   └── inference.py     # 推理引擎
│   ├── models/
│   │   └── schemas.py       # 数据模型
│   ├── services/
│   │   └── sentiment.py     # 智能情感分析
│   └── utils/
│       └── audio.py         # 音频处理
├── weights/                 # 模型权重
├── presets/                 # 音色库
├── logs/                    # 日志
├── scripts/
│   ├── deploy_direct.sh     # 直接部署脚本
│   ├── stop_service.sh      # 停止服务脚本
│   ├── quick_start.sh       # Docker 快速启动
│   └── create_default_voice.py  # 创建默认音色
├── examples/
│   └── api_examples.py      # API 使用示例
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 🔧 配置说明

### 环境变量（.env）

```env
# 服务配置
PORT=5050
HOST=0.0.0.0

# 模型配置
MODEL_PATH=./weights
PRESETS_PATH=./presets

# 智能情感分析
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_PROVIDER=gemini
SENTIMENT_LLM_API_KEY=your-api-key
SENTIMENT_GEMINI_MODEL=gemini-2.0-flash-exp

# 日志配置
LOG_LEVEL=INFO
```

## ❓ 常见问题

### Q: 如何下载模型？

**国内推荐使用魔搭（ModelScope）：**
```bash
pip install modelscope
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights
```

**国外可使用 HuggingFace：**
```bash
pip install huggingface-hub
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights
```

### Q: 端口被占用怎么办？

```bash
# 查看占用端口的进程
lsof -i:5050

# 停止进程
kill $(lsof -t -i:5050)

# 或修改 .env 中的 PORT
```

### Q: 显存不足怎么办？

服务已实现请求排队机制，同一时间只处理一个请求。如果仍然不足：
- 使用 CPU 模式（自动回退）
- 减少并发请求
- 使用更小的模型

### Q: 如何启用 GPU 加速？

**直接部署：**
确保安装了 PyTorch GPU 版本：
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Docker 部署：**
确保安装了 NVIDIA Docker Runtime：
```bash
# 安装
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# 测试
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### Q: 如何更新代码？

```bash
# 拉取最新代码
git pull origin main

# 直接部署方式
./scripts/stop_service.sh
pip install -r requirements.txt --upgrade
./scripts/deploy_direct.sh

# Docker 方式
docker-compose down
docker-compose up -d --build
```

### Q: 如何查看详细日志？

```bash
# 直接部署
tail -f logs/app.log

# Docker
docker-compose logs -f

# 只看错误
tail -f logs/app.log | grep ERROR
```

## 🚀 性能优化

### 使用多进程

```bash
# 启动 4 个 worker 进程
python3 -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 5050 \
  --workers 4
```

### 使用反向代理（Nginx）

```nginx
upstream indextts {
    server localhost:5050;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://indextts;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 使用 Cloudflare Tunnel

```bash
# 安装 cloudflared
# 然后运行
cloudflared tunnel --url localhost:5050
```

## 📝 开发

### 安装开发依赖

```bash
pip install -r requirements.txt
pip install pytest black flake8
```

### 运行测试

```bash
# 测试 API
python test_api.py

# 测试情感分析
python scripts/test_smart_sentiment.py

# 测试 IndexTTS 安装
python scripts/test_indextts_installation.py
```

### 代码格式化

```bash
black app/
flake8 app/
```

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系

- GitHub: https://github.com/yantianqi1/index-tts-airp
- Issues: https://github.com/yantianqi1/index-tts-airp/issues

## 🙏 致谢

- [IndexTTS](https://github.com/index-tts/index-tts) - B站开源的语音合成模型
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的 Web 框架
- [PyTorch](https://pytorch.org/) - 深度学习框架
