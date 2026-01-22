"""API 测试脚本"""
import requests
import json

BASE_URL = "http://localhost:5050"


def test_health():
    """测试健康检查"""
    print("测试健康检查...")
    response = requests.get(f"{BASE_URL}/")
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.json()}\n")


def test_get_voices():
    """测试获取音色列表"""
    print("测试获取音色列表...")
    response = requests.get(f"{BASE_URL}/v1/voices")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}\n")


def test_speech_synthesis():
    """测试语音合成"""
    print("测试语音合成...")
    
    # 测试 1: 默认情感
    print("\n1. 测试默认情感")
    payload = {
        "model": "indextts-2.0",
        "input": "你好，这是一个测试文本。",
        "voice": "default",
        "emotion": "default",
        "response_format": "wav",
        "speed": 1.0
    }
    
    response = requests.post(
        f"{BASE_URL}/v1/audio/speech",
        json=payload
    )
    
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        with open("test_output_default.wav", "wb") as f:
            f.write(response.content)
        print("✓ 音频已保存到 test_output_default.wav")
    else:
        print(f"✗ 错误: {response.text}")
    
    # 测试 2: 智能情感分析
    print("\n2. 测试智能情感分析（auto 模式）")
    payload["input"] = "太棒了！我真的很开心！"
    payload["emotion"] = "auto"
    
    response = requests.post(
        f"{BASE_URL}/v1/audio/speech",
        json=payload
    )
    
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        with open("test_output_auto.wav", "wb") as f:
            f.write(response.content)
        print("✓ 音频已保存到 test_output_auto.wav")
    else:
        print(f"✗ 错误: {response.text}")
    
    # 测试 3: 指定情感
    print("\n3. 测试指定情感（happy）")
    payload["input"] = "今天天气真好！"
    payload["emotion"] = "happy"
    
    response = requests.post(
        f"{BASE_URL}/v1/audio/speech",
        json=payload
    )
    
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        with open("test_output_happy.wav", "wb") as f:
            f.write(response.content)
        print("✓ 音频已保存到 test_output_happy.wav\n")
    else:
        print(f"✗ 错误: {response.text}\n")


def test_upload_voice():
    """测试上传音色（新结构）"""
    print("测试上传音色...")
    
    # 注意：需要准备一个测试音频文件
    try:
        with open("test_voice.wav", "rb") as f:
            files = {"file": ("test_voice.wav", f, "audio/wav")}
            # 新增参数：voice_id 和 emotion
            data = {
                "voice_id": "test_voice",
                "emotion": "happy"
            }
            response = requests.post(
                f"{BASE_URL}/v1/voices/upload",
                files=files,
                data=data
            )
        
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}\n")
    except FileNotFoundError:
        print("⚠️  test_voice.wav 不存在，跳过上传测试\n")


if __name__ == "__main__":
    print("=" * 50)
    print("VoiceNexus API 测试")
    print("=" * 50 + "\n")
    
    try:
        test_health()
        test_get_voices()
        test_speech_synthesis()
        test_upload_voice()
        
        print("=" * 50)
        print("测试完成")
        print("=" * 50)
        
    except requests.exceptions.ConnectionError:
        print("✗ 无法连接到服务，请确保服务已启动")
    except Exception as e:
        print(f"✗ 测试失败: {e}")
