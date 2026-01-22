#!/usr/bin/env python3
"""智能情感分析功能测试脚本"""
import sys
import asyncio
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.sentiment import sentiment_analyzer
from app.core.config import settings


async def test_sentiment_analysis():
    """测试情感分析功能"""
    print("=" * 60)
    print("智能情感分析测试")
    print("=" * 60)
    print()
    
    # 检查配置
    print("配置检查:")
    print(f"  启用状态: {settings.enable_smart_sentiment}")
    print(f"  LLM 模型: {settings.sentiment_llm_model}")
    print(f"  API Key: {'已配置' if settings.sentiment_llm_api_key else '未配置'}")
    print(f"  支持的情感: {', '.join(settings.sentiment_labels)}")
    print()
    
    if not settings.enable_smart_sentiment:
        print("⚠️  智能情感分析未启用")
        print("请在 .env 中设置 ENABLE_SMART_SENTIMENT=true")
        return
    
    if not settings.sentiment_llm_api_key:
        print("⚠️  未配置 API Key")
        print("请在 .env 中设置 SENTIMENT_LLM_API_KEY")
        return
    
    # 测试用例
    test_cases = [
        ("太棒了！我真的很开心！", "happy"),
        ("这太可怕了，我很害怕。", "fear"),
        ("我感到非常难过和失落。", "sad"),
        ("这让我非常生气！", "angry"),
        ("哇！真是太意外了！", "surprise"),
        ("今天天气不错。", "neutral"),
        ("你好，请问有什么可以帮助您的？", "neutral"),
    ]
    
    print("开始测试...")
    print("-" * 60)
    
    results = []
    for text, expected in test_cases:
        print(f"\n文本: {text}")
        print(f"预期: {expected}")
        
        try:
            result = await sentiment_analyzer.analyze(text)
            print(f"结果: {result}")
            
            match = "✓" if result == expected else "✗"
            print(f"匹配: {match}")
            
            results.append({
                "text": text,
                "expected": expected,
                "result": result,
                "match": result == expected
            })
            
        except Exception as e:
            print(f"错误: {e}")
            results.append({
                "text": text,
                "expected": expected,
                "result": "error",
                "match": False
            })
    
    # 统计结果
    print()
    print("=" * 60)
    print("测试总结")
    print("=" * 60)
    
    total = len(results)
    matched = sum(1 for r in results if r["match"])
    accuracy = (matched / total * 100) if total > 0 else 0
    
    print(f"总测试数: {total}")
    print(f"匹配数: {matched}")
    print(f"准确率: {accuracy:.1f}%")
    print()
    
    if accuracy >= 80:
        print("✓ 测试通过！情感分析功能正常工作。")
    elif accuracy >= 50:
        print("⚠️  准确率偏低，可能需要调整 Prompt 或模型。")
    else:
        print("✗ 测试失败，请检查配置和网络连接。")
    
    print("=" * 60)


def test_config():
    """测试配置"""
    print("=" * 60)
    print("配置测试")
    print("=" * 60)
    print()
    
    print("环境变量:")
    print(f"  ENABLE_SMART_SENTIMENT: {settings.enable_smart_sentiment}")
    print(f"  SENTIMENT_LLM_BASE_URL: {settings.sentiment_llm_base_url}")
    print(f"  SENTIMENT_LLM_MODEL: {settings.sentiment_llm_model}")
    print(f"  SENTIMENT_LLM_API_KEY: {'*' * 20 if settings.sentiment_llm_api_key else '(未设置)'}")
    print(f"  SENTIMENT_LABELS: {settings.sentiment_labels}")
    print(f"  SENTIMENT_TIMEOUT: {settings.sentiment_timeout}s")
    print()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="智能情感分析测试工具")
    parser.add_argument(
        "--config-only",
        action="store_true",
        help="仅显示配置信息"
    )
    parser.add_argument(
        "--text",
        type=str,
        help="测试单个文本"
    )
    
    args = parser.parse_args()
    
    if args.config_only:
        test_config()
    elif args.text:
        # 测试单个文本
        async def test_single():
            print(f"分析文本: {args.text}")
            result = await sentiment_analyzer.analyze(args.text)
            print(f"结果: {result}")
        
        asyncio.run(test_single())
    else:
        # 运行完整测试
        asyncio.run(test_sentiment_analysis())
