"""音频处理工具"""
import io
import logging
from pathlib import Path
import numpy as np
import soundfile as sf
import subprocess

from app.core.config import settings

logger = logging.getLogger(__name__)


def save_audio_to_wav(audio_data: np.ndarray, sample_rate: int = None) -> bytes:
    """
    将音频数据保存为 WAV 格式的字节流
    
    Args:
        audio_data: 音频数据 (numpy array)
        sample_rate: 采样率
        
    Returns:
        WAV 格式的字节数据
    """
    if sample_rate is None:
        sample_rate = settings.sample_rate
    
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format='WAV')
    buffer.seek(0)
    return buffer.read()


def convert_wav_to_mp3(wav_bytes: bytes) -> bytes:
    """
    使用 FFmpeg 将 WAV 转换为 MP3
    
    Args:
        wav_bytes: WAV 格式的字节数据
        
    Returns:
        MP3 格式的字节数据
    """
    try:
        process = subprocess.Popen(
            [
                'ffmpeg',
                '-i', 'pipe:0',  # 从标准输入读取
                '-f', 'mp3',
                '-ab', '192k',
                '-ar', str(settings.sample_rate),
                'pipe:1'  # 输出到标准输出
            ],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        mp3_bytes, stderr = process.communicate(input=wav_bytes)
        
        if process.returncode != 0:
            raise RuntimeError(f"FFmpeg 转换失败: {stderr.decode()}")
        
        return mp3_bytes
        
    except Exception as e:
        logger.error(f"音频格式转换失败: {e}")
        raise


def validate_audio_file(file_path: Path) -> bool:
    """
    验证音频文件是否有效
    
    Args:
        file_path: 音频文件路径
        
    Returns:
        是否为有效音频
    """
    try:
        data, samplerate = sf.read(file_path)
        
        # 检查基本属性
        if len(data) == 0:
            logger.warning(f"音频文件为空: {file_path}")
            return False
        
        if samplerate <= 0:
            logger.warning(f"无效的采样率: {samplerate}")
            return False
        
        logger.info(f"✓ 音频验证通过: {file_path.name}, 时长={len(data)/samplerate:.2f}s, 采样率={samplerate}Hz")
        return True
        
    except Exception as e:
        logger.error(f"音频验证失败: {e}")
        return False
