# Cloudflare Tunnel 域名绑定指南

## 📋 前提条件

- ✅ 已有域名托管在 Cloudflare
- ✅ 已完成 Cloudflare Tunnel 配置
- ✅ 服务正常运行在本地

## 🎯 绑定流程

### 方法 1: 命令行绑定（推荐）

#### 步骤 1: 查看现有隧道

```bash
cloudflared tunnel list
```

输出示例：
```
ID                                   NAME              CREATED
abc123-def456-ghi789                 indextts-api-xxx  2024-01-22T10:30:45Z
```

记下你的 **隧道名称**（NAME）或 **隧道 ID**（ID）

#### 步骤 2: 绑定域名

```bash
# 使用隧道名称绑定
cloudflared tunnel route dns <TUNNEL_NAME> your-domain.com

# 或使用隧道 ID 绑定
cloudflared tunnel route dns <TUNNEL_ID> your-domain.com
```

**实际示例**:
```bash
# 绑定主域名
cloudflared tunnel route dns indextts-api-1234567890 api.yourdomain.com

# 或绑定子域名
cloudflared tunnel route dns indextts-api-1234567890 tts.yourdomain.com
```

#### 步骤 3: 验证绑定

```bash
# 查看路由配置
cloudflared tunnel route dns list

# 等待 DNS 生效（通常 1-5 分钟）
# 测试域名解析
nslookup api.yourdomain.com

# 测试 HTTPS 访问
curl https://api.yourdomain.com
```

### 方法 2: Cloudflare Dashboard 绑定

#### 步骤 1: 登录 Cloudflare Dashboard

访问: https://dash.cloudflare.com/

#### 步骤 2: 进入 Zero Trust

1. 点击左侧菜单 **"Zero Trust"**
2. 如果是首次使用，需要设置 Team Name

#### 步骤 3: 找到你的隧道

1. 左侧菜单: **Access** → **Tunnels**
2. 找到你创建的隧道（如 `indextts-api-xxx`）
3. 点击隧道名称进入详情

#### 步骤 4: 添加公共主机名

1. 点击 **"Public Hostname"** 标签
2. 点击 **"Add a public hostname"** 按钮
3. 填写配置:
   - **Subdomain**: 子域名（如 `api` 或 `tts`）
   - **Domain**: 选择你的域名（如 `yourdomain.com`）
   - **Type**: 选择 `HTTP`
   - **URL**: 填写 `localhost:5050`（或 `localhost:8080`）

4. 点击 **"Save hostname"**

#### 步骤 5: 验证配置

DNS 记录会自动创建，通常 1-5 分钟生效。

访问: `https://api.yourdomain.com/docs`

## 🔧 完整配置示例

### 场景 1: 绑定子域名（推荐）

假设你的域名是 `example.com`，想绑定 `api.example.com`：

```bash
# 1. 查看隧道
cloudflared tunnel list
# 输出: indextts-api-1234567890

# 2. 绑定域名
cloudflared tunnel route dns indextts-api-1234567890 api.example.com
# 输出: Successfully created route for api.example.com

# 3. 更新配置文件（可选，用于多域名）
nano ~/.cloudflared/config.yml
```

更新配置文件:
```yaml
tunnel: abc123-def456-ghi789
credentials-file: /root/.cloudflared/abc123-def456-ghi789.json

ingress:
  # 绑定特定域名
  - hostname: api.example.com
    service: http://localhost:5050
  # 其他域名返回 404
  - service: http_status:404
```

```bash
# 4. 重启隧道
# 如果使用 systemd
sudo systemctl restart cloudflared-tunnel

# 如果手动运行
# Ctrl+C 停止，然后重新启动
cloudflared tunnel run indextts-api-1234567890
```

### 场景 2: 绑定多个域名

如果你想绑定多个域名到同一个服务：

```bash
# 绑定主域名
cloudflared tunnel route dns indextts-api-1234567890 api.example.com

# 绑定备用域名
cloudflared tunnel route dns indextts-api-1234567890 tts.example.com

# 绑定国际域名
cloudflared tunnel route dns indextts-api-1234567890 api.example.net
```

更新配置文件:
```yaml
tunnel: abc123-def456-ghi789
credentials-file: /root/.cloudflared/abc123-def456-ghi789.json

ingress:
  # 主域名
  - hostname: api.example.com
    service: http://localhost:5050
  
  # 备用域名
  - hostname: tts.example.com
    service: http://localhost:5050
  
  # 国际域名
  - hostname: api.example.net
    service: http://localhost:5050
  
  # 默认
  - service: http_status:404
```

