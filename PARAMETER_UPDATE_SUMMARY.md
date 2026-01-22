# TTS 参数实时调整功能 - 更新摘要

## 📅 更新日期
2025-01-22

## 🎯 更新目标
为前端添加完整的 TTS 参数实时调整功能，让用户可以在界面上自由调整所有参数。

## ✅ 已完成的更新

### 1. 后端 API 增强

#### 文件：`app/models/schemas.py`
- ✅ 添加高级参数字段到 `TTSRequest` 模型
  - `temperature`: 温度参数 (0.1-2.0)
  - `top_p`: 核采样参数 (0.0-1.0)
  - `top_k`: Top-K 采样参数 (1-100)
  - `repetition_penalty`: 重复惩罚参数 (0.1-2.0)

#### 文件：`app/core/inference.py`
- ✅ 更新 `generate()` 方法，接受所有高级参数
- ✅ 更新 `_sync_generate()` 方法，传递参数到模型
- ✅ 添加详细的日志记录

#### 文件：`app/main.py`
- ✅ 更新 `/v1/audio/speech` 端点
- ✅ 传递所有参数到推理引擎
- ✅ 更新 API 文档说明

### 2. 前端状态管理

#### 文件：`frontend/store/useSettings.ts`
- ✅ 扩展 `TTSConfig` 接口，添加所有参数
- ✅ 设置合理的默认值
- ✅ 参数持久化到本地存储

### 3. 前端组件更新

#### 文件：`frontend/components/SettingsModal.tsx`
- ✅ 完全重构设置界面
- ✅ 添加音色和情感选择器
- ✅ 添加语速滑块（0.5x - 2.0x）
- ✅ 添加输出格式单选按钮
- ✅ 添加可展开的高级参数区域
  - Temperature 滑块
  - Top P 滑块
  - Top K 滑块
  - Repetition Penalty 滑块
- ✅ 添加"恢复默认"按钮
- ✅ 实时显示参数值
- ✅ 添加参数说明文本

#### 文件：`frontend/components/ChatInterface.tsx`
- ✅ 更新音频管理器初始化
- ✅ 传递所有参数到音频队列

#### 文件：`frontend/utils/audioQueue.ts`
- ✅ 重构 `AudioQueueManager` 类
- ✅ 使用 `TTSParams` 接口
- ✅ 在 API 请求中包含所有参数

### 4. 文档更新

#### 新增文档
- ✅ `TTS_PARAMETERS_GUIDE.md` - 完整的参数说明文档
- ✅ `FRONTEND_PARAMETERS_GUIDE.md` - 前端使用指南
- ✅ `test_parameters.py` - 参数测试脚本
- ✅ `PARAMETER_UPDATE_SUMMARY.md` - 本文档

#### 更新文档
- ✅ `README.md` - 添加新特性说明

## 🎨 新增功能详情

### 基础参数控制
1. **音色选择** - 文本输入框
2. **情感选择** - 下拉菜单（8 个选项）
3. **语速调整** - 滑块控制（0.5x - 2.0x）
4. **输出格式** - WAV/MP3 单选

### 高级参数控制
1. **Temperature** - 滑块（0.1 - 2.0）
2. **Top P** - 滑块（0.1 - 1.0）
3. **Top K** - 滑块（5 - 50）
4. **Repetition Penalty** - 滑块（0.5 - 2.0）

### 用户体验优化
- ✅ 滑块实时显示当前值
- ✅ 参数说明和建议
- ✅ 可展开/收起高级参数
- ✅ 一键恢复默认值
- ✅ 参数自动保存
- ✅ 实时生效机制

## 📊 参数说明

### 基础参数

| 参数 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| voice | string | - | default | 音色 ID |
| emotion | enum | 8 个选项 | default | 情感标签 |
| speed | float | 0.5-2.0 | 1.0 | 语速倍率 |
| response_format | enum | wav/mp3 | wav | 输出格式 |

### 高级参数

| 参数 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| temperature | float | 0.1-2.0 | 1.0 | 控制随机性 |
| top_p | float | 0.1-1.0 | 0.8 | 核采样 |
| top_k | int | 5-50 | 20 | 候选数量 |
| repetition_penalty | float | 0.5-2.0 | 1.0 | 重复惩罚 |

## 🔧 技术实现

### 前端技术栈
- React 18
- TypeScript
- Zustand (状态管理)
- Tailwind CSS (样式)
- Lucide React (图标)

### 后端技术栈
- FastAPI
- Pydantic (数据验证)
- IndexTTS 2.0 (TTS 模型)

### 数据流
```
用户界面 → Zustand Store → AudioQueueManager → API 请求 → 后端推理 → 音频返回
```

## 🧪 测试

