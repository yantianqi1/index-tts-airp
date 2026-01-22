# 快速开始指南

本指南帮助你在 5 分钟内启动 VoiceNexus 服务并体验智能情感分析功能。

## 前置要求

- Docker & Docker Compose
- （可选）NVIDIA GPU + NVIDIA Docker Runtime
- （可选）Gemini API Key（用于智能情感分析）

## 步骤 1: 克隆项目

```bash
git clone <your-repo-url>
cd voicenexus
```

## 步骤 2: 初始化环境

```bash
# 运行初始化脚本
bash scripts/setup.sh

# 或手动执行
mkdir -p weights presets logs
python scripts/create_default_voice.py
cp .env.example .env
```

## 步骤 3: 配置智能情感分析（可选但推荐）

### 获取 Gemini API Key（免费）

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 点击 "Create API Key"
3. 复制生成的 Key

### 编辑配置文件

```bash
nano .env  # 或使用其他编辑器
```

修改以下内容：

```env
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_API_KEY=你的-API-Key
```

## 步骤 4: 准备音色文件

### 方式 A: 使用示例结构（快速测试）

```bash
python scripts/migrate_presets.py --example
```

这会创建示例目录结构（使用占位文件）。

### 方式 B: 使用真实音频

创建以下结构：

```
presets/
└── my_voice/
    ├── default.wav   # 必需
    ├── happy.wav     # 可选
    └── sad.wav       # 可选
```

每个 `.wav` 文件应该是 3-10 秒的清晰人声录音。

## 步骤 5: 下载 IndexTTS 模型（生产环境）

```bash
# 使用 HuggingFace（国际）
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights

# 或使用 ModelScope（国内推荐）
modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights
```

**注意：** 如果跳过此步骤，服务会以 Mock 模式运行（仅用于测试 API）。

## 步骤 6: 启动服务

```bash
# 使用快速启动脚本（推荐）
bash scripts/quick_start.sh

# 或手动启动
docker-compose up -d
```

等待几分钟让模型加载完成。

## 步骤 7: 测试服务

### 检查服务状态

```bash
curl http://localhost:5050/
```

应该返回：
```json
{
  "service": "VoiceNexus",
  "version": "1.0.0",
  "status": "running"
}
```

### 查看可用音色

```bash
curl http://localhost:5050/v1/voices
```

### 测试语音合成（默认情感）

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "你好，这是一个测试。",
    "voice": "default",
    "emotion": "default"
  }' \
  --output test.wav
```

### 测试智能情感分析

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "太棒了！我真的很开心！",
    "voice": "default",
    "emotion": "auto"
  }' \
  --output happy.wav
```

### 使用测试脚本

```bash
python test_api.py
```

## 步骤 8: 访问 API 文档

打开浏览器访问：

```
http://localhost:5050/docs
```

这是自动生成的交互式 API 文档，可以直接在浏览器中测试所有接口。

## 常见问题

### Q: 服务启动失败

**检查日志：**
```bash
docker-compose logs -f
```

**常见原因：**
- 端口 5050 被占用：修改 `docker-compose.yml` 中的端口
- GPU 不可用：检查 NVIDIA Docker Runtime
- 模型文件缺失：服务会以 Mock 模式运行

### Q: 智能情感分析不工作

**检查配置：**
```bash
python scripts/test_smart_sentiment.py --config-only
```

**测试 API Key：**
```bash
python scripts/test_smart_sentiment.py
```

**常见原因：**
- API Key 未配置或无效
- 网络连接问题
- LLM 服务不可用

### Q: 音频质量不好

**原因：**
- 使用了 Mock 模型（测试模式）
- 参考音频质量差
- 模型未正确加载

**解决方案：**
1. 确保下载了真实的 IndexTTS 模型
2. 使用高质量的参考音频（清晰、无噪音）
3. 检查日志确认模型加载成功

## 下一步

### 1. 添加更多音色

```bash
# 创建新音色目录
mkdir -p presets/my_new_voice

# 添加音频文件
cp your_audio.wav presets/my_new_voice/default.wav
cp happy_audio.wav presets/my_new_voice/happy.wav

# 重启服务
docker-compose restart
```

### 2. 调整情感标签

编辑 `.env`：

```env
SENTIMENT_LABELS=["happy","sad","angry","excited","calm"]
```

确保每个标签都有对应的音频文件。

### 3. 集成到你的应用

**Python 示例：**

```python
import requests

def text_to_speech(text, voice="default", emotion="auto"):
    response = requests.post(
        "http://localhost:5050/v1/audio/speech",
        json={
            "input": text,
            "voice": voice,
            "emotion": emotion,
            "response_format": "wav"
        }
    )
    return response.content

# 使用
audio = text_to_speech("你好，世界！")
with open("output.wav", "wb") as f:
    f.write(audio)
```

**JavaScript 示例：**

```javascript
async function textToSpeech(text, voice = "default", emotion = "auto") {
  const response = await fetch("http://localhost:5050/v1/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: text,
      voice: voice,
      emotion: emotion,
      response_format: "wav"
    })
  });
  
  return await response.blob();
}

// 使用
const audio = await textToSpeech("你好，世界！");
const url = URL.createObjectURL(audio);
const audioElement = new Audio(url);
audioElement.play();
```

### 4. 使用 Cloudflare Tunnel 暴露服务

```bash
# 安装 cloudflared
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# 启动 tunnel
cloudflared tunnel --url localhost:5050
```

会生成一个公网 URL，可以从任何地方访问你的服务。

## 性能优化建议

### 1. 启用 FP16（节省显存）

修改 `app/core/inference.py`：

```python
self.model = IndexTTS2(
    cfg_path=str(cfg_path),
    model_dir=model_dir,
    use_fp16=True,  # 启用
    use_cuda_kernel=False,
    use_deepspeed=False
)
```

### 2. 使用更快的 LLM 模型

```env
SENTIMENT_LLM_MODEL=gemini-1.5-flash  # 最快
```

### 3. 调整超时时间

```env
SENTIMENT_TIMEOUT=5  # 减少等待时间
```

## 获取帮助

- 📖 [完整文档](./README.md)
- 🔧 [集成指南](./INTEGRATION_GUIDE.md)
- 🎭 [智能情感指南](./SMART_SENTIMENT_GUIDE.md)
- 📝 [更新日志](./CHANGELOG.md)
- 💬 [提交 Issue](https://github.com/your-repo/issues)

## 停止服务

```bash
docker-compose down
```

## 卸载

```bash
# 停止并删除容器
docker-compose down -v

# 删除项目文件
cd ..
rm -rf voicenexus
```

---

**祝你使用愉快！** 🎉
