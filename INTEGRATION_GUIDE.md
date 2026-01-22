# IndexTTS2 集成指南

本文档详细说明如何将真实的 IndexTTS2 模型集成到 VoiceNexus 服务中。

## 方案概述

代码已经更新为支持真实的 IndexTTS2 模型，具有以下特性：

✅ **自动检测**：优先尝试加载真实模型，失败时自动回退到 Mock 模式  
✅ **显存优化**：支持 FP16 推理，降低显存占用  
✅ **语速控制**：使用 librosa 实现语速调整  
✅ **情感控制**：支持 IndexTTS2 的情感向量和文本情感控制（可扩展）

## 集成步骤

### 方案 A：在宿主机上安装 IndexTTS2（推荐用于开发）

#### 1. 克隆 IndexTTS2 仓库

```bash
cd /path/to/your/workspace
git clone https://github.com/index-tts/index-tts.git
cd index-tts
```

#### 2. 安装 uv 包管理器

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# 或使用 pip
pip install uv
```

#### 3. 安装依赖

```bash
# 使用 uv 创建环境并安装依赖
uv sync

# 或使用国内镜像加速
uv sync --index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

#### 4. 下载模型权重

```bash
# 方式 1：使用 huggingface-cli
uv run huggingface-cli download IndexTeam/Index-TTS-2 --local-dir checkpoints

# 方式 2：使用 modelscope（国内推荐）
uv run modelscope download --model IndexTeam/Index-TTS-2 --local_dir checkpoints
```

#### 5. 将模型复制到项目目录

```bash
# 回到 VoiceNexus 项目目录
cd /path/to/voicenexus

# 复制模型文件
cp -r /path/to/index-tts/checkpoints/* ./weights/
```

#### 6. 安装 IndexTTS2 到项目环境

```bash
# 激活项目虚拟环境
source venv/bin/activate  # 或使用你的环境管理工具

# 安装 IndexTTS2（开发模式）
cd /path/to/index-tts
pip install -e .

# 或直接安装依赖
pip install indextts
```

### 方案 B：在 Docker 容器中集成（推荐用于生产）

#### 1. 修改 Dockerfile

更新 `Dockerfile`，添加 IndexTTS2 的安装：

```dockerfile
# 基于 PyTorch 官方 CUDA 镜像
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    git-lfs \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv 包管理器
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 克隆并安装 IndexTTS2
RUN git clone https://github.com/index-tts/index-tts.git /tmp/index-tts && \
    cd /tmp/index-tts && \
    pip install -e . && \
    rm -rf /tmp/index-tts/.git

# 复制应用代码
COPY app/ ./app/

# 创建必要的目录
RUN mkdir -p /app/weights /app/presets /app/logs

# 暴露端口
EXPOSE 5050

# 启动命令
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5050"]
```

#### 2. 下载模型到本地

```bash
# 在宿主机上下载模型
mkdir -p weights
cd weights

# 使用 huggingface-cli
huggingface-cli download IndexTeam/Index-TTS-2 --local-dir .

# 或使用 modelscope（国内推荐）
modelscope download --model IndexTeam/Index-TTS-2 --local_dir .
```

#### 3. 重新构建并启动容器

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 目录结构要求

确保你的项目目录结构如下：

```
/project_root
├── weights/                    # 模型权重目录
│   ├── config.yaml            # IndexTTS2 配置文件（必需）
│   ├── model.pt               # 模型权重文件
│   └── ...                    # 其他模型文件
├── presets/                   # 音色库
│   ├── default.wav            # 默认音色（必需）
│   ├── girl_01.wav
│   └── uncle_li.wav
└── app/
    └── ...
```

## 验证安装

### 1. 测试 IndexTTS2 是否正确安装

```python
# test_indextts.py
try:
    from indextts.infer_v2 import IndexTTS2
    print("✓ IndexTTS2 导入成功")
    
    # 尝试加载模型
    tts = IndexTTS2(
        cfg_path="weights/config.yaml",
        model_dir="weights",
        use_fp16=True,
        use_cuda_kernel=False,
        use_deepspeed=False
    )
    print("✓ IndexTTS2 模型加载成功")
    
except ImportError as e:
    print(f"✗ IndexTTS2 导入失败: {e}")
except Exception as e:
    print(f"✗ 模型加载失败: {e}")
```

### 2. 测试 API 服务

```bash
# 启动服务
python -m uvicorn app.main:app --host 0.0.0.0 --port 5050

# 在另一个终端测试
python test_api.py
```

## 高级配置

### 启用 FP16 推理（节省显存）

修改 `app/core/inference.py` 中的模型加载参数：

