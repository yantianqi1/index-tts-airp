# 域名绑定快速参考

## 🎯 前提条件

- ✅ 域名已托管在 Cloudflare
- ✅ 已创建 Cloudflare Tunnel
- ✅ 服务正常运行

## ⚡ 快速绑定（推荐）

```bash
# 一键绑定
chmod +x scripts/bind_domain.sh
./scripts/bind_domain.sh
```

按提示操作：
1. 选择隧道名称
2. 输入域名（如 `api.example.com`）
3. 确认绑定
4. 自动更新配置
5. 重启隧道

## 📝 手动绑定

### 步骤 1: 查看隧道

```bash
cloudflared tunnel list
```

### 步骤 2: 绑定域名

```bash
cloudflared tunnel route dns <TUNNEL_NAME> api.example.com
```

### 步骤 3: 更新配置

编辑 `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.example.com
    service: http://localhost:5050
  - service: http_status:404
```

### 步骤 4: 重启隧道

```bash
# 如果使用 systemd
sudo systemctl restart cloudflared-tunnel

# 或手动运行
cloudflared tunnel run <TUNNEL_NAME>
```

## ✅ 验证绑定

```bash
# 1. 等待 DNS 生效（1-5 分钟）
sleep 60

# 2. 检查 DNS
nslookup api.example.com

# 3. 测试访问
curl https://api.example.com

# 4. 浏览器访问
# https://api.example.com/docs

# 5. 完整测试
export PUBLIC_URL=https://api.example.com
python test_public_api.py
```

## 🔧 管理命令

```bash
# 查看所有路由
cloudflared tunnel route dns list

# 删除路由
cloudflared tunnel route dns delete <TUNNEL_NAME> api.example.com

# 查看隧道信息
cloudflared tunnel info <TUNNEL_NAME>

# 查看隧道日志
sudo journalctl -u cloudflared-tunnel -f
```

## 🌐 多域名绑定

```bash
# 绑定多个域名
cloudflared tunnel route dns <TUNNEL_NAME> api.example.com
cloudflared tunnel route dns <TUNNEL_NAME> tts.example.com
cloudflared tunnel route dns <TUNNEL_NAME> voice.example.com
```

配置文件:

```yaml
ingress:
  - hostname: api.example.com
    service: http://localhost:5050
  - hostname: tts.example.com
    service: http://localhost:5050
  - hostname: voice.example.com
    service: http://localhost:5050
  - service: http_status:404
```

## ❓ 常见问题

### DNS 不生效？

```bash
# 清除 DNS 缓存
# macOS
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches

# 使用 Cloudflare DNS 测试
nslookup api.example.com 1.1.1.1
```

### 访问 502 错误？

```bash
# 检查本地服务
curl http://localhost:5050

# 检查隧道状态
cloudflared tunnel info <TUNNEL_NAME>

# 重启隧道
sudo systemctl restart cloudflared-tunnel
```

### 访问 404 错误？

```bash
# 检查配置文件
cat ~/.cloudflared/config.yml

# 确保 hostname 精确匹配
# 不要使用通配符 *.example.com
```

## 📚 详细文档

- [完整域名绑定指南](docs/CLOUDFLARE_DOMAIN_BINDING.md)
- [Cloudflare Tunnel 配置](docs/CLOUDFLARE_TUNNEL_REQUIREMENT.md)
- [部署方式对比](docs/DEPLOYMENT_COMPARISON.md)

## 🎉 完成

域名绑定成功后，你可以通过以下地址访问：

- **API 文档**: `https://api.example.com/docs`
- **健康检查**: `https://api.example.com/`
- **音色列表**: `https://api.example.com/v1/voices`
- **语音合成**: `POST https://api.example.com/v1/audio/speech`

享受你的自定义域名 API 服务！🚀
