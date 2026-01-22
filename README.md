# VoiceNexus - IndexTTS 2.0 API Service

基于 B站开源的 IndexTTS 2.0 模型构建的高性能语音合成 API 微服务。

## 📚 文档导航

- 📖 [快速开始](./QUICK_START.md) - 5 分钟快速上手
- 🔧 [IndexTTS 集成指南](./INTEGRATION_GUIDE.md) - 如何集成真实模型
- 🎭 [智能情感分析指南](./SMART_SENTIMENT_GUIDE.md) - 配置和使用 LLM 情感分析
- 📋 [项目总览](./PROJECT_OVERVIEW.md) - 完整的技术架构和开发指南
- 📝 [更新日志](./CHANGELOG.md) - 版本历史和更新记录

## 特性

- ✅ 基于预设音色的语音合成（无需训练）
- ✅ **智能情感分析**：基于 LLM 自动识别文本情感
- ✅ **多情感支持**：每个音色支持多种情感表达
- ✅ 请求排队机制，保护 8GB 显存
- ✅ 支持流式音频输出
- ✅ Docker 一键部署
- ✅ 支持 WAV/MP3 格式输出
- ✅ 音色管理接口

## 快速开始

### 1. 准备工作

确保已安装：
- Docker & Docker Compose
- NVIDIA Docker Runtime (GPU 支持)

### 2. 准备模型和音色

```bash
# 创建必要目录
mkdir -p weights presets logs

# 将 IndexTTS 2.0 模型权重放入 weights/ 目录
# 将参考音频文件放入 presets/ 目录（使用新的层级结构）

# 新的目录结构：
# presets/
# ├── girl_01/
# │   ├── default.wav  (必需)
# │   ├── happy.wav
# │   └── sad.wav
# └── uncle_li/
#     ├── default.wav  (必需)
#     └── serious.wav

# 如果你有旧的扁平结构，可以使用迁移工具：
python scripts/migrate_presets.py
```

### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

服务将在 `http://localhost:5050` 启动。

### 4. 使用 Cloudflare Tunnel 暴露服务（可选）

```bash
cloudflared tunnel --url localhost:5050
```

## API 文档

### 1. 获取音色列表

```bash
GET /v1/voices
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
    },
    {
      "id": "uncle_li",
      "name": "uncle_li",
      "emotions": ["default", "serious"],
      "has_default": true
    }
  ]
}
```

### 2. 语音合成

```bash
POST /v1/audio/speech
Content-Type: application/json

{
  "model": "indextts-2.0",
  "input": "你好，这是测试文本。",
  "voice": "girl_01",
  "emotion": "happy",  // 可选: "auto"(智能分析), "default", "happy", "sad" 等
  "response_format": "wav",
  "speed": 1.0
}
```

**emotion 参数说明：**
- `"auto"`: 使用 LLM 自动分析文本情感（需配置 API Key）
- `"default"`: 使用默认音色
- 其他值: 指定具体情感（如 "happy", "sad", "angry" 等）

返回音频流（WAV 或 MP3）。

### 3. 上传音色

```bash
POST /v1/voices/upload
Content-Type: multipart/form-data

file: <your_audio.wav>
voice_id: girl_01
emotion: happy
```

## 集成真实 IndexTTS 模型

代码已经支持真实的 IndexTTS2 模型！详细的集成步骤请查看：

📖 **[完整集成指南 (INTEGRATION_GUIDE.md)](./INTEGRATION_GUIDE.md)**

### 快速集成步骤

1. **安装 IndexTTS2**
```bash
# 克隆官方仓库
git clone https://github.com/index-tts/index-tts.git
cd index-tts

# 安装依赖
pip install -e .
```

2. **下载模型权重**
```bash
# 使用 huggingface-cli
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir checkpoints

# 或使用 modelscope（国内推荐）
modelscope download --model IndexTeam/Index-TTS-2 --local_dir checkpoints
```

3. **复制到项目目录**
```bash
cp -r checkpoints/* /path/to/voicenexus/weights/
```

4. **启动服务**
```bash
docker-compose up -d
```

服务会自动检测并加载真实模型，如果模型不存在会回退到 Mock 模式。

## 项目结构

```
.
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── core/
│   │   ├── config.py        # 配置管理（含智能情感配置）
│   │   └── inference.py     # 推理引擎（支持多情感）
│   ├── models/
│   │   └── schemas.py       # 数据模型
│   ├── services/
│   │   └── sentiment.py     # 智能情感分析服务
│   └── utils/
│       └── audio.py         # 音频处理
├── weights/                 # 模型权重
├── presets/                 # 音色库（新的层级结构）
│   ├── voice_01/
│   │   ├── default.wav      # 必需
│   │   ├── happy.wav
│   │   └── sad.wav
│   └── voice_02/
│       └── default.wav
├── logs/                    # 日志
├── scripts/
│   ├── migrate_presets.py   # 目录结构迁移工具
│   └── ...
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── README.md
├── INTEGRATION_GUIDE.md     # IndexTTS2 集成指南
└── SMART_SENTIMENT_GUIDE.md # 智能情感分析指南
```

## 常见问题

### Q: 如何添加新音色？
A: 
1. 在 `presets/` 下创建音色文件夹（如 `presets/my_voice/`）
2. 添加 `default.wav`（必需）
3. 可选：添加其他情感文件（如 `happy.wav`, `sad.wav`）
4. 或使用 `/v1/voices/upload` 接口上传

### Q: 如何启用智能情感分析？
A: 
1. 获取 Gemini API Key（推荐）或 OpenAI API Key
2. 在 `.env` 中配置：
   ```env
   ENABLE_SMART_SENTIMENT=true
   SENTIMENT_LLM_API_KEY=your-api-key
   ```
3. 重启服务
4. 使用 `emotion="auto"` 参数

详见 [智能情感分析指南](./SMART_SENTIMENT_GUIDE.md)

### Q: 如何迁移旧的音色文件？
A: 运行迁移工具：
```bash
python scripts/migrate_presets.py
```

### Q: 显存不足怎么办？
A: 服务已实现请求排队机制，同一时间只处理一个请求。如仍不足，可调整模型配置或使用更小的模型。

### Q: 如何修改端口？
A: 修改 `docker-compose.yml` 中的端口映射，或设置环境变量 `PORT`。

## 📚 完整文档

### 快速开始
- 📖 [README.md](./README.md) - 项目概述（本文档）
- ⚡ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - **快速参考卡片（常用命令）**
- 🚀 [CHECKLIST.md](./CHECKLIST.md) - 部署检查清单

### 详细指南
- 📘 [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md) - **完整使用指南（推荐新手阅读）**
- 🔧 [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - IndexTTS2 集成详细步骤
- 🧠 [SMART_SENTIMENT_GUIDE.md](./SMART_SENTIMENT_GUIDE.md) - 智能情感分析功能说明

### 开发文档
- 📊 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 项目总结和技术架构
- 📁 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 项目文件结构说明
- 📈 [STATUS_REPORT.md](./STATUS_REPORT.md) - 项目状态报告
- 💻 [examples/api_examples.py](./examples/api_examples.py) - 完整的 API 使用示例

### 工具脚本
- 🛠️ [scripts/quick_start.sh](./scripts/quick_start.sh) - 一键启动脚本
- 🔍 [scripts/test_indextts_installation.py](./scripts/test_indextts_installation.py) - 安装检查工具
- 🎵 [scripts/create_default_voice.py](./scripts/create_default_voice.py) - 创建默认音色

## License

MIT
