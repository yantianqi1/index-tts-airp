#!/usr/bin/env python3
"""
TTS 多实例集群启动脚本

启动多个 TTS 服务实例以支持并发请求。
每个实例独立加载模型，占用约 8GB 显存。

使用方法:
    python run_cluster.py                    # 启动 2 个实例 (默认)
    python run_cluster.py --instances 3      # 启动 3 个实例
    python run_cluster.py --base-port 8080   # 从端口 8080 开始
    python run_cluster.py --with-proxy       # 同时启动内置负载均衡代理

注意:
    - 确保 GPU 显存足够 (每实例约 8GB)
    - 4060 16GB 建议最多 2 个实例
    - 使用 Ctrl+C 可以同时停止所有实例
"""

import argparse
import os
import signal
import subprocess
import sys
import time
from typing import List, Optional


class ClusterManager:
    """TTS 集群管理器"""

    def __init__(
        self,
        instances: int = 2,
        base_port: int = 8080,
        with_proxy: bool = False,
        proxy_port: int = 8000
    ):
        self.instances = instances
        self.base_port = base_port
        self.with_proxy = with_proxy
        self.proxy_port = proxy_port
        self.processes: List[subprocess.Popen] = []
        self.proxy_process: Optional[subprocess.Popen] = None
        self._shutdown = False

    def start(self):
        """启动集群"""
        print("=" * 60)
        print("TTS 多实例集群启动器")
        print("=" * 60)
        print(f"实例数量: {self.instances}")
        print(f"端口范围: {self.base_port} - {self.base_port + self.instances - 1}")
        if self.with_proxy:
            print(f"负载均衡代理端口: {self.proxy_port}")
        print("=" * 60)
        print()

        # 注册信号处理
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        # 启动各个实例
        for i in range(self.instances):
            port = self.base_port + i
            self._start_instance(i + 1, port)
            # 等待一下避免同时加载模型导致显存峰值过高
            if i < self.instances - 1:
                print(f"等待 30 秒后启动下一个实例 (避免显存峰值)...")
                time.sleep(30)

        print()
        print("=" * 60)
        print("所有实例已启动!")
        print("=" * 60)

        # 启动负载均衡代理 (如果需要)
        if self.with_proxy:
            self._start_proxy()

        # 打印访问信息
        self._print_access_info()

        # 等待所有进程
        self._wait_for_processes()

    def _start_instance(self, instance_id: int, port: int):
        """启动单个实例"""
        print(f"[实例 {instance_id}] 正在启动 (端口: {port})...")

        env = os.environ.copy()
        env["PORT"] = str(port)
        env["BACKEND_PORT"] = str(port)

        # 使用 uvicorn 直接启动
        cmd = [
            sys.executable, "-m", "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0",
            "--port", str(port),
            "--workers", "1"
        ]

        # 创建日志文件
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        log_file = open(f"{log_dir}/instance_{instance_id}.log", "w")

        process = subprocess.Popen(
            cmd,
            env=env,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            bufsize=1
        )

        self.processes.append(process)
        print(f"[实例 {instance_id}] PID: {process.pid}, 日志: {log_dir}/instance_{instance_id}.log")

    def _start_proxy(self):
        """启动简易负载均衡代理"""
        print()
        print(f"正在启动负载均衡代理 (端口: {self.proxy_port})...")

        # 生成后端列表
        backends = [f"http://127.0.0.1:{self.base_port + i}" for i in range(self.instances)]
        backends_str = ",".join(backends)

        # 使用内置的简易代理
        proxy_code = f'''
import asyncio
import itertools
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import StreamingResponse
import uvicorn

app = FastAPI(title="TTS Load Balancer")
backends = {repr(backends)}
backend_cycle = itertools.cycle(backends)

@app.api_route("/{{path:path}}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(request: Request, path: str):
    backend = next(backend_cycle)
    url = f"{{backend}}/{{path}}"

    async with httpx.AsyncClient(timeout=300.0) as client:
        body = await request.body()
        headers = dict(request.headers)
        headers.pop("host", None)

        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
            params=request.query_params
        )

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.headers.get("content-type")
        )

@app.get("/")
async def health():
    return {{"status": "running", "backends": backends, "mode": "load_balancer"}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port={self.proxy_port})
'''

        # 写入临时代理脚本
        proxy_script = "logs/_proxy_temp.py"
        with open(proxy_script, "w") as f:
            f.write(proxy_code)

        log_file = open("logs/proxy.log", "w")
        self.proxy_process = subprocess.Popen(
            [sys.executable, proxy_script],
            stdout=log_file,
            stderr=subprocess.STDOUT
        )
        print(f"负载均衡代理已启动, PID: {self.proxy_process.pid}")

    def _print_access_info(self):
        """打印访问信息"""
        print()
        print("=" * 60)
        print("访问地址:")
        print("=" * 60)

        if self.with_proxy:
            print(f"  统一入口 (推荐): http://localhost:{self.proxy_port}")
            print()

        print("  各实例直接访问:")
        for i in range(self.instances):
            port = self.base_port + i
            print(f"    实例 {i + 1}: http://localhost:{port}")

        print()
        print("提示:")
        print("  - 按 Ctrl+C 停止所有实例")
        print("  - 日志文件在 logs/ 目录下")
        if not self.with_proxy:
            print("  - 添加 --with-proxy 参数可启动内置负载均衡")
        print("=" * 60)
        print()

    def _signal_handler(self, signum, frame):
        """信号处理器"""
        if self._shutdown:
            return
        self._shutdown = True

        print()
        print("正在停止所有实例...")
        self.stop()
        sys.exit(0)

    def stop(self):
        """停止所有实例"""
        # 停止代理
        if self.proxy_process:
            print("停止负载均衡代理...")
            self.proxy_process.terminate()
            try:
                self.proxy_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.proxy_process.kill()

        # 停止所有实例
        for i, proc in enumerate(self.processes):
            print(f"停止实例 {i + 1} (PID: {proc.pid})...")
            proc.terminate()

        # 等待所有进程结束
        for proc in self.processes:
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()

        print("所有实例已停止")

    def _wait_for_processes(self):
        """等待所有进程"""
        try:
            while not self._shutdown:
                # 检查是否有进程意外退出
                for i, proc in enumerate(self.processes):
                    ret = proc.poll()
                    if ret is not None:
                        print(f"警告: 实例 {i + 1} 已退出 (返回码: {ret})")
                time.sleep(1)
        except KeyboardInterrupt:
            pass


