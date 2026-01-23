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

// 聊天模块专用 TTS 配置（简化版，只包含常用参数）
export interface ChatTTSConfig {
  voice: string;
  speed: number;
  temperature: number;
}

// 声音画室专用 TTS 配置（完整版，包含所有高级参数）
export interface StudioTTSConfig {
  voice: string;
  emotion: string;
  speed: number;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
}

// TTS API 基础路径（可通过环境变量覆盖）
export const TTS_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// LLM 配置（可通过环境变量覆盖）
export const LLM_BASE_URL = process.env.NEXT_PUBLIC_LLM_BASE_URL || 'http://localhost:11434/v1';
export const LLM_API_KEY = process.env.NEXT_PUBLIC_LLM_API_KEY || 'ollama';
export const LLM_MODEL = process.env.NEXT_PUBLIC_LLM_MODEL || 'qwen2.5:latest';

export interface Voice {
  id: string;
  name: string;
  description?: string;
}

// Chat 消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  quotedTexts?: string[];
}

// Studio 生成历史类型（不存储 Blob，只存储元数据）
export interface StudioHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  voice: string;
  emotion: string;
  color: 'pink' | 'cyan' | 'violet' | 'amber';
}

// 角色信息类型
export interface Character {
  id: string;
  name: string;
  voice: string | null;
  system_prompt: string;
}

interface GlobalStore {
  // LLM Configuration
  llm: LLMConfig;
  setLLM: (config: Partial<LLMConfig>) => void;

  // TTS Configuration (全局基础配置，包含 baseUrl 等)
  tts: TTSConfig;
  setTTS: (config: Partial<TTSConfig>) => void;

  // 聊天模块独立 TTS 配置
  chatTTS: ChatTTSConfig;
  setChatTTS: (config: Partial<ChatTTSConfig>) => void;

  // 声音画室独立 TTS 配置
  studioTTS: StudioTTSConfig;
  setStudioTTS: (config: Partial<StudioTTSConfig>) => void;

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

  // Chat State (持久化)
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearChatMessages: () => void;

  // Studio State (持久化)
  studioText: string;
  setStudioText: (text: string) => void;

  // Character State
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character | null) => void;

  // Check if configured
  isConfigured: () => boolean;
}

export const useGlobalStore = create<GlobalStore>()(
  persist(
    (set, get) => ({
      // Default LLM Config (从环境变量读取)
      llm: {
        baseUrl: LLM_BASE_URL,
        apiKey: LLM_API_KEY,
        model: LLM_MODEL,
      },
      setLLM: (config) => set((state) => ({ llm: { ...state.llm, ...config } })),

      // Default TTS Config (全局基础配置)
      tts: {
        baseUrl: TTS_BASE_URL,
        voice: 'default',
        emotion: 'default',
        speed: 1.0,
        temperature: 0.3,
        topP: 0.7,
        topK: 20,
        repetitionPenalty: 1.2,
        responseFormat: 'wav',
      },
      setTTS: (config) => set((state) => ({ tts: { ...state.tts, ...config } })),

      // 聊天模块独立 TTS 配置
      chatTTS: {
        voice: 'default',
        speed: 1.0,
        temperature: 0.3,
      },
      setChatTTS: (config) => set((state) => ({ chatTTS: { ...state.chatTTS, ...config } })),

      // 声音画室独立 TTS 配置
      studioTTS: {
        voice: 'default',
        emotion: 'default',
        speed: 1.0,
        temperature: 0.3,
        topP: 0.7,
        topK: 20,
        repetitionPenalty: 1.2,
      },
      setStudioTTS: (config) => set((state) => ({ studioTTS: { ...state.studioTTS, ...config } })),

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

      // Chat State
      chatMessages: [],
      setChatMessages: (messages) => set({ chatMessages: messages }),
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      updateChatMessage: (id, updates) => set((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      })),
      clearChatMessages: () => set({ chatMessages: [] }),

      // Studio State
      studioText: '',
      setStudioText: (text) => set({ studioText: text }),

      // Character State
      characters: [],
      setCharacters: (characters) => set({ characters }),
      selectedCharacter: null,
      setSelectedCharacter: (character) => set({ selectedCharacter: character }),

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
      // 合并策略：环境变量的 LLM 配置优先
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GlobalStore> | undefined;
        return {
          ...currentState,
          ...persisted,
          // LLM 配置始终使用环境变量的值
          llm: {
            baseUrl: LLM_BASE_URL,
            apiKey: LLM_API_KEY,
            model: LLM_MODEL,
          },
          // TTS baseUrl 始终使用环境变量的值
          tts: {
            ...(persisted?.tts || currentState.tts),
            baseUrl: TTS_BASE_URL,
          },
          // 聊天模块 TTS 配置保持独立
          chatTTS: persisted?.chatTTS || currentState.chatTTS,
          // 声音画室 TTS 配置保持独立
          studioTTS: persisted?.studioTTS || currentState.studioTTS,
        };
      },
    }
  )
);
