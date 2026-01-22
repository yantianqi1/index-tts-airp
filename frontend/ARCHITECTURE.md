# 架构设计文档

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js 14 前端应用                      │    │
│  │                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │    │
│  │  │ ChatInterface│  │SettingsModal │  │MessageBubble│ │    │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │    │
│  │                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐                │    │
│  │  │  useChat     │  │ useSettings  │  (Zustand)     │    │
│  │  └──────────────┘  └──────────────┘                │    │
│  │                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐                │    │
│  │  │AudioQueueMgr │  │  llmApi      │  (Utils)       │    │
│  │  └──────────────┘  └──────────────┘                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                    │                    │
                    │ HTTP/SSE           │ HTTP
                    ▼                    ▼
        ┌──────────────────┐   ┌──────────────────┐
        │   LLM API        │   │   TTS API        │
        │  (OpenAI 兼容)   │   │  (FastAPI)       │
        └──────────────────┘   └──────────────────┘
```

## 核心模块

### 1. 状态管理 (Zustand)

#### useSettings.ts
- **职责**: 管理 LLM 和 TTS 配置
- **持久化**: localStorage
- **数据结构**:
  ```typescript
  {
    llm: { baseUrl, apiKey, model },
    tts: { apiUrl, voice },
    isConfigured: boolean
  }
  ```

#### useChat.ts
- **职责**: 管理聊天消息和状态
- **数据结构**:
  ```typescript
  {
    messages: Message[],
    isStreaming: boolean,
    extractedTexts?: string[]  // 每条消息提取的语音文本
  }
  ```

### 2. 音频队列管理器 (AudioQueueManager)

**核心功能**:
- 维护一个 FIFO 队列
- 串行播放音频，避免重叠
- 自动调用 TTS API 合成语音

**工作流程**:
```
1. enqueue(text) → 添加到队列
2. processQueue() → 取出第一个任务
3. synthesizeSpeech(text) → 调用 TTS API
4. playAudio(blob) → 播放音频
5. onended → 递归调用 processQueue()
```

**关键方法**:
- `enqueue(text)`: 添加文本到队列
- `stop()`: 停止当前播放并清空队列
- `updateConfig()`: 更新 TTS 配置

### 3. 语音提取 (extractQuotedTexts)

**正则表达式**:
```javascript
/[""]([^""]+)[""]|"([^"]+)"/g
```

**匹配规则**:
- 中文双引号: `"文本"`
- 英文双引号: `"text"`

**提取流程**:
```
AI 回复 → 正则匹配 → 去除引号 → 过滤空白 → 返回数组
```

### 4. LLM 流式处理 (streamChatCompletion)

**技术**: Server-Sent Events (SSE)

**流程**:
```
1. fetch() 发起请求，stream: true
2. getReader() 获取流读取器
3. 循环 read() 读取数据块
4. 解析 "data: {...}" 格式
5. yield delta.content
6. 调用方实时更新 UI
```

## 数据流

### 完整对话流程

```
用户输入
  ↓
addMessage (user)
  ↓
addMessage (assistant, empty)
  ↓
streamChatCompletion()
  ↓
for await (chunk) {
  fullContent += chunk
  extractedTexts = extractQuotedTexts(fullContent)
  newTexts = diff(extractedTexts, processedTexts)
  
  for (text of newTexts) {
    audioManager.enqueue(text)  ← 实时加入队列
  }
  
  updateLastMessage(fullContent, extractedTexts)
}
  ↓
setStreaming(false)
```

### 音频播放流程

```
enqueue(text)
  ↓
queue.push(task)
  ↓
if (!isPlaying) processQueue()
  ↓
task = queue.shift()
  ↓
synthesizeSpeech(task.text)
  ↓ POST /v1/audio/speech
TTS API
  ↓ Blob
playAudio(blob)
  ↓
new Audio(url)
  ↓
audio.play()
  ↓
