# VoiceNexus 项目总览

## 项目简介

VoiceNexus 是一个基于 B站开源的 IndexTTS 2.0 模型构建的**工业级语音合成 API 微服务**。它提供了简单易用的 REST API，支持智能情感分析和多情感语音合成。

### 核心特性

🎯 **零样本语音克隆** - 无需训练，仅需参考音频即可克隆音色  
🎭 **智能情感分析** - 基于 LLM 自动识别文本情感  
🎨 **多情感支持** - 每个音色支持多种情感表达  
🔒 **显存保护** - 请求排队机制，防止 OOM  
🚀 **高性能** - 异步处理，流式输出  
🐳 **易部署** - Docker 一键部署  
📚 **完整文档** - 详细的使用和集成指南

## 技术架构

### 技术栈

```
前端层: REST API (FastAPI)
    ↓
业务层: 
  - 情感分析服务 (LLM)
  - 音频处理工具
    ↓
推理层: TTS 推理引擎 (IndexTTS 2.0)
    ↓
基础层: PyTorch + CUDA
```

### 核心组件

| 组件 | 技术 | 作用 |
|------|------|------|
| API 框架 | FastAPI | 提供 REST API 接口 |
| 推理引擎 | IndexTTS 2.0 | 语音合成核心 |
| 情感分析 | OpenAI API | 智能识别文本情感 |
| 音频处理 | FFmpeg, librosa | 格式转换和处理 |
| 容器化 | Docker | 简化部署和运维 |

## 项目结构

```
voicenexus/
├── app/                          # 应用代码
│   ├── main.py                   # FastAPI 入口
│   ├── core/                     # 核心模块
│   │   ├── config.py             # 配置管理
│   │   └── inference.py          # TTS 推理引擎
│   ├── models/                   # 数据模型
│   │   └── schemas.py            # Pydantic 模型
│   ├── services/                 # 业务服务
│   │   └── sentiment.py          # 情感分析服务
│   └── utils/                    # 工具函数
│       └── audio.py              # 音频处理
│
├── scripts/                      # 工具脚本
│   ├── setup.sh                  # 环境初始化
│   ├── quick_start.sh            # 快速启动
│   ├── migrate_presets.py        # 目录迁移
│   ├── create_default_voice.py   # 创建默认音色
│   ├── test_indextts_installation.py  # 测试安装
│   └── test_smart_sentiment.py   # 测试情感分析
│
├── weights/                      # 模型权重（需下载）
├── presets/                      # 音色库
│   └── {voice_id}/
│       ├── default.wav           # 默认音色（必需）
│       ├── happy.wav             # 开心情感
│       └── ...                   # 其他情感
│
├── logs/                         # 运行日志
│
├── Dockerfile                    # Docker 镜像构建
├── docker-compose.yml            # 容器编排
├── requirements.txt              # Python 依赖
├── .env.example                  # 环境变量示例
│
├── README.md                     # 项目说明
├── QUICK_START.md                # 快速开始
├── INTEGRATION_GUIDE.md          # IndexTTS 集成指南
├── SMART_SENTIMENT_GUIDE.md      # 智能情感指南
├── CHANGELOG.md                  # 更新日志
└── PROJECT_OVERVIEW.md           # 本文档
```

## API 接口

### 1. 健康检查

```http
GET /
```

### 2. 获取音色列表

```http
GET /v1/voices
```

返回所有可用音色及其支持的情感。

### 3. 语音合成

```http
POST /v1/audio/speech
Content-Type: application/json

{
  "input": "待合成的文本",
  "voice": "音色ID",
  "emotion": "auto|default|happy|sad|...",
  "response_format": "wav|mp3",
  "speed": 1.0
}
```

### 4. 上传音色

```http
POST /v1/voices/upload
Content-Type: multipart/form-data

file: <audio.wav>
voice_id: "音色ID"
emotion: "情感标签"
```

## 数据流程

### 语音合成流程

```
用户请求
    ↓
[API 层] 接收请求，验证参数
    ↓
[情感分析] emotion="auto" → 调用 LLM 分析
    ↓
[路径解析] 查找对应的音频文件
    ↓
[推理引擎] 使用 IndexTTS 生成语音
    ↓
[音频处理] 格式转换（WAV/MP3）
    ↓
[响应] 返回音频流
```

### 情感分析流程

```
输入文本
    ↓
[构建 Prompt] 包含情感标签白名单
    ↓
[调用 LLM] 异步请求（带超时）
    ↓
[结果验证] 检查是否在白名单内
    ↓
[回退机制] 失败时返回 "default"
    ↓
返回情感标签
```

