#!/usr/bin/env python3
"""测试 TTS 参数调整功能"""
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8080"

def test_basic_parameters():
    """测试基础参数"""
    print("\n" + "=" * 60)
    print("测试 1: 基础参数")
    print("=" * 60)
    
    test_cases = [
        {
            "name": "默认参数",
            "params": {
                "input": "这是默认参数测试",
                "voice": "default",
                "emotion": "default",
                "speed": 1.0,
            }
        },
        {
            "name": "快速语速",
            "params": {
                "input": "这是快速语速测试",
                "voice": "default",
                "emotion": "default",
                "speed": 1.5,
            }
        },
        {
            "name": "慢速语速",
            "params": {
                "input": "这是慢速语速测试",
                "voice": "default",
                "emotion": "default",
                "speed": 0.7,
            }
        },
        {
            "name": "开心情感",
            "params": {
                "input": "太棒了！这真是太令人兴奋了！",
                "voice": "default",
                "emotion": "happy",
                "speed": 1.0,
            }
        },
    ]
    
    for case in test_cases:
        print(f"\n测试: {case['name']}")
        print(f"参数: {json.dumps(case['params'], ensure_ascii=False)}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/v1/audio/speech",
                json=case['params'],
                timeout=30
            )
            
            if response.status_code == 200:
                filename = f"test_output_{case['name'].replace(' ', '_')}.wav"
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"✓ 成功: {filename}")
            else:
                print(f"✗ 失败: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ 错误: {e}")


def test_advanced_parameters():
    """测试高级参数"""
    print("\n" + "=" * 60)
    print("测试 2: 高级参数")
    print("=" * 60)
    
    test_cases = [
        {
            "name": "低温度_稳定",
            "params": {
                "input": "这是低温度稳定测试",
                "voice": "default",
                "temperature": 0.5,
                "top_p": 0.6,
                "top_k": 10,
            }
        },
        {
            "name": "高温度_多变",
            "params": {
                "input": "这是高温度多变测试",
                "voice": "default",
                "temperature": 1.5,
                "top_p": 0.9,
                "top_k": 30,
            }
        },
        {
            "name": "高重复惩罚",
            "params": {
                "input": "测试测试测试重复重复重复",
                "voice": "default",
                "repetition_penalty": 1.5,
            }
        },
    ]
    
    for case in test_cases:
        print(f"\n测试: {case['name']}")
        print(f"参数: {json.dumps(case['params'], ensure_ascii=False)}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/v1/audio/speech",
                json=case['params'],
                timeout=30
            )
            
            if response.status_code == 200:
                filename = f"test_output_{case['name']}.wav"
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"✓ 成功: {filename}")
            else:
                print(f"✗ 失败: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ 错误: {e}")


def test_combined_parameters():
    """测试组合参数"""
    print("\n" + "=" * 60)
    print("测试 3: 组合参数")
    print("=" * 60)
    
    test_cases = [
        {
            "name": "播音员风格",
            "params": {
                "input": "欢迎收听今天的新闻播报",
                "voice": "default",
                "emotion": "neutral",
                "speed": 1.0,
                "temperature": 0.5,
                "top_p": 0.6,
                "top_k": 10,
            }
        },
        {
            "name": "对话角色",
            "params": {
                "input": "嘿，你今天过得怎么样？",
                "voice": "default",
                "emotion": "happy",
                "speed": 1.1,
                "temperature": 1.0,
                "top_p": 0.8,
                "top_k": 20,
            }
        },
        {
            "name": "快速播报",
            "params": {
                "input": "快速播报重要信息",
                "voice": "default",
                "emotion": "neutral",
                "speed": 1.5,
                "temperature": 0.7,
                "top_p": 0.7,
                "top_k": 15,
            }
        },
    ]
    
    for case in test_cases:
        print(f"\n测试: {case['name']}")
        print(f"参数: {json.dumps(case['params'], ensure_ascii=False, indent=2)}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/v1/audio/speech",
                json=case['params'],
                timeout=30
            )
            
            if response.status_code == 200:
                filename = f"test_output_{case['name'].replace(' ', '_')}.wav"
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"✓ 成功: {filename}")
            else:
                print(f"✗ 失败: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ 错误: {e}")


def test_format_options():
    """测试输出格式"""
    print("\n" + "=" * 60)
    print("测试 4: 输出格式")
    print("=" * 60)
    
    for fmt in ["wav", "mp3"]:
        print(f"\n测试格式: {fmt}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/v1/audio/speech",
                json={
                    "input": f"这是{fmt}格式测试",
                    "voice": "default",
                    "response_format": fmt,
                },
                timeout=30
            )
            
            if response.status_code == 200:
                filename = f"test_output_format.{fmt}"
                with open(filename, "wb") as f:
                    f.write(response.content)
                size_kb = len(response.content) / 1024
                print(f"✓ 成功: {filename} ({size_kb:.1f} KB)")
            else:
                print(f"✗ 失败: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ 错误: {e}")


def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("TTS 参数测试套件")
    print("=" * 60)
    
    # 检查服务
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"\n✓ 服务状态: {response.json()['status']}")
    except Exception as e:
        print(f"\n✗ 无法连接到服务: {e}")
        print("请确保服务已启动: docker-compose up -d")
        return
    
    # 运行测试
    test_basic_parameters()
    test_advanced_parameters()
    test_combined_parameters()
    test_format_options()
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)
    print("\n生成的音频文件:")
    for f in Path(".").glob("test_output_*.wav"):
        print(f"  - {f}")
    for f in Path(".").glob("test_output_*.mp3"):
        print(f"  - {f}")


if __name__ == "__main__":
    main()
