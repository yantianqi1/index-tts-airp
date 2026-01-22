#!/bin/bash

# 统一脚本入口（数字菜单）

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"

pause() {
    read -r -p "按回车继续..." _ </dev/tty
}

run_script() {
    local script_path="$1"
    if [ ! -f "$script_path" ]; then
        echo "✗ 未找到脚本: $script_path"
        return 1
    fi
    echo ""
    echo "→ 运行: $script_path"
    echo ""
    (cd "$ROOT_DIR" && bash "$script_path")
}

cloudflare_menu() {
    while true; do
        echo ""
        echo "====== 公网/隧道 > Cloudflare ======"
        echo "1) quick_tunnel.sh — 临时 Cloudflare 隧道（无需域名）"
        echo "2) setup_cloudflare_tunnel.sh — 创建并配置 Cloudflare Tunnel"
        echo "3) bind_domain.sh — 将 Tunnel 绑定到自定义域名"
        echo "0) 返回上级"
        read -r -p "请选择: " choice </dev/tty
        case "${choice:-}" in
            1) run_script "$SCRIPTS_DIR/quick_tunnel.sh"; pause ;;
            2) run_script "$SCRIPTS_DIR/setup_cloudflare_tunnel.sh"; pause ;;
            3) run_script "$SCRIPTS_DIR/bind_domain.sh"; pause ;;
            0) return ;;
            *) echo "无效选择"; pause ;;
        esac
    done
}

tunnel_menu() {
    while true; do
        echo ""
        echo "========== 公网/隧道 =========="
        echo "1) Cloudflare 相关"
        echo "2) setup_frp.sh — 配置 FRP 内网穿透（需自有服务器）"
        echo "3) setup_natapp.sh — 配置 NATAPP（国内免费方案）"
        echo "0) 返回上级"
        read -r -p "请选择: " choice </dev/tty
        case "${choice:-}" in
            1) cloudflare_menu ;;
            2) run_script "$SCRIPTS_DIR/setup_frp.sh"; pause ;;
            3) run_script "$SCRIPTS_DIR/setup_natapp.sh"; pause ;;
            0) return ;;
            *) echo "无效选择"; pause ;;
        esac
    done
}

model_menu() {
    while true; do
        echo ""
        echo "========== 模型/数据 =========="
        echo "1) setup.sh — 初始化目录/默认音色/.env"
        echo "2) setup_model.sh — 拷贝配置并检查模型与音色"
        echo "3) download_model_modelscope.sh — 用 ModelScope 下载模型"
        echo "0) 返回上级"
        read -r -p "请选择: " choice </dev/tty
        case "${choice:-}" in
            1) run_script "$SCRIPTS_DIR/setup.sh"; pause ;;
            2) run_script "$SCRIPTS_DIR/setup_model.sh"; pause ;;
            3) run_script "$SCRIPTS_DIR/download_model_modelscope.sh"; pause ;;
            0) return ;;
            *) echo "无效选择"; pause ;;
        esac
    done
}

deploy_menu() {
    while true; do
        echo ""
        echo "=========== 部署/运行 ==========="
        echo "1) quick_start.sh — Docker Compose 一键构建/启动"
        echo "2) deploy_direct.sh — 直装依赖并启动后端（非 Docker）"
        echo "3) deploy_gpushare.sh — GPU 平台公网直出（单 8080）"
        echo "4) deploy_gpushare_single_port.sh — GPU 单端口 Nginx（systemd）"
        echo "5) deploy_gpushare_no_systemd.sh — GPU 单端口 Nginx（无 systemd）"
        echo "6) deploy_single_port.sh — 通用单端口 Nginx 反代"
        echo "0) 返回上级"
        read -r -p "请选择: " choice </dev/tty
        case "${choice:-}" in
            1) run_script "$SCRIPTS_DIR/quick_start.sh"; pause ;;
            2) run_script "$SCRIPTS_DIR/deploy_direct.sh"; pause ;;
            3) run_script "$SCRIPTS_DIR/deploy_gpushare.sh"; pause ;;
            4) run_script "$SCRIPTS_DIR/deploy_gpushare_single_port.sh"; pause ;;
            5) run_script "$SCRIPTS_DIR/deploy_gpushare_no_systemd.sh"; pause ;;
            6) run_script "$SCRIPTS_DIR/deploy_single_port.sh"; pause ;;
            0) return ;;
            *) echo "无效选择"; pause ;;
        esac
    done
}

start_menu() {
    while true; do
        echo ""
        echo "=========== 启动/停止 ==========="
        echo "1) restart_and_watch.sh — 重启 Nginx/后端/前端并实时看后端日志"
        echo "2) start_all.sh — 启动前端+后端（不启动 Nginx）"
        echo "3) stop_all.sh — 停止 start_all.sh 启动的前后端"
        echo "4) scripts/start_service.sh — 仅启动后端 uvicorn"
        echo "5) scripts/stop_service.sh — 仅停止后端（PID/端口）"
        echo "6) scripts/stop_all_services.sh — 停止后端/前端/Nginx（systemd）"
        echo "7) scripts/stop_all_services_no_systemd.sh — 停止后端/前端/Nginx（无 systemd）"
        echo "0) 返回上级"
        read -r -p "请选择: " choice </dev/tty
        case "${choice:-}" in
            1) run_script "$ROOT_DIR/restart_and_watch.sh"; pause ;;
            2) run_script "$ROOT_DIR/start_all.sh"; pause ;;
            3) run_script "$ROOT_DIR/stop_all.sh"; pause ;;
            4) run_script "$SCRIPTS_DIR/start_service.sh"; pause ;;
            5) run_script "$SCRIPTS_DIR/stop_service.sh"; pause ;;
            6) run_script "$SCRIPTS_DIR/stop_all_services.sh"; pause ;;
            7) run_script "$SCRIPTS_DIR/stop_all_services_no_systemd.sh"; pause ;;
            0) return ;;
            *) echo "无效选择"; pause ;;
        esac
    done
}

tools_menu() {
    while true; do
        echo ""
        echo "=========== 工具/维护 ==========="
        echo "1) verify_port_change.sh — 端口/配置检查"
        echo "2) upgrade_nodejs.sh — Node.js 升级到 18"
        echo "3) push_to_github.sh — 交互式提交并推送 GitHub"
        echo "0) 返回上级"
        read -r -p "请选择: " choice </dev/tty
        case "${choice:-}" in
            1) run_script "$ROOT_DIR/verify_port_change.sh"; pause ;;
            2) run_script "$SCRIPTS_DIR/upgrade_nodejs.sh"; pause ;;
            3) run_script "$SCRIPTS_DIR/push_to_github.sh"; pause ;;
            0) return ;;
            *) echo "无效选择"; pause ;;
        esac
    done
}

main_menu() {
    while true; do
        echo ""
        echo "==============================="
        echo " VoiceNexus 一体化脚本"
        echo "==============================="
        echo "1) 启动/停止"
        echo "2) 部署/运行"
        echo "3) 模型/数据"
        echo "4) 公网/隧道"
        echo "5) 工具/维护"
        echo "0) 退出"
        read -r -p "请选择: " choice </dev/tty
        case "${choice:-}" in
            1) start_menu ;;
            2) deploy_menu ;;
            3) model_menu ;;
            4) tunnel_menu ;;
            5) tools_menu ;;
            0) exit 0 ;;
            *) echo "无效选择"; pause ;;
        esac
    done
}

main_menu
