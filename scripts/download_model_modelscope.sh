#!/bin/bash

set -e

echo "=== 使用魔搭 ModelScope 下载 IndexTTS-2 模型 ==="
echo ""

# 检查是否安装了 modelscope
if ! python -c "import modelscope" 2>/dev/null; then
    echo "正在安装 modelscope..."
    pip install modelscope -i https://pypi.tuna.tsinghua.edu.cn/simple
    echo "✓ modelscope 安装完成"
    echo ""
fi

# 创建 weights 目录
mkdir -p weights

echo "开始下载模型到 weights/ 目录..."
echo "模型大小约 3-5GB，请耐心等待..."
echo ""

# 使用 modelscope 下载
modelscope download --model IndexTeam/IndexTTS-2 --local_dir weights/

echo ""
echo "=== 下载完成 ==="
echo ""
echo "模型文件列表:"
ls -lh weights/

echo ""
echo "下一步: 运行 ./scripts/start_service.sh 启动服务"
