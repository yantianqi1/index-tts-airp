#!/bin/bash

echo "================================"
echo "VoiceNexus 环境初始化"
echo "================================"

# 创建必要目录
echo "创建目录..."
mkdir -p weights presets logs

# 创建默认音色
echo "创建默认音色..."
python scripts/create_default_voice.py

# 复制环境变量示例
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
fi

echo ""
echo "✓ 初始化完成！"
echo ""
echo "下一步："
echo "1. 将 IndexTTS 模型权重放入 weights/ 目录"
echo "2. 将参考音频放入 presets/ 目录"
echo "3. 运行: docker-compose up -d"
