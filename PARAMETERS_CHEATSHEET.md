# TTS 参数速查表 (Cheat Sheet)

## 🎯 快速参考

### 基础参数

| 参数 | 类型 | 范围 | 默认 | 快速说明 |
|------|------|------|------|---------|
| **voice** | 文本 | - | default | 音色 ID |
| **emotion** | 选择 | 8 选项 | default | 情感标签 |
| **speed** | 滑块 | 0.5-2.0 | 1.0 | 语速倍率 |
| **format** | 单选 | wav/mp3 | wav | 输出格式 |

### 高级参数

| 参数 | 范围 | 默认 | 低值效果 | 高值效果 |
|------|------|------|---------|---------|
| **temperature** | 0.1-2.0 | 1.0 | 稳定一致 | 随机多变 |
| **top_p** | 0.1-1.0 | 0.8 | 保守确定 | 多样灵活 |
| **top_k** | 5-50 | 20 | 确定性强 | 灵活性强 |
| **rep_penalty** | 0.5-2.0 | 1.0 | 允许重复 | 避免重复 |

## 📊 参数效果对比

### Temperature (温度)

```
0.1 ━━━━━━━━━━ 稳定、机械、一致
0.5 ━━━━━━━━━━ 较稳定、清晰
1.0 ━━━━━━━━━━ 平衡、自然 ⭐
1.5 ━━━━━━━━━━ 较多变、生动
2.0 ━━━━━━━━━━ 随机、不可预测
```

### Speed (语速)

```
0.5x ━━━━━━━━━━ 很慢、清晰
0.7x ━━━━━━━━━━ 慢速、舒缓
1.0x ━━━━━━━━━━ 正常、自然 ⭐
1.3x ━━━━━━━━━━ 较快、高效
1.5x ━━━━━━━━━━ 快速、紧凑
2.0x ━━━━━━━━━━ 很快、急促
```

### Top P (核采样)

```
0.1 ━━━━━━━━━━ 极度保守
0.6 ━━━━━━━━━━ 较保守、稳定
0.8 ━━━━━━━━━━ 平衡、推荐 ⭐
0.9 ━━━━━━━━━━ 较多样、灵活
1.0 ━━━━━━━━━━ 最大多样性
```

### Top K (候选数量)

```
5   ━━━━━━━━━━ 极度确定
10  ━━━━━━━━━━ 较确定、稳定
20  ━━━━━━━━━━ 平衡、推荐 ⭐
30  ━━━━━━━━━━ 较灵活、多样
50  ━━━━━━━━━━ 最大灵活性
```

## 🎨 场景配置速查

### 📰 新闻播报
```
voice: default
emotion: neutral
speed: 1.0
temperature: 0.5 ⬇️
top_p: 0.6 ⬇️
top_k: 10 ⬇️
```
**效果**: 稳定、专业、清晰

### 💬 对话聊天
```
voice: default
emotion: auto
speed: 1.1 ⬆️
temperature: 1.0 ➡️
top_p: 0.8 ➡️
top_k: 20 ➡️
```
**效果**: 自然、流畅、有变化

### 🎭 情感朗读
```
voice: default
emotion: happy/sad
speed: 1.0
temperature: 1.3 ⬆️
top_p: 0.9 ⬆️
top_k: 30 ⬆️
```
**效果**: 丰富、生动、有感染力

### ⚡ 快速播报
```
voice: default
emotion: neutral
speed: 1.5 ⬆️
temperature: 0.7 ⬇️
top_p: 0.7 ⬇️
top_k: 15 ⬇️
```
**效果**: 高效、简洁、快速

### 🎤 播音员风格
```
voice: default
emotion: neutral
speed: 1.0
temperature: 0.5 ⬇️
top_p: 0.6 ⬇️
top_k: 10 ⬇️
rep_penalty: 1.0
```
**效果**: 标准、规范、专业

### 🎪 角色扮演
```
voice: default
emotion: auto
speed: 1.2 ⬆️
temperature: 1.4 ⬆️
top_p: 0.85 ⬆️
top_k: 25 ⬆️
rep_penalty: 1.2 ⬆️
```
**效果**: 夸张、多变、有个性

## 🎯 参数调整策略

### 提高质量
```
✅ Temperature ⬇️ (0.5-0.7)
✅ Top P ⬇️ (0.6-0.7)
✅ Top K ⬇️ (10-15)
✅ 使用 WAV 格式
```

### 增加多样性
```
✅ Temperature ⬆️ (1.2-1.5)
✅ Top P ⬆️ (0.85-0.95)
✅ Top K ⬆️ (25-35)
✅ 使用 auto 情感
```

### 减少重复
```
✅ Repetition Penalty ⬆️ (1.2-1.5)
✅ Temperature ⬆️ (1.1-1.3)
✅ 使用不同情感
```

### 优化性能
```
✅ 使用默认参数
✅ Top K ⬇️ (<25)
✅ 使用 MP3 格式
✅ Speed 保持 1.0
```

## 🔥 常见问题速查

### Q: 声音太机械？
```
A: Temperature ⬆️ 1.2-1.5
   Top P ⬆️ 0.85-0.9
```

### Q: 声音不稳定？
```
A: Temperature ⬇️ 0.5-0.7
   Top P ⬇️ 0.6-0.7
   Top K ⬇️ 10-15
```

