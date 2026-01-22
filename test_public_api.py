#!/usr/bin/env python3
"""
公网 API 测试脚本
用于测试显卡平台公网暴露的服务
"""

import requests
import sys
import os

# 配置公网地址（请替换为你的实际地址）
PUBLIC_URL = os.environ.get("PUBLIC_URL", "http://localhost:8080")

def test_health():
    """测试健康检查"""
    print("1. 测试健康检查...")
    try:
        response = requests.get(f"{PUBLIC_URL}/", timeout=10)
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.json()}")
        assert response.status_code == 200
        print("   ✓ 健康检查通过\n")
        return True
    except Exception as e:
        print(f"   ✗ 健康检查失败: {e}\n")
        return False

def test_voices():
    """测试获取音色列表"""
    print("2. 测试获取音色列表...")
    try:
        response = requests.get(f"{PUBLIC_URL}/v1/voices", timeout=10)
        print(f"   状态码: {response.status_code}")
        data = response.json()
        print(f"   音色数量: {len(data.get('voices', []))}")
        for voice in data.get('voices', [])[:3]:  # 只显示前3个
            print(f"   - {voice['id']}: {voice['emotions']}")
        assert response.status_code == 200
        print("   ✓ 音色列表获取成功\n")
        return True
    except Exception as e:
        print(f"   ✗ 音色列表获取失败: {e}\n")
        return False

def test_speech():
    """测试语音合成"""
    print("3. 测试语音合成...")
    try:
        response = requests.post(
            f"{PUBLIC_URL}/v1/audio/speech",
            json={
                "model": "indextts-2.0",
                "input": "你好，这是公网API测试。",
                "voice": "girl_01",
                "emotion": "default",
                "response_format": "wav"
            },
            timeout=30
        )
        
        print(f"   状态码: {response.status_code}")
        
        if response.status_code == 200:
            output_file = "test_public_output.wav"
            with open(output_file, "wb") as f:
                f.write(response.content)
            
            file_size = os.path.getsize(output_file)
            print(f"   文件大小: {file_size} bytes")
            print(f"   ✓ 语音合成成功，已保存到 {output_file}\n")
            return True
        else:
            print(f"   ✗ 语音合成失败: {response.text}\n")
            return False
            
    except Exception as e:
        print(f"   ✗ 语音合成失败: {e}\n")
        return False

def test_docs():
    """测试 API 文档"""
    print("4. 测试 API 文档...")
    try:
        response = requests.get(f"{PUBLIC_URL}/docs", timeout=10)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✓ API 文档可访问: {PUBLIC_URL}/docs\n")
            return True
        else:
            print(f"   ✗ API 文档访问失败\n")
            return False
    except Exception as e:
        print(f"   ✗ API 文档访问失败: {e}\n")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("公网 API 测试")
    print("=" * 60)
    print(f"目标地址: {PUBLIC_URL}")
    print()
    
    # 提示用户设置公网地址
    if PUBLIC_URL == "http://localhost:8080":
        print("⚠️  提示: 当前使用本地地址")
        print("   如需测试公网地址，请设置环境变量:")
        print("   export PUBLIC_URL=https://your-public-url.com")
        print()
    
    results = []
    
    # 运行测试
    results.append(("健康检查", test_health()))
    results.append(("音色列表", test_voices()))
    results.append(("语音合成", test_speech()))
    results.append(("API文档", test_docs()))
    
    # 显示结果
    print("=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"{name:12s}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print()
    print(f"总计: {passed} 通过, {failed} 失败")
    print("=" * 60)
    
    # 返回退出码
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
