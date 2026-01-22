#!/bin/bash
# NATAPP 配置脚本（国内免费方案）

set -e

echo "🚀 配置 NATAPP..."

# 下载 NATAPP
echo "📦 下载 NATAPP 客户端..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    wget -O natapp https://download.natapp.cn/assets/downloads/clients/2_3_9/natapp_linux_amd64_2_3_9
    chmod +x natapp
else
    echo "请手动下载: https://natapp.cn/#download"
    exit 1
fi

# 创建配置文件
cat > natapp.ini <<EOF
#将本文件放置于natapp同级目录 程序将读取 [default] 段
#在命令行参数模式如 natapp -authtoken=xxx 等相同参数将会覆盖掉此配置
#命令行参数 -config= 可以指定任意config.ini文件
[default]
authtoken=YOUR_AUTHTOKEN
clienttoken=
log=none
loglevel=ERROR
http_proxy=
EOF

echo "✅ NATAPP 已配置"
echo ""
echo "📝 使用步骤："
echo "1. 访问 https://natapp.cn/ 注册账号"
echo "2. 购买免费隧道（每天限时免费）"
echo "3. 获取 authtoken"
echo "4. 编辑 natapp.ini 填入 authtoken"
echo "5. 运行: ./natapp -authtoken=YOUR_TOKEN -proto=tcp -lport=5050"
echo ""
echo "⚠️  免费版每次启动域名会变化"
