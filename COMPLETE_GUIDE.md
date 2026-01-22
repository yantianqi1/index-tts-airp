# VoiceNexus 完整使用指南

这是一份从零开始的完整指南，涵盖安装、配置、部署和使用的所有步骤。

## 📋 目录

1. [系统要求](#系统要求)
2. [快速开始](#快速开始)
3. [详细安装步骤](#详细安装步骤)
4. [配置说明](#配置说明)
5. [API 使用指南](#api-使用指南)
6. [高级功能](#高级功能)
7. [故障排除](#故障排除)

---

## 系统要求

### 硬件要求

- **GPU**: NVIDIA GPU，至少 8GB 显存（推荐 RTX 3060 或更高）
- **内存**: 至少 16GB RAM
- **存储**: 至少 20GB 可用空间（用于模型和音频文件）

### 软件要求

- **操作系统**: Ubuntu 22.04 LTS（推荐）或其他 Linux 发行版
- **Docker**: 20.10 或更高版本
- **Docker Compose**: 2.0 或更高版本
- **NVIDIA Docker Runtime**: 用于 GPU 支持

---

## 快速开始

### 一键启动（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd voicenexus

# 2. 运行快速启动脚本
chmod +x scripts/quick_start.sh
./scripts/quick_start.sh
```

脚本会自动检查环境、创建必要目录、并启动服务。

### 手动启动

```bash
# 1. 创建目录
mkdir -p weights presets logs

# 2. 下载模型（二选一）
# 方式 A: HuggingFace
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights

# 方式 B: ModelScope（国内推荐）
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights

# 3. 创建默认音色
python scripts/create_default_voice.py

# 4. 启动服务
docker-compose up -d
```

---

## 详细安装步骤

### 步骤 1: 安装 Docker 和 NVIDIA Runtime

#### Ubuntu 系统

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 安装 NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker

# 验证 GPU 支持
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### 步骤 2: 下载 IndexTTS2 模型

#### 方式 A: 使用 HuggingFace CLI

```bash
# 安装 huggingface-cli
pip install huggingface-hub

# 下载模型
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights
```

#### 方式 B: 使用 ModelScope（国内推荐）

```bash
# 安装 modelscope
pip install modelscope

# 下载模型
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights
```

#### 方式 C: 手动下载

1. 访问 [HuggingFace 模型页面](https://huggingface.co/IndexTeam/Index-TTS-2)
2. 下载所有文件到 `weights/` 目录
3. 确保 `config.yaml` 文件存在

### 步骤 3: 准备音色文件

VoiceNexus 支持两种音色组织方式：

#### 新结构（推荐）- 支持多情感

```
presets/
├── speaker1/
│   ├── default.wav      # 默认音色
│   ├── happy.wav        # 开心情感
│   ├── sad.wav          # 悲伤情感
│   └── angry.wav        # 愤怒情感
├── speaker2/
│   ├── default.wav
│   └── neutral.wav
```

#### 旧结构（兼容）- 单一音色

```
presets/
├── speaker1.wav
├── speaker2.wav
└── default.wav
```

**创建默认音色：**

```bash
python scripts/create_default_voice.py
```

### 步骤 4: 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置（可选）
nano .env
```

主要配置项：

```bash
# 服务配置
PORT=5050

# 模型配置
DEVICE=cuda              # 使用 GPU
DEFAULT_VOICE=default

# 智能情感分析（可选）
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_BASE_URL=https://api.openai.com/v1
SENTIMENT_LLM_API_KEY=your-api-key
SENTIMENT_LLM_MODEL=gpt-4o-mini
```

### 步骤 5: 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 检查状态
docker-compose ps
```

### 步骤 6: 验证安装

```bash
# 测试健康检查
curl http://localhost:5050/

# 测试 API
python test_api.py
```

---

## 配置说明

### 基础配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | 5050 |
| `DEVICE` | 计算设备 | cuda |
| `WEIGHTS_DIR` | 模型目录 | /app/weights |
| `PRESETS_DIR` | 音色目录 | /app/presets |

### 智能情感分析配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `ENABLE_SMART_SENTIMENT` | 启用智能情感分析 | false |
| `SENTIMENT_LLM_BASE_URL` | LLM API 地址 | - |
| `SENTIMENT_LLM_API_KEY` | LLM API 密钥 | - |
| `SENTIMENT_LLM_MODEL` | LLM 模型名称 | gpt-4o-mini |
| `SENTIMENT_TIMEOUT` | 分析超时时间（秒） | 10 |

### 性能优化配置

在 `app/core/inference.py` 中修改：

```python
self.model = IndexTTS2(
    cfg_path=str(cfg_path),
    model_dir=model_dir,
    use_fp16=True,          # 启用 FP16（节省显存）
    use_cuda_kernel=True,   # 启用 CUDA 加速
    use_deepspeed=False     # 启用 DeepSpeed（多 GPU）
)
```

---

## API 使用指南

### 1. 获取音色列表

**请求：**

```bash
curl http://localhost:5050/v1/voices
```

**响应：**

```json
{
  "voices": [
    {
      "id": "speaker1",
      "name": "speaker1",
      "emotions": ["default", "happy", "sad", "angry"],
      "has_default": true
    },
    {
      "id": "speaker2",
      "name": "speaker2",
      "emotions": ["default", "neutral"],
      "has_default": true
    }
  ]
}
```

### 2. 语音合成（基础）

**请求：**

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "indextts-2.0",
    "input": "你好，这是一个测试。",
    "voice": "speaker1",
    "emotion": "default",
    "response_format": "wav",
    "speed": 1.0
  }' \
  --output output.wav
```

### 3. 语音合成（指定情感）

**请求：**

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "太棒了！我们成功了！",
    "voice": "speaker1",
    "emotion": "happy",
    "response_format": "mp3"
  }' \
  --output output.mp3
```

### 4. 语音合成（智能情感分析）

**前提条件：** 需要配置 LLM API

**请求：**

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "天啊，这太可怕了！",
    "voice": "speaker1",
    "emotion": "auto",
    "response_format": "wav"
  }' \
  --output output.wav
```

系统会自动分析文本情感并选择合适的音色。

### 5. 上传新音色

**请求：**

```bash
curl -X POST http://localhost:5050/v1/voices/upload \
  -F "file=@my_voice.wav" \
  -F "voice_id=my_speaker" \
  -F "emotion=happy"
```

**响应：**

```json
{
  "success": true,
  "message": "上传成功",
  "voice_id": "my_speaker",
  "emotion": "happy"
}
```

### Python 示例

```python
import requests

# 语音合成
def synthesize_speech(text, voice="default", emotion="default"):
    url = "http://localhost:5050/v1/audio/speech"
    payload = {
        "input": text,
        "voice": voice,
        "emotion": emotion,
        "response_format": "wav"
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        with open("output.wav", "wb") as f:
            f.write(response.content)
        print("✓ 音频已保存")
    else:
        print(f"✗ 错误: {response.text}")

# 使用示例
synthesize_speech("你好，世界！", voice="speaker1", emotion="happy")
```

---

## 高级功能

### 1. 智能情感分析

启用后，系统可以自动分析文本情感并选择合适的音色。

**配置步骤：**

1. 在 `.env` 中配置 LLM API：

```bash
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_BASE_URL=https://api.openai.com/v1
SENTIMENT_LLM_API_KEY=sk-xxx
SENTIMENT_LLM_MODEL=gpt-4o-mini
```

2. 重启服务：

```bash
docker-compose restart
```

3. 使用 `emotion: "auto"` 参数：

```json
{
  "input": "这真是太令人兴奋了！",
  "voice": "speaker1",
  "emotion": "auto"
}
```

**支持的情感标签：**

- `happy` - 开心
- `sad` - 悲伤
- `angry` - 愤怒
- `fear` - 恐惧
- `surprise` - 惊讶
- `neutral` - 中性
- `default` - 默认

### 2. 批量合成

```python
import requests
import concurrent.futures

def batch_synthesize(texts, voice="default"):
    """批量合成语音"""
    url = "http://localhost:5050/v1/audio/speech"
    
    def synthesize_one(text, index):
        payload = {
            "input": text,
            "voice": voice,
            "emotion": "auto"
        }
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            filename = f"output_{index}.wav"
            with open(filename, "wb") as f:
                f.write(response.content)
            return f"✓ {filename}"
        else:
            return f"✗ 失败: {text[:20]}"
    
    # 使用线程池并发处理
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(synthesize_one, text, i) 
            for i, text in enumerate(texts)
        ]
        
        for future in concurrent.futures.as_completed(futures):
            print(future.result())

# 使用示例
texts = [
    "第一段文本",
    "第二段文本",
    "第三段文本"
]
batch_synthesize(texts)
```

### 3. 使用 Cloudflare Tunnel 暴露服务

```bash
# 安装 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 启动隧道
cloudflared tunnel --url localhost:5050
```

会生成一个公网 URL，如：`https://xxx.trycloudflare.com`

---

## 故障排除

### 问题 1: 模型加载失败

**症状：** 日志显示 "模型加载失败" 或 "配置文件不存在"

**解决方案：**

```bash
# 检查模型文件
ls -la weights/

# 确保 config.yaml 存在
ls weights/config.yaml

# 重新下载模型
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights
```

### 问题 2: GPU 不可用

**症状：** 日志显示使用 CPU 或 CUDA 错误

**解决方案：**

```bash
# 检查 NVIDIA 驱动
nvidia-smi

# 检查 Docker GPU 支持
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# 重启 Docker
sudo systemctl restart docker
```

### 问题 3: 显存不足 (OOM)

**症状：** 推理时出现 "CUDA out of memory"

**解决方案：**

1. 启用 FP16 推理（修改 `app/core/inference.py`）
2. 减少并发请求（已通过锁机制限制）
3. 使用更小的模型
4. 增加 GPU 显存

### 问题 4: 音色文件不存在

**症状：** API 返回 404 "音色文件不存在"

**解决方案：**

```bash
# 检查音色目录结构
tree presets/

# 创建默认音色
python scripts/create_default_voice.py

# 上传自定义音色
curl -X POST http://localhost:5050/v1/voices/upload \
  -F "file=@your_voice.wav" \
  -F "voice_id=speaker1" \
  -F "emotion=default"
```

### 问题 5: 智能情感分析不工作

**症状：** 使用 `emotion: "auto"` 时总是返回 "default"

**解决方案：**

```bash
# 检查配置
cat .env | grep SENTIMENT

# 确保启用了情感分析
ENABLE_SMART_SENTIMENT=true

# 检查 API 密钥是否正确
# 查看日志
docker-compose logs | grep sentiment
```

### 问题 6: 服务无法启动

**症状：** `docker-compose up` 失败

**解决方案：**

```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
sudo lsof -i :5050

# 清理并重建
docker-compose down
docker-compose up -d --build
```

---

## 性能优化建议

### 1. 启用 FP16 推理

可节省约 50% 显存，推理速度提升 20-30%。

### 2. 使用 CUDA 加速内核

可提升推理速度约 15-20%。

### 3. 预热模型

首次推理较慢，建议启动后先进行一次测试推理。

### 4. 使用 SSD 存储

模型加载和音频读写速度更快。

### 5. 调整并发限制

根据显存大小调整 `inference_lock` 的并发数。

---

## 监控和日志

### 查看实时日志

```bash
docker-compose logs -f
```

### 查看特定服务日志

```bash
docker-compose logs -f voicenexus
```

### 日志文件位置

```
logs/
├── app.log          # 应用日志
└── error.log        # 错误日志
```

---

## 更新和维护

### 更新模型

```bash
# 备份旧模型
mv weights weights.backup

# 下载新模型
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights

# 重启服务
docker-compose restart
```

### 更新代码

```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose up -d --build
```

### 清理旧数据

```bash
# 清理日志
rm -rf logs/*

# 清理临时文件
docker-compose exec voicenexus rm -rf /tmp/*
```

---

## 相关文档

- [集成指南 (INTEGRATION_GUIDE.md)](./INTEGRATION_GUIDE.md) - IndexTTS2 集成详细步骤
- [智能情感分析指南 (SMART_SENTIMENT_GUIDE.md)](./SMART_SENTIMENT_GUIDE.md) - 情感分析功能说明
- [README.md](./README.md) - 项目概述
- [IndexTTS2 官方文档](https://github.com/index-tts/index-tts)

---

## 技术支持

如遇到问题：

1. 查看本文档的故障排除部分
2. 查看项目日志：`docker-compose logs`
3. 运行诊断脚本：`python scripts/test_indextts_installation.py`
4. 提交 Issue 到项目仓库
5. 加入 IndexTTS 社区：QQ群 663272642

---

## 许可证

MIT License
