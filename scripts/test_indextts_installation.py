#!/usr/bin/env python3
"""测试 IndexTTS2 是否正确安装"""
import sys
from pathlib import Path

def test_import():
    """测试导入"""
    print("=" * 60)
    print("测试 1: 检查 IndexTTS2 导入")
    print("=" * 60)
    
    try:
        from indextts.infer_v2 import IndexTTS2
        print("✓ IndexTTS2 导入成功")
        return True
    except ImportError as e:
        print(f"✗ IndexTTS2 导入失败: {e}")
        print("\n解决方案:")
        print("1. 克隆仓库: git clone https://github.com/index-tts/index-tts.git")
        print("2. 安装依赖: cd index-tts && pip install -e .")
        return False

def test_model_files():
    """测试模型文件"""
    print("\n" + "=" * 60)
    print("测试 2: 检查模型文件")
    print("=" * 60)
    
    weights_dir = Path("weights")
    config_file = weights_dir / "config.yaml"
    
    if not weights_dir.exists():
        print(f"✗ 模型目录不存在: {weights_dir}")
        print("\n解决方案:")
        print("1. 创建目录: mkdir -p weights")
        print("2. 下载模型: huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights")
        return False
    
    if not config_file.exists():
        print(f"✗ 配置文件不存在: {config_file}")
        print("\n解决方案:")
        print("下载模型: huggingface-cli download IndexTeam/Index-TTS-2 --local-dir weights")
        return False
    
    print(f"✓ 模型目录存在: {weights_dir}")
    print(f"✓ 配置文件存在: {config_file}")
    
    # 列出模型文件
    model_files = list(weights_dir.glob("*"))
    print(f"\n找到 {len(model_files)} 个文件:")
    for f in model_files[:10]:  # 只显示前 10 个
        print(f"  - {f.name}")
    if len(model_files) > 10:
        print(f"  ... 还有 {len(model_files) - 10} 个文件")
    
    return True

def test_model_loading():
    """测试模型加载"""
    print("\n" + "=" * 60)
    print("测试 3: 尝试加载模型")
    print("=" * 60)
    
    try:
        from indextts.infer_v2 import IndexTTS2
        
        config_path = "weights/config.yaml"
        model_dir = "weights"
        
        print(f"配置文件: {config_path}")
        print(f"模型目录: {model_dir}")
        print("正在加载模型（这可能需要几分钟）...")
        
        tts = IndexTTS2(
            cfg_path=config_path,
            model_dir=model_dir,
            use_fp16=True,
            use_cuda_kernel=False,
            use_deepspeed=False
        )
        
        print("✓ IndexTTS2 模型加载成功！")
        return True
        
    except ImportError:
        print("✗ IndexTTS2 未安装，跳过模型加载测试")
        return False
    except FileNotFoundError as e:
        print(f"✗ 文件不存在: {e}")
        return False
    except Exception as e:
        print(f"✗ 模型加载失败: {e}")
        return False

def test_presets():
    """测试音色文件"""
    print("\n" + "=" * 60)
    print("测试 4: 检查音色文件")
    print("=" * 60)
    
    presets_dir = Path("presets")
    
    if not presets_dir.exists():
        print(f"✗ 音色目录不存在: {presets_dir}")
        print("\n解决方案:")
        print("1. 创建目录: mkdir -p presets")
        print("2. 添加默认音色: python scripts/create_default_voice.py")
        return False
    
    wav_files = list(presets_dir.glob("*.wav"))
    
    if len(wav_files) == 0:
        print(f"✗ 未找到音色文件 (.wav)")
        print("\n解决方案:")
        print("运行: python scripts/create_default_voice.py")
        return False
    
    print(f"✓ 找到 {len(wav_files)} 个音色文件:")
    for f in wav_files:
        print(f"  - {f.name}")
    
    # 检查默认音色
    default_voice = presets_dir / "default.wav"
    if default_voice.exists():
        print(f"\n✓ 默认音色存在: {default_voice}")
    else:
        print(f"\n⚠️  默认音色不存在: {default_voice}")
        print("建议运行: python scripts/create_default_voice.py")
    
    return True

def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("IndexTTS2 安装检查工具")
    print("=" * 60 + "\n")
    
    results = []
    
    # 运行所有测试
    results.append(("导入测试", test_import()))
    results.append(("模型文件", test_model_files()))
    results.append(("音色文件", test_presets()))
    
    # 只有在前面测试通过时才尝试加载模型
    if results[0][1] and results[1][1]:
        results.append(("模型加载", test_model_loading()))
    
    # 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    for name, passed in results:
        status = "✓ 通过" if passed else "✗ 失败"
        print(f"{name:20s} {status}")
    
    all_passed = all(r[1] for r in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 所有测试通过！可以启动服务了。")
        print("\n下一步:")
        print("  docker-compose up -d")
    else:
        print("⚠️  部分测试失败，请按照上述提示解决问题。")
        print("\n详细集成指南:")
        print("  查看 INTEGRATION_GUIDE.md")
    print("=" * 60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
