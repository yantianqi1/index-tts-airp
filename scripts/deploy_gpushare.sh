#!/bin/bash

# 显卡租赁平台公网暴露部署脚本
# 适用于提供公网暴露服务的平台（如 GPUShare 等）
# 要求: 监听地址 0.0.0.0, 端口 8080

set -e

echo "================================"
echo "IndexTTS API 显卡平台部署"
echo "公网暴露模式 (端口 8080)"
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
echo "使用阿里云镜像源加速..."
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
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
    pip install modelscope -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
    
    # 下载模型
    python3 << 'PYEOF'
from modelscope import snapshot_download
import os
import shutil

print("开始下载 IndexTTS-2 模型...")
print("提示: 首次下载可能需要较长时间，请耐心等待...")
try:
    model_dir = snapshot_download(
        'IndexTeam/IndexTTS-2',
        cache_dir='./weights_cache'
    )
    print(f"✓ 模型已下载到: {model_dir}")
    
    os.makedirs('./weights', exist_ok=True)
    
    for item in os.listdir(model_dir):
        src = os.path.join(model_dir, item)
        dst = os.path.join('./weights', item)
        
        if os.path.exists(dst):
            if os.path.isdir(dst):
                shutil.rmtree(dst)
            else:
                os.remove(dst)
        
        if os.path.isfile(src):
            shutil.copy2(src, dst)
        elif os.path.isdir(src):
            shutil.copytree(src, dst)
    
    print("✓ 模型文件已整理到 weights/ 目录")
    
    if os.path.exists('./weights/config.yaml'):
        print("✓ 模型下载成功！")
    else:
        print("⚠️  未找到 config.yaml，可能需要手动检查")
        
except Exception as e:
    print(f"✗ 下载失败: {e}")
    print("\n请手动下载模型:")
    print("  modelscope download --model IndexTeam/IndexTTS-2 --local_dir weights")
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

# 创建配置文件（使用 8080 端口）
echo ""
echo "检查配置文件..."
if [ ! -f ".env" ]; then
    echo "创建 .env 文件（公网暴露模式）..."
    cat > .env << 'EOF'
# 服务配置 - 显卡平台公网暴露模式
APP_NAME=VoiceNexus
APP_VERSION=1.0.0
HOST=0.0.0.0
PORT=8080

# 路径配置
WEIGHTS_DIR=./weights
PRESETS_DIR=./presets
LOGS_DIR=./logs

# 模型配置
MODEL_NAME=indextts-2.0
DEVICE=cuda
DEFAULT_VOICE=default.wav

# 音频配置
SAMPLE_RATE=24000
MAX_TEXT_LENGTH=5000

# 上传配置
MAX_UPLOAD_SIZE=52428800

# 智能情感分析配置
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
SENTIMENT_LLM_API_KEY=your-api-key-here
SENTIMENT_LLM_MODEL=gemini-1.5-flash
SENTIMENT_LABELS=["happy","sad","angry","fear","surprise","neutral","default"]
SENTIMENT_TIMEOUT=10
EOF
    echo -e "${GREEN}✓ .env 文件创建完成（端口: 8080）${NC}"
