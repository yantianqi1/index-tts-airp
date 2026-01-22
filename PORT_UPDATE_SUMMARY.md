# 🔄 端口更新完成

## ✅ 更新总结

所有服务端口已从 **5050** 成功更改为 **8080**

## �� 更新统计

- **更新文件数**: 40+ 个文件
- **涉及类型**: Python, TypeScript, Shell, Markdown, YAML, HTML
- **验证状态**: ✅ 全部通过

## 🎯 新的端口配置

### 后端服务
- **端口**: 8080
- **API 地址**: http://localhost:8080
- **API 文档**: http://localhost:8080/docs

### 前端服务
- **端口**: 3000（未变）
- **应用地址**: http://localhost:3000

## 🚀 启动服务

### 方式 1: 一键启动（推荐）
```bash
./start_all.sh
```

### 方式 2: 手动启动
```bash
# 终端 1: 后端
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080

# 终端 2: 前端
cd frontend && npm run dev
```

## 🔍 验证更改

运行验证脚本：
```bash
./verify_port_change.sh
```

或手动验证：
```bash
# 检查后端
curl http://localhost:8080/

# 检查端口占用
lsof -i :8080
```

## 📝 主要更新文件

### 核心配置
- ✅ `app/core/config.py` - 默认端口: 8080
- ✅ `.env.example` - PORT=8080
- ✅ `docker-compose.yml` - 端口映射: 8080:8080

### 前端配置
- ✅ `frontend/store/useSettings.ts` - TTS API: localhost:8080

### 启动脚本
- ✅ `start_all.sh` - 后端端口: 8080
- ✅ `scripts/start_service.sh` - 服务端口: 8080
- ✅ `scripts/stop_service.sh` - 停止端口: 8080

### 文档
- ✅ 所有 Markdown 文档已更新
- ✅ 所有示例代码已更新
- ✅ 所有配置说明已更新

## ⚠️ 注意事项

### 如果你有自定义配置

1. **环境变量文件 (.env)**
   如果你有 `.env` 文件，请手动更新：
   ```bash
   PORT=8080
   ```

2. **防火墙规则**
   如果配置了防火墙，需要开放 8080 端口：
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 8080
   
   # CentOS/RHEL
   sudo firewall-cmd --add-port=8080/tcp --permanent
   sudo firewall-cmd --reload
   ```

3. **云服务安全组**
   在云服务器控制台中，将安全组规则从 5050 改为 8080

4. **反向代理配置**
   如果使用 Nginx 等反向代理，更新配置：
   ```nginx
   location /v1/ {
       proxy_pass http://localhost:8080;
   }
   ```

5. **客户端应用**
   所有调用 API 的客户端都需要更新端口号

## 📚 相关文档

- [PORT_CHANGE_NOTES.md](PORT_CHANGE_NOTES.md) - 详细更改说明
- [GET_STARTED.md](GET_STARTED.md) - 快速开始指南
- [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - 前端集成指南

## 🎉 完成

端口更改已全部完成并验证通过！现在可以使用新的端口 8080 启动服务了。

```bash
./start_all.sh
```

访问：
- 前端: http://localhost:3000
- 后端: http://localhost:8080
- API 文档: http://localhost:8080/docs
