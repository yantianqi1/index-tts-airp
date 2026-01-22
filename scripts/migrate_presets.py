#!/usr/bin/env python3
"""
音色目录结构迁移工具

将旧的扁平结构迁移到新的层级结构：
旧: presets/voice_id.wav
新: presets/voice_id/default.wav
"""
import shutil
from pathlib import Path


def migrate_presets(presets_dir: Path = Path("presets"), backup: bool = True):
    """
    迁移音色目录结构
    
    Args:
        presets_dir: presets 目录路径
        backup: 是否备份原文件
    """
    print("=" * 60)
    print("音色目录结构迁移工具")
    print("=" * 60)
    print()
    
    if not presets_dir.exists():
        print(f"✗ 目录不存在: {presets_dir}")
        return
    
    # 查找所有顶层的 .wav 文件（旧结构）
    old_files = list(presets_dir.glob("*.wav"))
    
    if not old_files:
        print("✓ 未找到需要迁移的文件（可能已经是新结构）")
        return
    
    print(f"找到 {len(old_files)} 个需要迁移的文件:\n")
    
    for old_file in old_files:
        voice_id = old_file.stem
        print(f"处理: {old_file.name}")
        
        # 创建新目录
        new_dir = presets_dir / voice_id
        new_dir.mkdir(exist_ok=True)
        
        # 新文件路径
        new_file = new_dir / "default.wav"
        
        # 备份原文件
        if backup:
            backup_file = presets_dir / f"{old_file.name}.backup"
            shutil.copy2(old_file, backup_file)
            print(f"  ✓ 备份到: {backup_file.name}")
        
        # 移动文件
        shutil.move(str(old_file), str(new_file))
        print(f"  ✓ 迁移到: {voice_id}/default.wav")
        print()
    
    print("=" * 60)
    print("✓ 迁移完成！")
    print()
    print("新结构示例:")
    print("  presets/")
    print("  ├── voice_01/")
    print("  │   └── default.wav")
    print("  └── voice_02/")
    print("      └── default.wav")
    print()
    
    if backup:
        print("原文件已备份为 *.wav.backup")
        print("确认无误后可以删除备份文件")
    
    print("=" * 60)


def create_example_structure():
    """创建示例目录结构"""
    print("\n创建示例目录结构...")
    
    presets_dir = Path("presets")
    
    # 示例音色
    examples = [
        ("girl_01", ["default", "happy", "sad"]),
        ("uncle_li", ["default", "serious", "angry"]),
    ]
    
    for voice_id, emotions in examples:
        voice_dir = presets_dir / voice_id
        voice_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n创建音色: {voice_id}")
        for emotion in emotions:
            # 创建空的占位文件
            placeholder = voice_dir / f"{emotion}.wav"
            if not placeholder.exists():
                placeholder.touch()
                print(f"  ✓ {emotion}.wav")
    
    print("\n✓ 示例结构创建完成")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--example":
        create_example_structure()
    else:
        migrate_presets()
        
        print("\n提示:")
        print("  如需创建示例结构: python scripts/migrate_presets.py --example")
