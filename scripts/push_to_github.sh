#!/bin/bash
# 推送更新到 GitHub

set -e

echo "=========================================="
echo "推送更新到 GitHub"
echo "=========================================="

# 检查是否在 git 仓库中
if [ ! -d .git ]; then
    echo "✗ 错误: 不在 git 仓库中"
    exit 1
fi

# 检查是否有未提交的更改
echo ""
echo "检查更改..."
git status

echo ""
read -p "是否继续提交并推送? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# 添加所有更改
echo ""
echo "添加文件..."
git add .

# 显示将要提交的文件
echo ""
echo "将要提交的文件:"
git diff --cached --name-status

# 提交
echo ""
echo "提交更改..."
git commit -m "feat: 添加 TTS 参数实时调整功能 v1.1.0

✨ 新增功能:
- 前端参数调整界面（音色、情感、语速、高级参数）
- 8 个情感选项（default, auto, happy, sad, angry, fear, surprise, neutral）
- 4 个高级参数滑块（Temperature, Top-P, Top-K, Repetition Penalty）
- 一键恢复默认值
- 参数自动保存

🔧 后端增强:
- 支持所有高级参数
- 参数验证和范围检查
- 详细日志记录

📚 新增文档:
- TTS_PARAMETERS_GUIDE.md - 完整参数说明
- FRONTEND_PARAMETERS_GUIDE.md - 前端使用指南
- PARAMETERS_CHEATSHEET.md - 参数速查表
- NODE_UPGRADE_GUIDE.md - Node.js 升级指南
- 多个部署和测试脚本

🚀 部署优化:
- 单端口部署支持（Nginx 反向代理）
- GPUShare 平台部署脚本
- Node.js 自动升级脚本

📝 更新文件:
- app/models/schemas.py
- app/core/inference.py
- app/main.py
- frontend/store/useSettings.ts
- frontend/components/SettingsModal.tsx
- frontend/components/ChatInterface.tsx
- frontend/utils/audioQueue.ts

查看完整更新: CHANGELOG_v1.1.0.md"

# 推送到 GitHub
echo ""
echo "推送到 GitHub..."
git push origin main

echo ""
echo "=========================================="
echo "✓ 推送完成！"
echo "=========================================="
echo ""
echo "GitHub 仓库: https://github.com/yantianqi1/index-tts-airp"
echo ""
echo "更新内容:"
echo "  - TTS 参数实时调整功能"
echo "  - 前端可视化参数控制"
echo "  - 单端口部署支持"
echo "  - 完整的文档和脚本"
echo ""
