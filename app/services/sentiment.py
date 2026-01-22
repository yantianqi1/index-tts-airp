"""智能情感分析服务"""
import logging
import asyncio
from typing import Optional
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """基于 LLM 的情感分析器"""
    
    def __init__(self):
        self.client: Optional[AsyncOpenAI] = None
        self.enabled = settings.enable_smart_sentiment
        
        if self.enabled and settings.sentiment_llm_api_key:
            try:
                self.client = AsyncOpenAI(
                    base_url=settings.sentiment_llm_base_url,
                    api_key=settings.sentiment_llm_api_key,
                    timeout=settings.sentiment_timeout
                )
                logger.info("✓ 情感分析服务已启用")
            except Exception as e:
                logger.error(f"✗ 情感分析服务初始化失败: {e}")
                self.enabled = False
        else:
            logger.info("情感分析服务未启用")
    
    def _build_prompt(self, text: str) -> str:
        """构建情感分析 Prompt"""
        labels_str = ", ".join([f"'{label}'" for label in settings.sentiment_labels])
        
        prompt = f"""你是一个情感分析助手。请分析以下文本的情感，并严格从以下列表中选择一个最匹配的标签返回：[{labels_str}]。

**规则：**
1. 仅返回标签单词，不要包含任何 markdown 格式、标点符号或解释性文字
2. 必须从给定列表中选择，不能返回其他词
3. 如果无法判断，返回 'neutral'

待分析文本：{text}"""
        
        return prompt
    
    async def analyze(self, text: str) -> str:
        """
        分析文本情感
        
        Args:
            text: 待分析的文本
            
        Returns:
            情感标签（如果失败返回 "default"）
        """
        # 如果服务未启用，直接返回 default
        if not self.enabled or not self.client:
            logger.debug("情感分析服务未启用，返回 default")
            return "default"
        
        try:
            logger.info(f"开始情感分析: {text[:50]}...")
            
            # 调用 LLM
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=settings.sentiment_llm_model,
                    messages=[
                        {
                            "role": "user",
                            "content": self._build_prompt(text)
                        }
                    ],
                    temperature=0.3,  # 降低随机性，提高一致性
                    max_tokens=10     # 只需要一个单词
                ),
                timeout=settings.sentiment_timeout
            )
            
            # 提取结果
            emotion = response.choices[0].message.content.strip().lower()
            
            # 清理可能的格式问题
            emotion = emotion.replace("'", "").replace('"', "").replace(".", "").strip()
            
            # 验证是否在白名单内
            if emotion not in settings.sentiment_labels:
                logger.warning(f"LLM 返回了不在白名单内的情感: {emotion}，回退到 default")
                return "default"
            
            logger.info(f"✓ 情感分析完成: {emotion}")
            return emotion
            
        except asyncio.TimeoutError:
            logger.error("情感分析超时，回退到 default")
            return "default"
        except Exception as e:
            logger.error(f"情感分析失败: {e}，回退到 default")
            return "default"


# 全局单例
sentiment_analyzer = SentimentAnalyzer()
