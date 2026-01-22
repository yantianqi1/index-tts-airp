#!/bin/bash

# 直接部署脚本（不使用 Docker）
# 适用于无法使用 Docker 的环境

set -e

echo "================================"
echo "IndexTTS API 直接部署"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 Python
echo "检查 Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python3 未安装${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ $PYTHON_VERSION${NC}"

# 检查 pip
echo "检查 pip..."
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo -e "${RED}✗ pip 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip 已安装${NC}"

echo ""
echo "================================"
echo "准备环境"
echo "================================"

# 创建必要目录
echo "创建目录..."
mkdir -p weights presets logs
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 安装依赖
echo ""
echo "安装 Python 依赖..."
pip install -r requirements.txt -q
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 检查模型文件
echo ""
echo "检查模型文件..."
if [ -f "weights/config.yaml" ]; then
    echo -e "${GREEN}✓ 模型配置文件存在${NC}"
    MODEL_EXISTS=true
else
    echo -e "${YELLOW}⚠️  模型配置文件不存在${NC}"
    echo ""
    echo "正在下载模型（使用魔搭 ModelScope）..."
    
    # 安装 modelscope
    pip install modelscope -q
    
    # 下载模型
    python3 << 'PYEOF'
from modelscope import snapshot_download
import os

print("开始下载 IndexTTS-2 模型...")
try:
    model_dir = snapshot_download(
        'IndexTeam/Index-TTS-2',
        cache_dir='./weights'
    )
    print(f"✓ 模型已下载到: {model_dir}")
    
    # 如果模型在子目录，移动到 weights 根目录
    import shutil
    if os.path.exists(os.path.join(model_dir, 'config.yaml')):
        for item in os.listdir(model_dir):
            src = os.path.join(model_dir, item)
            dst = os.path.join('./weights', item)
            if os.path.isfile(src):
                shutil.copy2(src, dst)
            elif os.path.isdir(src):
                if os.path.exists(dst):
                    shutil.rmtree(dst)
                shutil.copytree(src, dst)
        print("✓ 模型文件已整理")
except Exception as e:
    print(f"✗ 下载失败: {e}")
    print("\n请手动下载模型:")
    print("  modelscope download --model IndexTeam/Index-TTS-2 --local_dir weights")
    exit(1)
PYEOF
    
    if [ -f "weights/config.yaml" ]; then
        echo -e "${GREEN}✓ 模型下载完成${NC}"
        MODEL_EXISTS=true
    else
        echo -e "${RED}✗ 模型下载失败${NC}"
        MODEL_EXISTS=false
    fi
fi

# 创建默认音色
echo ""
echo "检查音色文件..."
if [ -f "presets/default/default.wav" ]; then
    echo -e "${GREEN}✓ 默认音色存在${NC}"
else
    echo "创建默认音色..."
    python3 scripts/create_default_voice.py
    echo -e "${GREEN}✓ 默认音色创建完成${NC}"
fi

# 创建配置文件
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
    echo ""
    read -p "是否继续启动? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消启动"
        exit 0
    fi
fi

# 检查端口是否被占用
PORT=5050
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  端口 $PORT 已被占用${NC}"
    echo "正在停止旧进程..."
    kill $(lsof -t -i:$PORT) 2>/dev/null || true
    sleep 2
fi

echo ""
echo "启动 API 服务..."
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port $PORT > logs/app.log 2>&1 &
APP_PID=$!

echo "等待服务启动..."
sleep 5

# 检查服务是否运行
if ps -p $APP_PID > /dev/null; then
    echo -e "${GREEN}✓ 服务启动成功！${NC}"
    echo ""
    echo "================================"
    echo "服务信息"
    echo "================================"
    echo "进程 ID: $APP_PID"
    echo "API 地址: http://localhost:$PORT"
    echo "API 文档: http://localhost:$PORT/docs"
    echo ""
    echo "查看日志: tail -f logs/app.log"
    echo "停止服务: kill $APP_PID"
    echo ""
    
    # 保存 PID
    echo $APP_PID > logs/app.pid
    echo "PID 已保存到: logs/app.pid"
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
    echo "  tail -f logs/app.log"
    exit 1
fi

echo ""
echo "================================"
