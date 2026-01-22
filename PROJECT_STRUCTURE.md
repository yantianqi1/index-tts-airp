# VoiceNexus 项目文件结构

本文档详细说明项目的文件组织结构和各文件的用途。

## 📁 目录结构

```
voicenexus/
├── 📄 文档文件
│   ├── README.md                      # 项目概述和快速开始
│   ├── CHECKLIST.md                   # 部署检查清单
│   ├── COMPLETE_GUIDE.md              # 完整使用指南（推荐新手）
│   ├── INTEGRATION_GUIDE.md           # IndexTTS2 集成详细步骤
│   ├── SMART_SENTIMENT_GUIDE.md       # 智能情感分析功能说明
│   ├── PROJECT_SUMMARY.md             # 项目总结和技术架构
│   ├── PROJECT_STRUCTURE.md           # 本文档
│   ├── STATUS_REPORT.md               # 项目状态报告
│   └── CHANGELOG.md                   # 变更日志
│
├── 🐍 应用代码 (app/)
│   ├── __init__.py                    # 包初始化
│   ├── main.py                        # FastAPI 主应用，定义所有 API 路由
│   │
│   ├── core/                          # 核心模块
│   │   ├── __init__.py
│   │   ├── config.py                  # 配置管理（Pydantic Settings）
│   │   └── inference.py               # TTS 推理引擎（带显存锁保护）
│   │
│   ├── models/                        # 数据模型
│   │   ├── __init__.py
│   │   └── schemas.py                 # Pydantic 数据模型（Request/Response）
│   │
│   ├── services/                      # 业务服务
│   │   ├── __init__.py
│   │   └── sentiment.py               # 智能情感分析服务
│   │
│   └── utils/                         # 工具函数
│       ├── __init__.py
│       └── audio.py                   # 音频处理工具（格式转换、验证）
│
├── 🛠️ 工具脚本 (scripts/)
│   ├── quick_start.sh                 # 一键启动脚本（推荐使用）
│   ├── setup.sh                       # 环境初始化脚本
│   ├── create_default_voice.py        # 创建默认音色文件
│   ├── test_indextts_installation.py  # IndexTTS2 安装检查工具
│   ├── test_smart_sentiment.py        # 情感分析功能测试
│   └── migrate_presets.py             # 音色文件迁移工具
│
├── 📝 示例代码 (examples/)
│   └── api_examples.py                # 完整的 API 使用示例（9 个示例）
│
├── 🐳 Docker 配置
│   ├── Dockerfile                     # Docker 镜像构建文件
│   ├── docker-compose.yml             # Docker Compose 编排文件
│   ├── .dockerignore                  # Docker 忽略文件
│   └── .gitignore                     # Git 忽略文件
│
├── ⚙️ 配置文件
│   ├── requirements.txt               # Python 依赖列表
│   ├── .env.example                   # 环境变量示例
│   └── .env                           # 环境变量配置（需创建）
│
├── 🧪 测试文件
│   └── test_api.py                    # API 基础测试脚本
│
└── 📦 数据目录（需创建或挂载）
    ├── weights/                       # 模型权重文件
    │   ├── config.yaml                # IndexTTS2 配置文件（必需）
    │   └── ...                        # 其他模型文件
    │
    ├── presets/                       # 音色库
    │   ├── speaker1/                  # 音色 1（新结构）
    │   │   ├── default.wav            # 默认音色
    │   │   ├── happy.wav              # 开心情感
    │   │   └── sad.wav                # 悲伤情感
    │   ├── speaker2/                  # 音色 2
    │   │   └── default.wav
    │   └── default.wav                # 兼容旧结构
    │
    └── logs/                          # 日志文件
        ├── app.log                    # 应用日志
        └── error.log                  # 错误日志
```

## 📄 核心文件说明

### 应用代码

#### `app/main.py`
FastAPI 主应用入口，定义所有 API 路由：
- `GET /` - 健康检查
- `GET /v1/voices` - 获取音色列表
- `POST /v1/audio/speech` - 语音合成
- `POST /v1/voices/upload` - 上传音色

**关键特性**：
- 使用 `lifespan` 管理应用生命周期
- 自动加载模型
- 完整的错误处理

#### `app/core/inference.py`
TTS 推理引擎，核心功能模块：
- `TTSModelEngine` - 单例模式的推理引擎
- `load_model()` - 加载 IndexTTS2 模型
- `generate()` - 异步语音合成
- `_sync_generate()` - 同步推理（在线程池中执行）