audio.onended → processQueue() (递归)
```

## 组件层次

```
page.tsx
  └─ ChatInterface
       ├─ Header
       │    ├─ Title
       │    └─ Buttons (Settings, Clear)
       │
       ├─ Messages Container
       │    └─ MessageBubble (多个)
       │         ├─ Content (高亮引号)
       │         └─ Replay Button
       │
       ├─ Input Area
       │    ├─ Textarea
       │    └─ Send Button
       │
       └─ SettingsModal
            ├─ LLM Config
            │    ├─ Base URL
            │    ├─ API Key
            │    └─ Model (+ Fetch Button)
            │
            └─ TTS Config
                 ├─ API URL
                 └─ Voice
```

## 关键技术决策

### 1. 为什么选择 Zustand？
- 轻量级（~1KB）
- API 简洁，学习成本低
- 内置 persist 中间件
- 无需 Provider 包裹

### 2. 为什么不用 WebSocket？
- LLM API 标准是 SSE (Server-Sent Events)
- 单向数据流，SSE 更简单
- 浏览器原生支持，无需额外库

### 3. 为什么用队列而不是并发播放？
- 避免多段语音重叠
- 保持对话的连贯性
- 用户体验更好

### 4. 为什么实时提取而不是等回复完成？
- 减少用户等待时间
- 边生成边播放，体验更流畅
- 利用 LLM 流式响应的优势

## 性能优化

### 1. 避免重复提取
```typescript
const processedTextsRef = useRef<Set<string>>(new Set());

// 只处理新增的文本
const newTexts = extractedTexts.filter(
  text => !processedTextsRef.current.has(text)
);
```

### 2. 音频资源清理
```typescript
audio.onended = () => {
  URL.revokeObjectURL(url);  // 释放 Blob URL
  this.currentAudio = null;
};
```

### 3. 组件优化
- 使用 `useRef` 避免不必要的重渲染
- 音频管理器单例模式
- 消息列表虚拟滚动（可选，消息量大时）

## 扩展性设计

### 1. 支持多种 TTS 服务
修改 `AudioQueueManager.synthesizeSpeech()` 方法，适配不同的 API 格式。

### 2. 支持多种提取规则
```typescript
// 可配置的提取器
interface TextExtractor {
  extract(text: string): string[];
}

class QuoteExtractor implements TextExtractor {
  extract(text: string): string[] {
    // 引号提取逻辑
  }
}

class BracketExtractor implements TextExtractor {
  extract(text: string): string[] {
    // 括号提取逻辑
  }
}
```

### 3. 插件系统
```typescript
interface ChatPlugin {
  onMessageReceived?(message: Message): void;
  onTextExtracted?(texts: string[]): void;
  onAudioPlayed?(text: string): void;
}
```

## 安全考虑

### 1. API Key 保护
- 存储在 localStorage（客户端）
- 不要提交到 Git
- 生产环境建议使用后端代理

### 2. XSS 防护
- React 自动转义
- 不使用 `dangerouslySetInnerHTML`

### 3. CORS 配置
- 后端需要正确配置 CORS
- 生产环境限制 origin

## 测试策略

### 单元测试
- `extractQuotedTexts()` 函数
- `AudioQueueManager` 类方法
- Zustand store actions

### 集成测试
- LLM API 调用
- TTS API 调用
- 完整对话流程

### E2E 测试
- 用户输入 → AI 回复 → 语音播放
- 设置保存和加载
- 错误处理

## 未来改进

### 短期
- [ ] 添加语音控制（暂停/继续/停止）
- [ ] 支持语音速度调节
- [ ] 添加音量控制
- [ ] 导出对话历史

### 中期
- [ ] 支持多语言 UI
- [ ] 添加主题切换（暗色模式）
- [ ] 语音可视化（波形图）
- [ ] 离线模式支持

### 长期
- [ ] 语音输入（STT）
- [ ] 多角色对话（不同声音）
- [ ] 情感识别和语音情感
- [ ] 实时翻译
