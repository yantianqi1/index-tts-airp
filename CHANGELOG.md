# 更新日志

## [2.0.0] - 智能情感控制版本

### 🎉 重大更新

#### 新增功能

1. **智能情感分析**
   - 基于 LLM（如 Gemini Flash）自动分析文本情感
   - 支持 OpenAI 兼容的 API 接口
   - 自动选择最合适的情感音色
   - 完善的容错机制和回退逻辑

2. **多情感支持**
   - 每个音色支持多种情感表达
   - 支持的情感：happy, sad, angry, fear, surprise, neutral, default
   - 可自定义情感标签

3. **新的目录结构**
   - 从扁平结构升级到层级结构
   - 格式：`presets/{voice_id}/{emotion}.wav`
   - 向后兼容旧的扁平结构

#### API 更新

1. **语音合成接口** (`POST /v1/audio/speech`)
   - 新增 `emotion` 参数
   - 支持 `"auto"` 自动情感分析
   - 支持手动指定情感

2. **音色列表接口** (`GET /v1/voices`)
   - 返回每个音色的可用情感列表
   - 显示是否包含默认音频

3. **上传接口** (`POST /v1/voices/upload`)
   - 支持指定 `voice_id` 和 `emotion`
   - 自动创建层级目录结构

#### 配置更新

新增环境变量：
```env
ENABLE_SMART_SENTIMENT=true
SENTIMENT_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
SENTIMENT_LLM_API_KEY=your-api-key
SENTIMENT_LLM_MODEL=gemini-1.5-flash
SENTIMENT_LABELS=["happy","sad","angry","fear","surprise","neutral","default"]
SENTIMENT_TIMEOUT=10
```

#### 工具和脚本

1. **目录迁移工具** (`scripts/migrate_presets.py`)
   - 自动将旧结构迁移到新结构
   - 支持备份原文件

2. **情感分析测试** (`scripts/test_smart_sentiment.py`)
   - 测试 LLM 配置
   - 验证情感识别准确率

3. **更新的默认音色生成** (`scripts/create_default_voice.py`)
   - 支持新的层级结构

#### 文档

1. **智能情感分析指南** (`SMART_SENTIMENT_GUIDE.md`)
   - 详细的配置说明
   - 支持的 LLM 服务
   - 使用示例和最佳实践

2. **更新的 README**
   - 新功能说明
   - API 文档更新
   - 常见问题解答

### 🔧 改进

1. **推理引擎**
   - 重构音频路径查找逻辑
   - 增强的降级机制
   - 更详细的日志输出

2. **错误处理**
   - 完善的异常捕获
   - 友好的错误提示
   - 自动回退机制

3. **性能优化**
   - 异步情感分析
   - 超时控制
   - 请求排队机制保持不变

### 📝 向后兼容

- 完全兼容旧的扁平目录结构
- 旧的 API 调用方式仍然有效
- 不指定 `emotion` 参数时默认使用 `"default"`

### 🔄 迁移指南

如果你使用的是旧版本：

1. **更新代码**
   ```bash
   git pull
   pip install -r requirements.txt
   ```

2. **迁移音色文件**（可选）
   ```bash
   python scripts/migrate_presets.py
   ```

3. **配置智能情感**（可选）
   - 编辑 `.env` 文件
   - 添加 LLM API Key
   - 重启服务

4. **测试功能**
   ```bash
   python test_api.py
   ```

### ⚠️ 破坏性变更

无。所有更新都是向后兼容的。

---

## [1.0.0] - 初始版本

### 功能

- 基于 IndexTTS 2.0 的语音合成
- FastAPI REST API
- Docker 容器化部署
- 请求排队机制（显存保护）
- WAV/MP3 格式输出
- 音色管理接口
- 完整的文档和测试脚本

### 技术栈

- Python 3.10+
- FastAPI
- PyTorch
- Docker & Docker Compose
- IndexTTS 2.0

---

## 未来计划

### v2.1.0
- [ ] 情感分析结果缓存
- [ ] 批量合成接口
- [ ] WebSocket 流式输出
- [ ] 音色预览功能

### v2.2.0
- [ ] 多语言支持优化
- [ ] 语速和音调精细控制
- [ ] 音色混合功能
- [ ] 管理后台界面

### v3.0.0
- [ ] 分布式部署支持
- [ ] 负载均衡
- [ ] 监控和告警
- [ ] 性能分析工具
