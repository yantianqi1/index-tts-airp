#!/bin/bash

# ============================================
# 前端控制脚本 - Voice Workshop Frontend
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 配置
DEV_PORT=3999
PROD_PORT=3999
LOG_FILE="$SCRIPT_DIR/frontend.log"
PID_FILE="$SCRIPT_DIR/.frontend.pid"

# ============================================
# 工具函数
# ============================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}        ${PURPLE}声音工坊 - 前端控制面板${NC}                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}        ${BLUE}Voice Workshop Frontend Controller${NC}             ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_menu() {
    echo -e "${YELLOW}请选择操作 (输入数字):${NC}"
    echo ""
    echo -e "  ${GREEN}1${NC}  启动开发服务器 (npm run dev)"
    echo -e "  ${GREEN}2${NC}  构建生产版本 (npm run build)"
    echo -e "  ${GREEN}3${NC}  启动生产服务器 (npm run start)"
    echo -e "  ${GREEN}4${NC}  代码检查 (npm run lint)"
    echo -e "  ${GREEN}5${NC}  安装依赖 (npm install)"
    echo -e "  ${GREEN}6${NC}  清理并重新安装依赖"
    echo -e "  ${GREEN}7${NC}  查看运行状态"
    echo -e "  ${GREEN}8${NC}  停止前端服务"
    echo -e "  ${GREEN}9${NC}  查看日志"
    echo -e "  ${GREEN}10${NC} 后台启动开发服务器"
    echo -e "  ${GREEN}11${NC} 后台启动生产服务器"
    echo -e "  ${GREEN}12${NC} 完整构建流程 (安装+构建+启动)"
    echo -e "  ${GREEN}13${NC} 更新依赖到最新版本"
    echo -e "  ${GREEN}14${NC} 检查依赖安全漏洞"
    echo -e "  ${GREEN}15${NC} 清理缓存 (.next)"
    echo -e "  ${GREEN}16${NC} 显示项目信息"
    echo -e "  ${GREEN}0${NC}  退出"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查 node 和 npm
check_prerequisites() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
}

# 检查 node_modules
check_node_modules() {
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules 不存在，正在安装依赖..."
        npm install
    fi
}

# 获取进程 PID
get_frontend_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        # 尝试通过端口查找
        lsof -ti:$DEV_PORT 2>/dev/null || lsof -ti:$PROD_PORT 2>/dev/null
    fi
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# ============================================
# 功能函数
# ============================================

# 1. 启动开发服务器
start_dev() {
    print_info "启动开发服务器..."
    check_node_modules

    if check_port $DEV_PORT; then
        print_warning "端口 $DEV_PORT 已被占用"
        read -p "是否强制停止现有服务? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            stop_frontend
        else
            return
        fi
    fi

    echo ""
    print_info "开发服务器地址: http://localhost:$DEV_PORT"
    print_info "按 Ctrl+C 停止服务器"
    echo ""
    npm run dev
}

# 2. 构建生产版本
build_production() {
    print_info "开始构建生产版本..."
    check_node_modules

    echo ""
    npm run build

    if [ $? -eq 0 ]; then
        print_success "构建完成!"
        print_info "构建输出目录: .next/"
    else
        print_error "构建失败"
    fi
}

# 3. 启动生产服务器
start_production() {
    print_info "启动生产服务器..."

    if [ ! -d ".next" ]; then
        print_warning ".next 目录不存在，需要先构建"
        read -p "是否现在构建? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            build_production
        else
            return
        fi
    fi

    if check_port $PROD_PORT; then
        print_warning "端口 $PROD_PORT 已被占用"
        read -p "是否强制停止现有服务? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            stop_frontend
        else
            return
        fi
    fi

    echo ""
    print_info "生产服务器地址: http://localhost:$PROD_PORT"
    print_info "按 Ctrl+C 停止服务器"
    echo ""
    npm run start
}

# 4. 代码检查
run_lint() {
    print_info "运行代码检查..."
    check_node_modules
    echo ""
    npm run lint

    if [ $? -eq 0 ]; then
        print_success "代码检查通过!"
    else
        print_warning "发现代码问题，请查看上方输出"
    fi
}

# 5. 安装依赖
install_deps() {
    print_info "安装依赖..."
    echo ""
    npm install

    if [ $? -eq 0 ]; then
        print_success "依赖安装完成!"
    else
        print_error "依赖安装失败"
    fi
}

