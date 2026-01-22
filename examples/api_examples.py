#!/usr/bin/env python3
"""VoiceNexus API 使用示例集合"""
import requests
import json
from pathlib import Path
from typing import Optional

# API 基础 URL
BASE_URL = "http://localhost:8080"


class VoiceNexusClient:
    """VoiceNexus API 客户端"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
    
    def health_check(self) -> dict:
        """健康检查"""
        response = requests.get(f"{self.base_url}/")
        return response.json()
    
    def get_voices(self) -> dict:
        """获取可用音色列表"""
        response = requests.get(f"{self.base_url}/v1/voices")
        return response.json()
    
    def synthesize(
        self,
        text: str,
        voice: str = "default",
        emotion: str = "default",
        response_format: str = "wav",
        speed: float = 1.0,
        output_file: Optional[str] = None
    ) -> bytes:
        """
        语音合成
        
        Args:
            text: 待合成的文本
            voice: 音色ID
            emotion: 情感标签（或 "auto" 自动分析）
            response_format: 输出格式 ("wav" 或 "mp3")
            speed: 语速 (0.5-2.0)
            output_file: 输出文件路径（可选）
            
        Returns:
            音频字节数据
        """
        payload = {
            "model": "indextts-2.0",
            "input": text,
            "voice": voice,
            "emotion": emotion,
            "response_format": response_format,
            "speed": speed
        }
        
        response = requests.post(
            f"{self.base_url}/v1/audio/speech",
            json=payload
        )
        
        if response.status_code == 200:
            audio_data = response.content
            
            if output_file:
                with open(output_file, "wb") as f:
                    f.write(audio_data)
                print(f"✓ 音频已保存到: {output_file}")
            
            return audio_data
        else:
            raise Exception(f"API 错误: {response.status_code} - {response.text}")
    
    def upload_voice(
        self,
        audio_file: str,
        voice_id: str,
        emotion: str = "default"
    ) -> dict:
        """
        上传新音色
        
        Args:
            audio_file: 音频文件路径
            voice_id: 音色ID
            emotion: 情感标签
            
        Returns:
            上传结果
        """
        with open(audio_file, "rb") as f:
            files = {"file": (Path(audio_file).name, f, "audio/wav")}
            data = {
                "voice_id": voice_id,
                "emotion": emotion
            }
            
            response = requests.post(
                f"{self.base_url}/v1/voices/upload",
                files=files,
                data=data
            )
        
        return response.json()


# ============================================================================
# 示例 1: 基础语音合成
# ============================================================================

def example_basic_synthesis():
    """示例 1: 基础语音合成"""
    print("\n" + "=" * 60)
    print("示例 1: 基础语音合成")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    # 合成语音
    text = "你好，这是一个基础的语音合成示例。"
    client.synthesize(
        text=text,
        voice="default",
        emotion="default",
        output_file="example1_basic.wav"
    )
    
    print("✓ 完成")


# ============================================================================
# 示例 2: 指定情感合成
# ============================================================================

def example_emotion_synthesis():
    """示例 2: 指定情感合成"""
    print("\n" + "=" * 60)
    print("示例 2: 指定情感合成")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    # 不同情感的文本
    emotions_texts = {
        "happy": "太棒了！我们成功了！这真是太令人兴奋了！",
        "sad": "真遗憾，我们没能完成这个任务。",
        "angry": "这太不公平了！我无法接受这个结果！",
        "neutral": "今天天气不错，适合出门散步。"
    }
    
    for emotion, text in emotions_texts.items():
        print(f"\n合成情感: {emotion}")
        client.synthesize(
            text=text,
            voice="default",
            emotion=emotion,
            output_file=f"example2_{emotion}.wav"
        )
    
    print("\n✓ 完成")


# ============================================================================
# 示例 3: 智能情感分析
# ============================================================================

def example_auto_emotion():
    """示例 3: 智能情感分析"""
    print("\n" + "=" * 60)
    print("示例 3: 智能情感分析（需要配置 LLM）")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    # 让系统自动分析情感
    texts = [
        "哇！这个礼物太棒了！谢谢你！",
        "我感到非常难过，事情不应该是这样的。",
        "你怎么能这样对我？我真的很生气！",
        "今天的会议讨论了项目进度和下一步计划。"
    ]
    
    for i, text in enumerate(texts, 1):
        print(f"\n文本 {i}: {text}")
        try:
            client.synthesize(
                text=text,
                voice="default",
                emotion="auto",  # 自动分析情感
                output_file=f"example3_auto_{i}.wav"
            )
        except Exception as e:
            print(f"✗ 错误: {e}")
            print("提示: 需要在 .env 中配置 SENTIMENT_LLM_API_KEY")
    
    print("\n✓ 完成")


# ============================================================================
# 示例 4: 调整语速
# ============================================================================

def example_speed_control():
    """示例 4: 调整语速"""
    print("\n" + "=" * 60)
    print("示例 4: 调整语速")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    text = "这是一个测试语速的示例文本。"
    speeds = [0.5, 0.75, 1.0, 1.25, 1.5]
    
    for speed in speeds:
        print(f"\n语速: {speed}x")
        client.synthesize(
            text=text,
            voice="default",
            speed=speed,
            output_file=f"example4_speed_{speed}.wav"
        )
    
    print("\n✓ 完成")


# ============================================================================
# 示例 5: 不同输出格式
# ============================================================================

def example_output_formats():
    """示例 5: 不同输出格式"""
    print("\n" + "=" * 60)
    print("示例 5: 不同输出格式")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    text = "这是一个测试不同输出格式的示例。"
    
    # WAV 格式
    print("\n生成 WAV 格式...")
    client.synthesize(
        text=text,
        response_format="wav",
        output_file="example5_output.wav"
    )
    
    # MP3 格式
    print("生成 MP3 格式...")
    client.synthesize(
        text=text,
        response_format="mp3",
        output_file="example5_output.mp3"
    )
    
    print("\n✓ 完成")


# ============================================================================
# 示例 6: 批量合成
# ============================================================================

def example_batch_synthesis():
    """示例 6: 批量合成"""
    print("\n" + "=" * 60)
    print("示例 6: 批量合成")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    # 批量文本
    texts = [
        "第一段：欢迎使用语音合成服务。",
        "第二段：我们提供高质量的语音输出。",
        "第三段：支持多种音色和情感。",
        "第四段：感谢您的使用！"
    ]
    
    for i, text in enumerate(texts, 1):
        print(f"\n合成第 {i} 段...")
        client.synthesize(
            text=text,
            voice="default",
            output_file=f"example6_batch_{i}.wav"
        )
    
    print("\n✓ 完成")


# ============================================================================
# 示例 7: 获取音色列表
# ============================================================================

def example_list_voices():
    """示例 7: 获取音色列表"""
    print("\n" + "=" * 60)
    print("示例 7: 获取音色列表")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    # 获取音色列表
    result = client.get_voices()
    
    print(f"\n找到 {len(result['voices'])} 个音色:\n")
    
    for voice in result['voices']:
        print(f"音色ID: {voice['id']}")
        print(f"  名称: {voice['name']}")
        print(f"  情感: {', '.join(voice['emotions'])}")
        print(f"  默认音频: {'是' if voice['has_default'] else '否'}")
        print()
    
    print("✓ 完成")


# ============================================================================
# 示例 8: 上传自定义音色
# ============================================================================

def example_upload_voice():
    """示例 8: 上传自定义音色"""
    print("\n" + "=" * 60)
    print("示例 8: 上传自定义音色")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    # 注意：需要准备一个 .wav 文件
    audio_file = "my_voice.wav"
    
    if not Path(audio_file).exists():
        print(f"⚠️  文件不存在: {audio_file}")
        print("请准备一个 .wav 文件并重命名为 my_voice.wav")
        return
    
    # 上传音色
    result = client.upload_voice(
        audio_file=audio_file,
        voice_id="my_speaker",
        emotion="default"
    )
    
    print(f"\n上传结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
    
    if result['success']:
        # 使用新上传的音色
        print("\n使用新音色合成...")
        client.synthesize(
            text="这是使用新上传音色的测试。",
            voice="my_speaker",
            emotion="default",
            output_file="example8_custom_voice.wav"
        )
    
    print("\n✓ 完成")


# ============================================================================
# 示例 9: 错误处理
# ============================================================================

def example_error_handling():
    """示例 9: 错误处理"""
    print("\n" + "=" * 60)
    print("示例 9: 错误处理")
    print("=" * 60)
    
    client = VoiceNexusClient()
    
    # 测试各种错误情况
    
    # 1. 不存在的音色
    print("\n测试 1: 不存在的音色")
    try:
        client.synthesize(
            text="测试",
            voice="nonexistent_voice",
            output_file="error_test.wav"
        )
    except Exception as e:
        print(f"✓ 捕获到预期错误: {e}")
    
    # 2. 空文本
    print("\n测试 2: 空文本")
    try:
        client.synthesize(
            text="",
            output_file="error_test.wav"
        )
    except Exception as e:
        print(f"✓ 捕获到预期错误: {e}")
    
    # 3. 无效的语速
    print("\n测试 3: 无效的语速")
    try:
        client.synthesize(
            text="测试",
            speed=5.0,  # 超出范围
            output_file="error_test.wav"
        )
    except Exception as e:
        print(f"✓ 捕获到预期错误: {e}")
    
    print("\n✓ 完成")


# ============================================================================
# 主函数
# ============================================================================

def main():
    """运行所有示例"""
    print("\n" + "=" * 60)
    print("VoiceNexus API 使用示例")
    print("=" * 60)
    
    # 创建输出目录
    Path("examples/output").mkdir(parents=True, exist_ok=True)
    
    # 检查服务是否可用
    try:
        client = VoiceNexusClient()
        health = client.health_check()
        print(f"\n✓ 服务状态: {health['status']}")
        print(f"  版本: {health['version']}")
    except Exception as e:
        print(f"\n✗ 无法连接到服务: {e}")
        print("请确保服务已启动: docker-compose up -d")
        return
    
    # 运行示例
    examples = [
        ("基础语音合成", example_basic_synthesis),
        ("指定情感合成", example_emotion_synthesis),
        ("智能情感分析", example_auto_emotion),
        ("调整语速", example_speed_control),
        ("不同输出格式", example_output_formats),
        ("批量合成", example_batch_synthesis),
        ("获取音色列表", example_list_voices),
        ("上传自定义音色", example_upload_voice),
        ("错误处理", example_error_handling),
    ]
    
    print("\n可用示例:")
    for i, (name, _) in enumerate(examples, 1):
        print(f"  {i}. {name}")
    
    print("\n选择要运行的示例（输入数字，或 'all' 运行全部，'q' 退出）:")
    choice = input("> ").strip().lower()
    
    if choice == 'q':
        return
    elif choice == 'all':
        for name, func in examples:
            try:
                func()
            except Exception as e:
                print(f"\n✗ 示例失败: {e}")
    else:
        try:
            index = int(choice) - 1
            if 0 <= index < len(examples):
                name, func = examples[index]
                func()
            else:
                print("无效的选择")
        except ValueError:
            print("无效的输入")
    
    print("\n" + "=" * 60)
    print("示例运行完成")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
