"""IndexTTS 核心推理引擎"""
import asyncio
import inspect
import logging
import os
import sys
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

        requested_device = self.device
        if requested_device == "auto":
            if torch.cuda.is_available():
                resolved_device = "cuda"
            elif hasattr(torch, "xpu") and torch.xpu.is_available():
                resolved_device = "xpu"
            elif hasattr(torch, "mps") and torch.backends.mps.is_available():
                resolved_device = "mps"
            else:
                resolved_device = "cpu"
        else:
            resolved_device = requested_device
            if requested_device.startswith("cuda") and not torch.cuda.is_available():
                logger.warning("CUDA 不可用，回退到 CPU")
                resolved_device = "cpu"
            if requested_device == "mps" and not (hasattr(torch, "mps") and torch.backends.mps.is_available()):
                logger.warning("MPS 不可用，回退到 CPU")
                resolved_device = "cpu"
            if requested_device == "xpu" and not (hasattr(torch, "xpu") and torch.xpu.is_available()):
                logger.warning("XPU 不可用，回退到 CPU")
                resolved_device = "cpu"

        if resolved_device != self.device:
            logger.info(f"设备调整: {self.device} -> {resolved_device}")
        self.device = resolved_device

        logger.info(f"开始加载 IndexTTS 模型到 {self.device}...")

        try:
            # 尝试导入 IndexTTS
            try:
                repo_candidates = []
                env_repo = os.environ.get("INDEX_TTS_REPO_DIR")
                if env_repo:
                    repo_candidates.append(Path(env_repo))
                repo_candidates.append(settings.index_tts_repo_dir)
                try:
                    repo_candidates.append(Path(__file__).resolve().parents[2] / "index-tts")
                except Exception:
                    pass
                repo_candidates.append(Path.cwd() / "index-tts")
                repo_candidates.append(Path("/root/index-tts"))

                repo_root = None
                for candidate in repo_candidates:
                    try:
                        if (candidate / "indextts").is_dir():
                            repo_root = candidate
                            break
                    except Exception:
                        continue

                if repo_root:
                    repo_root_str = str(repo_root)
                    if repo_root_str not in sys.path:
                        sys.path.insert(0, repo_root_str)
                    logger.info(f"使用 IndexTTS 仓库路径: {repo_root}")
                else:
                    logger.warning("未找到 IndexTTS 仓库，将尝试使用已安装的 indextts 包")

                # 如果需要使用 HF 镜像
                if "HF_ENDPOINT" not in os.environ:
                    os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

                from indextts.infer_v2 import IndexTTS2

                try:
                    logger.info(f"IndexTTS2 导入路径: {inspect.getfile(IndexTTS2)}")
                except Exception:
                    pass

                # 构建配置文件路径
                cfg_path = settings.weights_dir / "config.yaml"

                # 检查配置文件是否存在
                if not cfg_path.exists():
                    logger.warning(f"配置文件不存在: {cfg_path}")
                    raise FileNotFoundError(f"模型配置文件不存在: {cfg_path}")

                # 加载 IndexTTS 模型
                logger.info(f"加载配置: {cfg_path}")
                logger.info(f"模型目录: {settings.weights_dir}")
                logger.info(f"使用设备: {self.device}")

                # 初始化 IndexTTS 模型
                use_cuda_kernel = self.device.startswith("cuda")
                kwargs = {
                    "cfg_path": str(cfg_path),
                    "model_dir": str(settings.weights_dir),
                    "use_fp16": use_cuda_kernel,
                    "use_cuda_kernel": use_cuda_kernel,
                    "use_deepspeed": False,
                }
                if "device" in inspect.signature(IndexTTS2).parameters:
                    kwargs["device"] = self.device
                
                logger.info(f"开始初始化 IndexTTS2，参数: {kwargs}")
                logger.info("这可能需要 1-3 分钟，请耐心等待...")
                self.model = IndexTTS2(**kwargs)

                logger.info("✓ IndexTTS 模型加载成功")

            except ImportError as ie:
                logger.warning(f"无法导入 IndexTTS: {ie}")
                logger.warning("回退到 Mock 模式（仅用于测试）")
                self.model = MockIndexTTS(self.device)
            except Exception as e:
                logger.error(f"IndexTTS 加载失败: {e}")
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
        """
        voice_id = voice_id.replace(".wav", "")
        emotion = emotion.replace(".wav", "")

        voice_dir = settings.presets_dir / voice_id
        target_path = voice_dir / f"{emotion}.wav"

        if target_path.exists():
            logger.info(f"使用音色: {voice_id}/{emotion}")
            return target_path

        default_path = voice_dir / "default.wav"
        if default_path.exists():
            logger.warning(f"情感 {emotion} 不存在，使用 {voice_id}/default")
            return default_path

        old_structure_path = settings.presets_dir / f"{voice_id}.wav"
        if old_structure_path.exists():
            logger.warning(f"使用旧结构音色: {voice_id}.wav（建议迁移到新结构）")
            return old_structure_path

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
        speed: float = 1.0,
        temperature: float = 1.0,
        top_p: float = 0.8,
        top_k: int = 20,
        repetition_penalty: float = 1.0
    ) -> np.ndarray:
        """生成语音（异步，带显存锁保护）"""
        if not self.is_loaded:
            raise RuntimeError("模型未加载，请先调用 load_model()")

        if emotion == "auto":
            from app.services.sentiment import sentiment_analyzer
            emotion = await sentiment_analyzer.analyze(text)
            logger.info(f"智能情感分析结果: {emotion}")

        ref_audio_path = self._get_reference_audio_path(voice_id, emotion)

        async with self.inference_lock:
            logger.info(
                f"开始推理: text_len={len(text)}, voice={voice_id}, emotion={emotion}, "
                f"speed={speed}, temp={temperature}, top_p={top_p}, top_k={top_k}, rep_penalty={repetition_penalty}"
            )
            try:
                loop = asyncio.get_event_loop()
                audio_data = await loop.run_in_executor(
                    None, 
                    self._sync_generate, 
                    text, 
                    str(ref_audio_path), 
                    speed,
                    temperature,
                    top_p,
                    top_k,
                    repetition_penalty
                )
                logger.info(f"✓ 推理完成，音频长度: {len(audio_data)} samples")
                return audio_data
            except Exception as e:
                logger.error(f"✗ 推理失败: {e}")
                raise RuntimeError(f"语音合成失败: {e}")

    def _sync_generate(
        self, 
        text: str, 
        ref_audio_path: str, 
        speed: float,
        temperature: float,
        top_p: float,
        top_k: int,
        repetition_penalty: float
    ) -> np.ndarray:
        """同步推理函数（在线程池中执行）"""
        with torch.no_grad():
            if isinstance(self.model, MockIndexTTS):
                return self.model.synthesize(text, ref_audio_path, speed)

            try:
                result = self.model.infer(
                    spk_audio_prompt=ref_audio_path,
                    text=text,
                    output_path=None,
                    top_p=top_p,
                    top_k=top_k,
                    temperature=temperature,
                    repetition_penalty=repetition_penalty
                )

                sample_rate = settings.sample_rate
                audio_data = result
                if isinstance(result, tuple) and len(result) == 2:
                    sample_rate, audio_data = result
                elif isinstance(result, str):
                    audio_data, sample_rate = sf.read(result)
                elif result is None:
                    raise RuntimeError("模型未返回音频数据")

                if isinstance(audio_data, torch.Tensor):
                    audio_data = audio_data.cpu().numpy()

                if isinstance(audio_data, np.ndarray):
                    if audio_data.dtype in (np.int16, np.int32):
                        max_val = np.iinfo(audio_data.dtype).max
                        audio_data = audio_data.astype(np.float32) / max_val
                    else:
                        audio_data = audio_data.astype(np.float32, copy=False)

                if len(audio_data.shape) > 1:
                    if audio_data.shape[0] == 1:
                        audio_data = audio_data.squeeze(0)
                    elif audio_data.shape[1] == 1:
                        audio_data = audio_data.squeeze(1)
                    else:
                        audio_data = audio_data.mean(axis=1)

                if speed != 1.0:
                    audio_data = self._adjust_speed(audio_data, sample_rate, speed)

                if sample_rate != settings.sample_rate:
                    audio_data = self._resample_audio(audio_data, orig_sr=sample_rate, target_sr=settings.sample_rate)

                return audio_data.astype(np.float32, copy=False)

            except Exception as e:
                logger.error(f"IndexTTS 推理失败: {e}")
                raise

    def _adjust_speed(self, audio: np.ndarray, sample_rate: int, speed: float) -> np.ndarray:
        """调整音频速度"""
        try:
            import librosa
            return librosa.effects.time_stretch(audio, rate=speed)
        except ImportError:
            logger.warning("librosa 未安装，无法调整语速")
            return audio
        except Exception as e:
            logger.warning(f"语速调整失败: {e}，返回原始音频")
            return audio

    def _resample_audio(self, audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
        """重采样音频"""
        try:
            import librosa
            return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)
        except ImportError:
            logger.warning("librosa 未安装，无法重采样")
            return audio
        except Exception as e:
            logger.warning(f"重采样失败: {e}，返回原始音频")
            return audio


class MockIndexTTS:
    """Mock 模型（用于测试，实际使用时需替换）"""

    def __init__(self, device: str):
        self.device = device
        logger.warning("⚠️  使用 Mock 模型，请替换为真实的 IndexTTS 实现")

    def synthesize(self, text: str, ref_audio: str, speed: float) -> np.ndarray:
        import time
        time.sleep(0.5)
        duration = len(text) * 0.1
        samples = int(settings.sample_rate * duration)
        return np.zeros(samples, dtype=np.float32)


tts_engine = TTSModelEngine()