# 6. 清理并重新安装
clean_install() {
    print_info "清理并重新安装依赖..."

    if [ -d "node_modules" ]; then
        print_info "删除 node_modules..."
        rm -rf node_modules
    fi

    if [ -f "package-lock.json" ]; then
        print_info "删除 package-lock.json..."
        rm -f package-lock.json
    fi

    echo ""
    npm install

    if [ $? -eq 0 ]; then
        print_success "清理并重新安装完成!"
    else
        print_error "安装失败"
    fi
}

# 7. 查看运行状态
check_status() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}          前端服务状态${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    # 检查开发端口
    if check_port $DEV_PORT; then
        local pid=$(lsof -ti:$DEV_PORT)
        print_success "端口 $DEV_PORT: 运行中 (PID: $pid)"
    else
        print_info "端口 $DEV_PORT: 未运行"
    fi

    # Node.js 版本
    echo ""
    print_info "Node.js 版本: $(node -v)"
    print_info "npm 版本: $(npm -v)"

    # 项目信息
    if [ -f "package.json" ]; then
        local name=$(node -p "require('./package.json').name" 2>/dev/null)
        local version=$(node -p "require('./package.json').version" 2>/dev/null)
        print_info "项目名称: $name"
        print_info "项目版本: $version"
    fi

    # 检查 .next 目录
    echo ""
    if [ -d ".next" ]; then
        local build_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" .next 2>/dev/null || stat -c "%y" .next 2>/dev/null | cut -d'.' -f1)
        print_success "生产构建: 已构建 ($build_time)"
    else
        print_warning "生产构建: 未构建"
    fi

    # 检查 node_modules
    if [ -d "node_modules" ]; then
        local dep_count=$(ls -1 node_modules | wc -l | tr -d ' ')
        print_success "依赖状态: 已安装 ($dep_count 个包)"
    else
        print_warning "依赖状态: 未安装"
    fi

    echo ""
}

# 8. 停止前端服务
stop_frontend() {
    print_info "停止前端服务..."

    local stopped=false

    # 通过 PID 文件停止
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            rm -f "$PID_FILE"
            print_success "已停止进程 (PID: $pid)"
            stopped=true
        fi
    fi

    # 通过端口停止
    for port in $DEV_PORT $PROD_PORT; do
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs kill -9 2>/dev/null
            print_success "已停止端口 $port 上的服务"
            stopped=true
        fi
    done

    if [ "$stopped" = false ]; then
        print_info "没有运行中的前端服务"
    fi
}

# 9. 查看日志
view_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_info "显示最近 50 行日志..."
        echo ""
        tail -50 "$LOG_FILE"
    else
        print_warning "日志文件不存在"
        print_info "后台运行时才会生成日志文件"
    fi
}

# 10. 后台启动开发服务器
start_dev_background() {
    print_info "后台启动开发服务器..."
    check_node_modules

    if check_port $DEV_PORT; then
        print_warning "端口 $DEV_PORT 已被占用"
        return
    fi

    nohup npm run dev > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"

    sleep 2

    if kill -0 $pid 2>/dev/null; then
        print_success "开发服务器已在后台启动 (PID: $pid)"
        print_info "地址: http://localhost:$DEV_PORT"
        print_info "日志: $LOG_FILE"
    else
        print_error "启动失败，请查看日志"
    fi
}

# 11. 后台启动生产服务器
start_prod_background() {
    print_info "后台启动生产服务器..."

    if [ ! -d ".next" ]; then
        print_warning ".next 目录不存在，需要先构建"
        return
    fi

    if check_port $PROD_PORT; then
        print_warning "端口 $PROD_PORT 已被占用"
        return
    fi

    nohup npm run start > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"

    sleep 2

    if kill -0 $pid 2>/dev/null; then
        print_success "生产服务器已在后台启动 (PID: $pid)"
        print_info "地址: http://localhost:$PROD_PORT"
        print_info "日志: $LOG_FILE"
    else
        print_error "启动失败，请查看日志"
    fi
}

