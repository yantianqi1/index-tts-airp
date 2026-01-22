"""FastAPI 主应用入口"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn

from app.core.config import settings
from app.core.inference import tts_engine
from app.models.schemas import (
    TTSRequest,
    VoicesResponse,
    VoiceInfo,
    UploadResponse
)
from app.utils.audio import (
    save_audio_to_wav,
    convert_wav_to_mp3,
    validate_audio_file
)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    logger.info("=" * 50)
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} 启动中...")
    logger.info("=" * 50)
    
    # 确保必要目录存在
    settings.presets_dir.mkdir(parents=True, exist_ok=True)
    settings.weights_dir.mkdir(parents=True, exist_ok=True)
    settings.logs_dir.mkdir(parents=True, exist_ok=True)
    
    # 加载模型
    try:
        tts_engine.load_model()
        logger.info("✓ 模型加载完成")
    except Exception as e:
        logger.error(f"✗ 模型加载失败: {e}")
        raise
    
    logger.info(f"✓ 服务已启动: http://{settings.host}:{settings.port}")
    
    yield
    
    # 关闭时清理
    logger.info("🛑 服务正在关闭...")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="基于 IndexTTS 2.0 的语音合成 API 微服务",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """健康检查"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running"
    }


@app.get("/v1/voices", response_model=VoicesResponse)
async def get_voices():
    """
    获取可用音色列表（支持新的层级结构）
    
    扫描 presets 目录下的所有音色文件夹
    """
    try:
        voices = []
        
        if not settings.presets_dir.exists():
            logger.warning(f"presets 目录不存在: {settings.presets_dir}")
            return VoicesResponse(voices=[])
        
        # 扫描所有子目录（新结构）
        for voice_dir in settings.presets_dir.iterdir():
            if not voice_dir.is_dir():
                continue
            
            voice_id = voice_dir.name
            
            # 获取该音色下的所有情感文件
            emotions = []
            has_default = False
            
            for wav_file in voice_dir.glob("*.wav"):
                emotion_name = wav_file.stem
                emotions.append(emotion_name)
                if emotion_name == "default":
                    has_default = True
            
            # 只有包含至少一个 wav 文件的目录才算有效音色
            if emotions:
                voices.append(
                    VoiceInfo(
                        id=voice_id,
                        name=voice_id,
                        emotions=sorted(emotions),
                        has_default=has_default
                    )
                )
        
        # 兼容旧的扁平结构
        for wav_file in settings.presets_dir.glob("*.wav"):
            voice_id = wav_file.stem
            # 避免重复添加（如果已经在新结构中）
            if not any(v.id == voice_id for v in voices):
                voices.append(
                    VoiceInfo(
                        id=voice_id,
                        name=voice_id,
                        emotions=["default"],
                        has_default=True
                    )
                )
        
        logger.info(f"找到 {len(voices)} 个音色")
        return VoicesResponse(voices=voices)
        
    except Exception as e:
        logger.error(f"获取音色列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/audio/speech")
async def create_speech(request: TTSRequest):
    """
    语音合成接口（支持智能情感分析和高级参数）
    
    接收文本、音色和情感参数，返回音频流
    
    emotion 参数说明：
    - "auto": 自动分析文本情感（需要配置 LLM）
    - "default": 使用默认音色
    - 其他值: 指定具体情感（如 "happy", "sad" 等）
    
    高级参数：
    - temperature: 控制生成的随机性 (0.1-2.0)
    - top_p: 核采样，影响音色多样性 (0.0-1.0)
    - top_k: Top-K采样，控制候选token数量 (1-100)
    - repetition_penalty: 重复惩罚 (0.1-2.0)
    """
    try:
        # 生成音频
        audio_data = await tts_engine.generate(
            text=request.input,
            voice_id=request.voice,
            emotion=request.emotion,
            speed=request.speed,
            temperature=request.temperature or 1.0,
            top_p=request.top_p or 0.8,
            top_k=request.top_k or 20,
            repetition_penalty=request.repetition_penalty or 1.0
        )
        
        # 转换为 WAV 格式
        wav_bytes = save_audio_to_wav(audio_data)
        
        # 根据请求格式转换
        if request.response_format == "mp3":
            audio_bytes = convert_wav_to_mp3(wav_bytes)
            media_type = "audio/mpeg"
        else:
            audio_bytes = wav_bytes
            media_type = "audio/wav"
        
        # 返回流式响应
        return StreamingResponse(
            iter([audio_bytes]),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename=speech.{request.response_format}"
            }
        )
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"语音合成失败: {e}")
        raise HTTPException(status_code=500, detail=f"语音合成失败: {str(e)}")


@app.post("/v1/voices/upload", response_model=UploadResponse)
async def upload_voice(
    file: Annotated[UploadFile, File(description="音色文件 (.wav)")],
    voice_id: str = "default",
    emotion: str = "default"
):
    """
    上传新音色（支持新的层级结构）
    
    管理端接口，用于添加新的参考音频
    
    参数：
    - file: 音频文件
    - voice_id: 音色ID（文件夹名）
    - emotion: 情感标签（文件名）
    """
    try:
        # 验证文件格式
        if not file.filename.endswith('.wav'):
            return UploadResponse(
                success=False,
                message="仅支持 .wav 格式"
            )
        
        # 检查文件大小
        content = await file.read()
        if len(content) > settings.max_upload_size:
            return UploadResponse(
                success=False,
                message=f"文件过大，最大支持 {settings.max_upload_size / 1024 / 1024}MB"
            )
        
        # 创建音色目录（新结构）
        voice_dir = settings.presets_dir / voice_id
        voice_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存文件
        save_path = voice_dir / f"{emotion}.wav"
        
        with open(save_path, "wb") as f:
            f.write(content)
        
        # 验证音频文件
        if not validate_audio_file(save_path):
            save_path.unlink()  # 删除无效文件
            return UploadResponse(
                success=False,
                message="音频文件无效或损坏"
            )
        
        logger.info(f"✓ 音色上传成功: {voice_id}/{emotion}.wav")
        return UploadResponse(
            success=True,
            message="上传成功",
            voice_id=voice_id,
            emotion=emotion
        )
        
    except Exception as e:
        logger.error(f"上传失败: {e}")
        return UploadResponse(
            success=False,
            message=f"上传失败: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=False
    )
