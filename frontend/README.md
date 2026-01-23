# AI 语音聊天客户端 (声音工坊)

一个具备语音合成能力的 LLM 聊天客户端，基于 Next.js 14 开发。

## 功能特性

- 🤖 **LLM 对话**：支持 OpenAI 兼容的 API，流式响应
- 🎙️ **智能语音合成**：自动提取对话中的引号内容，转为语音播放
- 🎵 **音频队列管理**：多段语音按顺序播放，不会重叠
- 💾 **配置持久化**：设置自动保存到 localStorage
- 🎨 **现代化 UI**：基于 Tailwind CSS，响应式设计
- 🎭 **角色系统**：支持自定义角色，每个角色有独立音色和系统提示词
- ⚙️ **可折叠设置面板**：快速切换角色和调整语音参数

## 核心逻辑

### 语音提取规则

前端会自动从 AI 回复中提取以下格式的文本：
- 中文双引号：`"对话内容"`
- 英文双引号：`"dialogue content"`

提取出的文本会：
1. 在聊天气泡中高亮显示（蓝色背景）
2. 自动发送到 TTS API 转为语音
3. 按顺序播放（通过音频队列管理）

### 音频队列

`AudioQueueManager` 类负责管理语音播放：
- 当检测到新的引号内容时，立即加入队列
- 当前音频播放完毕后，自动播放下一段
- 支持手动重播（点击消息旁的喇叭图标）

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
# 或
pnpm install
# 或
yarn install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 3. 配置设置

首次打开会自动弹出设置面板，需要配置：

**LLM 配置：**
- Base URL: 例如 `https://api.openai.com/v1`
- API Key: 你的 OpenAI API Key
- Model: 例如 `gpt-4` 或 `gpt-3.5-turbo`

**TTS 配置：**
- TTS API URL: 你的 TTS 服务地址，例如 `http://localhost:8080/v1/audio/speech`
- Character Voice: 角色声音 ID，例如 `girl_01`

## 项目结构

```
frontend/
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 主页面
├── components/
│   ├── ChatInterface.tsx    # 主聊天界面（核心逻辑）
│   ├── MessageBubble.tsx    # 消息气泡组件
│   └── SettingsModal.tsx    # 设置模态框
├── store/
│   ├── useSettings.ts       # 设置状态管理（Zustand）
│   └── useChat.ts           # 聊天状态管理
└── utils/
    ├── audioQueue.ts        # 音频队列管理器
    └── llmApi.ts            # LLM API 工具函数
```

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **音频**: HTML5 Audio API

## 依赖清单

### 生产依赖 (dependencies)

| 包名 | 版本 | 说明 |
|------|------|------|
| next | 14.2.0 | Next.js 框架核心 |
| react | ^18.3.0 | React 核心库 |
| react-dom | ^18.3.0 | React DOM 渲染 |
| zustand | ^4.5.0 | 轻量级状态管理库 |
| framer-motion | ^12.29.0 | 动画库，用于页面过渡和交互动效 |
| lucide-react | ^0.344.0 | 图标库 |
| dotenv | ^16.4.5 | 环境变量加载 |
| dotenv-cli | ^7.4.2 | CLI 环境变量工具，用于 npm scripts |

### 开发依赖 (devDependencies)

| 包名 | 版本 | 说明 |
|------|------|------|
| typescript | ^5 | TypeScript 编译器 |
| @types/node | ^20 | Node.js 类型定义 |
| @types/react | ^18 | React 类型定义 |
| @types/react-dom | ^18 | React DOM 类型定义 |
| tailwindcss | ^3.4.1 | Tailwind CSS 框架 |
| postcss | ^8.4.35 | CSS 后处理器 |
| autoprefixer | ^10.4.18 | CSS 浏览器前缀自动添加 |

### 安装所有依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install

# 或使用 yarn
yarn install
```

### 手动安装（如需单独安装）

```bash
# 生产依赖
npm install next@14.2.0 react@^18.3.0 react-dom@^18.3.0 zustand@^4.5.0 framer-motion@^12.29.0 lucide-react@^0.344.0 dotenv@^16.4.5 dotenv-cli@^7.4.2

# 开发依赖
npm install -D typescript@^5 @types/node@^20 @types/react@^18 @types/react-dom@^18 tailwindcss@^3.4.1 postcss@^8.4.35 autoprefixer@^10.4.18
```

## TTS API 接口

前端会向配置的 TTS API 发送以下请求：

```typescript
POST {tts.apiUrl}
Content-Type: application/json

{
  "input": "提取出的对话文本",
  "voice": "girl_01",
  "response_format": "wav"
}
```

响应应该是音频文件的 Blob。

## 使用示例

1. 用户输入：`请给我讲个故事`
2. AI 回复：`好的！从前有个小女孩，她对妈妈说："我想去森林里探险。"妈妈回答："那你要小心哦。"`
3. 前端自动提取：
   - `"我想去森林里探险。"`
   - `"那你要小心哦。"`
4. 这两句话会依次转为语音播放

## 开发说明

### 修改提取规则

如果需要修改语音提取的正则规则，编辑 `utils/audioQueue.ts` 中的 `extractQuotedTexts` 函数。

### 自定义样式

所有样式都使用 Tailwind CSS，可以直接在组件中修改 className。

### 添加新功能

- 状态管理：在 `store/` 目录下创建新的 Zustand store
- 新组件：在 `components/` 目录下创建
- 工具函数：在 `utils/` 目录下添加

## 构建生产版本

```bash
npm run build
npm start
```

## 常见问题

### Q: 语音没有播放？
A: 检查：
1. TTS API URL 是否正确
2. TTS 服务是否正常运行
3. 浏览器控制台是否有错误信息

### Q: 无法连接 LLM？
A: 检查：
1. Base URL 和 API Key 是否正确
2. 网络连接是否正常
3. 是否有 CORS 问题（可能需要配置代理）

### Q: 如何支持更多引号格式？
A: 修改 `utils/audioQueue.ts` 中的正则表达式，添加你需要的引号类型。

## License

MIT
