# TTS 项目前端集成指南

本文档说明如何将新创建的前端与现有的 TTS 后端服务集成。

## 项目结构

```
.
├── app/                    # 后端 FastAPI 服务
├── frontend/               # 新创建的 Next.js 前端
├── index-tts/             # IndexTTS 核心库
└── scripts/               # 部署脚本
```

## 快速启动

### 1. 启动后端 TTS 服务

```bash
# 安装依赖（如果还没安装）
pip install -r requirements.txt

# 启动服务
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

后端服务将运行在：`http://localhost:8080`

### 2. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在：`http://localhost:3000`

### 3. 配置前端

访问 `http://localhost:3000`，在设置面板中配置：

**LLM 配置：**
- Base URL: `https://api.openai.com/v1` （或你的 API 地址）
- API Key: 你的 OpenAI API Key
- Model: `gpt-4` 或其他模型

**TTS 配置：**
- TTS API URL: `http://localhost:8080/v1/audio/speech`
- Character Voice: `girl_01` （或其他可用的声音）

## API 接口对接

### 后端 TTS API

前端会调用以下接口：

```
POST http://localhost:8080/v1/audio/speech
Content-Type: application/json

{
  "input": "要合成的文本",
  "voice": "girl_01",
  "response_format": "wav"
}
```

### 检查后端兼容性

确保你的后端 `app/main.py` 中有对应的路由：

```python
@app.post("/v1/audio/speech")
async def create_speech(request: SpeechRequest):
    # 处理 TTS 请求
    # 返回音频文件
    pass
```

如果路由不同，需要在前端设置中修改 TTS API URL。

## 功能说明

### 核心功能流程

1. **用户输入** → 发送到 LLM API
2. **LLM 流式响应** → 前端实时显示
3. **提取引号内容** → 正则匹配 `"..."` 或 `"..."`
4. **发送到 TTS** → POST 请求到后端
5. **音频队列播放** → 按顺序播放，不重叠

### 语音提取示例

**AI 回复：**
```
好的！小红帽对妈妈说："我想去看望奶奶。"妈妈回答："路上要小心哦。"
```

**提取结果：**
- `"我想去看望奶奶。"`
- `"路上要小心哦。"`

这两句会依次转为语音播放。

## 测试

### 测试 TTS API

访问：`http://localhost:3000/test.html`

这是一个简单的测试页面，可以直接测试 TTS API 是否正常工作。

### 测试完整流程

1. 在聊天界面输入：`请用对话的形式讲一个故事`
2. 观察 AI 回复中的引号内容是否被高亮
3. 检查是否自动播放语音
4. 点击喇叭图标测试重播功能

## 部署

### 开发环境

```bash
# 终端 1: 启动后端
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080

# 终端 2: 启动前端
cd frontend && npm run dev
```

### 生产环境

#### 方案 1: 分离部署

**后端：**
```bash
# 使用 Docker 或直接运行
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

**前端：**
```bash
cd frontend
npm run build
npm start
```

#### 方案 2: 统一部署

可以使用 Nginx 反向代理：

```nginx
server {
    listen 80;
    
    # 前端
    location / {
        proxy_pass http://localhost:3000;
    }
    
    # 后端 API
    location /v1/ {
        proxy_pass http://localhost:8080;
    }
}
```

然后在前端设置中使用相对路径：
- TTS API URL: `/v1/audio/speech`

#### 方案 3: Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./checkpoints:/app/checkpoints
    environment:
      - MODEL_PATH=/app/checkpoints
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_TTS_URL=http://backend:8080
    depends_on:
      - backend
```

## 常见问题

### Q1: CORS 错误

**问题**: 前端无法访问后端 API，提示 CORS 错误。

**解决方案**: 在后端 `app/main.py` 中添加 CORS 中间件：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Q2: 音频无法播放

**问题**: TTS 请求成功，但音频无法播放。

**解决方案**:
1. 检查后端返回的 Content-Type 是否为 `audio/wav`
2. 确认浏览器支持 WAV 格式
3. 查看浏览器控制台的错误信息

### Q3: 语音提取不准确

**问题**: 某些引号内容没有被提取。

**解决方案**: 修改 `frontend/utils/audioQueue.ts` 中的正则表达式：

```typescript
// 当前规则
const quoteRegex = /[""]([^""]+)[""]|"([^"]+)"/g;

// 可以根据需要调整，例如支持单引号：
const quoteRegex = /[""]([^""]+)[""]|"([^"]+)"|'([^']+)'/g;
```

### Q4: 性能问题

**问题**: 大量对话时，音频队列堆积。

**解决方案**:
1. 在 `frontend/utils/audioQueue.ts` 中添加队列长度限制
2. 提供"停止播放"按钮
3. 优化 TTS API 响应速度

## 自定义开发

### 添加新的语音角色

1. 在后端添加新的 voice 配置
2. 在前端 `components/SettingsModal.tsx` 中添加到提示文本

### 修改 UI 样式

所有样式都在组件中使用 Tailwind CSS，直接修改 className 即可。

### 添加更多功能

可以考虑添加：
- 语音速度控制
- 音量控制
- 语音暂停/继续
- 导出对话历史
- 多语言支持

## 技术支持

如有问题，请检查：
1. 后端日志：查看 TTS 服务是否正常处理请求
2. 前端控制台：查看是否有 JavaScript 错误
3. 网络面板：检查 API 请求和响应

## 相关文档

- [前端 README](frontend/README.md)
- [前端快速启动](frontend/QUICK_START.md)
- [后端 API 文档](README.md)
- [使用指南](USAGE_GUIDE.md)
