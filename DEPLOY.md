# Voice AI Workbench - 部署指南

## 快速启动

### 1. 启动后端 TTS 服务

```bash
# 启动 IndexTTS 服务（端口 9880）
cd index-tts
python -m indextts.infer_v2 --port 9880
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:3000

### 3. 配置

首次使用点击左侧 "全局设置"：

**LLM 配置**:
- Base URL: `http://localhost:11434/v1`
- API Key: `ollama`
- Model: `qwen2.5:latest`

**TTS 配置**:
- Base URL: `http://localhost:9880`
- Voice: `girl_01`

点击保存即可使用。

## 生产部署

### 使用 Docker Compose

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 单独部署

**后端**:
```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 9880
```

**前端**:
```bash
cd frontend
npm run build
npm start
```

## 功能说明

- **💬 AI 语音对话**: 引号内容自动转语音
- **📝 文本转语音**: 批量转换工具
- **📦 语音仓库**: 作品展示
- **⚙️ 全局设置**: 配置中心

完成！