# 12. 完整构建流程
full_build() {
    print_info "开始完整构建流程..."
    echo ""

    echo -e "${PURPLE}[1/3] 安装依赖${NC}"
    npm install
    if [ $? -ne 0 ]; then
        print_error "依赖安装失败，终止流程"
        return
    fi
    print_success "依赖安装完成"
    echo ""

    echo -e "${PURPLE}[2/3] 构建生产版本${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        print_error "构建失败，终止流程"
        return
    fi
    print_success "构建完成"
    echo ""

    echo -e "${PURPLE}[3/3] 启动生产服务器${NC}"
    read -p "是否启动生产服务器? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        npm run start
    else
        print_info "跳过启动服务器"
        print_success "完整构建流程完成!"
    fi
}

# 13. 更新依赖
update_deps() {
    print_info "检查依赖更新..."
    echo ""

    # 检查是否有 npm-check-updates
    if command -v npx &> /dev/null; then
        echo -e "${YELLOW}可更新的依赖:${NC}"
        npx npm-check-updates
        echo ""
        read -p "是否更新所有依赖到最新版本? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            npx npm-check-updates -u
            npm install
            print_success "依赖已更新!"
        fi
    else
        npm outdated
        print_info "使用 'npm update' 更新依赖"
    fi
}

# 14. 安全检查
security_check() {
    print_info "检查依赖安全漏洞..."
    echo ""
    npm audit
    echo ""

    read -p "是否尝试自动修复? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        npm audit fix
    fi
}

# 15. 清理缓存
clean_cache() {
    print_info "清理缓存..."

    if [ -d ".next" ]; then
        rm -rf .next
        print_success "已删除 .next 目录"
    fi

    if [ -d ".turbo" ]; then
        rm -rf .turbo
        print_success "已删除 .turbo 目录"
    fi

    # 清理 npm 缓存
    read -p "是否清理 npm 缓存? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        npm cache clean --force
        print_success "npm 缓存已清理"
    fi

    print_success "缓存清理完成!"
}

# 16. 显示项目信息
show_project_info() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}          项目信息${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    if [ -f "package.json" ]; then
        echo -e "${YELLOW}package.json:${NC}"
        cat package.json
    fi

    echo ""
    echo -e "${YELLOW}目录结构:${NC}"
    if command -v tree &> /dev/null; then
        tree -L 2 -I 'node_modules|.next' --dirsfirst
    else
        ls -la
    fi

    echo ""
    echo -e "${YELLOW}磁盘占用:${NC}"
    if [ -d "node_modules" ]; then
        du -sh node_modules 2>/dev/null | awk '{print "node_modules: " $1}'
    fi
    if [ -d ".next" ]; then
        du -sh .next 2>/dev/null | awk '{print ".next: " $1}'
    fi
}

# ============================================
# 主程序
# ============================================

main() {
    check_prerequisites

    # 如果有参数，直接执行对应功能
    if [ -n "$1" ]; then
        case $1 in
            1|dev)        start_dev ;;
            2|build)      build_production ;;
            3|start)      start_production ;;
            4|lint)       run_lint ;;
            5|install)    install_deps ;;
            6|reinstall)  clean_install ;;
            7|status)     check_status ;;
            8|stop)       stop_frontend ;;
            9|logs)       view_logs ;;
            10|dev-bg)    start_dev_background ;;
            11|start-bg)  start_prod_background ;;
            12|full)      full_build ;;
            13|update)    update_deps ;;
            14|audit)     security_check ;;
            15|clean)     clean_cache ;;
            16|info)      show_project_info ;;
            0|exit|quit)  exit 0 ;;
            *)
                print_error "未知选项: $1"
                echo "使用方法: $0 [选项]"
                echo "选项: 1-16 或 dev|build|start|lint|install|reinstall|status|stop|logs|dev-bg|start-bg|full|update|audit|clean|info"
                exit 1
                ;;
        esac
        exit 0
    fi

    # 交互式菜单
    while true; do
        print_header
        print_menu

        read -p "请输入选项: " choice
        echo ""

        case $choice in
            1)  start_dev ;;
            2)  build_production ;;
            3)  start_production ;;
            4)  run_lint ;;
            5)  install_deps ;;
            6)  clean_install ;;
            7)  check_status ;;
            8)  stop_frontend ;;
            9)  view_logs ;;
            10) start_dev_background ;;
            11) start_prod_background ;;
            12) full_build ;;
            13) update_deps ;;
            14) security_check ;;
            15) clean_cache ;;
            16) show_project_info ;;
            0)
                print_info "再见!"
                exit 0
                ;;
            *)
                print_error "无效选项，请输入 0-16"
                ;;
        esac

        echo ""
        read -p "按 Enter 键继续..."
    done
}

main "$@"
