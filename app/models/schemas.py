"""Pydantic 数据模型定义"""
from typing import Literal, Optional
from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    """语音合成请求模型"""
    model: str = Field(default="indextts-2.0", description="模型名称")
    input: str = Field(..., min_length=1, max_length=5000, description="待合成的文本")
    voice: str = Field(default="default", description="音色ID，对应presets目录下的文件夹名")
    emotion: str = Field(
        default="default", 
        description="情感标签。可选值: 'auto'(智能分析), 'default', 'happy', 'sad', 'angry', 'fear', 'surprise', 'neutral' 等"
    )
    response_format: Literal["wav", "mp3"] = Field(default="wav", description="输出音频格式")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="语速，范围0.5-2.0")


class VoiceInfo(BaseModel):
    """音色信息模型"""
    id: str = Field(..., description="音色ID")
    name: str = Field(..., description="显示名称")
    emotions: list[str] = Field(default_factory=list, description="可用的情感列表")
    has_default: bool = Field(default=False, description="是否包含默认音频")


class VoicesResponse(BaseModel):
    """音色列表响应模型"""
    voices: list[VoiceInfo]


class UploadResponse(BaseModel):
    """上传响应模型"""
    success: bool
    message: str
    voice_id: Optional[str] = None
    emotion: Optional[str] = None
