#!/bin/bash

# ==========================================
#  GPU 服务器一键部署脚本
#  适用于全新 GPU 服务器的快速部署
#  自动安装依赖、下载模型、启动服务
# ==========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_PORT=${BACKEND_PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-3999}
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/app.pid"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# 打印横幅
print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           IndexTTS GPU 服务器一键部署脚本                   ║${NC}"
    echo -e "${CYAN}║                                                            ║${NC}"
    echo -e "${CYAN}║   功能: 自动安装依赖 -> 下载模型 -> 配置环境 -> 启动服务     ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_warn "检测到 root 用户，建议使用普通用户执行"
    fi
}

# 检测 GPU 环境
detect_gpu() {
    log_step "检测 GPU 环境..."

    if command -v nvidia-smi &> /dev/null; then
        GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || echo "")
        if [ -n "$GPU_INFO" ]; then
            log_success "检测到 NVIDIA GPU: $GPU_INFO"
            export DEVICE="cuda"
            return 0
        fi
    fi

    # 检查 Intel XPU
    if python3 -c "import intel_extension_for_pytorch; import torch; print(torch.xpu.is_available())" 2>/dev/null | grep -q "True"; then
        log_success "检测到 Intel XPU"
        export DEVICE="xpu"
        return 0
    fi

    # 检查 Apple MPS
    if python3 -c "import torch; print(torch.backends.mps.is_available())" 2>/dev/null | grep -q "True"; then
        log_success "检测到 Apple MPS"
        export DEVICE="mps"
        return 0
    fi

    log_warn "未检测到 GPU，将使用 CPU 模式（速度较慢）"
    export DEVICE="cpu"
    return 0
}

# 检查系统依赖
check_system_deps() {
    log_step "检查系统依赖..."

    local missing_deps=()

    # Python 3.10+
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    else
        PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        log_info "Python 版本: $PY_VERSION"

        # 检查版本是否 >= 3.10
        if python3 -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
            log_success "Python 版本符合要求 (>= 3.10)"
        else
            log_warn "Python 版本低于 3.10，建议升级"
        fi
    fi

    # pip
    if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
        missing_deps+=("pip")
    else
        log_success "pip 已安装"
    fi

    # git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    else
        log_success "git 已安装"
    fi

    # git-lfs
    if ! command -v git-lfs &> /dev/null; then
        log_warn "git-lfs 未安装（可选，用于 Git 方式下载模型）"
    else
        log_success "git-lfs 已安装"
    fi

    # ffmpeg
    if ! command -v ffmpeg &> /dev/null; then
        log_warn "ffmpeg 未安装（可选，用于音频格式转换）"
    else
        log_success "ffmpeg 已安装"
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少必要依赖: ${missing_deps[*]}"
        echo ""
        echo "请先安装以下依赖："
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install -y python3 python3-pip git"
        echo "  CentOS/RHEL:   sudo yum install -y python3 python3-pip git"
        exit 1
    fi
}

# 创建虚拟环境（可选）
setup_venv() {
    log_step "配置 Python 环境..."

    # 如果已在虚拟环境中，跳过
    if [ -n "$VIRTUAL_ENV" ]; then
        log_info "已在虚拟环境中: $VIRTUAL_ENV"
        return 0
    fi

    # 询问是否创建虚拟环境
    echo ""
    read -p "是否创建 Python 虚拟环境? (推荐) [Y/n] " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        VENV_DIR="$PROJECT_DIR/venv"

        if [ -d "$VENV_DIR" ]; then
            log_info "虚拟环境已存在，激活中..."
        else
            log_info "创建虚拟环境..."
            python3 -m venv "$VENV_DIR"
        fi

        source "$VENV_DIR/bin/activate"
        log_success "虚拟环境已激活: $VENV_DIR"

        # 升级 pip
        pip install --upgrade pip -q
    else
        log_info "跳过虚拟环境创建"
    fi
}

# 安装 Python 依赖
install_python_deps() {
    log_step "安装 Python 依赖..."

    cd "$PROJECT_DIR"

    # 使用国内镜像源
    PIP_MIRROR="https://mirrors.aliyun.com/pypi/simple/"

    log_info "使用镜像源: $PIP_MIRROR"
    log_info "安装依赖中，请耐心等待..."

    pip install -r requirements.txt \
        -i "$PIP_MIRROR" \
        --trusted-host mirrors.aliyun.com \
        --progress-bar on \
        2>&1 | while read line; do
            # 只显示安装进度，减少输出
            if [[ "$line" == *"Successfully installed"* ]] || [[ "$line" == *"Requirement already satisfied"* ]]; then
                echo -ne "\r${GREEN}[OK]${NC} ${line:0:60}...                    "
            fi
        done
    echo ""

    log_success "Python 依赖安装完成"
}

