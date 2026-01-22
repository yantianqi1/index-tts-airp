# 快速启动指南

## 一、安装依赖

```bash
cd frontend
npm install
```

## 二、启动开发服务器

```bash
npm run dev
```

浏览器访问：http://localhost:3000

## 三、配置设置

首次打开会自动弹出设置面板：

### LLM 配置
- **Base URL**: `https://api.openai.com/v1` （或你的中转地址）
- **API Key**: `sk-xxxxx` （你的 OpenAI API Key）
- **Model**: `gpt-4` 或 `gpt-3.5-turbo`

点击"获取列表"按钮可以自动拉取可用模型。

### TTS 配置
- **TTS API URL**: `http://localhost:8080/v1/audio/speech`
- **Character Voice**: `girl_01`

可选的 voice 值：
- `girl_01`, `girl_02`, `girl_03` - 女声
- `boy_01`, `boy_02`, `boy_03` - 男声

## 四、开始使用

1. 在输入框输入消息，例如：`请给我讲个故事`
2. AI 会回复，其中双引号内的对话会自动转为语音
3. 点击消息旁的喇叭图标可以重播语音

## 五、示例对话

**用户**: 请用对话的形式讲一个小红帽的故事

**AI**: 好的！

小红帽："妈妈，我可以去看望奶奶吗？"

妈妈："当然可以，但是要小心，不要离开小路。"

小红帽："我会的，妈妈！"

（前端会自动提取三句对话并依次播放语音）

## 六、常用命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 七、故障排查

### 问题：语音没有播放
**解决方案**：
1. 确保 TTS 服务正在运行（`http://localhost:8080`）
2. 检查浏览器控制台是否有错误
3. 确认 TTS API URL 配置正确

### 问题：无法连接 LLM
**解决方案**：
1. 检查 API Key 是否正确
2. 确认网络连接正常
3. 如果使用中转地址，确保地址可访问

### 问题：CORS 错误
**解决方案**：
如果遇到跨域问题，可以在 `next.config.mjs` 中添加代理配置：

```javascript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/llm/:path*',
        destination: 'https://api.openai.com/v1/:path*',
      },
      {
        source: '/api/tts/:path*',
        destination: 'http://localhost:8080/v1/:path*',
      },
    ];
  },
};
```

然后在设置中使用：
- LLM Base URL: `/api/llm`
- TTS API URL: `/api/tts/audio/speech`

## 八、自定义配置

### 修改默认设置
编辑 `store/useSettings.ts`：

```typescript
llm: {
  baseUrl: 'https://your-api.com/v1',  // 修改默认 URL
  apiKey: '',
  model: 'gpt-4',
},
tts: {
  apiUrl: 'http://localhost:8080/v1/audio/speech',
  voice: 'girl_01',  // 修改默认声音
},
```

### 修改提取规则
编辑 `utils/audioQueue.ts` 中的 `extractQuotedTexts` 函数，自定义正则表达式。

## 九、部署到生产环境

### Vercel 部署
```bash
npm install -g vercel
vercel
```

### Docker 部署
创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

构建并运行：
```bash
docker build -t tts-chat-client .
docker run -p 3000:3000 tts-chat-client
```

## 十、与后端 TTS 服务集成

确保你的 TTS 服务支持以下接口：

```
POST /v1/audio/speech
Content-Type: application/json

{
  "input": "要合成的文本",
  "voice": "girl_01",
  "response_format": "wav"
}

Response: audio/wav (Blob)
```

如果你的 TTS API 格式不同，可以修改 `utils/audioQueue.ts` 中的 `synthesizeSpeech` 方法。
