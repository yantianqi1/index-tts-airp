"""FastAPI 主应用入口"""
import logging
import re
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.config import settings
from app.core.inference import tts_engine
from app.models.schemas import (
    TTSRequest,
    VoicesResponse,
    VoiceInfo,
    UploadResponse,
    AudioRepositoryResponse,
    AudioRepositoryItem,
    CharacterInfo,
    CharactersResponse
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


def _sanitize_save_name(name: str) -> str:
    name = name.strip()
    if not name:
        return ""
    name = name.replace("/", "_").replace("\\", "_")
    name = re.sub(r"[\x00-\x1f\x7f]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def _build_save_path(save_name: str, response_format: str) -> Optional[Path]:
    safe_name = _sanitize_save_name(save_name)
    if not safe_name:
        return None
    base_name = safe_name
    lower_name = base_name.lower()
    if lower_name.endswith(".wav") or lower_name.endswith(".mp3"):
        base_name = base_name[:-4].strip().rstrip(".")
    if not base_name:
        return None
    filename = f"{base_name}.{response_format}"
    return settings.generated_audio_dir / Path(filename).name


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
    settings.generated_audio_dir.mkdir(parents=True, exist_ok=True)
    settings.char_dir.mkdir(parents=True, exist_ok=True)
    
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

# 添加 CORS 中间件（允许跨域请求）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 提供生成音频的静态访问
app.mount("/generated_audio", StaticFiles(directory=str(settings.generated_audio_dir), check_dir=False), name="generated_audio")


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

            # 获取该音色下的所有情感文件（支持大小写后缀）
            emotions = []
            has_default = False

            for wav_file in list(voice_dir.glob("*.wav")) + list(voice_dir.glob("*.WAV")):
                emotion_name = wav_file.stem
                emotions.append(emotion_name)
                if emotion_name.lower() == "default":
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
        
        # 兼容旧的扁平结构（支持大小写后缀）
        for wav_file in list(settings.presets_dir.glob("*.wav")) + list(settings.presets_dir.glob("*.WAV")):
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



@app.get("/v1/audio/repository", response_model=AudioRepositoryResponse)
async def list_audio_repository():
    # 获取已保存的音频列表
    try:
        if not settings.generated_audio_dir.exists():
            return AudioRepositoryResponse(items=[])

        items = []
        audio_files = [
            *settings.generated_audio_dir.glob("*.wav"),
            *settings.generated_audio_dir.glob("*.mp3"),
        ]
        audio_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)

        for file_path in audio_files:
            stat = file_path.stat()
            items.append(
                AudioRepositoryItem(
                    id=file_path.stem,
                    filename=file_path.name,
                    url=f"/generated_audio/{file_path.name}",
                    created_at=int(stat.st_mtime * 1000),
                    size_bytes=stat.st_size,
                )
            )

        return AudioRepositoryResponse(items=items)
    except Exception as e:
        logger.error(f"获取音频仓库失败: {e}")
        raise HTTPException(status_code=500, detail="获取音频仓库失败")


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
        
        # 持久化保存（可选）
        if request.save_audio:
            if not request.save_name:
                raise HTTPException(status_code=400, detail="save_audio 为 true 时必须提供 save_name")
            save_path = _build_save_path(request.save_name, request.response_format)
            if not save_path:
                raise HTTPException(status_code=400, detail="save_name 无效")
            if save_path.exists():
                raise HTTPException(status_code=409, detail="文件名已存在，请更换名称")
            save_path.parent.mkdir(parents=True, exist_ok=True)
            with open(save_path, "wb") as f:
                f.write(audio_bytes)
            logger.info(f"✓ 生成音频已保存: {save_path}")

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


@app.get("/v1/characters", response_model=CharactersResponse)
async def get_characters():
    """
    获取可用角色列表

    扫描 char 目录下的所有角色文件夹
    每个角色文件夹包含：
    - wav 音频文件（音色）
    - config.json（角色配置，包含系统提示词）
    """
    try:
        characters = []

        if not settings.char_dir.exists():
            logger.warning(f"char 目录不存在: {settings.char_dir}")
            return CharactersResponse(characters=[])

        for char_dir in settings.char_dir.iterdir():
            if not char_dir.is_dir():
                continue

            char_id = char_dir.name

            # 跳过隐藏目录和 .ipynb_checkpoints 等系统目录
            if char_id.startswith('.') or char_id == '__pycache__':
                continue

            voice_file = None
            system_prompt = ""
            char_name = char_id  # 默认使用目录名作为角色名

            # 查找 wav 音频文件
            wav_files = list(char_dir.glob("*.wav")) + list(char_dir.glob("*.WAV"))
            if wav_files:
                voice_file = wav_files[0].name

            # 读取角色配置文件（支持任意 .json 文件，优先使用 config.json）
            config_path = char_dir / "config.json"
            if not config_path.exists():
                # 如果没有 config.json，尝试查找其他 json 文件
                json_files = list(char_dir.glob("*.json"))
                if json_files:
                    config_path = json_files[0]

            if config_path.exists():
                try:
                    with open(config_path, "r", encoding="utf-8") as f:
                        config_data = json.load(f)
                        # 支持 system_prompt 或 system_prompt_instruction 字段
                        system_prompt = config_data.get("system_prompt", "") or config_data.get("system_prompt_instruction", "")
                        # 获取角色名
                        char_name = config_data.get("char_name", char_id)
                except Exception as e:
                    logger.warning(f"读取角色配置失败 {char_id}: {e}")

            characters.append(
                CharacterInfo(
                    id=char_id,
                    name=char_name,
                    voice=voice_file,
                    system_prompt=system_prompt
                )
            )

        logger.info(f"找到 {len(characters)} 个角色")
        return CharactersResponse(characters=characters)

    except Exception as e:
        logger.error(f"获取角色列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 提供角色音频的静态访问
app.mount("/char_audio", StaticFiles(directory=str(settings.char_dir), check_dir=False), name="char_audio")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=False
    )
