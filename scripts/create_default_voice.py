"""创建默认音色文件（支持新的层级结构）"""
import sys
from pathlib import Path

try:
    import numpy as np
    import soundfile as sf
except ImportError as e:
    print(f"⚠️  缺少依赖: {e}")
    print("请先安装依赖:")
    print("  pip install soundfile numpy")
    print()
    print("或者跳过此步骤，在 Docker 容器启动后会自动创建默认音色。")
    sys.exit(0)  # 使用 0 退出码，不中断安装流程

# 创建 presets 目录
presets_dir = Path("presets")
presets_dir.mkdir(exist_ok=True)

# 创建默认音色文件夹
default_voice_dir = presets_dir / "default"
default_voice_dir.mkdir(exist_ok=True)

# 生成 1 秒的静音音频作为默认音色
sample_rate = 24000
duration = 1.0
samples = int(sample_rate * duration)
audio_data = np.zeros(samples, dtype=np.float32)

# 保存为 default.wav
output_path = default_voice_dir / "default.wav"
sf.write(output_path, audio_data, sample_rate)

print(f"✓ 已创建默认音色: {output_path}")
print(f"  采样率: {sample_rate} Hz")
print(f"  时长: {duration} 秒")
print()
print("提示: 这是一个静音文件，仅用于测试。")
print("请替换为真实的音频文件以获得实际效果。")
print()
print("新的目录结构:")
print("  presets/")
print("  └── default/")
print("      └── default.wav")