### 场景 3: 不同路径映射不同服务

如果你有多个服务：

```yaml
tunnel: abc123-def456-ghi789
credentials-file: /root/.cloudflared/abc123-def456-ghi789.json

ingress:
  # API 服务
  - hostname: api.example.com
    service: http://localhost:5050
  
  # 管理后台
  - hostname: admin.example.com
    service: http://localhost:8000
  
  # 静态文件
  - hostname: static.example.com
    service: http://localhost:3000
  
  # 默认
  - service: http_status:404
```

## 🔍 验证和测试

### 1. 检查 DNS 记录

```bash
# 查看 DNS 记录
nslookup api.example.com

# 或使用 dig
dig api.example.com

# 预期输出应该包含 Cloudflare 的 IP
```

### 2. 测试 HTTP 访问

```bash
# 测试健康检查
curl https://api.example.com/

# 测试 API
curl https://api.example.com/v1/voices

# 查看响应头
curl -I https://api.example.com/
```

### 3. 浏览器测试

访问以下地址：
- API 文档: `https://api.example.com/docs`
- 健康检查: `https://api.example.com/`
- 音色列表: `https://api.example.com/v1/voices`

### 4. 完整功能测试

```bash
# 使用测试脚本
export PUBLIC_URL=https://api.example.com
python test_public_api.py
```

## 🛠️ 管理命令

### 查看所有路由

```bash
cloudflared tunnel route dns list
```

### 删除路由

```bash
# 删除特定域名的路由
cloudflared tunnel route dns delete <TUNNEL_ID> api.example.com
```

### 查看隧道状态

```bash
# 查看所有隧道
cloudflared tunnel list

# 查看隧道详情
cloudflared tunnel info <TUNNEL_NAME>
```

### 重启隧道

```bash
# 如果使用 systemd
sudo systemctl restart cloudflared-tunnel

# 如果使用 screen/tmux
# 进入会话，Ctrl+C 停止，然后重新启动
cloudflared tunnel run <TUNNEL_NAME>
```

## 📝 一键绑定脚本

创建 `scripts/bind_domain.sh`:

```bash
#!/bin/bash
# Cloudflare Tunnel 域名绑定脚本

set -e

echo "🌐 Cloudflare Tunnel 域名绑定"
echo "================================"
echo ""

# 检查 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared 未安装"
    echo "请先运行: ./scripts/setup_cloudflare_tunnel.sh"
    exit 1
fi

# 获取隧道列表
echo "📋 现有隧道列表:"
cloudflared tunnel list
echo ""

# 获取隧道名称
read -p "请输入隧道名称（NAME）: " TUNNEL_NAME

if [ -z "$TUNNEL_NAME" ]; then
    echo "❌ 隧道名称不能为空"
    exit 1
fi

# 获取域名
read -p "请输入要绑定的域名（如 api.example.com）: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ 域名不能为空"
    exit 1
fi

# 确认
echo ""
echo "📌 配置信息:"
echo "  隧道名称: $TUNNEL_NAME"
echo "  绑定域名: $DOMAIN"
echo ""
read -p "确认绑定? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

# 绑定域名
echo ""
echo "🔧 正在绑定域名..."
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN

echo ""
echo "✅ 域名绑定成功！"
echo ""
echo "📌 下一步:"
echo "1. 等待 DNS 生效（1-5 分钟）"
echo "2. 测试访问: curl https://$DOMAIN"
echo "3. 浏览器访问: https://$DOMAIN/docs"
echo ""
echo "🔍 验证命令:"
echo "  nslookup $DOMAIN"
echo "  curl https://$DOMAIN"
echo ""
```

使用方法:
```bash
chmod +x scripts/bind_domain.sh
./scripts/bind_domain.sh
```

## ⚠️ 常见问题

### Q1: DNS 记录不生效

**原因**: DNS 传播需要时间

**解决**:
```bash
# 1. 等待 5-10 分钟

# 2. 清除本地 DNS 缓存
# macOS
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches

# Windows
ipconfig /flushdns

# 3. 使用 Cloudflare DNS 测试
nslookup api.example.com 1.1.1.1
```

### Q2: 域名访问 502 错误

**原因**: 本地服务未运行或配置错误

