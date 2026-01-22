import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  extractedTexts?: string[]; // 提取出的语音文本
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string, extractedTexts?: string[]) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChat = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Date.now().toString(),
          timestamp: Date.now(),
        },
      ],
    })),
  updateLastMessage: (content, extractedTexts) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
          extractedTexts,
        };
      }
      return { messages };
    }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  clearMessages: () => set({ messages: [] }),
}));