### Q: 有重复内容？
```
A: Repetition Penalty ⬆️ 1.3-1.5
   Temperature ⬆️ 1.1-1.3
```

### Q: 语速不合适？
```
A: 慢速 → Speed 0.7-0.8
   快速 → Speed 1.3-1.5
```

### Q: 情感不明显？
```
A: 选择具体情感 (happy/sad/angry)
   Temperature ⬆️ 1.2-1.4
   Top P ⬆️ 0.85-0.9
```

## 📱 前端操作速查

### 打开设置
```
点击右上角 ⚙️ 按钮
```

### 调整基础参数
```
1. 输入音色 ID
2. 选择情感下拉菜单
3. 拖动语速滑块
4. 选择输出格式
```

### 调整高级参数
```
1. 点击 "高级参数 (Advanced)"
2. 拖动各个滑块
3. 观察实时数值
```

### 恢复默认
```
高级参数区域 → 点击 "恢复默认"
```

### 保存设置
```
点击 "保存并应用" 按钮
```

## 🎨 情感选项速查

| 情感 | 英文 | 适用场景 |
|------|------|---------|
| 默认 | default | 通用场景 |
| 智能 | auto | 自动分析 |
| 开心 | happy | 欢快内容 |
| 悲伤 | sad | 伤感内容 |
| 愤怒 | angry | 激动内容 |
| 恐惧 | fear | 紧张内容 |
| 惊讶 | surprise | 意外内容 |
| 中性 | neutral | 客观内容 |

## 🔢 数值推荐表

### Temperature 推荐值

| 场景 | 推荐值 | 说明 |
|------|--------|------|
| 新闻播报 | 0.5 | 最稳定 |
| 有声书 | 0.7 | 较稳定 |
| 对话 | 1.0 | 平衡 |
| 角色扮演 | 1.3 | 较多变 |
| 实验性 | 1.5+ | 最多变 |

### Speed 推荐值

| 场景 | 推荐值 | 说明 |
|------|--------|------|
| 学习材料 | 0.7 | 慢速清晰 |
| 有声书 | 0.9 | 舒缓 |
| 对话 | 1.0-1.1 | 自然 |
| 快速播报 | 1.3-1.5 | 高效 |
| 极速模式 | 1.8+ | 最快 |

### Top P 推荐值

| 场景 | 推荐值 | 说明 |
|------|--------|------|
| 高质量 | 0.6 | 最保守 |
| 播音 | 0.7 | 较保守 |
| 通用 | 0.8 | 推荐 |
| 多样化 | 0.9 | 较灵活 |
| 实验性 | 0.95+ | 最灵活 |

## 💾 API 调用速查

### Python
```python
import requests

requests.post("http://localhost:8080/v1/audio/speech", json={
    "input": "文本",
    "voice": "default",
    "emotion": "happy",
    "speed": 1.2,
    "temperature": 1.0,
    "top_p": 0.8,
    "top_k": 20,
    "repetition_penalty": 1.0
})
```

### JavaScript
```javascript
fetch("http://localhost:8080/v1/audio/speech", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    input: "文本",
    voice: "default",
    emotion: "happy",
    speed: 1.2,
    temperature: 1.0,
    top_p: 0.8,
    top_k: 20,
    repetition_penalty: 1.0
  })
})
```

### cURL
```bash
curl -X POST http://localhost:8080/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "文本",
    "voice": "default",
    "emotion": "happy",
    "speed": 1.2,
    "temperature": 1.0,
    "top_p": 0.8,
    "top_k": 20,
    "repetition_penalty": 1.0
  }' \
  --output output.wav
```

## 🎓 学习路径

### 新手 (第 1 天)
```
1. 使用默认参数
2. 尝试不同情感
3. 调整语速
```

### 进阶 (第 2-3 天)
```
1. 调整 Temperature
2. 尝试不同场景配置
3. 对比参数效果
```

### 专家 (第 4-7 天)
```
1. 精细调整所有参数
2. 创建自定义预设
3. 优化特定场景
```

## 📊 参数影响矩阵

|  | 质量 | 多样性 | 稳定性 | 性能 |
|---|------|--------|--------|------|
| Temperature ⬇️ | ⬆️ | ⬇️ | ⬆️ | ➡️ |
| Temperature ⬆️ | ⬇️ | ⬆️ | ⬇️ | ➡️ |
| Top P ⬇️ | ⬆️ | ⬇️ | ⬆️ | ⬆️ |
| Top P ⬆️ | ⬇️ | ⬆️ | ⬇️ | ⬇️ |
| Top K ⬇️ | ⬆️ | ⬇️ | ⬆️ | ⬆️ |
| Top K ⬆️ | ⬇️ | ⬆️ | ⬇️ | ⬇️ |
| Speed ⬆️ | ➡️ | ➡️ | ➡️ | ⬆️ |

## 🎯 一句话总结

| 参数 | 一句话说明 |
|------|-----------|
| **Temperature** | 控制随机性，越低越稳定 |
| **Top P** | 控制多样性，0.8 最平衡 |
| **Top K** | 候选数量，20 是推荐值 |
| **Rep Penalty** | 防止重复，1.0 是默认 |
| **Speed** | 语速倍率，1.0 是正常 |
| **Emotion** | 情感标签，auto 最智能 |

---

**提示**: 打印此页面作为快速参考！
