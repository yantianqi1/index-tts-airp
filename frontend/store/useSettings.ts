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
        apiUrl: 'http://localhost:8080/v1/audio/speech',
        voice: 'girl_01',
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
