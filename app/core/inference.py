"""IndexTTS 核心推理引擎"""
import asyncio
import inspect
import logging
import os
import sys
import time
import uuid
from collections import OrderedDict
from pathlib import Path
from typing import Optional, Dict, Any
import torch
import numpy as np
import soundfile as sf

from app.core.config import settings

logger = logging.getLogger(__name__)

# 队列配置
MAX_QUEUE_SIZE = 50


class QueueItem:
    """队列项"""
    def __init__(self, request_id: str):
        self.request_id = request_id
        self.created_at = time.time()
        self.status = "pending"  # pending, processing, completed, error


class TTSQueue:
    """TTS 请求队列管理器"""

    def __init__(self, max_size: int = MAX_QUEUE_SIZE):
        self.max_size = max_size
        self._queue: OrderedDict[str, QueueItem] = OrderedDict()
        self._lock = asyncio.Lock()
        self._current_processing: Optional[str] = None

    async def add(self, request_id: str) -> tuple[bool, int]:
        """添加请求到队列，返回 (是否成功, 位置)"""
        async with self._lock:
            if len(self._queue) >= self.max_size:
                return False, -1

            item = QueueItem(request_id)
            self._queue[request_id] = item
            position = list(self._queue.keys()).index(request_id) + 1
            return True, position

    async def remove(self, request_id: str):
        """从队列移除请求"""
        async with self._lock:
            if request_id in self._queue:
                del self._queue[request_id]
            if self._current_processing == request_id:
                self._current_processing = None

    async def set_processing(self, request_id: str):
        """设置正在处理的请求"""
        async with self._lock:
            self._current_processing = request_id
            if request_id in self._queue:
                self._queue[request_id].status = "processing"

    async def get_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        async with self._lock:
            return {
                "queue_length": len(self._queue),
                "max_queue_size": self.max_size,
                "is_processing": self._current_processing is not None,
                "current_processing": self._current_processing,
                "can_submit": len(self._queue) < self.max_size,
            }

    async def get_position(self, request_id: str) -> int:
        """获取请求在队列中的位置 (1-based), 如果不在队列中返回 -1"""
        async with self._lock:
            if request_id not in self._queue:
                return -1
            return list(self._queue.keys()).index(request_id) + 1


