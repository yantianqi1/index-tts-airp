import { TTSConfig } from '@/store/useGlobalStore';

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
}

export async function generateSpeech(
  config: TTSConfig,
  text: string
): Promise<Blob> {
  const response = await fetch(`${config.baseUrl}/v1/audio/speech`, {
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
    } as TTSRequest),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.statusText}`);
  }

  return await response.blob();
}

export async function fetchVoices(baseUrl: string) {
  const response = await fetch(`${baseUrl}/v1/voices`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.statusText}`);
  }

  return await response.json();
}
