# 🚀 开始使用

## 最快启动方式

```bash
# 1. 一键启动前后端
./start_all.sh

# 2. 打开浏览器
# 访问 http://localhost:3000
```

就这么简单！🎉

## 首次配置

打开浏览器后，会自动弹出设置面板：

### LLM 配置
- **Base URL**: `https://api.openai.com/v1`
- **API Key**: 你的 OpenAI API Key
- **Model**: `gpt-4` 或 `gpt-3.5-turbo`

### TTS 配置
- **TTS API URL**: `http://localhost:8080/v1/audio/speech`
- **Character Voice**: `girl_01`

点击"保存"即可开始使用！

## 试试这个

输入：
```
请用对话的形式讲一个小红帽的故事
```

你会看到：
- ✅ AI 流式回复（打字机效果）
- ✅ 对话内容被高亮显示
- ✅ 自动转为语音播放
- ✅ 可以点击喇叭图标重播

## 停止服务

```bash
./stop_all.sh
```

## 需要帮助？

查看详细文档：
- **快速开始**: [frontend/QUICK_START.md](frontend/QUICK_START.md)
- **完整文档**: [frontend/README.md](frontend/README.md)
- **项目总览**: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- **集成指南**: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)

## 常见问题

### Q: 语音没有播放？
A: 确保 TTS 服务正在运行（端口 8080）

### Q: 无法连接 LLM？
A: 检查 API Key 和网络连接

### Q: CORS 错误？
A: 查看 [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) 的 CORS 配置部分

---

**祝使用愉快！** 🎉