**关键特性**：
- `asyncio.Lock` 显存保护
- 自动降级到 Mock 模式
- 支持 FP16/CUDA/DeepSpeed

#### `app/core/config.py`
配置管理，使用 Pydantic Settings：
- 服务配置（端口、主机）
- 路径配置（模型、音色、日志）
- 模型配置（设备、默认音色）
- 情感分析配置（LLM API）

#### `app/models/schemas.py`
Pydantic 数据模型：
- `TTSRequest` - 语音合成请求
- `VoiceInfo` - 音色信息
- `VoicesResponse` - 音色列表响应
- `UploadResponse` - 上传响应

#### `app/services/sentiment.py`
智能情感分析服务：
- `SentimentAnalyzer` - 情感分析器
- `analyze()` - 分析文本情感
- 支持自定义 LLM API
- 自动降级机制

#### `app/utils/audio.py`
音频处理工具：
- `save_audio_to_wav()` - 保存为 WAV 格式
- `convert_wav_to_mp3()` - 转换为 MP3
- `validate_audio_file()` - 验证音频文件

### 工具脚本

#### `scripts/quick_start.sh`
一键启动脚本，自动完成：
- 环境检查（Docker、GPU）
- 目录创建
- 模型检查
- 服务启动

**使用方法**：
```bash
chmod +x scripts/quick_start.sh
./scripts/quick_start.sh
```

#### `scripts/test_indextts_installation.py`
安装检查工具，验证：
- IndexTTS2 是否正确安装
- 模型文件是否完整
- 音色文件是否存在
- 模型是否能正常加载

**使用方法**：
```bash
python scripts/test_indextts_installation.py
```

#### `scripts/create_default_voice.py`
创建默认音色文件（1 秒静音音频）

**使用方法**：
```bash
python scripts/create_default_voice.py
```

### 示例代码

#### `examples/api_examples.py`
完整的 API 使用示例，包含 9 个示例：
1. 基础语音合成
2. 指定情感合成
3. 智能情感分析
4. 调整语速
5. 不同输出格式
6. 批量合成
7. 获取音色列表
8. 上传自定义音色
9. 错误处理

**使用方法**：
```bash
python examples/api_examples.py
```

### Docker 配置

#### `Dockerfile`
Docker 镜像构建文件：
- 基于 PyTorch CUDA 镜像
- 安装系统依赖（FFmpeg、git）
- 安装 Python 依赖
- 复制应用代码

#### `docker-compose.yml`
Docker Compose 编排文件：
- 服务定义
- 端口映射（5050:5050）
- 卷挂载（weights、presets、logs）
- GPU 支持配置

### 配置文件

#### `requirements.txt`
Python 依赖列表：
- FastAPI - Web 框架
- PyTorch - 深度学习
- soundfile - 音频处理
- librosa - 音频分析
- 等等...

#### `.env.example`
环境变量示例，包含：
- 服务配置
- 路径配置
- 模型配置
- 情感分析配置

**使用方法**：
```bash
cp .env.example .env
nano .env  # 编辑配置
```

### 测试文件

#### `test_api.py`
API 基础测试脚本，测试：
- 健康检查
- 获取音色列表
- 语音合成
- 上传音色

**使用方法**：
```bash
python test_api.py
```

## 📚 文档文件说明

### 用户文档

#### `README.md`
项目概述和快速开始指南，包含：
- 项目介绍
- 核心特性
- 快速开始
- API 示例
- 文档索引

**适合人群**：所有用户

#### `COMPLETE_GUIDE.md`
完整使用指南，包含：
- 系统要求
- 详细安装步骤
- 配置说明
- API 使用指南
- 高级功能
- 故障排除

**适合人群**：新手用户（强烈推荐）

#### `CHECKLIST.md`
部署检查清单，包含：
- 环境准备检查
- 模型准备检查
- 配置文件检查
- 功能测试检查
- 性能验证检查

**适合人群**：运维人员

### 技术文档

#### `INTEGRATION_GUIDE.md`
IndexTTS2 集成详细步骤，包含：
- 集成方案概述
- 宿主机安装方法
- Docker 集成方法
- 高级配置
- 情感控制扩展

**适合人群**：开发人员

#### `SMART_SENTIMENT_GUIDE.md`
智能情感分析功能说明，包含：
- 功能介绍
- 配置方法
- 使用示例
- 自定义情感标签
- 故障排除

**适合人群**：需要情感分析功能的用户