# 下载模型
download_model() {
    log_step "检查/下载 IndexTTS-2 模型..."

    cd "$PROJECT_DIR"
    mkdir -p weights

    # 检查模型是否已存在
    if [ -f "weights/config.yaml" ]; then
        log_success "模型已存在，跳过下载"
        return 0
    fi

    log_info "模型不存在，开始下载..."
    log_info "模型大小约 3-5GB，请耐心等待..."
    echo ""

    # 安装 modelscope（如果未安装）
    if ! python3 -c "import modelscope" 2>/dev/null; then
        log_info "安装 modelscope..."
        pip install modelscope -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -q
    fi

    # 使用 Python 脚本下载（更可靠）
    python3 << 'PYEOF'
import os
import sys
import shutil

try:
    from modelscope import snapshot_download

    print("开始下载 IndexTTS-2 模型...")
    print("提示: 首次下载需要较长时间，请耐心等待...")
    print("")

    # 下载模型
    model_dir = snapshot_download(
        'IndexTeam/IndexTTS-2',
        cache_dir='./weights_cache'
    )

    print(f"\n模型已下载到: {model_dir}")

    # 确保 weights 目录存在
    os.makedirs('./weights', exist_ok=True)

    # 复制模型文件到 weights 目录
    print("整理模型文件...")
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

    # 验证
    if os.path.exists('./weights/config.yaml'):
        print("\n✓ 模型下载成功！")
    else:
        print("\n⚠️  未找到 config.yaml，请检查下载是否完整")
        sys.exit(1)

except Exception as e:
    print(f"\n✗ 下载失败: {e}")
    print("\n备选下载方式:")
    print("  方式 1 (命令行):")
    print("    modelscope download --model IndexTeam/IndexTTS-2 --local_dir weights")
    print("")
    print("  方式 2 (Git):")
    print("    git lfs install")
    print("    git clone https://www.modelscope.cn/IndexTeam/IndexTTS-2.git weights")
    sys.exit(1)
PYEOF

    if [ $? -eq 0 ]; then
        log_success "模型下载完成"

        # 清理缓存（可选）
        read -p "是否清理下载缓存以节省空间? [y/N] " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf weights_cache
            log_info "缓存已清理"
        fi
    else
        log_error "模型下载失败"
        return 1
    fi
}

# 创建默认音色
setup_default_voice() {
    log_step "检查默认音色..."

    cd "$PROJECT_DIR"
    mkdir -p presets/default

    if [ -f "presets/default/default.wav" ]; then
        log_success "默认音色已存在"
        return 0
    fi

    log_info "创建默认音色..."

    if [ -f "scripts/create_default_voice.py" ]; then
        python3 scripts/create_default_voice.py
        log_success "默认音色创建完成"
    else
        log_warn "未找到音色创建脚本，请手动添加音色文件到 presets/default/default.wav"
    fi
}

# 配置环境变量
setup_env() {
    log_step "配置环境变量..."

    cd "$PROJECT_DIR"

    if [ -f ".env" ]; then
        log_info ".env 文件已存在"

        # 更新设备配置
        if grep -q "^DEVICE=" .env; then
            sed -i "s/^DEVICE=.*/DEVICE=$DEVICE/" .env
        else
            echo "DEVICE=$DEVICE" >> .env
        fi

        log_success "设备配置已更新: DEVICE=$DEVICE"
    else
        if [ -f ".env.example" ]; then
            cp .env.example .env
            sed -i "s/^DEVICE=.*/DEVICE=$DEVICE/" .env 2>/dev/null || echo "DEVICE=$DEVICE" >> .env
            log_success ".env 文件创建完成"
        else
            log_warn ".env.example 不存在，创建基础配置..."
            cat > .env << EOF
# 服务配置
BACKEND_PORT=$BACKEND_PORT
HOST=0.0.0.0

# 路径配置
WEIGHTS_DIR=./weights
PRESETS_DIR=./presets
CHAR_DIR=./char
LOGS_DIR=./logs
GENERATED_AUDIO_DIR=./generated_audio

# 设备配置
DEVICE=$DEVICE

# 模型配置
MODEL_NAME=indextts-2.0
DEFAULT_VOICE=default.wav
EOF
            log_success ".env 文件创建完成"
        fi
    fi
}

# 创建必要目录
create_directories() {
    log_step "创建必要目录..."

    cd "$PROJECT_DIR"

    mkdir -p weights presets logs generated_audio char

    log_success "目录创建完成"
}

# 停止已有服务
stop_existing_service() {
    log_step "检查并停止已有服务..."

    # 通过 PID 文件停止
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log_info "停止旧进程 (PID: $OLD_PID)..."
            kill "$OLD_PID" 2>/dev/null || true
            sleep 2
        fi
        rm -f "$PID_FILE"
    fi

    # 通过端口停止
    if command -v lsof &> /dev/null; then
        PID=$(lsof -t -i:$BACKEND_PORT 2>/dev/null || true)
        if [ -n "$PID" ]; then
            log_info "端口 $BACKEND_PORT 被占用，停止进程 (PID: $PID)..."
            kill $PID 2>/dev/null || true
            sleep 2
        fi
    elif command -v fuser &> /dev/null; then
        fuser -k $BACKEND_PORT/tcp 2>/dev/null || true
        sleep 2
    fi

    log_success "服务检查完成"
}

