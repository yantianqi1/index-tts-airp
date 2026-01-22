# VoiceNexus 完整文件结构

## 📁 项目文件树

```
voicenexus/
│
├── 📄 配置文件
│   ├── .env.example              # 环境变量示例
│   ├── .gitignore                # Git 忽略规则
│   ├── .dockerignore             # Docker 忽略规则
│   ├── requirements.txt          # Python 依赖
│   ├── Dockerfile                # Docker 镜像构建
│   └── docker-compose.yml        # 容器编排配置
│
├── 📚 文档
│   ├── README.md                 # 项目主文档
│   ├── QUICK_START.md            # 快速开始指南
│   ├── INTEGRATION_GUIDE.md      # IndexTTS 集成指南
│   ├── SMART_SENTIMENT_GUIDE.md  # 智能情感分析指南
│   ├── PROJECT_OVERVIEW.md       # 项目总览
│   ├── CHANGELOG.md              # 更新日志
│   ├── DEPLOYMENT_CHECKLIST.md   # 部署检查清单
│   ├── UPDATE_SUMMARY.md         # 更新总结
│   └── FILE_STRUCTURE.md         # 本文档
│
├── 🐍 应用代码 (app/)
│   ├── __init__.py               # 包初始化
│   ├── main.py                   # FastAPI 主应用
│   │
│   ├── core/                     # 核心模块
│   │   ├── __init__.py
│   │   ├── config.py             # 配置管理
│   │   └── inference.py          # TTS 推理引擎
│   │
│   ├── models/                   # 数据模型
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic 模型
│   │
│   ├── services/                 # 业务服务
│   │   ├── __init__.py
│   │   └── sentiment.py          # 智能情感分析
│   │
│   └── utils/                    # 工具函数
│       ├── __init__.py
│       └── audio.py              # 音频处理
│
├── 🔧 工具脚本 (scripts/)
│   ├── setup.sh                  # 环境初始化
│   ├── quick_start.sh            # 快速启动
│   ├── create_default_voice.py   # 创建默认音色
│   ├── migrate_presets.py        # 目录结构迁移
│   ├── test_indextts_installation.py  # 测试 IndexTTS 安装
│   └── test_smart_sentiment.py   # 测试智能情感分析
│
├── 🧪 测试
│   └── test_api.py               # API 测试脚本
│
├── 📦 数据目录（需创建）
│   ├── weights/                  # 模型权重
│   │   ├── config.yaml           # IndexTTS 配置
│   │   └── ...                   # 模型文件
│   │
│   ├── presets/                  # 音色库
│   │   ├── voice_01/
│   │   │   ├── default.wav       # 默认音色（必需）
│   │   │   ├── happy.wav         # 开心情感
│   │   │   └── sad.wav           # 悲伤情感
│   │   └── voice_02/
│   │       └── default.wav
│   │
│   └── logs/                     # 运行日志
│       └── *.log
│
└── 🔐 环境配置（需创建）
    └── .env                      # 环境变量（从 .env.example 复制）
```

## 📊 文件统计

### 代码文件

| 类型 | 数量 | 说明 |
|------|------|------|
| Python 源码 | 10 | 应用核心代码 |
| Python 脚本 | 5 | 工具和测试脚本 |
| 配置文件 | 5 | Docker、依赖等配置 |
| 文档文件 | 9 | Markdown 文档 |
| **总计** | **29** | - |

### 代码行数（估算）

| 模块 | 行数 | 说明 |
|------|------|------|
| app/main.py | ~200 | API 路由定义 |
| app/core/inference.py | ~200 | 推理引擎 |
| app/services/sentiment.py | ~120 | 情感分析服务 |
| app/core/config.py | ~50 | 配置管理 |
| app/models/schemas.py | ~40 | 数据模型 |
| app/utils/audio.py | ~80 | 音频处理 |
| 其他 | ~300 | 脚本和测试 |
| **总计** | **~990** | - |

## 📝 文件说明

### 核心应用文件

#### app/main.py
- FastAPI 应用入口
- 定义所有 API 路由
- 生命周期管理
- 约 200 行代码

**主要功能：**
- `GET /` - 健康检查
- `GET /v1/voices` - 获取音色列表
- `POST /v1/audio/speech` - 语音合成
- `POST /v1/voices/upload` - 上传音色

#### app/core/inference.py
- TTS 推理引擎核心
- 模型加载和管理
- 显存保护机制
- 约 200 行代码

**主要类：**
- `TTSModelEngine` - 推理引擎主类
- `MockIndexTTS` - Mock 模型（测试用）

#### app/services/sentiment.py
- 智能情感分析服务
- LLM API 调用
- 容错和回退机制
- 约 120 行代码

**主要类：**
- `SentimentAnalyzer` - 情感分析器

#### app/core/config.py
- 配置管理
- 环境变量读取
- 约 50 行代码

**主要类：**
- `Settings` - 配置类

#### app/models/schemas.py
- Pydantic 数据模型
- 请求/响应验证
- 约 40 行代码

**主要模型：**
- `TTSRequest` - 语音合成请求
- `VoiceInfo` - 音色信息
- `VoicesResponse` - 音色列表响应
- `UploadResponse` - 上传响应

#### app/utils/audio.py
- 音频处理工具
- 格式转换
- 约 80 行代码

**主要函数：**
- `save_audio_to_wav()` - 保存为 WAV
- `convert_wav_to_mp3()` - 转换为 MP3
- `validate_audio_file()` - 验证音频

### 工具脚本

