#!/bin/bash

# VoiceNexus 快速启动脚本
# 用于检查环境并启动服务

set -e  # 遇到错误立即退出

echo "================================"
echo "VoiceNexus 快速启动"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
echo "检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker 已安装${NC}"

# 检查 Docker Compose
echo "检查 Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD=(docker-compose)
elif docker compose version &> /dev/null; then
    COMPOSE_CMD=(docker compose)
else
    echo -e "${RED}✗ Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose 已安装${NC}"

# 检查 NVIDIA Docker（可选）
echo "检查 NVIDIA Docker Runtime..."
if docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
    echo -e "${GREEN}✓ NVIDIA Docker Runtime 可用${NC}"
    USE_GPU=true
else
    echo -e "${YELLOW}⚠️  NVIDIA Docker Runtime 不可用，将使用 CPU 模式${NC}"
    USE_GPU=false
fi

echo ""
echo "================================"
echo "准备环境"
echo "================================"

# 创建必要目录
echo "创建目录..."
mkdir -p weights presets logs
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 检查模型文件
echo ""
echo "检查模型文件..."
if [ -f "weights/config.yaml" ]; then
    echo -e "${GREEN}✓ 模型配置文件存在${NC}"
    MODEL_EXISTS=true
else
    echo -e "${YELLOW}⚠️  模型配置文件不存在${NC}"
    echo ""
    echo "请下载 IndexTTS2 模型:"
    echo "  方式 1 (HuggingFace):"
    echo "    huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights"
    echo ""
    echo "  方式 2 (ModelScope，国内推荐):"
    echo "    modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights"
    echo ""
    MODEL_EXISTS=false
fi

# 检查音色文件
echo ""
echo "检查音色文件..."
if [ -f "presets/default/default.wav" ]; then
    echo -e "${GREEN}✓ 默认音色存在${NC}"
else
    echo -e "${YELLOW}⚠️  默认音色不存在，正在创建...${NC}"
    if command -v python3 &> /dev/null; then
        python3 scripts/create_default_voice.py || echo -e "${YELLOW}⚠️  跳过默认音色创建（将在容器内自动创建）${NC}"
    else
        echo -e "${YELLOW}⚠️  Python3 未安装，将在容器内自动创建默认音色${NC}"
    fi
fi

# 检查 .env 文件
echo ""
echo "检查配置文件..."
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env 文件创建完成${NC}"
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi

echo ""
echo "================================"
echo "启动服务"
echo "================================"

if [ "$MODEL_EXISTS" = false ]; then
    echo -e "${YELLOW}⚠️  模型文件不存在，服务将以 Mock 模式运行${NC}"
    echo "这仅用于测试 API 接口，不会生成真实语音"
    echo ""
    read -p "是否继续启动? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消启动"
        exit 0
    fi
fi

echo ""
echo "构建并启动 Docker 容器..."
"${COMPOSE_CMD[@]}" up -d --build

echo ""
echo "等待服务启动..."
sleep 5

# 检查服务状态
if "${COMPOSE_CMD[@]}" ps | grep -q "Up"; then
    echo -e "${GREEN}✓ 服务启动成功！${NC}"
    echo ""
    echo "================================"
    echo "服务信息"
    echo "================================"
    echo "API 地址: http://localhost:8080"
    echo "API 文档: http://localhost:8080/docs"
    echo ""
    echo "查看日志: ${COMPOSE_CMD[*]} logs -f"
    echo "停止服务: ${COMPOSE_CMD[*]} down"
    echo ""
    
    if [ "$MODEL_EXISTS" = true ]; then
        echo "测试 API:"
        echo "  python test_api.py"
    else
        echo -e "${YELLOW}提示: 当前为 Mock 模式，请下载模型后重启服务${NC}"
    fi
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    echo ""
    echo "查看错误日志:"
    echo "  ${COMPOSE_CMD[*]} logs"
    exit 1
fi

echo ""
echo "================================"
