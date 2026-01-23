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
    save_audio: bool = Field(default=False, description="是否保存生成音频到本地仓库目录")
    save_name: Optional[str] = Field(default=None, description="保存的音频文件名（不含扩展名）")
    
    # 高级参数（可选）
    temperature: Optional[float] = Field(default=1.0, ge=0.1, le=2.0, description="温度，控制生成的随机性")
    top_p: Optional[float] = Field(default=0.8, ge=0.0, le=1.0, description="核采样，影响音色多样性")
    top_k: Optional[int] = Field(default=20, ge=1, le=100, description="Top-K采样，控制候选token数量")
    repetition_penalty: Optional[float] = Field(default=1.0, ge=0.1, le=2.0, description="重复惩罚")


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


class AudioRepositoryItem(BaseModel):
    id: str
    filename: str
    url: str
    created_at: int
    size_bytes: int


class AudioRepositoryResponse(BaseModel):
    items: list[AudioRepositoryItem]


class CharacterInfo(BaseModel):
    """角色信息模型"""
    id: str = Field(..., description="角色ID（文件夹名）")
    name: str = Field(..., description="显示名称（文件夹名）")
    voice: Optional[str] = Field(default=None, description="关联的音色文件名")
    system_prompt: str = Field(default="", description="角色专属系统提示词")


class CharactersResponse(BaseModel):
    """角色列表响应模型"""
    characters: list[CharacterInfo]
