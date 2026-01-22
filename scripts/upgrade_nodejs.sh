#!/bin/bash
# Node.js 升级脚本

set -e

echo "=========================================="
echo "Node.js 升级脚本"
echo "=========================================="

# 检查当前版本
echo ""
echo "当前 Node.js 版本:"
node --version || echo "Node.js 未安装"

echo ""
echo "当前 npm 版本:"
npm --version || echo "npm 未安装"

# 检查是否有 nvm
if command -v nvm &> /dev/null; then
    echo ""
    echo "✓ 检测到 nvm，使用 nvm 升级..."
    nvm install 18
    nvm use 18
    nvm alias default 18
    echo "✓ Node.js 已升级到 18.x"
    exit 0
fi

# 检查操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "✗ 无法检测操作系统"
    exit 1
fi

echo ""
echo "检测到操作系统: $OS"

# 根据操作系统选择安装方法
case $OS in
    ubuntu|debian)
        echo ""
        echo "使用 NodeSource 仓库升级 Node.js..."
        
        # 移除旧版本
        sudo apt-get remove -y nodejs npm || true
        
        # 添加 NodeSource 仓库
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        
        # 安装 Node.js 18
        sudo apt-get install -y nodejs
        
        echo "✓ Node.js 已升级"
        ;;
        
    centos|rhel|fedora)
        echo ""
        echo "使用 NodeSource 仓库升级 Node.js..."
        
        # 移除旧版本
        sudo yum remove -y nodejs npm || true
        
        # 添加 NodeSource 仓库
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        
        # 安装 Node.js 18
        sudo yum install -y nodejs
        
        echo "✓ Node.js 已升级"
        ;;
        
    *)
        echo ""
        echo "⚠️  未识别的操作系统: $OS"
        echo ""
        echo "请手动安装 Node.js 18.x:"
        echo "1. 访问: https://nodejs.org/"
        echo "2. 下载 Node.js 18.x LTS 版本"
        echo "3. 或使用 nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        exit 1
        ;;
esac

# 验证安装
echo ""
echo "=========================================="
echo "验证安装"
echo "=========================================="
echo ""
echo "Node.js 版本:"
node --version

echo ""
echo "npm 版本:"
npm --version

echo ""
echo "✓ Node.js 升级完成！"
echo ""
echo "现在可以运行:"
echo "  cd frontend"
echo "  npm install"
echo "  npm run dev"
