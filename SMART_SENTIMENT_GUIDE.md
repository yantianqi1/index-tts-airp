# 智能情感分析配置指南

本指南说明如何配置和使用基于 LLM 的智能情感分析功能。

## 功能概述

智能情感分析功能允许系统自动分析输入文本的情感，并选择对应的音色文件。这样用户无需手动指定情感，系统会根据文本内容智能选择最合适的情感表达。

## 支持的 LLM 服务

本服务使用 OpenAI 兼容的 API 接口，支持以下服务：

### 1. Google Gemini（推荐）

**优势：**
- 免费额度充足
- 响应速度快
- 支持中英文

**配置示例：**
```env
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
SENTIMENT_LLM_API_KEY=your-gemini-api-key
SENTIMENT_LLM_MODEL=gemini-1.5-flash
```

**获取 API Key：**
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的 API Key
3. 复制 Key 到配置文件

### 2. OpenAI

**配置示例：**
```env
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_BASE_URL=https://api.openai.com/v1/
SENTIMENT_LLM_API_KEY=sk-proj-xxxxx
SENTIMENT_LLM_MODEL=gpt-3.5-turbo
```

### 3. 其他兼容服务

任何支持 OpenAI API 格式的服务都可以使用，例如：
- Azure OpenAI
- 本地部署的 LLM（如 Ollama + OpenAI 兼容层）
- 国内的 API 服务（如智谱、百川等）

## 配置步骤

### 1. 编辑环境变量

创建或编辑 `.env` 文件：

```bash
cp .env.example .env
nano .env  # 或使用其他编辑器
```

### 2. 配置 LLM 参数

```env
# 启用智能情感分析
ENABLE_SMART_SENTIMENT=true

# LLM API 配置
SENTIMENT_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
SENTIMENT_LLM_API_KEY=your-api-key-here
SENTIMENT_LLM_MODEL=gemini-1.5-flash

# 支持的情感标签（必须与音频文件名一致）
SENTIMENT_LABELS=["happy","sad","angry","fear","surprise","neutral","default"]

# 请求超时时间（秒）
SENTIMENT_TIMEOUT=10
```

### 3. 准备音色文件

确保你的音色目录包含对应的情感文件：

```
presets/
└── girl_01/
    ├── default.wav   # 必需，作为回退
    ├── happy.wav     # 开心
    ├── sad.wav       # 悲伤
    ├── angry.wav     # 愤怒
    ├── fear.wav      # 恐惧
    ├── surprise.wav  # 惊讶
    └── neutral.wav   # 中性
```

**重要提示：**
- 每个音色文件夹必须包含 `default.wav`
- 情感文件名必须与 `SENTIMENT_LABELS` 中的标签一致
- 如果 LLM 返回的情感没有对应文件，会自动回退到 `default.wav`

### 4. 重启服务

```bash
docker-compose restart
```

## 使用方法

### API 调用示例

**自动情感分析：**
```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "太棒了！我真的很开心！",
    "voice": "girl_01",
    "emotion": "auto"
  }' \
  --output happy.wav
```

系统会自动分析文本，识别出 "happy" 情感，并使用 `girl_01/happy.wav` 作为参考音频。

**手动指定情感：**
```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "今天天气真好。",
    "voice": "girl_01",
    "emotion": "happy"
  }' \
  --output output.wav
```

### Python 示例

```python
import requests

# 自动情感分析
response = requests.post(
    "http://localhost:5050/v1/audio/speech",
    json={
        "input": "这太可怕了！",
        "voice": "girl_01",
        "emotion": "auto",  # 自动分析
        "response_format": "wav"
    }
)

with open("output.wav", "wb") as f:
    f.write(response.content)
```

## 情感标签说明

默认支持的情感标签及其含义：

| 标签 | 中文 | 适用场景 |
|------|------|----------|
| `happy` | 开心 | 积极、兴奋、愉快的内容 |
| `sad` | 悲伤 | 失落、难过、遗憾的内容 |
| `angry` | 愤怒 | 生气、不满、激动的内容 |
| `fear` | 恐惧 | 害怕、紧张、担心的内容 |
| `surprise` | 惊讶 | 意外、震惊、惊喜的内容 |
| `neutral` | 中性 | 平静、客观、陈述性内容 |
| `default` | 默认 | 回退选项，无法判断时使用 |

