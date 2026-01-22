import { LLMConfig } from '@/store/useGlobalStore';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
  const regex = /["""']([^"""']+)["""']/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 0) {
      matches.push(text);
    }
  }

  return matches;
}
