# VoiceNexus 部署检查清单

使用本清单确保所有步骤都已正确完成。

## 📋 环境准备

- [ ] Ubuntu 22.04 LTS 或其他 Linux 系统
- [ ] NVIDIA GPU（至少 8GB 显存）
- [ ] NVIDIA 驱动已安装（运行 `nvidia-smi` 验证）
- [ ] Docker 已安装（运行 `docker --version` 验证）
- [ ] Docker Compose 已安装（运行 `docker-compose --version` 验证）
- [ ] NVIDIA Container Toolkit 已安装（运行 `docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi` 验证）

## 📦 模型准备

- [ ] 已下载 IndexTTS2 模型到 `weights/` 目录
- [ ] `weights/config.yaml` 文件存在
- [ ] 模型文件完整（至少包含 config.yaml 和模型权重文件）
- [ ] 运行 `python scripts/test_indextts_installation.py` 验证模型

## 🎵 音色准备

- [ ] `presets/` 目录已创建
- [ ] 至少有一个 `default.wav` 文件（运行 `python scripts/create_default_voice.py` 创建）
- [ ] 音色文件组织正确（新结构或旧结构）
- [ ] 音频文件格式正确（WAV，采样率 16kHz 或更高）

## ⚙️ 配置文件

- [ ] `.env` 文件已创建（从 `.env.example` 复制）
- [ ] 端口配置正确（默认 5050）
- [ ] 设备配置正确（`DEVICE=cuda`）
- [ ] 如需智能情感分析，已配置 LLM API 密钥

## 🐳 Docker 部署

- [ ] `Dockerfile` 存在且未修改（除非有自定义需求）
- [ ] `docker-compose.yml` 存在且未修改
- [ ] 运行 `docker-compose config` 验证配置
- [ ] 运行 `docker-compose up -d` 启动服务
- [ ] 运行 `docker-compose ps` 检查容器状态
- [ ] 运行 `docker-compose logs` 查看日志，确认无错误

## 🧪 功能测试

- [ ] 访问 `http://localhost:5050/` 返回健康状态
- [ ] 访问 `http://localhost:5050/docs` 查看 API 文档
- [ ] 运行 `python test_api.py` 测试所有 API
- [ ] 测试基础语音合成
- [ ] 测试获取音色列表
- [ ] 测试上传音色（可选）
- [ ] 测试智能情感分析（如已配置）

## 📊 性能验证

- [ ] 首次推理成功（可能较慢）
- [ ] 后续推理速度正常（< 2秒）
- [ ] GPU 显存占用正常（< 8GB）
- [ ] 无 OOM 错误
- [ ] 并发请求正常排队

## 🌐 网络访问（可选）

- [ ] 如需公网访问，已安装 cloudflared
- [ ] 运行 `cloudflared tunnel --url localhost:5050`
- [ ] 获得公网 URL 并测试访问

## 📚 文档检查

- [ ] 已阅读 `README.md`
- [ ] 已阅读 `COMPLETE_GUIDE.md`（推荐）
- [ ] 已阅读 `INTEGRATION_GUIDE.md`（如需集成真实模型）
- [ ] 已查看 `examples/api_examples.py`（了解 API 用法）

## 🔧 故障排除

如遇到问题，按以下顺序检查：

1. **查看日志**
   ```bash
   docker-compose logs -f
   ```

2. **运行诊断工具**
   ```bash
   python scripts/test_indextts_installation.py
   ```

3. **检查 GPU**
   ```bash
   nvidia-smi
   docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
   ```

4. **重启服务**
   ```bash
   docker-compose restart
   ```

5. **重新构建**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## ✅ 最终验证

运行以下命令进行完整测试：

```bash
# 1. 健康检查
curl http://localhost:5050/

# 2. 获取音色列表
curl http://localhost:5050/v1/voices

# 3. 语音合成
curl -X POST http://localhost:5050/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input": "你好，世界！", "voice": "default"}' \
  --output test.wav

# 4. 检查生成的音频
file test.wav
```

如果所有测试通过，恭喜！VoiceNexus 已成功部署。

## 📝 生产环境额外检查

如果要部署到生产环境，还需要：

- [ ] 配置反向代理（Nginx/Caddy）
- [ ] 启用 HTTPS
- [ ] 配置防火墙规则
- [ ] 设置日志轮转
- [ ] 配置监控和告警
- [ ] 设置自动重启（systemd）
- [ ] 配置备份策略
- [ ] 进行压力测试
- [ ] 准备应急预案

## 🎉 完成

所有检查项都完成后，你的 VoiceNexus 服务就可以正常使用了！

**下一步：**
- 查看 `examples/api_examples.py` 学习 API 用法
- 阅读 `COMPLETE_GUIDE.md` 了解高级功能
- 加入 IndexTTS 社区交流使用经验

---

**提示**: 将此清单打印出来，逐项检查，确保不遗漏任何步骤。
