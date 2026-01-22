# TTS 参数调整指南

## 📋 概述

现在前端支持实时调整所有 TTS 参数，用户可以在设置界面中自由调整音色、情感、语速和高级参数。

## 🎛️ 可调参数列表

### 基础参数

#### 1. **音色 (Voice)**
- **类型**: 文本输入
- **默认值**: `default`
- **说明**: 对应 `presets/` 目录下的文件夹名
- **示例**: `default`, `voice_01`, `voice_02`

#### 2. **情感 (Emotion)**
- **类型**: 下拉选择
- **默认值**: `default`
- **可选值**:
  - `default` - 默认情感
  - `auto` - 智能分析（需要配置 LLM）
  - `happy` - 开心
  - `sad` - 悲伤
  - `angry` - 愤怒
  - `fear` - 恐惧
  - `surprise` - 惊讶
  - `neutral` - 中性

#### 3. **语速 (Speed)**
- **类型**: 滑块
- **范围**: 0.5x - 2.0x
- **默认值**: 1.0x
- **说明**: 
  - 0.5x = 慢速
  - 1.0x = 正常
  - 2.0x = 快速

#### 4. **输出格式 (Response Format)**
- **类型**: 单选按钮
- **可选值**:
  - `wav` - 高质量无损格式
  - `mp3` - 压缩格式，文件更小

### 高级参数

#### 5. **Temperature (温度)**
- **类型**: 滑块
- **范围**: 0.1 - 2.0
- **默认值**: 1.0
- **说明**: 控制生成的随机性
  - 越低 (0.1-0.5): 更稳定、一致
  - 中等 (0.8-1.2): 平衡
  - 越高 (1.5-2.0): 更随机、多变

#### 6. **Top P (核采样)**
- **类型**: 滑块
- **范围**: 0.1 - 1.0
- **默认值**: 0.8
- **说明**: 影响音色的多样性
  - 推荐值: 0.8
  - 越低: 更保守
  - 越高: 更多样

#### 7. **Top K (候选数量)**
- **类型**: 滑块
- **范围**: 5 - 50
- **默认值**: 20
- **说明**: 控制候选 token 数量
  - 推荐值: 20
  - 越低: 更确定
  - 越高: 更灵活

#### 8. **Repetition Penalty (重复惩罚)**
- **类型**: 滑块
- **范围**: 0.5 - 2.0
- **默认值**: 1.0
- **说明**: 防止重复生成
  - 1.0 = 无惩罚
  - >1.0 = 减少重复
  - <1.0 = 允许重复

## 🎨 使用场景建议

### 场景 1: 播音员风格（稳定、清晰）
```
Temperature: 0.5
Top P: 0.6
Top K: 10
Speed: 1.0
Emotion: neutral
```

### 场景 2: 对话角色（自然、多变）
```
Temperature: 1.0
Top P: 0.8
Top K: 20
Speed: 1.1
Emotion: auto
```

### 场景 3: 情感表达（丰富、夸张）
```
Temperature: 1.3
Top P: 0.9
Top K: 30
Speed: 1.0
Emotion: happy/sad/angry
```

### 场景 4: 快速播报（高效、简洁）
```
Temperature: 0.7
Top P: 0.7
Top K: 15
Speed: 1.5
Emotion: neutral
```

## 🔧 前端使用方法

### 1. 打开设置
点击右上角的设置图标 ⚙️

### 2. 调整基础参数
在 "TTS 语音配置" 部分：
- 输入音色名称
- 选择情感
- 拖动语速滑块
- 选择输出格式

### 3. 调整高级参数
点击 "高级参数 (Advanced)" 展开：
- 拖动各个滑块实时调整
- 点击 "恢复默认" 重置所有高级参数

### 4. 保存并应用
点击 "保存并应用" 按钮，新设置立即生效

## 📡 API 调用示例

### Python 示例
```python
import requests

response = requests.post("http://localhost:8080/v1/audio/speech", json={
    "input": "你好世界",
    "voice": "default",
    "emotion": "happy",
    "speed": 1.2,
    "response_format": "wav",
    # 高级参数
    "temperature": 1.0,
    "top_p": 0.8,
    "top_k": 20,
    "repetition_penalty": 1.0
})

with open("output.wav", "wb") as f:
    f.write(response.content)
```

### JavaScript 示例
```javascript
const response = await fetch("http://localhost:8080/v1/audio/speech", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    input: "你好世界",
    voice: "default",
    emotion: "happy",
    speed: 1.2,
    response_format: "wav",
    // 高级参数
    temperature: 1.0,
    top_p: 0.8,
    top_k: 20,
    repetition_penalty: 1.0
  })
});

const blob = await response.blob();
const audio = new Audio(URL.createObjectURL(blob));
audio.play();
```

## 🎯 参数调优建议

### 提高质量
1. 降低 Temperature (0.5-0.8)
2. 降低 Top P (0.6-0.7)
3. 降低 Top K (10-15)
4. 使用 WAV 格式

### 增加多样性
1. 提高 Temperature (1.2-1.5)
2. 提高 Top P (0.85-0.95)
3. 提高 Top K (25-35)
4. 使用 auto 情感

### 减少重复
1. 提高 Repetition Penalty (1.2-1.5)
2. 适当提高 Temperature
3. 使用不同的情感

### 优化性能
1. 使用 MP3 格式（文件更小）
2. 保持默认参数
3. 避免过高的 Top K

## ⚠️ 注意事项

1. **高级参数影响**: 修改高级参数可能影响语音质量，建议先测试
2. **情感支持**: 确保选择的音色包含对应的情感文件
3. **智能情感**: 使用 `auto` 需要配置 LLM API
4. **参数范围**: 超出范围的值会被 API 拒绝
5. **实时生效**: 参数修改后立即应用到下一次合成

## 🔄 更新内容

### v1.1.0 (2025-01-22)
- ✅ 添加所有高级参数支持
- ✅ 前端实时调整界面
- ✅ 参数持久化存储
- ✅ 滑块可视化控制
- ✅ 参数说明和建议
- ✅ 一键恢复默认值

## 📚 相关文档

- [API 文档](./README.md)
- [使用指南](./USAGE_GUIDE.md)
- [快速参考](./QUICK_REFERENCE.md)
- [前端集成](./FRONTEND_INTEGRATION.md)
