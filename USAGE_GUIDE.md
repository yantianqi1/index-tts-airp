# VoiceNexus 使用指南

## 快速开始

### 1. 启动服务

```bash
# 启动服务（后台运行）
bash scripts/start_service.sh

# 查看日志（确认服务启动成功）
# 看到 "✓ 服务已启动" 和 "Uvicorn running" 表示成功
```

服务启动需要 10-15 分钟（首次启动会构建文本规范化模型）

### 2. 验证服务

```bash
# 检查服务状态
curl http://localhost:8080/

# 查看可用音色
curl http://localhost:8080/v1/voices
```

### 3. 生成语音

```bash
# 基础用法
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "你好，欢迎使用语音合成服务", "voice": "default"}' \
  --output output.wav

# 查看生成的文件
ls -lh output.wav
```

---

## API 接口说明

### 1. 健康检查

**端点**: `GET /`

```bash
curl http://localhost:8080/
```

**响应**:
```json
{
  "service": "VoiceNexus",
  "version": "1.0.0",
  "status": "running"
}
```

---

### 2. 获取音色列表

**端点**: `GET /v1/voices`

```bash
curl http://localhost:8080/v1/voices
```

**响应**:
```json
{
  "voices": [
    {
      "id": "default",
      "name": "default",
      "emotions": ["default", "happy", "sad"],
      "has_default": true
    }
  ]
}
```

---

### 3. 语音合成（核心接口）

**端点**: `POST /v1/audio/speech`

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `input` | string | ✓ | - | 要合成的文本（最长 5000 字符） |
| `voice` | string | ✗ | "default" | 音色 ID |
| `emotion` | string | ✗ | "default" | 情感标签（default/happy/sad/angry/auto） |
| `speed` | float | ✗ | 1.0 | 语速（0.5-2.0） |
| `response_format` | string | ✗ | "wav" | 输出格式（wav/mp3） |

#### 使用示例

**基础合成**:
```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "今天天气真不错",
    "voice": "default"
  }' \
  --output speech.wav
```

**指定情感**:
```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "我今天很开心",
    "voice": "default",
    "emotion": "happy"
  }' \
  --output happy.wav
```

**智能情感分析**（需配置 LLM）:
```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "今天真是糟糕的一天",
    "voice": "default",
    "emotion": "auto"
  }' \
  --output auto_emotion.wav
```

**调整语速**:
```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "这是一段快速播报的新闻",
    "voice": "default",
    "speed": 1.5
  }' \
  --output fast.wav
```

**输出 MP3 格式**:
```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "输出为 MP3 格式",
    "voice": "default",
    "response_format": "mp3"
  }' \
  --output speech.mp3
```

---

### 4. 上传自定义音色

**端点**: `POST /v1/voices/upload`

```bash
# 上传音色文件
curl -X POST http://localhost:8080/v1/voices/upload \
  -F "file=@my_voice.wav" \
  -F "voice_id=my_voice" \
  -F "emotion=default"

# 上传不同情感的音色
curl -X POST http://localhost:8080/v1/voices/upload \
  -F "file=@happy_voice.wav" \
  -F "voice_id=my_voice" \
  -F "emotion=happy"
```

**响应**:
```json
{
  "success": true,
  "message": "上传成功",
  "voice_id": "my_voice",
  "emotion": "default"
}
```

**音色文件要求**:
- 格式: WAV
- 大小: < 50MB
- 时长: 建议 3-10 秒
- 采样率: 任意（会自动转换）
- 内容: 清晰的语音，无背景噪音

---

## Python 客户端示例

### 基础用法

```python
import requests

# API 地址
API_URL = "http://localhost:8080"

def text_to_speech(text, voice="default", emotion="default", output_file="output.wav"):
    """文本转语音"""
    response = requests.post(
        f"{API_URL}/v1/audio/speech",
        json={
            "input": text,
            "voice": voice,
            "emotion": emotion
        }
    )
    
    if response.status_code == 200:
        with open(output_file, "wb") as f:
            f.write(response.content)
        print(f"✓ 音频已保存: {output_file}")
    else:
        print(f"✗ 错误: {response.json()}")

# 使用示例
text_to_speech("你好，这是测试", output_file="test.wav")
```

### 批量生成

```python
import requests
from pathlib import Path

API_URL = "http://localhost:8080"

def batch_generate(texts, voice="default", output_dir="outputs"):
    """批量生成语音"""
    Path(output_dir).mkdir(exist_ok=True)
    
    for i, text in enumerate(texts):
        response = requests.post(
            f"{API_URL}/v1/audio/speech",
            json={"input": text, "voice": voice}
        )
        
        if response.status_code == 200:
            output_file = f"{output_dir}/speech_{i+1}.wav"
            with open(output_file, "wb") as f:
                f.write(response.content)
            print(f"✓ [{i+1}/{len(texts)}] {output_file}")
        else:
            print(f"✗ [{i+1}/{len(texts)}] 失败: {response.json()}")

# 使用示例
texts = [
    "第一段文本",
    "第二段文本",
    "第三段文本"
]
batch_generate(texts)
```

### 上传音色

