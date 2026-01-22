import { TTSConfig, TTS_BASE_URL } from '@/store/useGlobalStore';

export interface TTSRequest {
  input: string;
  voice: string;
  emotion?: string;
  speed?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repetition_penalty?: number;
  response_format?: string;
  save_audio?: boolean;
  save_name?: string;
}

export interface TTSSaveOptions {
  saveAudio?: boolean;
  saveName?: string;
}

export async function generateSpeech(
  config: TTSConfig,
  text: string,
  options: TTSSaveOptions = {}
): Promise<Blob> {
  const response = await fetch(`${TTS_BASE_URL}/v1/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      voice: config.voice,
      emotion: config.emotion,
      speed: config.speed,
      temperature: config.temperature,
      top_p: config.topP,
      top_k: config.topK,
      repetition_penalty: config.repetitionPenalty,
      response_format: config.responseFormat,
      save_audio: options.saveAudio,
      save_name: options.saveName,
    } as TTSRequest),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.statusText}`);
  }

  return await response.blob();
}

export async function fetchVoices() {
  const response = await fetch(`${TTS_BASE_URL}/v1/voices`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }

  return await response.json();
}

export async function testTTSConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${TTS_BASE_URL}/`);
    
    if (!response.ok) {
      return {
        success: false,
        message: `连接失败: HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `连接成功! 服务: ${data.service || 'Unknown'}, 版本: ${data.version || 'Unknown'}`
    };
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}
