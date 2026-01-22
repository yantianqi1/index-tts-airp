import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface TTSConfig {
  baseUrl: string;
  voice: string;
  emotion: string;
  speed: number;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
  responseFormat: string;
}

export interface Voice {
  id: string;
  name: string;
  description?: string;
}

interface GlobalStore {
  // LLM Configuration
  llm: LLMConfig;
  setLLM: (config: Partial<LLMConfig>) => void;
  
  // TTS Configuration
  tts: TTSConfig;
  setTTS: (config: Partial<TTSConfig>) => void;
  
  // Available voices
  voices: Voice[];
  setVoices: (voices: Voice[]) => void;
  
  // Available models
  models: string[];
  setModels: (models: string[]) => void;
  
  // Audio Queue State
  isPlaying: boolean;
  currentAudio: string | null;
  setIsPlaying: (playing: boolean) => void;
  setCurrentAudio: (text: string | null) => void;
  
  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Check if configured
  isConfigured: () => boolean;
}

export const useGlobalStore = create<GlobalStore>()(
  persist(
    (set, get) => ({
      // Default LLM Config
      llm: {
        baseUrl: 'http://localhost:11434/v1',
        apiKey: 'ollama',
        model: 'qwen2.5:latest',
      },
      setLLM: (config) => set((state) => ({ llm: { ...state.llm, ...config } })),
      
      // Default TTS Config
      tts: {
        baseUrl: 'http://localhost:9880',
        voice: 'girl_01',
        emotion: 'default',
        speed: 1.0,
        temperature: 0.3,
        topP: 0.7,
        topK: 20,
        repetitionPenalty: 1.2,
        responseFormat: 'wav',
      },
      setTTS: (config) => set((state) => ({ tts: { ...state.tts, ...config } })),
      
      // Voices
      voices: [],
      setVoices: (voices) => set({ voices }),
      
      // Models
      models: [],
      setModels: (models) => set({ models }),
      
      // Audio State
      isPlaying: false,
      currentAudio: null,
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentAudio: (text) => set({ currentAudio: text }),
      
      // UI State
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Check Configuration
      isConfigured: () => {
        const state = get();
        return !!(
          state.llm.baseUrl &&
          state.llm.apiKey &&
          state.llm.model &&
          state.tts.baseUrl &&
          state.tts.voice
        );
      },
    }),
    {
      name: 'voice-ai-workbench',
    }
  )
);
