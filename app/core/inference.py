"""IndexTTS 核心推理引擎"""
import asyncio
import logging
from pathlib import Path
from typing import Optional
import torch
import numpy as np
import soundfile as sf

from app.core.config import settings

logger = logging.getLogger(__name__)


class TTSModelEngine:
    """TTS 模型推理引擎（单例模式）"""
    
    def __init__(self):
        self.model = None
        self.device = settings.device
        self.inference_lock = asyncio.Lock()  # 显存保护锁
        self.is_loaded = False
        
    def load_model(self):
        """加载模型到 GPU"""
        if self.is_loaded:
            logger.info("模型已加载，跳过重复加载")
            return
            
        logger.info(f"开始加载 IndexTTS 模型到 {self.device}...")
        
        try:
            # 尝试导入 IndexTTS2
            try:
                from indextts.infer_v2 import IndexTTS2
                
                # 构建配置文件路径
                cfg_path = settings.weights_dir / "config.yaml"
                model_dir = str(settings.weights_dir)
                
                # 检查配置文件是否存在
                if not cfg_path.exists():
                    logger.warning(f"配置文件不存在: {cfg_path}，尝试使用默认路径")
                    cfg_path = "checkpoints/config.yaml"
                    model_dir = "checkpoints"
                
                # 加载 IndexTTS2 模型
                logger.info(f"加载配置: {cfg_path}")
                logger.info(f"模型目录: {model_dir}")
                
                self.model = IndexTTS2(
                    cfg_path=str(cfg_path),
                    model_dir=model_dir,
                    use_fp16=(self.device == "cuda"),  # GPU 时使用 FP16 节省显存
                    use_cuda_kernel=False,  # 可选：启用 CUDA 加速
                    use_deepspeed=False     # 可选：启用 DeepSpeed 加速
                )
                
                logger.info("✓ IndexTTS2 模型加载成功")
                
            except ImportError as ie:
                logger.warning(f"无法导入 IndexTTS2: {ie}")
                logger.warning("回退到 Mock 模式（仅用于测试）")
                self.model = MockIndexTTS(self.device)
            
            self.is_loaded = True
            logger.info("✓ 模型加载完成")
            
        except Exception as e:
            logger.error(f"✗ 模型加载失败: {e}")
            raise RuntimeError(f"模型加载失败: {e}")
    
    def _get_reference_audio_path(self, voice_id: str, emotion: str = "default") -> Path:
        """
        获取参考音频路径（支持新的层级结构）
        
        新结构: presets/{voice_id}/{emotion}.wav
        降级逻辑: 
        1. 尝试 presets/{voice_id}/{emotion}.wav
        2. 回退到 presets/{voice_id}/default.wav
        3. 如果都不存在，抛出异常
        
        Args:
            voice_id: 音色ID
            emotion: 情感标签
            
        Returns:
            音频文件路径
        """
        # 移除可能的 .wav 后缀
        voice_id = voice_id.replace(".wav", "")
        emotion = emotion.replace(".wav", "")
        
        # 构建目标路径（新结构）
        voice_dir = settings.presets_dir / voice_id
        target_path = voice_dir / f"{emotion}.wav"
        
        # 尝试找指定情感的音频
        if target_path.exists():
            logger.info(f"使用音色: {voice_id}/{emotion}")
            return target_path
        
        # 回退到 default.wav
        default_path = voice_dir / "default.wav"
        if default_path.exists():
            logger.warning(f"情感 {emotion} 不存在，使用 {voice_id}/default")
            return default_path
        
        # 兼容旧的扁平结构（向后兼容）
        old_structure_path = settings.presets_dir / f"{voice_id}.wav"
        if old_structure_path.exists():
            logger.warning(f"使用旧结构音色: {voice_id}.wav（建议迁移到新结构）")
            return old_structure_path
        
        # 都不存在，抛出异常
        raise FileNotFoundError(
            f"音色 {voice_id} 不存在。请确保以下路径之一存在：\n"
            f"  - {target_path}\n"
            f"  - {default_path}\n"
            f"  - {old_structure_path}"
        )
    
    async def generate(
        self,
        text: str,
        voice_id: str = "default",
        emotion: str = "default",
        speed: float = 1.0
    ) -> np.ndarray:
        """
        生成语音（异步，带显存锁保护）
        
        Args:
            text: 待合成的文本
            voice_id: 音色ID
            emotion: 情感标签（支持 "auto" 自动分析）
            speed: 语速
            
        Returns:
            音频数据 (numpy array)
        """
        if not self.is_loaded:
            raise RuntimeError("模型未加载，请先调用 load_model()")
        
        # 如果是自动模式，先进行情感分析
        if emotion == "auto":
            from app.services.sentiment import sentiment_analyzer
            emotion = await sentiment_analyzer.analyze(text)
            logger.info(f"智能情感分析结果: {emotion}")
        
        # 获取参考音频路径
        ref_audio_path = self._get_reference_audio_path(voice_id, emotion)
        
        # 使用锁保护 GPU 推理，防止并发导致 OOM
        async with self.inference_lock:
            logger.info(f"开始推理: text_len={len(text)}, voice={voice_id}, emotion={emotion}, speed={speed}")
            
            try:
                # 在线程池中执行同步推理（避免阻塞事件循环）
                loop = asyncio.get_event_loop()
                audio_data = await loop.run_in_executor(
                    None,
                    self._sync_generate,
                    text,
                    str(ref_audio_path),
                    speed
                )
                
                logger.info(f"✓ 推理完成，音频长度: {len(audio_data)} samples")
                return audio_data
                
            except Exception as e:
                logger.error(f"✗ 推理失败: {e}")
                raise RuntimeError(f"语音合成失败: {e}")
    
    def _sync_generate(self, text: str, ref_audio_path: str, speed: float) -> np.ndarray:
        """同步推理函数（在线程池中执行）"""
        with torch.no_grad():
            # 检查是否为 Mock 模型
            if isinstance(self.model, MockIndexTTS):
                return self.model.synthesize(text, ref_audio_path, speed)
            
            # 使用真实的 IndexTTS2 模型
            try:
                # 生成临时输出文件路径
                import tempfile
                import os
                
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                    output_path = tmp_file.name
                
                # 调用 IndexTTS2 推理
                # 注意：IndexTTS2 的 speed 参数可能需要通过其他方式控制
                # 这里我们使用基础的语音克隆功能
                self.model.infer(
                    spk_audio_prompt=ref_audio_path,  # 音色参考音频
                    text=text,                         # 待合成文本
                    output_path=output_path,           # 输出路径
                    use_random=False,                  # 不使用随机性
                    verbose=False                      # 不输出详细日志
                )
                
                # 读取生成的音频文件
                audio_data, sample_rate = sf.read(output_path)
                
                # 删除临时文件
                os.unlink(output_path)
                
                # 如果需要调整语速，可以使用音频处理库
                if speed != 1.0:
                    audio_data = self._adjust_speed(audio_data, sample_rate, speed)
                
                # 确保返回单声道音频
                if len(audio_data.shape) > 1:
                    audio_data = audio_data.mean(axis=1)
                
                return audio_data.astype(np.float32)
                
            except Exception as e:
                logger.error(f"IndexTTS2 推理失败: {e}")
                raise
    
    def _adjust_speed(self, audio: np.ndarray, sample_rate: int, speed: float) -> np.ndarray:
        """调整音频速度（简单实现）"""
        try:
            import librosa
            # 使用 librosa 的时间拉伸功能
            audio_stretched = librosa.effects.time_stretch(audio, rate=speed)
            return audio_stretched
        except ImportError:
            logger.warning("librosa 未安装，无法调整语速")
            return audio
        except Exception as e:
            logger.warning(f"语速调整失败: {e}，返回原始音频")
            return audio


class MockIndexTTS:
    """Mock 模型（用于测试，实际使用时需替换）"""
    
    def __init__(self, device: str):
        self.device = device
        logger.warning("⚠️  使用 Mock 模型，请替换为真实的 IndexTTS 实现")
    
    def synthesize(self, text: str, ref_audio: str, speed: float) -> np.ndarray:
        """生成假音频数据"""
        import time
        time.sleep(0.5)  # 模拟推理耗时
        
        # 生成 1 秒的静音音频
        duration = len(text) * 0.1  # 根据文本长度估算时长
        samples = int(settings.sample_rate * duration)
        return np.zeros(samples, dtype=np.float32)


# 全局单例
tts_engine = TTSModelEngine()