**解决**:
```bash
# 1. 检查本地服务
curl http://localhost:5050

# 2. 检查隧道状态
cloudflared tunnel info <TUNNEL_NAME>

# 3. 查看隧道日志
# 如果使用 systemd
sudo journalctl -u cloudflared-tunnel -f

# 4. 检查配置文件
cat ~/.cloudflared/config.yml

# 5. 重启隧道
sudo systemctl restart cloudflared-tunnel
```

### Q3: 域名访问 404 错误

**原因**: 配置文件中的 hostname 不匹配

**解决**:
```bash
# 1. 检查配置文件
cat ~/.cloudflared/config.yml

# 2. 确保 hostname 匹配
# 错误示例:
ingress:
  - hostname: "*.example.com"  # 通配符可能不工作
    service: http://localhost:5050

# 正确示例:
ingress:
  - hostname: api.example.com  # 精确匹配
    service: http://localhost:5050
  - service: http_status:404   # 默认返回 404

# 3. 重启隧道
sudo systemctl restart cloudflared-tunnel
```

### Q4: 多个域名只有一个生效

**原因**: 配置文件中只配置了一个 hostname

**解决**:
```bash
# 编辑配置文件
nano ~/.cloudflared/config.yml

# 添加所有域名
ingress:
  - hostname: api.example.com
    service: http://localhost:5050
  - hostname: tts.example.com
    service: http://localhost:5050
  - service: http_status:404

# 重启隧道
sudo systemctl restart cloudflared-tunnel
```

### Q5: 域名绑定失败

**错误信息**: `Failed to create route`

**解决**:
```bash
# 1. 确认域名在 Cloudflare 托管
# 登录 https://dash.cloudflare.com/ 检查

# 2. 确认域名状态为 Active
# 如果是 Pending，需要先完成 DNS 设置

# 3. 检查权限
# 确保 Cloudflare 账号有域名管理权限

# 4. 手动在 Dashboard 添加
# 访问 Zero Trust → Tunnels → 选择隧道 → Public Hostname
```

## 🔒 安全建议

### 1. 启用 Cloudflare 防护

在 Cloudflare Dashboard:
- **SSL/TLS**: 设置为 "Full" 或 "Full (strict)"
- **Firewall**: 配置防火墙规则
- **Rate Limiting**: 设置请求频率限制
- **Bot Fight Mode**: 启用机器人防护

### 2. 添加访问控制（可选）

```yaml
tunnel: abc123-def456-ghi789
credentials-file: /root/.cloudflared/abc123-def456-ghi789.json

ingress:
  - hostname: api.example.com
    service: http://localhost:5050
    # 添加访问策略
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
      tlsTimeout: 10s
```

### 3. 监控和日志

```bash
# 查看实时日志
sudo journalctl -u cloudflared-tunnel -f

# 查看错误日志
sudo journalctl -u cloudflared-tunnel -p err

# 导出日志
sudo journalctl -u cloudflared-tunnel > tunnel.log
```

## 📊 性能优化

### 1. 启用 HTTP/2

Cloudflare Tunnel 默认支持 HTTP/2，无需额外配置。

### 2. 启用压缩

在 Cloudflare Dashboard:
- **Speed** → **Optimization**
- 启用 **Auto Minify**
- 启用 **Brotli**

### 3. 配置缓存

```yaml
ingress:
  - hostname: api.example.com
    service: http://localhost:5050
    originRequest:
      # 禁用缓存（API 服务）
      disableChunkedEncoding: false
      # 或启用缓存（静态资源）
      # cacheControl: "public, max-age=3600"
```

## 🎉 完成

现在你的域名已经成功绑定到 Cloudflare Tunnel！

访问你的 API:
- 文档: `https://api.example.com/docs`
- 健康检查: `https://api.example.com/`
- 音色列表: `https://api.example.com/v1/voices`

## 📚 相关文档

- [Cloudflare Tunnel 配置指南](CLOUDFLARE_TUNNEL_REQUIREMENT.md)
- [公网暴露部署指南](GPUSHARE_PUBLIC_DEPLOY.md)
- [部署方式对比](DEPLOYMENT_COMPARISON.md)
- [项目 README](../README.md)

## 🔗 官方文档

- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [DNS 路由配置](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/routing-to-tunnel/dns/)
- [公共主机名配置](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/routing-to-tunnel/public-hostname/)