```python
self.model = IndexTTS2(
    cfg_path=str(cfg_path),
    model_dir=model_dir,
    use_fp16=True,  # 启用 FP16
    use_cuda_kernel=False,
    use_deepspeed=False
)
```

### 启用 CUDA 加速内核

```python
self.model = IndexTTS2(
    cfg_path=str(cfg_path),
    model_dir=model_dir,
    use_fp16=True,
    use_cuda_kernel=True,  # 启用 CUDA 加速
    use_deepspeed=False
)
```

### 启用 DeepSpeed 加速（多 GPU）

```python
self.model = IndexTTS2(
    cfg_path=str(cfg_path),
    model_dir=model_dir,
    use_fp16=True,
    use_cuda_kernel=True,
    use_deepspeed=True  # 启用 DeepSpeed
)
```

## 添加情感控制功能

IndexTTS2 支持情感控制，你可以扩展 API 来支持这个功能：

### 1. 更新请求模型

修改 `app/models/schemas.py`：

```python
class TTSRequest(BaseModel):
    model: str = Field(default="indextts-2.0")
    input: str = Field(..., min_length=1, max_length=5000)
    voice: str = Field(default="default")
    response_format: Literal["wav", "mp3"] = Field(default="wav")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    
    # 新增情感控制参数
    emotion_audio: Optional[str] = Field(None, description="情感参考音频文件名")
    emotion_vector: Optional[list[float]] = Field(None, description="情感向量 [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]")
    emotion_text: Optional[str] = Field(None, description="情感描述文本")
    emotion_alpha: float = Field(default=1.0, ge=0.0, le=1.0, description="情感强度")
```

### 2. 更新推理函数

修改 `app/core/inference.py` 中的 `_sync_generate` 方法：

```python
def _sync_generate(self, text: str, ref_audio_path: str, speed: float, 
                   emotion_audio: Optional[str] = None,
                   emotion_vector: Optional[list] = None,
                   emotion_text: Optional[str] = None,
                   emotion_alpha: float = 1.0) -> np.ndarray:
    """同步推理函数（支持情感控制）"""
    with torch.no_grad():
        # ... 省略其他代码 ...
        
        # 构建推理参数
        infer_kwargs = {
            "spk_audio_prompt": ref_audio_path,
            "text": text,
            "output_path": output_path,
            "use_random": False,
            "verbose": False
        }
        
        # 添加情感控制参数
        if emotion_audio:
            emo_audio_path = settings.presets_dir / emotion_audio
            if emo_audio_path.exists():
                infer_kwargs["emo_audio_prompt"] = str(emo_audio_path)
                infer_kwargs["emo_alpha"] = emotion_alpha
        
        if emotion_vector:
            infer_kwargs["emo_vector"] = emotion_vector
        
        if emotion_text:
            infer_kwargs["use_emo_text"] = True
            infer_kwargs["emo_text"] = emotion_text
            infer_kwargs["emo_alpha"] = emotion_alpha
        
        # 调用推理
        self.model.infer(**infer_kwargs)
        
        # ... 省略其他代码 ...
```

## 常见问题

### Q1: 提示 "无法导入 IndexTTS2"

**解决方案**：
- 确保已正确安装 IndexTTS2：`pip install -e /path/to/index-tts`
- 检查 Python 环境是否正确
- 尝试手动导入测试：`python -c "from indextts.infer_v2 import IndexTTS2"`

### Q2: 提示 "配置文件不存在"

**解决方案**：
- 确保 `weights/config.yaml` 文件存在
- 检查模型是否完整下载
- 查看日志中的实际路径

### Q3: 显存不足 (OOM)

**解决方案**：
- 启用 FP16 推理：`use_fp16=True`
- 减少并发请求（已通过 `asyncio.Lock` 实现）
- 使用更小的批处理大小
- 考虑使用 CPU 推理（性能较慢）

### Q4: 推理速度慢

**解决方案**：
- 启用 CUDA 加速内核：`use_cuda_kernel=True`
- 启用 FP16 推理
- 考虑使用 DeepSpeed（多 GPU 环境）
- 检查是否使用了 GPU：`torch.cuda.is_available()`

## 参考资源

- [IndexTTS2 官方仓库](https://github.com/index-tts/index-tts)
- [IndexTTS2 Demo 页面](https://indextts2.org/)
- [IndexTTS2 论文](https://arxiv.org/abs/2506.21619)
- [HuggingFace 模型页面](https://huggingface.co/IndexTeam/Index-TTS-2)
- [ModelScope 模型页面](https://modelscope.cn/models/IndexTeam/Index-TTS-2)

## 技术支持

如遇到问题，可以：
- 查看项目日志：`docker-compose logs -f`
- 加入 IndexTTS 社区：QQ群 663272642 或 Discord
- 提交 Issue 到官方仓库
