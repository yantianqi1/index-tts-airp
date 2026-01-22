# 部署检查清单

使用此清单确保 VoiceNexus 服务正确部署和配置。

## 📋 部署前检查

### 1. 环境准备

- [ ] Docker 已安装（版本 20.10+）
- [ ] Docker Compose 已安装（版本 2.0+）
- [ ] （GPU 部署）NVIDIA Docker Runtime 已安装
- [ ] （GPU 部署）GPU 驱动正常工作
- [ ] 磁盘空间充足（至少 20 GB）

**验证命令：**
```bash
docker --version
docker-compose --version
nvidia-smi  # GPU 环境
```

### 2. 项目文件

- [ ] 项目代码已下载/克隆
- [ ] 所有必需文件存在
- [ ] `.env` 文件已创建（从 `.env.example` 复制）

**验证命令：**
```bash
ls -la
test -f .env && echo "✓ .env exists" || echo "✗ .env missing"
```

### 3. 模型文件

- [ ] IndexTTS 2.0 模型已下载到 `weights/` 目录
- [ ] `weights/config.yaml` 存在
- [ ] 模型文件完整（约 2-5 GB）

**验证命令：**
```bash
ls -lh weights/
test -f weights/config.yaml && echo "✓ Config exists" || echo "✗ Config missing"
```

**跳过此步骤：** 服务会以 Mock 模式运行（仅用于测试）

### 4. 音色文件

- [ ] `presets/` 目录已创建
- [ ] 至少有一个音色文件夹（如 `presets/default/`）
- [ ] 每个音色文件夹包含 `default.wav`

**验证命令：**
```bash
ls -la presets/
find presets/ -name "default.wav"
```

**快速创建：**
```bash
python scripts/create_default_voice.py
```

## 📝 配置检查

### 1. 基础配置

在 `.env` 文件中检查：

- [ ] `WEIGHTS_DIR` 路径正确
- [ ] `PRESETS_DIR` 路径正确
- [ ] `DEVICE` 设置正确（`cuda` 或 `cpu`）

### 2. 智能情感配置（可选）

- [ ] `ENABLE_SMART_SENTIMENT` 设置为 `true`（如需启用）
- [ ] `SENTIMENT_LLM_API_KEY` 已配置
- [ ] `SENTIMENT_LLM_MODEL` 已设置
- [ ] `SENTIMENT_LABELS` 与音频文件匹配

**测试配置：**
```bash
python scripts/test_smart_sentiment.py --config-only
```

### 3. Docker 配置

在 `docker-compose.yml` 中检查：

- [ ] 端口映射正确（默认 5050:5050）
- [ ] 卷挂载路径正确
- [ ] GPU 配置正确（如使用 GPU）

## 🚀 部署步骤

### 1. 构建镜像

```bash
docker-compose build
```

**检查点：**
- [ ] 构建成功，无错误
- [ ] 镜像大小合理（约 5-10 GB）

**验证：**
```bash
docker images | grep voicenexus
```

### 2. 启动服务

```bash
docker-compose up -d
```

**检查点：**
- [ ] 容器启动成功
- [ ] 无错误日志

**验证：**
```bash
docker-compose ps
docker-compose logs --tail=50
```

### 3. 等待模型加载

⏱️ 首次启动需要 2-5 分钟加载模型

**监控日志：**
```bash
docker-compose logs -f
```

**等待看到：**
```
✓ 模型加载完成
✓ 服务已启动: http://0.0.0.0:5050
```

## ✅ 功能测试

### 1. 健康检查

```bash
curl http://localhost:5050/
```

**预期响应：**
```json
{
  "service": "VoiceNexus",
  "version": "1.0.0",
  "status": "running"
}
```

- [ ] 响应正常
- [ ] 状态为 "running"

### 2. 音色列表

```bash
curl http://localhost:5050/v1/voices
```

**预期响应：**
```json
{
  "voices": [
    {
      "id": "default",
      "name": "default",
      "emotions": ["default"],
      "has_default": true
    }
  ]
}
```

- [ ] 返回音色列表
- [ ] 至少有一个音色

### 3. 语音合成（基础）

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "测试文本",
    "voice": "default",
    "emotion": "default"
  }' \
  --output test.wav
```

- [ ] 请求成功（HTTP 200）
- [ ] 生成了 `test.wav` 文件
- [ ] 文件大小 > 0

**验证音频：**
```bash
ls -lh test.wav
file test.wav
```

### 4. 智能情感分析（如已启用）

```bash
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "input": "太棒了！我真的很开心！",
    "voice": "default",
    "emotion": "auto"
  }' \
  --output test_auto.wav