# 全局队列实例
tts_queue = TTSQueue(MAX_QUEUE_SIZE)


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

            # 启动时预热所有角色的参考音频特征
            self._warmup_all_voices()

        except Exception as e:
            logger.error(f"✗ 模型加载失败: {e}")
            raise RuntimeError(f"模型加载失败: {e}")

    def _warmup_all_voices(self):
        """
        预热所有角色的参考音频特征
        在启动时调用，将所有角色的特征预先计算并缓存到GPU显存
        """
        if isinstance(self.model, MockIndexTTS):
            logger.info("Mock 模式，跳过预热")
            return

        # 检查模型是否支持预热
        if not hasattr(self.model, 'warmup_speaker'):
            logger.warning("模型不支持预热功能，跳过")
            return

        logger.info("=" * 50)
        logger.info("🔥 开始预热角色参考音频...")
        logger.info("=" * 50)

        warmup_count = 0
        failed_count = 0

        # 1. 预热 presets 目录下的所有音色
        if settings.presets_dir.exists():
            # 新结构: presets/{voice_id}/{emotion}.wav
            for voice_dir in settings.presets_dir.iterdir():
                if voice_dir.is_dir():
                    for wav_file in list(voice_dir.glob("*.wav")) + list(voice_dir.glob("*.WAV")):
                        try:
                            if self.model.warmup_speaker(str(wav_file)):
                                warmup_count += 1
                            else:
                                failed_count += 1
                        except Exception as e:
                            logger.warning(f"预热失败 {wav_file}: {e}")
                            failed_count += 1

            # 旧结构: presets/{voice}.wav
            for wav_file in list(settings.presets_dir.glob("*.wav")) + list(settings.presets_dir.glob("*.WAV")):
                if wav_file.is_file():
                    try:
                        if self.model.warmup_speaker(str(wav_file)):
                            warmup_count += 1
                        else:
                            failed_count += 1
                    except Exception as e:
                        logger.warning(f"预热失败 {wav_file}: {e}")
                        failed_count += 1

        # 2. 预热 char 目录下的所有角色音色
        if settings.char_dir.exists():
            for char_dir in settings.char_dir.iterdir():
                if char_dir.is_dir():
                    for wav_file in list(char_dir.glob("*.wav")) + list(char_dir.glob("*.WAV")):
                        try:
                            if self.model.warmup_speaker(str(wav_file)):
                                warmup_count += 1
                            else:
                                failed_count += 1
                        except Exception as e:
                            logger.warning(f"预热失败 {wav_file}: {e}")
                            failed_count += 1

        logger.info("=" * 50)
        logger.info(f"🔥 预热完成: 成功 {warmup_count} 个, 失败 {failed_count} 个")

        # 打印缓存状态
        if hasattr(self.model, 'get_cache_info'):
            cache_info = self.model.get_cache_info()
            logger.info(f"📊 缓存状态: {cache_info['speaker_cache_size']} 个说话人已缓存")

        logger.info("=" * 50)

    def _get_reference_audio_path(self, voice_id: str, emotion: str = "default") -> Path:
        """
        获取参考音频路径（支持新的层级结构和角色音色）
        新结构: presets/{voice_id}/{emotion}.wav
        角色音色: char/{char_id}/{voice_file}.wav
        """
        voice_id = voice_id.replace(".wav", "")
        emotion = emotion.replace(".wav", "")

        # 检查是否是角色音色路径 (格式: char/{char_id}/{voice_name})
        if voice_id.startswith("char/"):
            parts = voice_id.split("/")
            if len(parts) >= 3:
                # char/{char_id}/{voice_name}
                char_id = parts[1]
                voice_name = parts[2]
                char_audio_path = settings.char_dir / char_id / f"{voice_name}.wav"
                if char_audio_path.exists():
                    logger.info(f"使用角色音色: {char_id}/{voice_name}")
                    return char_audio_path
                # 尝试大写后缀
                char_audio_path_upper = settings.char_dir / char_id / f"{voice_name}.WAV"
                if char_audio_path_upper.exists():
                    logger.info(f"使用角色音色: {char_id}/{voice_name}")
                    return char_audio_path_upper
                raise FileNotFoundError(f"角色音色不存在: {char_audio_path}")

        voice_dir = settings.presets_dir / voice_id
        target_path = voice_dir / f"{emotion}.wav"

        if target_path.exists():
            logger.info(f"使用音色: {voice_id}/{emotion}")
            return target_path

        # 尝试大写后缀
        target_path_upper = voice_dir / f"{emotion}.WAV"
        if target_path_upper.exists():
            logger.info(f"使用音色: {voice_id}/{emotion}")
            return target_path_upper

        default_path = voice_dir / "default.wav"
        if default_path.exists():
            logger.warning(f"情感 {emotion} 不存在，使用 {voice_id}/default")
            return default_path

        # 尝试大写后缀
        default_path_upper = voice_dir / "default.WAV"
        if default_path_upper.exists():
            logger.warning(f"情感 {emotion} 不存在，使用 {voice_id}/default")
            return default_path_upper

        old_structure_path = settings.presets_dir / f"{voice_id}.wav"
        if old_structure_path.exists():
            logger.warning(f"使用旧结构音色: {voice_id}.wav（建议迁移到新结构）")
            return old_structure_path

        # 尝试大写后缀
        old_structure_path_upper = settings.presets_dir / f"{voice_id}.WAV"
        if old_structure_path_upper.exists():
            logger.warning(f"使用旧结构音色: {voice_id}.WAV（建议迁移到新结构）")
            return old_structure_path_upper

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
        repetition_penalty: float = 1.0,
        request_id: Optional[str] = None
    ) -> np.ndarray:
        """生成语音（异步，带显存锁保护和队列管理）"""
        if not self.is_loaded:
            raise RuntimeError("模型未加载，请先调用 load_model()")

        # 生成请求ID
        if request_id is None:
            request_id = str(uuid.uuid4())

        # 添加到队列
        success, position = await tts_queue.add(request_id)
        if not success:
            raise RuntimeError(f"队列已满（最大 {MAX_QUEUE_SIZE}），请稍后重试")

        logger.info(f"请求 {request_id[:8]}... 加入队列，位置: {position}")

        try:
            if emotion == "auto":
                from app.services.sentiment import sentiment_analyzer
                emotion = await sentiment_analyzer.analyze(text)
                logger.info(f"智能情感分析结果: {emotion}")

            ref_audio_path = self._get_reference_audio_path(voice_id, emotion)

            # 设置为正在处理
            await tts_queue.set_processing(request_id)

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
        finally:
            # 从队列移除
            await tts_queue.remove(request_id)

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
