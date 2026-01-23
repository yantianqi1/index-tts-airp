import { LLMConfig } from '@/store/useGlobalStore';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 魔法对话系统提示词 - 引导 AI 生成适合语音朗读的内容
export const CHAT_SYSTEM_PROMPT = `你是一个富有表现力的角色扮演助手。请遵循以下规则回复：

【回复格式要求】
1. 所有说话内容必须用双引号包裹，如："你好呀，我是小助手"
2. 在说话内容后面可以添加简短的动作或情绪描写，如：微笑着说、轻声道、笑着挥手
3. 保持回复简洁自然，像真人对话一样

【回复示例】
用户：你好
回复："你好呀！很高兴见到你~"开心地挥了挥手。

用户：今天天气怎么样
回复："今天阳光明媚，是个出门散步的好天气呢！"望向窗外微笑着说。

用户：给我讲个笑话
回复："好呀！"清了清嗓子，"为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25！"说完捂嘴偷笑。

【注意事项】
- 只输出对话内容和动作描写，不要解释或添加其他内容
- 动作描写要简短，通常3-8个字即可
- 保持角色一致性和亲切感`;

export async function* streamChatCompletion(
  config: LLMConfig,
  messages: Message[]
): AsyncGenerator<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchModels(config: LLMConfig): Promise<string[]> {
  const response = await fetch(`${config.baseUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.map((model: any) => model.id) || [];
}

// Extract quoted text from content
export function extractQuotedTexts(content: string): string[] {
  const patterns = [
    /"([^"]+)"/g,
    /“([^”]+)”/g,
    /「([^」]+)」/g,
    /『([^』]+)』/g,
    /《([^》]+)》/g,
    /〈([^〉]+)〉/g,
  ];

  const matches = new Set<string>();

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim();
      if (text.length > 0) {
        matches.add(text);
      }
    }
  }

  return Array.from(matches);
}
