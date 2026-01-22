# Node.js 升级指南

## 🚨 问题

你的服务器 Node.js 版本是 **14.17.0**，但 Next.js 14 需要 **Node.js >= 18.17.0**。

## ✅ 解决方案

### 方案 1: 使用自动升级脚本（推荐）

```bash
chmod +x scripts/upgrade_nodejs.sh
./scripts/upgrade_nodejs.sh
```

### 方案 2: 使用 nvm（推荐，最灵活）

```bash
# 1. 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. 重新加载 shell
source ~/.bashrc
# 或
source ~/.zshrc

# 3. 安装 Node.js 18
nvm install 18

# 4. 使用 Node.js 18
nvm use 18

# 5. 设置为默认版本
nvm alias default 18

# 6. 验证
node --version  # 应该显示 v18.x.x
```

### 方案 3: Ubuntu/Debian 系统

```bash
# 1. 移除旧版本
sudo apt-get remove -y nodejs npm

# 2. 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 3. 安装 Node.js 18
sudo apt-get install -y nodejs

# 4. 验证
node --version  # 应该显示 v18.x.x
npm --version
```

### 方案 4: CentOS/RHEL 系统

```bash
# 1. 移除旧版本
sudo yum remove -y nodejs npm

# 2. 添加 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 3. 安装 Node.js 18
sudo yum install -y nodejs

# 4. 验证
node --version  # 应该显示 v18.x.x
npm --version
```

## 🔄 升级后的步骤

### 1. 清理旧的依赖

```bash
cd frontend
rm -rf node_modules package-lock.json
```

### 2. 重新安装依赖

```bash
npm install
```

### 3. 启动前端

```bash
npm run dev
```

### 4. 验证

访问 `http://localhost:3000`，应该可以正常打开了。

## 🎯 快速命令（一键执行）

```bash
# 升级 Node.js（使用 nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && \
source ~/.bashrc && \
nvm install 18 && \
nvm use 18 && \
nvm alias default 18

# 重新安装前端依赖
cd ~/index-tts-airp/frontend && \
rm -rf node_modules package-lock.json && \
npm install && \
npm run dev
```

## 🐛 常见问题

### Q1: nvm 命令找不到？

**A**: 需要重新加载 shell 配置：

```bash
source ~/.bashrc
# 或
source ~/.zshrc
# 或重新登录 SSH
```

### Q2: 权限不足？

**A**: 某些命令需要 sudo：

```bash
sudo apt-get install -y nodejs
# 或
sudo yum install -y nodejs
```

### Q3: 升级后还是显示旧版本？

**A**: 可能有多个 Node.js 安装，检查路径：

```bash
which node
which npm

# 如果使用 nvm
nvm list
nvm use 18
```

### Q4: npm install 还是报错？

**A**: 完全清理后重试：

```bash
cd frontend
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
```

## 📊 版本要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.17.0 | 18.x LTS |
| npm | 9.x | 最新 |
| Next.js | 14.2.0 | 14.2.0 |

## 🔍 验证安装

运行以下命令验证：

```bash
# 检查 Node.js 版本
node --version
# 应该显示: v18.x.x

# 检查 npm 版本
npm --version
# 应该显示: 9.x.x 或更高

# 检查 nvm（如果使用）
nvm --version
nvm list
```

## 🚀 升级完成后

1. **清理旧依赖**：
```bash
cd frontend
rm -rf node_modules package-lock.json
```

2. **重新安装**：
```bash
npm install
```

3. **启动开发服务器**：
```bash
npm run dev
```

4. **访问前端**：
打开浏览器访问 `http://localhost:3000`

## 💡 推荐：使用 nvm 管理 Node.js 版本

nvm 的优势：
- ✅ 可以安装多个 Node.js 版本
- ✅ 轻松切换版本
- ✅ 不需要 sudo 权限
- ✅ 项目级别的版本管理

安装 nvm：
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

使用 nvm：
```bash
nvm install 18      # 安装 Node.js 18
nvm use 18          # 使用 Node.js 18
nvm alias default 18 # 设置默认版本
nvm list            # 查看已安装版本
```

## 🎉 完成

升级完成后，你就可以正常使用前端的参数调整功能了！

如果还有问题，请查看：
- [Node.js 官方文档](https://nodejs.org/)
- [nvm GitHub](https://github.com/nvm-sh/nvm)
- [Next.js 文档](https://nextjs.org/docs)