## 自定义情感标签

你可以根据需要添加自定义情感：

### 1. 更新配置

```env
SENTIMENT_LABELS=["happy","sad","angry","excited","calm","romantic"]
```

### 2. 准备对应音频

```
presets/
└── girl_01/
    ├── default.wav
    ├── happy.wav
    ├── sad.wav
    ├── angry.wav
    ├── excited.wav
    ├── calm.wav
    └── romantic.wav
```

### 3. 更新 Prompt（可选）

如果需要更精确的控制，可以修改 `app/services/sentiment.py` 中的 `_build_prompt` 方法。

## 性能优化

### 1. 调整超时时间

如果 LLM 响应较慢，可以增加超时时间：

```env
SENTIMENT_TIMEOUT=15  # 增加到 15 秒
```

### 2. 使用更快的模型

```env
# Gemini Flash 系列速度最快
SENTIMENT_LLM_MODEL=gemini-1.5-flash

# 或使用 GPT-3.5（比 GPT-4 快）
SENTIMENT_LLM_MODEL=gpt-3.5-turbo
```

### 3. 缓存机制（未来功能）

可以考虑添加缓存，对相同文本直接返回之前的分析结果。

## 故障排查

### 问题 1: 提示 "情感分析服务未启用"

**原因：**
- `ENABLE_SMART_SENTIMENT` 设置为 `false`
- 未配置 `SENTIMENT_LLM_API_KEY`

**解决方案：**
检查 `.env` 文件配置，确保启用并配置了 API Key。

### 问题 2: 总是返回 "default" 情感

**原因：**
- LLM 请求失败或超时
- API Key 无效
- 网络连接问题

**解决方案：**
1. 查看日志：`docker-compose logs -f`
2. 测试 API Key 是否有效
3. 检查网络连接

### 问题 3: LLM 返回了不在白名单的情感

**原因：**
- LLM 理解偏差
- Prompt 设计不够严格

**解决方案：**
系统会自动回退到 `default`，这是正常的容错机制。如果频繁出现，可以：
1. 调整 `SENTIMENT_LABELS` 包含更多标签
2. 修改 Prompt 使其更严格

## 禁用智能情感分析

如果不需要此功能，可以禁用：

```env
ENABLE_SMART_SENTIMENT=false
```

禁用后，`emotion="auto"` 会直接使用 `default` 情感。

## 成本估算

### Gemini Flash（推荐）

- 免费额度：每天 1500 次请求
- 付费价格：极低（几乎可忽略）
- 适合：个人项目、中小型应用

### OpenAI GPT-3.5

- 价格：约 $0.0015 / 1K tokens
- 每次情感分析约消耗 50-100 tokens
- 成本：约 $0.0001 / 次
- 适合：商业应用

## 最佳实践

1. **优先使用 Gemini Flash**：免费且快速
2. **合理设置超时**：避免阻塞请求
3. **准备完整的情感音频**：确保每个情感都有对应文件
4. **监控日志**：及时发现问题
5. **测试不同文本**：验证情感识别准确性

## 示例场景

### 场景 1: 客服机器人

```python
# 根据用户反馈自动调整语气
texts = [
    "非常感谢您的帮助！",  # -> happy
    "这个问题还没解决...",  # -> sad
    "为什么还不处理？",     # -> angry
]

for text in texts:
    response = requests.post(
        "http://localhost:5050/v1/audio/speech",
        json={"input": text, "voice": "service", "emotion": "auto"}
    )
```

### 场景 2: 有声书朗读

```python
# 根据小说内容自动调整情感
story = """
"太好了！" 小明兴奋地说。
但很快，他的脸色变得凝重。
"这可怎么办..." 他担心地想。
"""

# 分段处理，每段自动识别情感
for paragraph in story.split('\n'):
    if paragraph.strip():
        response = requests.post(
            "http://localhost:5050/v1/audio/speech",
            json={"input": paragraph, "voice": "narrator", "emotion": "auto"}
        )
```

## 参考资源

- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [Google Gemini API 文档](https://ai.google.dev/docs)
- [项目主文档](./README.md)
- [集成指南](./INTEGRATION_GUIDE.md)
