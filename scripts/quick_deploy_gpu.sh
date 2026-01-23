#!/bin/bash

# ==========================================
#  IndexTTS 全新 GPU 服务器快速部署
#  用法: curl -s URL | bash
#  或者: ./quick_deploy_gpu.sh
# ==========================================

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        IndexTTS 全新 GPU 服务器一键部署                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 配置
BACKEND_PORT=${BACKEND_PORT:-8080}
PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"

# 检查 Python
echo -e "${BLUE}[1/7]${NC} 检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python3 未安装${NC}"
    echo "请先安装 Python 3.10+:"
    echo "  Ubuntu: sudo apt install python3 python3-pip python3-venv"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version | cut -d' ' -f2)${NC}"

# 检查 pip
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo -e "${RED}✗ pip 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip 已安装${NC}"

# 检测 GPU
echo ""
echo -e "${BLUE}[2/7]${NC} 检测 GPU..."
if command -v nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
    if [ -n "$GPU_NAME" ]; then
        echo -e "${GREEN}✓ 检测到 GPU: $GPU_NAME${NC}"
        DEVICE="cuda"
    else
        echo -e "${YELLOW}⚠ 未检测到 GPU，使用 CPU 模式${NC}"
        DEVICE="cpu"
    fi
else
    echo -e "${YELLOW}⚠ 未检测到 GPU，使用 CPU 模式${NC}"
    DEVICE="cpu"
fi

# 创建目录
echo ""
echo -e "${BLUE}[3/7]${NC} 创建目录..."
mkdir -p weights presets logs generated_audio char
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 安装依赖
echo ""
echo -e "${BLUE}[4/7]${NC} 安装 Python 依赖（使用阿里云镜像）..."
pip install -r requirements.txt \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    --trusted-host mirrors.aliyun.com \
    -q
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 下载模型
echo ""
echo -e "${BLUE}[5/7]${NC} 检查/下载 IndexTTS-2 模型..."
if [ -f "weights/config.yaml" ]; then
    echo -e "${GREEN}✓ 模型已存在${NC}"
else
    echo "模型不存在，开始从魔搭下载..."
    echo "模型大小约 3-5GB，请耐心等待..."
    echo ""

    # 安装 modelscope
    pip install modelscope -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -q

    # 使用命令行下载（更可靠）
    modelscope download --model IndexTeam/IndexTTS-2 --local_dir weights/

    if [ -f "weights/config.yaml" ]; then
        echo -e "${GREEN}✓ 模型下载完成${NC}"
    else
        echo -e "${RED}✗ 模型下载失败${NC}"
        echo ""
        echo "请手动下载:"
        echo "  modelscope download --model IndexTeam/IndexTTS-2 --local_dir weights/"
        echo ""
        echo "或使用 Git 下载:"
        echo "  git lfs install"
        echo "  git clone https://www.modelscope.cn/IndexTeam/IndexTTS-2.git weights"
        exit 1
    fi
fi

# 配置环境
echo ""
echo -e "${BLUE}[6/7]${NC} 配置环境..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        cat > .env << EOF
BACKEND_PORT=$BACKEND_PORT
HOST=0.0.0.0
WEIGHTS_DIR=./weights
PRESETS_DIR=./presets
CHAR_DIR=./char
DEVICE=$DEVICE
EOF
    fi
fi

# 更新设备配置
if grep -q "^DEVICE=" .env 2>/dev/null; then
    sed -i "s/^DEVICE=.*/DEVICE=$DEVICE/" .env 2>/dev/null || true
else
    echo "DEVICE=$DEVICE" >> .env
fi
echo -e "${GREEN}✓ 环境配置完成 (DEVICE=$DEVICE)${NC}"

# 创建默认音色
if [ ! -f "presets/default/default.wav" ]; then
    mkdir -p presets/default
    if [ -f "scripts/create_default_voice.py" ]; then
        python3 scripts/create_default_voice.py 2>/dev/null || true
    fi
fi

# 启动服务
echo ""
echo -e "${BLUE}[7/7]${NC} 启动服务..."

# 停止已有服务
if [ -f "logs/app.pid" ]; then
    OLD_PID=$(cat logs/app.pid)
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        kill "$OLD_PID" 2>/dev/null || true
        sleep 2
    fi
fi

# 释放端口
if command -v fuser &> /dev/null; then
    fuser -k $BACKEND_PORT/tcp 2>/dev/null || true
    sleep 1
fi

# 启动
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT > logs/app.log 2>&1 &
echo $! > logs/app.pid

echo "等待服务启动..."
sleep 5

# 验证
if ps -p $(cat logs/app.pid) > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    部署成功!                               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  API 地址:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
    echo -e "  API 文档:  ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
    echo -e "  设备模式:  $DEVICE"
    echo -e "  进程 ID:   $(cat logs/app.pid)"
    echo ""

    # 公网 IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")
    if [ -n "$PUBLIC_IP" ]; then
        echo -e "  公网访问:  ${BLUE}http://$PUBLIC_IP:$BACKEND_PORT${NC}"
        echo ""
    fi

    echo "  常用命令:"
    echo "    查看日志: tail -f logs/app.log"
    echo "    停止服务: kill \$(cat logs/app.pid)"
    echo ""
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    echo ""
    echo "错误日志:"
    tail -20 logs/app.log
    exit 1
fi