## 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WEIGHTS_DIR` | 模型权重目录 | `/app/weights` |
| `PRESETS_DIR` | 音色库目录 | `/app/presets` |
| `DEVICE` | 计算设备 | `cuda` |
| `ENABLE_SMART_SENTIMENT` | 启用智能情感 | `true` |
| `SENTIMENT_LLM_API_KEY` | LLM API Key | - |
| `SENTIMENT_LLM_MODEL` | LLM 模型 | `gemini-1.5-flash` |
| `SENTIMENT_LABELS` | 支持的情感标签 | `[...]` |

### 音色目录结构

**新结构（推荐）：**
```
presets/
└── voice_id/
    ├── default.wav    # 必需
    ├── happy.wav      # 可选
    └── sad.wav        # 可选
```

**旧结构（兼容）：**
```
presets/
├── voice_01.wav
└── voice_02.wav
```

## 部署方式

### 开发环境

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动服务
python -m uvicorn app.main:app --reload
```

### 生产环境（Docker）

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

### 使用 Cloudflare Tunnel

```bash
cloudflared tunnel --url localhost:5050
```

## 性能指标

### 硬件要求

| 配置 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 4 核 | 8 核+ |
| 内存 | 8 GB | 16 GB+ |
| GPU | 8 GB 显存 | 12 GB+ |
| 存储 | 20 GB | 50 GB+ |

### 性能数据

- **推理速度**: ~1-3 秒/句（取决于文本长度）
- **并发处理**: 排队机制，顺序处理
- **显存占用**: 6-8 GB（FP16 模式）
- **情感分析**: ~0.5-2 秒/次

## 安全考虑

### API 安全

- [ ] 添加 API Key 认证
- [ ] 实现速率限制
- [ ] 添加请求日志
- [ ] 输入验证和清理

### 数据安全

- [ ] 加密敏感配置
- [ ] 定期备份音色库
- [ ] 访问控制

### 网络安全

- [ ] HTTPS 支持
- [ ] CORS 配置
- [ ] 防火墙规则

## 监控和日志

### 日志级别

- `INFO`: 正常操作日志
- `WARNING`: 警告信息（如回退到默认音色）
- `ERROR`: 错误信息（如推理失败）

### 日志位置

- 容器内: `/app/logs/`
- 宿主机: `./logs/`

### 监控指标

- 请求数量和成功率
- 平均响应时间
- GPU 使用率
- 内存使用情况

## 扩展开发

### 添加新功能

1. **新的情感标签**
   - 更新 `SENTIMENT_LABELS`
   - 准备对应的音频文件
   - 可选：调整 LLM Prompt

2. **新的音频格式**
   - 在 `app/utils/audio.py` 添加转换函数
   - 更新 `TTSRequest` 模型
   - 更新 API 响应逻辑

3. **批量合成**
   - 创建新的 API 端点
   - 实现批量处理逻辑
   - 考虑异步任务队列

### 自定义 LLM

修改 `app/services/sentiment.py`：

```python
# 使用自定义 LLM 服务
self.client = AsyncOpenAI(
    base_url="http://your-llm-service/v1/",
    api_key="your-key"
)
```

### 集成其他 TTS 模型

修改 `app/core/inference.py`：

```python
# 替换 IndexTTS2 为其他模型
from your_tts_library import YourTTSModel

class TTSModelEngine:
    def load_model(self):
        self.model = YourTTSModel.load(...)
```

## 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 服务无法启动 | 端口占用 | 修改端口配置 |
| 推理失败 | 模型未加载 | 检查模型文件 |
| 情感分析不工作 | API Key 无效 | 验证配置 |
| 显存不足 | 并发请求 | 已有排队机制 |

### 调试技巧

1. **查看详细日志**
   ```bash
   docker-compose logs -f voicenexus
   ```

2. **测试单个组件**
   ```bash
   python scripts/test_indextts_installation.py
   python scripts/test_smart_sentiment.py
   ```

3. **使用 API 文档**
   访问 `http://localhost:5050/docs`

## 贡献指南

### 开发流程

1. Fork 项目
2. 创建功能分支
3. 编写代码和测试
4. 提交 Pull Request

### 代码规范

- 遵循 PEP 8
- 添加类型注解
- 编写文档字符串
- 添加单元测试

## 许可证

MIT License

## 联系方式

- 项目主页: [GitHub](https://github.com/your-repo)
- 问题反馈: [Issues](https://github.com/your-repo/issues)
- 邮件: your-email@example.com

## 致谢

- [IndexTTS](https://github.com/index-tts/index-tts) - 核心 TTS 模型
- [FastAPI](https://fastapi.tiangolo.com/) - Web 框架
- [Google Gemini](https://ai.google.dev/) - 情感分析 LLM

---

**最后更新**: 2025-01-22  
**版本**: 2.0.0