else
    echo -e "${YELLOW}⚠️  .env 文件已存在${NC}"
    echo "检查端口配置..."
    
    # 检查并更新端口
    if grep -q "^PORT=" .env; then
        CURRENT_PORT=$(grep "^PORT=" .env | cut -d'=' -f2)
        if [ "$CURRENT_PORT" != "8080" ]; then
            echo "更新端口从 $CURRENT_PORT 到 8080..."
            sed -i.bak 's/^PORT=.*/PORT=8080/' .env
            echo -e "${GREEN}✓ 端口已更新为 8080${NC}"
        else
            echo -e "${GREEN}✓ 端口配置正确 (8080)${NC}"
        fi
    else
        echo "PORT=8080" >> .env
        echo -e "${GREEN}✓ 已添加端口配置 (8080)${NC}"
    fi
    
    # 检查并更新 HOST
    if grep -q "^HOST=" .env; then
        CURRENT_HOST=$(grep "^HOST=" .env | cut -d'=' -f2)
        if [ "$CURRENT_HOST" != "0.0.0.0" ]; then
            echo "更新监听地址从 $CURRENT_HOST 到 0.0.0.0..."
            sed -i.bak 's/^HOST=.*/HOST=0.0.0.0/' .env
            echo -e "${GREEN}✓ 监听地址已更新为 0.0.0.0${NC}"
        else
            echo -e "${GREEN}✓ 监听地址配置正确 (0.0.0.0)${NC}"
        fi
    else
        echo "HOST=0.0.0.0" >> .env
        echo -e "${GREEN}✓ 已添加监听地址配置 (0.0.0.0)${NC}"
    fi
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
PORT=8080
if command -v ss &> /dev/null; then
    # 使用 ss 命令检查
    if ss -anplt 2>/dev/null | grep -q ":$PORT "; then
        echo -e "${YELLOW}⚠️  端口 $PORT 已被占用${NC}"
        echo "正在停止旧进程..."
        OLD_PID=$(ss -anplt 2>/dev/null | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | head -1)
        if [ ! -z "$OLD_PID" ]; then
            kill $OLD_PID 2>/dev/null || true
            sleep 2
        fi
    fi
elif command -v lsof &> /dev/null; then
    # 使用 lsof 命令检查
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  端口 $PORT 已被占用${NC}"
        echo "正在停止旧进程..."
        kill $(lsof -t -i:$PORT) 2>/dev/null || true
        sleep 2
    fi
fi

echo ""
echo "启动 API 服务（公网暴露模式）..."
echo "监听地址: 0.0.0.0"
echo "监听端口: 8080"
echo ""

nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080 > logs/app.log 2>&1 &
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
    echo "监听地址: 0.0.0.0:8080"
    echo ""
    echo "本地访问:"
    echo "  API 地址: http://localhost:8080"
    echo "  API 文档: http://localhost:8080/docs"
    echo ""
    echo "公网访问:"
    echo "  请在显卡平台控制台查看公网地址"
    echo "  通常格式: https://your-instance.gpushare.com"
    echo ""
    echo "验证服务:"
    echo "  ss -anplt | grep 8080"
    echo "  curl http://localhost:8080"
    echo ""
    echo "查看日志: tail -f logs/app.log"
    echo "停止服务: ./scripts/stop_service.sh"
    echo ""
    
    # 保存 PID
    echo $APP_PID > logs/app.pid
    echo "PID 已保存到: logs/app.pid"
    echo ""
    
    # 验证端口监听
    echo "验证端口监听..."
    sleep 2
    if command -v ss &> /dev/null; then
        if ss -anplt 2>/dev/null | grep -q ":8080 "; then
            echo -e "${GREEN}✓ 端口 8080 正在监听${NC}"
            ss -anplt 2>/dev/null | grep ":8080 "
        else
            echo -e "${RED}✗ 端口 8080 未监听${NC}"
        fi
    elif command -v lsof &> /dev/null; then
        if lsof -Pi :8080 -sTCP:LISTEN >/dev/null 2>&1; then
            echo -e "${GREEN}✓ 端口 8080 正在监听${NC}"
            lsof -Pi :8080 -sTCP:LISTEN
        else
            echo -e "${RED}✗ 端口 8080 未监听${NC}"
        fi
    fi
    
    echo ""
    if [ "$MODEL_EXISTS" = true ]; then
        echo "测试 API:"
        echo "  curl http://localhost:8080"
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
echo "🎉 部署完成！"
echo "================================"
echo ""
echo "下一步:"
echo "1. 在显卡平台控制台找到公网访问地址"
echo "2. 访问 https://your-public-url/docs 查看 API 文档"
echo "3. 开始使用语音合成服务"
echo ""