```

- [ ] 请求成功
- [ ] 日志显示情感分析结果
- [ ] 生成了音频文件

**检查日志：**
```bash
docker-compose logs | grep "情感分析"
```

### 5. 运行完整测试

```bash
python test_api.py
```

- [ ] 所有测试通过
- [ ] 生成了测试音频文件

## 🔍 性能检查

### 1. 资源使用

```bash
docker stats voicenexus-api
```

**检查：**
- [ ] CPU 使用率合理（< 80%）
- [ ] 内存使用正常（< 8 GB）
- [ ] GPU 使用正常（如适用）

### 2. 响应时间

使用 API 文档测试：http://localhost:5050/docs

**检查：**
- [ ] 健康检查 < 100ms
- [ ] 音色列表 < 500ms
- [ ] 语音合成 < 5s（取决于文本长度）

### 3. 并发测试（可选）

```bash
# 使用 Apache Bench
ab -n 10 -c 2 -p request.json -T application/json \
  http://localhost:5050/v1/audio/speech
```

**检查：**
- [ ] 请求排队正常工作
- [ ] 无 OOM 错误
- [ ] 所有请求成功

## 🔒 安全检查

### 1. 网络安全

- [ ] 仅暴露必要端口
- [ ] 考虑使用反向代理（Nginx）
- [ ] 配置防火墙规则

### 2. 数据安全

- [ ] `.env` 文件权限正确（600）
- [ ] API Key 未泄露到日志
- [ ] 敏感数据已加密

```bash
chmod 600 .env
```

### 3. 访问控制

- [ ] 考虑添加 API Key 认证
- [ ] 实现速率限制
- [ ] 配置 CORS（如需要）

## 📊 监控设置

### 1. 日志

- [ ] 日志正常写入 `logs/` 目录
- [ ] 日志轮转配置正确
- [ ] 日志级别适当

```bash
ls -lh logs/
tail -f logs/*.log
```

### 2. 告警（可选）

- [ ] 设置磁盘空间告警
- [ ] 设置服务健康检查
- [ ] 配置错误通知

### 3. 备份

- [ ] 音色文件已备份
- [ ] 配置文件已备份
- [ ] 模型文件有备份计划

## 🌐 外部访问（可选）

### 使用 Cloudflare Tunnel

```bash
cloudflared tunnel --url localhost:5050
```

- [ ] Tunnel 启动成功
- [ ] 获得公网 URL
- [ ] 外部可访问

### 使用 Nginx 反向代理

- [ ] Nginx 配置正确
- [ ] SSL 证书已配置
- [ ] 域名解析正确

## 📱 客户端集成测试

### Python 客户端

```python
import requests

response = requests.post(
    "http://localhost:5050/v1/audio/speech",
    json={"input": "测试", "voice": "default"}
)
assert response.status_code == 200
```

- [ ] Python 客户端正常工作

### JavaScript 客户端

```javascript
const response = await fetch("http://localhost:5050/v1/audio/speech", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ input: "测试", voice: "default" })
});
```

- [ ] JavaScript 客户端正常工作

## 🎯 生产环境额外检查

### 1. 高可用性

- [ ] 配置自动重启（`restart: unless-stopped`）
- [ ] 设置健康检查
- [ ] 准备故障恢复方案

### 2. 性能优化

- [ ] 启用 FP16 推理（如使用 GPU）
- [ ] 配置合适的超时时间
- [ ] 优化 Docker 镜像大小

### 3. 文档

- [ ] 部署文档已更新
- [ ] API 文档可访问
- [ ] 故障排查指南已准备

## ✨ 部署完成

当所有检查项都完成后：

```bash
echo "🎉 VoiceNexus 部署成功！"
echo "API 地址: http://localhost:5050"
echo "API 文档: http://localhost:5050/docs"
```

## 🆘 故障排查

如果遇到问题，按以下顺序检查：

1. **查看日志**
   ```bash
   docker-compose logs -f
   ```

2. **检查容器状态**
   ```bash
   docker-compose ps
   docker inspect voicenexus-api
   ```

3. **验证配置**
   ```bash
   cat .env
   docker-compose config
   ```

4. **测试组件**
   ```bash
   python scripts/test_indextts_installation.py
   python scripts/test_smart_sentiment.py
   ```

5. **重启服务**
   ```bash
   docker-compose restart
   ```

6. **完全重建**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## 📞 获取帮助

- 📖 查看 [完整文档](./README.md)
- 🔧 查看 [故障排查指南](./PROJECT_OVERVIEW.md#故障排查)
- 💬 提交 [Issue](https://github.com/your-repo/issues)

---

**检查清单版本**: 2.0.0  
**最后更新**: 2025-01-22
