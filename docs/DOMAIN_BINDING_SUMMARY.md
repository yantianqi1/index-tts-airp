# 域名绑定总结

## 🎯 三种绑定方式

### 1️⃣ 一键脚本（最简单）

```bash
./scripts/bind_domain.sh
```

**优点**: 全自动，适合新手

### 2️⃣ 命令行（快速）

```bash
cloudflared tunnel route dns <TUNNEL_NAME> api.example.com
```

**优点**: 一条命令搞定

### 3️⃣ Dashboard（可视化）

访问: https://dash.cloudflare.com/
- Zero Trust → Tunnels → 选择隧道 → Public Hostname

**优点**: 图形界面，直观

## 📋 完整流程

```
1. 创建隧道
   └─> ./scripts/setup_cloudflare_tunnel.sh

2. 绑定域名
   └─> ./scripts/bind_domain.sh
   
3. 更新配置
   └─> 编辑 ~/.cloudflared/config.yml
   
4. 重启隧道
   └─> sudo systemctl restart cloudflared-tunnel
   
5. 验证访问
   └─> curl https://api.example.com
```

## ✅ 验证清单

- [ ] DNS 解析正确: `nslookup api.example.com`
- [ ] HTTPS 可访问: `curl https://api.example.com`
- [ ] API 正常工作: 访问 `/docs`
- [ ] 完整测试通过: `python test_public_api.py`

## 📚 相关文档

- [详细绑定指南](CLOUDFLARE_DOMAIN_BINDING.md) - 完整步骤
- [快速参考](../DOMAIN_BINDING_QUICK_REF.md) - 常用命令
- [部署对比](DEPLOYMENT_COMPARISON.md) - 选择方案

## 🆘 需要帮助？

查看 [常见问题](CLOUDFLARE_DOMAIN_BINDING.md#常见问题)
