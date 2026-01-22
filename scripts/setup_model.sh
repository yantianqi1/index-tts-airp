#!/bin/bash

set -e

echo "=== IndexTTS 模型配置脚本 ==="

# 1. 创建必要的目录
echo "1. 创建目录..."
mkdir -p weights
mkdir -p presets/default
mkdir -p logs

# 2. 复制配置文件
echo "2. 复制配置文件..."
if [ -f "index-tts/checkpoints/config.yaml" ]; then
    cp index-tts/checkpoints/config.yaml weights/
    echo "   ✓ config.yaml 已复制"
else
    echo "   ✗ 找不到 index-tts/checkpoints/config.yaml"
    exit 1
fi

if [ -f "index-tts/checkpoints/pinyin.vocab" ]; then
    cp index-tts/checkpoints/pinyin.vocab weights/
    echo "   ✓ pinyin.vocab 已复制"
fi

# 3. 检查是否需要下载模型
echo ""
echo "3. 检查模型文件..."
echo ""

# 检查是否有 .pt 或 .pth 文件
if ls weights/*.pt 1> /dev/null 2>&1 || ls weights/*.pth 1> /dev/null 2>&1; then
    echo "✓ 发现模型文件:"
    ls -lh weights/*.pt weights/*.pth 2>/dev/null || true
else
    echo "⚠️  未发现模型文件"
    echo ""
    echo "请选择下载方式："
    echo ""
    echo "【推荐】方法 1: 魔搭 ModelScope（国内快速）"
    echo "  # 安装 modelscope"
    echo "  pip install modelscope"
    echo ""
    echo "  # 下载完整模型"
    echo "  modelscope download --model IndexTeam/IndexTTS-2 --local_dir weights/"
    echo ""
    echo "方法 2: Hugging Face 镜像"
    echo "  export HF_ENDPOINT=https://hf-mirror.com"
    echo "  huggingface-cli download IndexTeam/Index-1.9B-Character --local-dir weights/"
    echo ""
    echo "方法 3: Git 克隆（魔搭）"
    echo "  git lfs install"
    echo "  git clone https://www.modelscope.cn/IndexTeam/IndexTTS-2.git weights_temp"
    echo "  mv weights_temp/* weights/"
    echo ""
fi

# 4. 创建默认音色
echo ""
echo "4. 检查默认音色..."
if [ -f "presets/default/default.wav" ]; then
    echo "   ✓ 默认音色已存在"
elif [ -f "index-tts/examples/voice_01.wav" ]; then
    cp index-tts/examples/voice_01.wav presets/default/default.wav
    echo "   ✓ 已创建默认音色（使用 voice_01.wav）"
else
    echo "   ⚠️  未找到默认音色文件"
    echo "   请手动添加音色文件到 presets/default/default.wav"
fi

echo ""
echo "=== 设置完成 ==="
echo ""
echo "目录结构:"
echo "  weights/          - 模型文件目录"
echo "  presets/          - 音色预设目录"
echo "  logs/             - 日志目录"
echo ""
echo "下一步:"
echo "  1. 确保模型文件已下载到 weights/ 目录"
echo "  2. 运行: ./scripts/start_service.sh"
