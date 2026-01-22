# 端口更改说明

## 更改内容

所有服务端口已从 **5050** 更改为 **8080**

## 更新的文件

### 核心配置文件
- ✅ `app/core/config.py` - 默认端口配置
- ✅ `.env.example` - 环境变量示例
- ✅ `docker-compose.yml` - Docker 端口映射

### 前端配置
- ✅ `frontend/store/useSettings.ts` - TTS API 默认地址

### 脚本文件
- ✅ `start_all.sh` - 启动脚本
- ✅ `stop_all.sh` - 停止脚本（通过 pkill）
- ✅ `scripts/start_service.sh` - 服务启动脚本
- ✅ `scripts/stop_service.sh` - 服务停止脚本
- ✅ `scripts/deploy_direct.sh` - 部署脚本
- ✅ `scripts/quick_start.sh` - 快速启动脚本
- ✅ `scripts/quick_tunnel.sh` - 隧道脚本
- ✅ `scripts/setup_cloudflare_tunnel.sh` - Cloudflare 隧道配置
- ✅ `scripts/setup_frp.sh` - FRP 配置
- ✅ `scripts/setup_natapp.sh` - NATAPP 配置
- ✅ `scripts/bind_domain.sh` - 域名绑定脚本

### 测试文件
- ✅ `test_api.py` - API 测试
- ✅ `examples/api_examples.py` - API 示例

### 文档文件
- ✅ `README.md` - 主文档
- ✅ `USAGE_GUIDE.md` - 使用指南
- ✅ `QUICK_REFERENCE.md` - 快速参考
- ✅ `GET_STARTED.md` - 快速开始
- ✅ `PROJECT_OVERVIEW.md` - 项目总览
- ✅ `FRONTEND_INTEGRATION.md` - 前端集成指南
- ✅ `DELIVERY_CHECKLIST.md` - 交付清单
- ✅ `frontend/README.md` - 前端文档
- ✅ `frontend/QUICK_START.md` - 前端快速启动
- ✅ `frontend/ARCHITECTURE.md` - 前端架构
- ✅ `frontend/PROJECT_SUMMARY.md` - 前端项目总结
- ✅ `frontend/DEMO_SCRIPT.md` - 演示脚本
- ✅ `frontend/public/test.html` - TTS 测试页面

## 新的访问地址

### 开发环境
- 后端 API: `http://localhost:8080`
- API 文档: `http://localhost:8080/docs`
- 前端应用: `http://localhost:3000`

### 配置示例

#### 前端设置
```
TTS API URL: http://localhost:8080/v1/audio/speech
```

#### 环境变量
```bash
PORT=8080
```

#### Docker
```yaml
ports:
  - "8080:8080"
```

## 启动服务

### 一键启动
```bash
./start_all.sh
```

服务将在以下端口启动：
- 后端: 8080
- 前端: 3000

### 手动启动后端
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### 手动启动前端
```bash
cd frontend
npm run dev
```

## 验证更改

### 检查后端
```bash
curl http://localhost:8080/
```

### 检查端口占用
```bash
lsof -i :8080
```

### 查看进程
```bash
ps aux | grep uvicorn
```

## 注意事项

1. **防火墙规则**: 如果之前配置了防火墙规则允许 5050 端口，需要更新为 8080
2. **反向代理**: 如果使用 Nginx 等反向代理，需要更新配置
3. **云服务**: 如果部署在云服务器，需要在安全组中开放 8080 端口
4. **环境变量**: 如果有 `.env` 文件，需要手动更新 `PORT=8080`
5. **客户端配置**: 所有调用 API 的客户端都需要更新端口号

## 回滚方法

如果需要回滚到 5050 端口，可以执行：

```bash
# 批量替换回 5050
find . -type f \( -name "*.md" -o -name "*.sh" -o -name "*.py" -o -name "*.html" -o -name "*.ts" -o -name "*.tsx" \) \
  ! -path "./node_modules/*" ! -path "./.next/*" ! -path "./index-tts/*" ! -path "./.git/*" \
  -exec sed -i '' 's/localhost:8080/localhost:5050/g' {} +

find . -type f \( -name "*.md" -o -name "*.sh" -o -name "*.py" -o -name "*.html" -o -name "*.ts" -o -name "*.tsx" \) \
  ! -path "./node_modules/*" ! -path "./.next/*" ! -path "./index-tts/*" ! -path "./.git/*" \
  -exec sed -i '' 's/:8080/:5050/g' {} +
```

然后手动更新：
- `app/core/config.py` 中的 `port: int = 5050`
- `.env.example` 中的 `PORT=5050`

## 更新日期

2024-01-22

## 更新人员

Kiro AI Assistant
