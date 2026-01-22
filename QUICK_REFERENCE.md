# VoiceNexus 快速参考

## 一键启动

```bash
bash scripts/start_service.sh
```

## 常用命令

### 服务管理
```bash
# 启动
bash scripts/start_service.sh

# 停止
bash scripts/stop_service.sh

# 查看日志
tail -f logs/service.log

# 检查状态
curl http://localhost:8080/
```

### 基础 TTS
```bash
# 生成语音
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "你好世界", "voice": "default"}' \
  --output output.wav

# 查看音色
curl http://localhost:8080/v1/voices
```

### 高级用法
```bash
# 指定情感
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "我很开心", "voice": "default", "emotion": "happy"}' \
  --output happy.wav

# 调整语速
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "快速播报", "voice": "default", "speed": 1.5}' \
  --output fast.wav

# 智能情感（需配置 LLM）
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "今天真糟糕", "voice": "default", "emotion": "auto"}' \
  --output auto.wav
```

### 上传音色
```bash
curl -X POST http://localhost:8080/v1/voices/upload \
  -F "file=@my_voice.wav" \
  -F "voice_id=my_voice" \
  -F "emotion=default"
```

## Python 示例

```python
import requests

# 生成语音
response = requests.post(
    "http://localhost:8080/v1/audio/speech",
    json={"input": "你好", "voice": "default"}
)

with open("output.wav", "wb") as f:
    f.write(response.content)
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| input | string | 必填 | 文本内容 |
| voice | string | "default" | 音色 ID |
| emotion | string | "default" | 情感（default/happy/sad/angry/auto） |
| speed | float | 1.0 | 语速（0.5-2.0） |
| response_format | string | "wav" | 格式（wav/mp3） |

## 故障排查

```bash
# 检查磁盘空间
df -h

# 检查进程
ps aux | grep uvicorn

# 检查端口
lsof -i :8080

# 查看 GPU
nvidia-smi

# 查看错误日志
grep ERROR logs/service.log
```

## API 端点

- `GET /` - 健康检查
- `GET /v1/voices` - 音色列表
- `POST /v1/audio/speech` - 语音合成
- `POST /v1/voices/upload` - 上传音色
- `GET /docs` - API 文档

## 配置文件

`.env` 文件配置项：

```bash
# 服务配置
HOST=0.0.0.0
PORT=8080

# 设备配置
DEVICE=auto  # auto/cuda/cpu

# 智能情感（可选）
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_API_KEY=your_key
```

## 目录结构

```
.
├── app/              # 应用代码
├── weights/          # 模型文件
├── presets/          # 音色文件
├── logs/             # 日志文件
└── scripts/          # 管理脚本
```

## 获取帮助

- 完整文档: `USAGE_GUIDE.md`
- API 文档: `http://localhost:8080/docs`
- 日志文件: `logs/service.log`
