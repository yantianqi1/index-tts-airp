import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface TTSConfig {
  apiUrl: string;
  voice: string;
  emotion: string;
  speed: number;
  responseFormat: 'wav' | 'mp3';
  // 高级参数
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
}

interface SettingsState {
  llm: LLMConfig;
  tts: TTSConfig;
  isConfigured: boolean;
  setLLMConfig: (config: Partial<LLMConfig>) => void;
  setTTSConfig: (config: Partial<TTSConfig>) => void;
  markConfigured: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      llm: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4',
      },
      tts: {
        apiUrl: '/api/v1/audio/speech',  // 使用相对路径，通过 Nginx 代理
        voice: 'default',
        emotion: 'default',
        speed: 1.0,
        responseFormat: 'wav',
        // 高级参数默认值
        temperature: 1.0,
        topP: 0.8,
        topK: 20,
        repetitionPenalty: 1.0,
      },
      isConfigured: false,
      setLLMConfig: (config) =>
        set((state) => ({
          llm: { ...state.llm, ...config },
        })),
      setTTSConfig: (config) =>
        set((state) => ({
          tts: { ...state.tts, ...config },
        })),
      markConfigured: () => set({ isConfigured: true }),
    }),
    {
      name: 'tts-chat-settings',
    }
  )
);