```python
import requests

API_URL = "http://localhost:8080"

def upload_voice(audio_file, voice_id, emotion="default"):
    """上传自定义音色"""
    with open(audio_file, "rb") as f:
        files = {"file": f}
        data = {
            "voice_id": voice_id,
            "emotion": emotion
        }
        response = requests.post(
            f"{API_URL}/v1/voices/upload",
            files=files,
            data=data
        )
    
    result = response.json()
    if result["success"]:
        print(f"✓ 上传成功: {voice_id}/{emotion}")
    else:
        print(f"✗ 上传失败: {result['message']}")

# 使用示例
upload_voice("my_voice.wav", "custom_voice", "default")
```

---

## 服务管理

### 启动服务

```bash
# 方式 1: 使用脚本（推荐）
bash scripts/start_service.sh

# 方式 2: 手动启动
mkdir -p logs
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 > logs/service.log 2>&1 &
```

### 停止服务

```bash
# 方式 1: 使用脚本
bash scripts/stop_service.sh

# 方式 2: 手动停止
pkill -f "uvicorn app.main:app"
```

### 查看日志

```bash
# 实时查看日志
tail -f logs/service.log

# 查看最近 100 行
tail -100 logs/service.log

# 搜索错误
grep ERROR logs/service.log
```

### 重启服务

```bash
# 停止并重启
bash scripts/stop_service.sh
bash scripts/start_service.sh
```

---

## 音色管理

### 音色目录结构

```
presets/
├── default/
│   ├── default.wav    # 默认情感
│   ├── happy.wav      # 开心
│   └── sad.wav        # 悲伤
├── voice_01/
│   └── default.wav
└── voice_02/
    └── default.wav
```

### 添加新音色

**方法 1: 通过 API 上传**（推荐）
```bash
curl -X POST http://localhost:8080/v1/voices/upload \
  -F "file=@my_voice.wav" \
  -F "voice_id=my_voice" \
  -F "emotion=default"
```

**方法 2: 手动复制文件**
```bash
# 创建音色目录
mkdir -p presets/my_voice

# 复制音频文件
cp my_voice.wav presets/my_voice/default.wav

# 添加不同情感
cp happy_voice.wav presets/my_voice/happy.wav
cp sad_voice.wav presets/my_voice/sad.wav
```

### 使用自定义音色

```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "使用自定义音色",
    "voice": "my_voice",
    "emotion": "happy"
  }' \
  --output custom.wav
```

---

## 智能情感分析配置

### 配置 LLM（可选）

编辑 `.env` 文件：

```bash
# 启用智能情感分析
ENABLE_SMART_SENTIMENT=true

# 配置 LLM API（支持 OpenAI 兼容接口）
SENTIMENT_LLM_BASE_URL=https://api.openai.com/v1
SENTIMENT_LLM_API_KEY=your_api_key_here
SENTIMENT_LLM_MODEL=gpt-3.5-turbo

# 或使用 Google Gemini（默认）
SENTIMENT_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
SENTIMENT_LLM_API_KEY=your_gemini_api_key
SENTIMENT_LLM_MODEL=gemini-1.5-flash
```

### 使用智能情感

```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "今天真是糟糕透了，什么都不顺利",
    "voice": "default",
    "emotion": "auto"
  }' \
  --output auto_sad.wav
```

系统会自动分析文本情感并选择合适的音色。

---

## 常见问题

### 1. 服务启动失败

**检查日志**:
```bash
tail -50 logs/service.log
```

**常见原因**:
- 磁盘空间不足: `df -h` 检查
- 端口被占用: `lsof -i :8080` 检查
- 模型文件缺失: `ls -lh weights/` 检查

### 2. 生成的音频文件很小（< 1KB）

说明返回的是错误信息，查看内容：
```bash
cat output.wav
```

可能原因：
- 音色文件不存在
- 文本过长（> 5000 字符）
- 参数格式错误

### 3. 生成速度慢

首次推理会较慢（需要初始化），后续会快很多。

优化建议：
- 使用 GPU（自动检测）
- 减少文本长度
- 批量处理时复用连接

### 4. 显存不足

修改配置使用 CPU：

编辑 `.env`:
```bash
DEVICE=cpu
```

重启服务。

### 5. 音色效果不好

音色文件要求：
- 清晰无噪音
- 3-10 秒时长
- 单人语音
- 情感表达明确

---

## 性能优化

### GPU 加速

服务会自动检测并使用 GPU，查看 GPU 使用：
```bash
watch -n 1 nvidia-smi
```

### 并发处理

服务支持并发请求，但会自动排队避免显存溢出。

### 缓存优化

首次启动会构建文本规范化缓存，后续启动会更快。

---

## API 文档

启动服务后访问：

```
http://localhost:8080/docs
```

可以看到完整的 Swagger API 文档，支持在线测试。

---

## 技术支持

- 查看日志: `tail -f logs/service.log`
- 检查服务: `curl http://localhost:8080/`
- 查看进程: `ps aux | grep uvicorn`
- 查看端口: `lsof -i :8080`

---

## 更新日志

查看 `CHANGELOG.md` 了解版本更新内容。