#### `PROJECT_SUMMARY.md`
项目总结和技术架构，包含：
- 项目概述
- 核心特性
- 技术栈
- 架构设计
- 性能指标
- 使用场景

**适合人群**：技术决策者、架构师

#### `STATUS_REPORT.md`
项目状态报告，包含：
- 完成情况
- 技术实现
- 测试情况
- 部署情况
- 已知问题
- 下一步计划

**适合人群**：项目管理者

## 🔄 工作流程

### 开发流程

```
1. 修改代码
   ↓
2. 本地测试
   ↓
3. 提交代码
   ↓
4. 构建镜像
   ↓
5. 部署测试
   ↓
6. 生产发布
```

### 部署流程

```
1. 准备环境
   ↓
2. 下载模型
   ↓
3. 配置文件
   ↓
4. 启动服务
   ↓
5. 功能测试
   ↓
6. 性能验证
```

### 使用流程

```
1. 准备音色文件
   ↓
2. 上传音色（可选）
   ↓
3. 调用 API
   ↓
4. 获取音频
   ↓
5. 后续处理
```

## 📊 文件统计

### 代码文件

| 类型 | 数量 | 说明 |
|------|------|------|
| Python 文件 | 15 | 应用代码和脚本 |
| Shell 脚本 | 2 | 启动和初始化脚本 |
| 配置文件 | 4 | Docker、依赖、环境变量 |
| 总计 | 21 | - |

### 文档文件

| 类型 | 数量 | 说明 |
|------|------|------|
| 用户文档 | 4 | README、指南、清单 |
| 技术文档 | 4 | 集成、架构、报告 |
| 总计 | 8 | - |

### 代码行数

| 模块 | 行数 | 说明 |
|------|------|------|
| app/main.py | ~200 | API 路由 |
| app/core/inference.py | ~250 | 推理引擎 |
| app/services/sentiment.py | ~150 | 情感分析 |
| 其他 | ~400 | 配置、工具等 |
| 总计 | ~1000 | 核心代码 |

## 🎯 重要文件快速索引

### 新手必读

1. **README.md** - 了解项目
2. **COMPLETE_GUIDE.md** - 学习使用
3. **CHECKLIST.md** - 部署验证

### 开发必读

1. **INTEGRATION_GUIDE.md** - 集成模型
2. **PROJECT_SUMMARY.md** - 了解架构
3. **app/core/inference.py** - 核心逻辑

### 运维必读

1. **docker-compose.yml** - 部署配置
2. **CHECKLIST.md** - 检查清单
3. **STATUS_REPORT.md** - 项目状态

### 使用必读

1. **examples/api_examples.py** - 使用示例
2. **test_api.py** - 快速测试
3. **SMART_SENTIMENT_GUIDE.md** - 高级功能

## 📝 文件命名规范

### Python 文件
- 小写字母 + 下划线：`inference.py`, `sentiment.py`
- 包初始化：`__init__.py`

### 文档文件
- 大写字母 + 下划线：`README.md`, `COMPLETE_GUIDE.md`
- 描述性命名：清晰表达文档内容

### 脚本文件
- 小写字母 + 下划线：`quick_start.sh`, `test_api.py`
- 动词开头：表达脚本功能

### 配置文件
- 小写字母 + 点号：`.env`, `docker-compose.yml`
- 标准命名：遵循工具约定

## 🔍 查找文件技巧

### 按功能查找

- **API 相关**：`app/main.py`, `app/models/schemas.py`
- **推理相关**：`app/core/inference.py`
- **配置相关**：`app/core/config.py`, `.env`
- **工具相关**：`scripts/`, `examples/`
- **文档相关**：`*.md` 文件

### 按角色查找

- **用户**：`README.md`, `COMPLETE_GUIDE.md`
- **开发者**：`app/`, `INTEGRATION_GUIDE.md`
- **运维**：`docker-compose.yml`, `CHECKLIST.md`
- **管理者**：`STATUS_REPORT.md`, `PROJECT_SUMMARY.md`

## 💡 最佳实践

### 文件组织

1. **模块化**：相关文件放在同一目录
2. **分层**：应用代码、工具、文档分离
3. **命名**：清晰、一致、描述性

### 代码管理

1. **版本控制**：使用 Git 管理代码
2. **忽略文件**：配置 `.gitignore`
3. **文档同步**：代码和文档同步更新

### 部署管理

1. **环境隔离**：使用 Docker 容器
2. **配置分离**：使用环境变量
3. **数据持久化**：使用卷挂载

---

**最后更新**: 2026-01-22  
**文档版本**: 1.0