# 启动后端服务
start_backend() {
    log_step "启动后端服务..."

    cd "$PROJECT_DIR"

    # 确保日志目录存在
    mkdir -p "$LOG_DIR"

    # 启动服务
    nohup python3 -m uvicorn app.main:app \
        --host 0.0.0.0 \
        --port $BACKEND_PORT \
        > "$LOG_DIR/app.log" 2>&1 &

    APP_PID=$!
    echo $APP_PID > "$PID_FILE"

    log_info "等待服务启动..."
    sleep 5

    # 验证服务
    if ps -p $APP_PID > /dev/null 2>&1; then
        log_success "后端服务启动成功"
        return 0
    else
        log_error "后端服务启动失败"
        echo ""
        echo "查看错误日志:"
        tail -20 "$LOG_DIR/app.log"
        return 1
    fi
}

# 健康检查
health_check() {
    log_step "执行健康检查..."

    local max_retries=10
    local retry=0

    while [ $retry -lt $max_retries ]; do
        if curl -s "http://localhost:$BACKEND_PORT/" > /dev/null 2>&1; then
            log_success "API 服务响应正常"
            return 0
        fi
        retry=$((retry + 1))
        log_info "等待服务就绪... ($retry/$max_retries)"
        sleep 2
    done

    log_warn "健康检查超时，但服务可能仍在启动中"
    return 0
}

# 打印部署结果
print_result() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    部署完成                                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}API 地址:${NC}     http://localhost:$BACKEND_PORT"
    echo -e "  ${CYAN}API 文档:${NC}     http://localhost:$BACKEND_PORT/docs"
    echo -e "  ${CYAN}设备模式:${NC}     $DEVICE"
    echo -e "  ${CYAN}进程 ID:${NC}      $(cat $PID_FILE 2>/dev/null || echo '未知')"
    echo ""
    echo -e "  ${YELLOW}常用命令:${NC}"
    echo "    查看日志:    tail -f $LOG_DIR/app.log"
    echo "    停止服务:    kill \$(cat $PID_FILE)"
    echo "    重启服务:    $0 --restart"
    echo ""

    # 获取公网 IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")
    if [ -n "$PUBLIC_IP" ]; then
        echo -e "  ${CYAN}公网访问:${NC}     http://$PUBLIC_IP:$BACKEND_PORT"
        echo ""
    fi

    echo -e "  ${YELLOW}测试 API:${NC}"
    echo "    curl http://localhost:$BACKEND_PORT/"
    echo "    curl http://localhost:$BACKEND_PORT/v1/voices"
    echo ""
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h       显示帮助信息"
    echo "  --restart        重启服务（不重新安装依赖）"
    echo "  --stop           停止服务"
    echo "  --status         查看服务状态"
    echo "  --download-only  仅下载模型"
    echo "  --no-venv        不创建虚拟环境"
    echo "  --port PORT      指定后端端口（默认: 8080）"
    echo ""
    echo "环境变量:"
    echo "  BACKEND_PORT     后端端口（默认: 8080）"
    echo "  DEVICE           运行设备（auto/cuda/cpu/mps/xpu）"
    echo ""
}

# 查看状态
show_status() {
    echo ""
    echo "=== IndexTTS 服务状态 ==="
    echo ""

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "状态: ${GREEN}运行中${NC}"
            echo "PID:  $PID"

            # 检查 API 响应
            if curl -s "http://localhost:$BACKEND_PORT/" > /dev/null 2>&1; then
                echo -e "API:  ${GREEN}正常${NC}"
            else
                echo -e "API:  ${YELLOW}无响应${NC}"
            fi
        else
            echo -e "状态: ${RED}已停止${NC}"
        fi
    else
        echo -e "状态: ${YELLOW}未运行${NC}"
    fi

    echo ""
    echo "端口: $BACKEND_PORT"
    echo "日志: $LOG_DIR/app.log"
    echo ""
}

# 主函数
main() {
    # 解析参数
    SKIP_VENV=false
    ACTION="deploy"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --restart)
                ACTION="restart"
                ;;
            --stop)
                ACTION="stop"
                ;;
            --status)
                ACTION="status"
                ;;
            --download-only)
                ACTION="download"
                ;;
            --no-venv)
                SKIP_VENV=true
                ;;
            --port)
                BACKEND_PORT="$2"
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done

    # 切换到项目目录
    cd "$PROJECT_DIR"

    case $ACTION in
        stop)
            stop_existing_service
            log_success "服务已停止"
            exit 0
            ;;
        status)
            show_status
            exit 0
            ;;
        download)
            print_banner
            check_system_deps
            download_model
            exit 0
            ;;
        restart)
            print_banner
            stop_existing_service
            start_backend
            health_check
            print_result
            exit 0
            ;;
        deploy)
            print_banner
            check_root
            check_system_deps
            detect_gpu

            if [ "$SKIP_VENV" = false ]; then
                setup_venv
            fi

            install_python_deps
            create_directories
            download_model
            setup_default_voice
            setup_env
            stop_existing_service
            start_backend
            health_check
            print_result
            ;;
    esac
}

# 执行
main "$@"