def main():
    parser = argparse.ArgumentParser(
        description="TTS 多实例集群启动器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    python run_cluster.py                    # 启动 2 个实例
    python run_cluster.py --instances 3      # 启动 3 个实例
    python run_cluster.py --with-proxy       # 启动实例 + 负载均衡代理

注意:
    4060 16GB 显卡建议最多启动 2 个实例 (每个约 8GB 显存)
        """
    )

    parser.add_argument(
        "--instances", "-n",
        type=int,
        default=2,
        help="启动的实例数量 (默认: 2)"
    )

    parser.add_argument(
        "--base-port", "-p",
        type=int,
        default=8080,
        help="起始端口号 (默认: 8080)"
    )

    parser.add_argument(
        "--with-proxy",
        action="store_true",
        help="同时启动内置负载均衡代理"
    )

    parser.add_argument(
        "--proxy-port",
        type=int,
        default=8000,
        help="负载均衡代理端口 (默认: 8000)"
    )

    args = parser.parse_args()

    # 验证参数
    if args.instances < 1:
        print("错误: 实例数量必须大于 0")
        sys.exit(1)

    if args.instances > 4:
        print("警告: 实例数量较多，请确保 GPU 显存足够")
        print("4060 16GB 建议最多 2 个实例")
        response = input("是否继续? (y/N): ")
        if response.lower() != 'y':
            sys.exit(0)

    # 启动集群
    manager = ClusterManager(
        instances=args.instances,
        base_port=args.base_port,
        with_proxy=args.with_proxy,
        proxy_port=args.proxy_port
    )

    manager.start()


if __name__ == "__main__":
    main()