#### scripts/setup.sh
- 环境初始化脚本
- 创建必要目录
- 复制配置文件

#### scripts/quick_start.sh
- 快速启动脚本
- 环境检查
- 自动启动服务

#### scripts/create_default_voice.py
- 创建默认音色文件
- 生成测试音频

#### scripts/migrate_presets.py
- 目录结构迁移工具
- 从旧结构迁移到新结构
- 支持备份

#### scripts/test_indextts_installation.py
- 测试 IndexTTS 安装
- 验证模型文件
- 测试模型加载

#### scripts/test_smart_sentiment.py
- 测试智能情感分析
- 验证 LLM 配置
- 测试情感识别准确率

### 测试文件

#### test_api.py
- API 功能测试
- 测试所有接口
- 生成测试音频

### 配置文件

#### .env.example
- 环境变量示例
- 包含所有配置项
- 需复制为 `.env` 使用

#### requirements.txt
- Python 依赖列表
- 包含所有必需包

#### Dockerfile
- Docker 镜像构建文件
- 基于 PyTorch CUDA 镜像

#### docker-compose.yml
- 容器编排配置
- 定义服务、卷、网络

#### .gitignore
- Git 忽略规则
- 排除临时文件、日志等

#### .dockerignore
- Docker 构建忽略规则
- 减小镜像大小

### 文档文件

#### README.md
- 项目主文档
- 功能介绍
- 快速开始
- API 文档

#### QUICK_START.md
- 5 分钟快速上手
- 分步骤说明
- 常见问题

#### INTEGRATION_GUIDE.md
- IndexTTS 集成详细指南
- 模型下载和安装
- 配置说明

#### SMART_SENTIMENT_GUIDE.md
- 智能情感分析完整指南
- LLM 配置
- 使用示例
- 故障排查

#### PROJECT_OVERVIEW.md
- 项目技术总览
- 架构设计
- 开发指南

#### CHANGELOG.md
- 版本更新历史
- 功能变更记录
- 未来计划

#### DEPLOYMENT_CHECKLIST.md
- 部署检查清单
- 完整的部署步骤
- 测试验证

#### UPDATE_SUMMARY.md
- v2.0 更新总结
- 新增功能说明
- 升级指南

#### FILE_STRUCTURE.md
- 本文档
- 完整文件结构
- 文件说明

## 🎯 关键文件快速索引

### 开始使用
1. [README.md](./README.md) - 从这里开始
2. [QUICK_START.md](./QUICK_START.md) - 快速上手

### 配置和部署
1. [.env.example](./.env.example) - 配置模板
2. [docker-compose.yml](./docker-compose.yml) - 容器配置
3. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 部署清单

### 功能集成
1. [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - IndexTTS 集成
2. [SMART_SENTIMENT_GUIDE.md](./SMART_SENTIMENT_GUIDE.md) - 智能情感配置

### 开发和扩展
1. [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - 技术架构
2. [app/main.py](./app/main.py) - API 入口
3. [app/core/inference.py](./app/core/inference.py) - 推理引擎

### 测试和工具
1. [test_api.py](./test_api.py) - API 测试
2. [scripts/test_smart_sentiment.py](./scripts/test_smart_sentiment.py) - 情感测试
3. [scripts/migrate_presets.py](./scripts/migrate_presets.py) - 迁移工具

## 📦 需要创建的目录

运行以下命令创建必要的目录：

```bash
mkdir -p weights presets logs
```

或使用初始化脚本：

```bash
bash scripts/setup.sh
```

## 🔐 需要配置的文件

1. **创建 .env 文件**
   ```bash
   cp .env.example .env
   nano .env  # 编辑配置
   ```

2. **下载模型文件到 weights/**
   ```bash
   huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights
   ```

3. **准备音色文件到 presets/**
   ```bash
   python scripts/create_default_voice.py
   ```

## 📊 文件大小估算

| 目录/文件 | 大小 | 说明 |
|-----------|------|------|
| app/ | ~50 KB | 应用代码 |
| scripts/ | ~30 KB | 工具脚本 |
| 文档 | ~200 KB | Markdown 文档 |
| weights/ | 2-5 GB | 模型文件（需下载） |
| presets/ | 变化 | 音色文件（用户提供） |
| logs/ | 变化 | 运行日志 |

## 🔄 版本控制

### 应该提交的文件
- ✅ 所有 `.py` 文件
- ✅ 所有 `.md` 文档
- ✅ 配置文件（`.example` 后缀）
- ✅ Docker 相关文件
- ✅ `.gitignore` 和 `.dockerignore`

### 不应该提交的文件
- ❌ `.env` 文件（包含敏感信息）
- ❌ `weights/` 目录（模型文件太大）
- ❌ `presets/` 目录（用户数据）
- ❌ `logs/` 目录（运行日志）
- ❌ `__pycache__/` 目录（Python 缓存）

## 📝 文件命名规范

### Python 文件
- 使用小写字母和下划线
- 例如：`sentiment.py`, `audio.py`

### 脚本文件
- 使用小写字母和下划线
- Shell 脚本使用 `.sh` 后缀
- 例如：`setup.sh`, `migrate_presets.py`

### 文档文件
- 使用大写字母和下划线
- 使用 `.md` 后缀
- 例如：`README.md`, `QUICK_START.md`

### 配置文件
- 使用小写字母和连字符
- 例如：`docker-compose.yml`, `.env.example`

---

**文档版本**: 2.0.0  
**最后更新**: 2025-01-22
