# 更新日志 v1.1.0

## 🎉 重大更新：TTS 参数实时调整功能

**发布日期**: 2025-01-22

### ✨ 新增功能

#### 前端参数调整界面
- ✅ 音色选择（文本输入）
- ✅ 情感选择（8 个选项下拉菜单）
  - default, auto, happy, sad, angry, fear, surprise, neutral
- ✅ 语速调整（0.5x - 2.0x 滑块）
- ✅ 输出格式选择（WAV/MP3）
- ✅ 高级参数可展开区域
  - Temperature 滑块（0.1 - 2.0）
  - Top P 滑块（0.1 - 1.0）
  - Top K 滑块（5 - 50）
  - Repetition Penalty 滑块（0.5 - 2.0）
- ✅ 一键恢复默认值
- ✅ 参数自动保存到本地存储
- ✅ 实时显示参数值

#### 后端 API 增强
- ✅ 支持所有高级参数
- ✅ 参数验证和范围检查
- ✅ 详细的日志记录
- ✅ 参数传递到 TTS 模型

#### 部署优化
- ✅ 单端口部署支持（Nginx 反向代理）
- ✅ GPUShare 平台部署脚本
- ✅ Node.js 升级脚本
- ✅ 自动化部署脚本

### 📚 新增文档

1. **TTS_PARAMETERS_GUIDE.md** - 完整的参数说明文档
2. **FRONTEND_PARAMETERS_GUIDE.md** - 前端使用指南
3. **PARAMETER_UPDATE_SUMMARY.md** - 技术更新摘要
4. **QUICK_START_PARAMETERS.md** - 5 分钟快速上手
5. **PARAMETERS_CHEATSHEET.md** - 参数速查表
6. **IMPLEMENTATION_COMPLETE.md** - 实施完成总结
7. **NODE_UPGRADE_GUIDE.md** - Node.js 升级指南
8. **test_parameters.py** - 自动化测试脚本

### 🔧 更新的文件

#### 后端
- `app/models/schemas.py` - 添加高级参数字段
- `app/core/inference.py` - 支持参数传递
- `app/main.py` - API 端点更新

#### 前端
- `frontend/store/useSettings.ts` - 状态管理扩展
- `frontend/components/SettingsModal.tsx` - 完整重构
- `frontend/components/ChatInterface.tsx` - 参数传递
- `frontend/utils/audioQueue.ts` - API 调用更新

#### 部署脚本
- `scripts/deploy_gpushare_single_port.sh` - GPUShare 单端口部署
- `scripts/deploy_single_port.sh` - 通用单端口部署
- `scripts/upgrade_nodejs.sh` - Node.js 升级
- `scripts/stop_all_services.sh` - 停止所有服务
- `nginx_8080.conf` - Nginx 配置文件

### 🎯 使用场景

#### 新闻播报
```json
{
  "temperature": 0.5,
  "top_p": 0.6,
  "top_k": 10,
  "speed": 1.0
}
```

#### 对话聊天
```json
{
  "temperature": 1.0,
  "top_p": 0.8,
  "top_k": 20,
  "speed": 1.1
}
```

#### 情感朗读
```json
{
  "temperature": 1.3,
  "top_p": 0.9,
  "top_k": 30,
  "speed": 1.0
}
```

### 📊 参数说明

| 参数 | 范围 | 默认值 | 说明 |
|------|------|--------|------|
| voice | string | default | 音色 ID |
| emotion | enum | default | 情感标签 |
| speed | 0.5-2.0 | 1.0 | 语速倍率 |
| temperature | 0.1-2.0 | 1.0 | 控制随机性 |
| top_p | 0.1-1.0 | 0.8 | 核采样 |
| top_k | 5-50 | 20 | 候选数量 |
| repetition_penalty | 0.5-2.0 | 1.0 | 重复惩罚 |

### 🚀 快速开始

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 升级 Node.js（如果需要）
bash scripts/upgrade_nodejs.sh

# 3. 部署（单端口模式）
sudo bash scripts/deploy_gpushare_single_port.sh

# 4. 访问前端
# http://你的地址:端口/
```

### 🐛 Bug 修复

- 修复了前端 Node.js 版本兼容性问题
- 优化了参数传递逻辑
- 改进了错误处理

### ⚠️ 破坏性变更

- 前端需要 Node.js >= 18.17.0
- TTS API 默认地址改为相对路径 `/api/v1/audio/speech`

### 📝 升级指南

#### 从 v1.0.0 升级

1. **升级 Node.js**:
```bash
bash scripts/upgrade_nodejs.sh
```

2. **更新依赖**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

3. **重新部署**:
```bash
sudo bash scripts/deploy_gpushare_single_port.sh
```

4. **更新前端设置**:
- 打开前端界面
- 点击设置
- TTS API URL 改为: `/api/v1/audio/speech`
- 保存

### 🎊 致谢

感谢所有使用和反馈的用户！

### 📞 支持

- GitHub Issues: https://github.com/yantianqi1/index-tts-airp/issues
- 文档: 查看项目根目录下的各种 `.md` 文件

---

**完整更新内容**: 查看 [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)
