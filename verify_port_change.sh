#!/bin/bash

# 验证端口更改脚本

echo "🔍 验证端口更改..."
echo ""

# 检查是否还有 5050 的引用
echo "1. 检查是否还有 5050 端口的引用..."
FOUND_5050=$(grep -rn "5050" . \
  --include="*.md" --include="*.sh" --include="*.py" --include="*.ts" \
  --include="*.tsx" --include="*.html" --include="*.yml" --include="*.yaml" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=index-tts --exclude-dir=.git \
  2>/dev/null | grep -v "Binary" | grep -v "PORT_CHANGE_NOTES.md" | grep -v "verify_port_change.sh")

if [ -z "$FOUND_5050" ]; then
    echo "   ✅ 未发现 5050 端口引用"
else
    echo "   ⚠️  发现以下文件仍包含 5050:"
    echo "$FOUND_5050"
fi

echo ""
echo "2. 验证关键配置文件..."

# 检查 config.py
if grep -q "port: int = 8080" app/core/config.py; then
    echo "   ✅ app/core/config.py - 端口已更新为 8080"
else
    echo "   ❌ app/core/config.py - 端口未正确更新"
fi

# 检查 .env.example
if grep -q "PORT=8080" .env.example; then
    echo "   ✅ .env.example - 端口已更新为 8080"
else
    echo "   ❌ .env.example - 端口未正确更新"
fi

# 检查前端配置
if [ -f "frontend/store/useSettings.ts" ]; then
    if grep -q "localhost:8080" frontend/store/useSettings.ts; then
        echo "   ✅ frontend/store/useSettings.ts - 端口已更新为 8080"
    else
        echo "   ❌ frontend/store/useSettings.ts - 端口未正确更新"
    fi
else
    echo "   ⚠️  frontend/store/useSettings.ts 不存在，跳过检查"
fi

# 检查 docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    if grep -q "8080:8080" docker-compose.yml; then
        echo "   ✅ docker-compose.yml - 端口已更新为 8080"
    else
        echo "   ❌ docker-compose.yml - 端口未正确更新"
    fi
else
    echo "   ⚠️  docker-compose.yml 不存在，跳过检查"
fi

echo ""
echo "3. 验证启动脚本..."

if [ -f "start_all.sh" ]; then
    if grep -q "端口 8080" start_all.sh; then
        echo "   ✅ start_all.sh - 端口已更新为 8080"
    else
        echo "   ❌ start_all.sh - 端口未正确更新"
    fi
else
    echo "   ⚠️  start_all.sh 不存在，跳过检查"
fi

if [ -f "scripts/start_service.sh" ]; then
    if grep -q "port 8080" scripts/start_service.sh; then
        echo "   ✅ scripts/start_service.sh - 端口已更新为 8080"
    else
        echo "   ❌ scripts/start_service.sh - 端口未正确更新"
    fi
else
    echo "   ⚠️  scripts/start_service.sh 不存在，跳过检查"
fi

echo ""
echo "4. 验证文档..."

if [ -f "README.md" ]; then
    if grep -q "localhost:8080" README.md; then
        echo "   ✅ README.md - 端口已更新为 8080"
    else
        echo "   ❌ README.md - 端口未正确更新"
    fi
else
    echo "   ⚠️  README.md 不存在，跳过检查"
fi

if [ -f "FRONTEND_INTEGRATION.md" ]; then
    if grep -q "localhost:8080" FRONTEND_INTEGRATION.md; then
        echo "   ✅ FRONTEND_INTEGRATION.md - 端口已更新为 8080"
    else
        echo "   ❌ FRONTEND_INTEGRATION.md - 端口未正确更新"
    fi
else
    echo "   ⚠️  FRONTEND_INTEGRATION.md 不存在，跳过检查"
fi

echo ""
echo "✅ 验证完成！"
echo ""
echo "📝 新的访问地址:"
echo "   - 后端 API: http://localhost:8080"
echo "   - API 文档: http://localhost:8080/docs"
echo "   - 前端应用: http://localhost:3000"