### 测试脚本
运行 `test_parameters.py` 进行完整测试：

```bash
python test_parameters.py
```

测试内容：
1. 基础参数测试（默认、快速、慢速、情感）
2. 高级参数测试（温度、采样、惩罚）
3. 组合参数测试（播音员、对话、快速播报）
4. 输出格式测试（WAV、MP3）

### 手动测试
1. 启动服务
2. 打开前端界面
3. 点击设置按钮
4. 调整各个参数
5. 发送测试消息
6. 验证语音效果

## 📱 界面预览

### 设置界面结构
```
┌─────────────────────────────────────┐
│ 设置                           ✕   │
├─────────────────────────────────────┤
│ LLM 配置                            │
│ ├─ Base URL                         │
│ ├─ API Key                          │
│ └─ Model                            │
│                                     │
│ TTS 语音配置                        │
│ ├─ TTS API URL                      │
│ ├─ 音色 (Voice)                     │
│ ├─ 情感 (Emotion) [下拉]            │
│ ├─ 语速 (Speed) [━━●━━] 1.20x      │
│ ├─ 输出格式 ○ WAV ● MP3             │
│ └─ ▼ 高级参数 (Advanced)            │
│    ├─ Temperature [━━●━━] 1.00      │
│    ├─ Top P [━━●━━] 0.80            │
│    ├─ Top K [━━●━━] 20              │
│    └─ Rep. Penalty [━━●━━] 1.00     │
│                                     │
│ [取消]              [保存并应用]     │
└─────────────────────────────────────┘
```

## 🎯 使用场景示例

### 场景 1: 新闻播报
```json
{
  "voice": "default",
  "emotion": "neutral",
  "speed": 1.0,
  "temperature": 0.5,
  "top_p": 0.6,
  "top_k": 10
}
```

### 场景 2: 对话聊天
```json
{
  "voice": "default",
  "emotion": "auto",
  "speed": 1.1,
  "temperature": 1.0,
  "top_p": 0.8,
  "top_k": 20
}
```

### 场景 3: 情感朗读
```json
{
  "voice": "default",
  "emotion": "happy",
  "speed": 1.0,
  "temperature": 1.3,
  "top_p": 0.9,
  "top_k": 30
}
```

## 🚀 部署说明

### 前端部署
```bash
cd frontend
npm install
npm run build
npm start
```

### 后端部署
```bash
# 确保已安装依赖
pip install -r requirements.txt

# 启动服务
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### Docker 部署
```bash
docker-compose up -d
```

## 📈 性能影响

### 参数对性能的影响
- **Temperature**: 对性能影响较小
- **Top P/Top K**: 影响中等，值越大计算量越大
- **Speed**: 后处理阶段影响，不影响模型推理
- **Format**: MP3 转换需要额外时间

### 优化建议
1. 使用默认参数获得最佳性能
2. 避免过高的 Top K 值（>40）
3. 使用 WAV 格式减少转换时间
4. 批量请求时考虑参数复用

## 🔒 安全性

### 参数验证
- ✅ 后端使用 Pydantic 进行严格验证
- ✅ 前端限制参数范围
- ✅ 无效参数会被拒绝

### 数据保护
- ✅ API Key 使用密码输入框
- ✅ 本地存储加密（浏览器自动）
- ✅ 不传输敏感信息到 TTS API

## 📝 待优化项

### 短期优化
- [ ] 添加参数预设功能（保存/加载配置）
- [ ] 添加参数对比功能
- [ ] 添加实时预览功能

### 长期优化
- [ ] 添加参数推荐系统
- [ ] 添加 A/B 测试功能
- [ ] 添加参数历史记录

## 🐛 已知问题

1. **情感文件缺失**: 如果音色文件夹下没有对应情感文件，会自动使用 default.wav
2. **参数范围**: 某些极端参数组合可能产生异常效果
3. **浏览器兼容**: 滑块在旧版浏览器可能显示异常

## 💡 使用建议

1. **新手用户**: 使用默认参数，只调整音色和情感
2. **进阶用户**: 调整语速和 Temperature
3. **专业用户**: 精细调整所有高级参数

## 📞 支持

如有问题，请：
1. 查看文档：`TTS_PARAMETERS_GUIDE.md`
2. 运行测试：`python test_parameters.py`
3. 检查日志：查看后端控制台输出
4. 提交 Issue：GitHub Issues

## 🎉 总结

本次更新为项目添加了完整的参数调整功能，用户现在可以：
- ✅ 在前端实时调整所有 TTS 参数
- ✅ 使用滑块可视化控制参数
- ✅ 查看参数说明和建议
- ✅ 一键恢复默认值
- ✅ 参数自动保存和持久化

这大大提升了系统的灵活性和用户体验！
