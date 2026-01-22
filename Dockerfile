# 基于 PyTorch 官方 CUDA 镜像
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app/ ./app/
COPY scripts/ ./scripts/

# 创建必要的目录
RUN mkdir -p /app/weights /app/presets /app/logs

# 创建启动脚本
RUN echo '#!/bin/bash\n\
# 检查并创建默认音色\n\
if [ ! -f "/app/presets/default/default.wav" ]; then\n\
    echo "创建默认音色..."\n\
    python /app/scripts/create_default_voice.py || true\n\
fi\n\
\n\
# 启动应用\n\
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 5050\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# 暴露端口
EXPOSE 5050

# 启动命令
CMD ["/app/entrypoint.sh"]
