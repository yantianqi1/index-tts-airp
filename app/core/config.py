"""环境变量配置"""
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置类"""
    
    # 服务配置
    app_name: str = "VoiceNexus"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 5050
    
    # 路径配置
    weights_dir: Path = Path("./weights")
    presets_dir: Path = Path("./presets")
    logs_dir: Path = Path("./logs")
    index_tts_repo_dir: Path = Path("./index-tts")
    
    # 模型配置
    model_name: str = "indextts-2.0"
    device: str = "auto"
    default_voice: str = "default.wav"
    
    # 音频配置
    sample_rate: int = 24000
    max_text_length: int = 5000
    
    # 上传配置
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    allowed_audio_formats: list[str] = [".wav"]
    
    # 智能情感分析配置
    enable_smart_sentiment: bool = True
    sentiment_llm_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    sentiment_llm_api_key: str = ""
    sentiment_llm_model: str = "gemini-1.5-flash"
    sentiment_labels: list[str] = ["happy", "sad", "angry", "fear", "surprise", "neutral", "default"]
    sentiment_timeout: int = 10  # LLM 请求超时时间（秒）
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局配置实例
settings = Settings()
