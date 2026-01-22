'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Loader2 } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { streamChatCompletion, extractQuotedTexts, Message } from '@/utils/llmApi';
import { AudioQueueManager } from '@/utils/audioQueue';

interface ChatMessage extends Message {
  id: string;
  timestamp: number;
  quotedTexts?: string[];
}

export default function ChatPage() {
  const { llm, tts, isConfigured } = useGlobalStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioManagerRef = useRef<AudioQueueManager | null>(null);
  const processedTextsRef = useRef<Set<string>>(new Set());

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new AudioQueueManager(tts);
    return () => {
      audioManagerRef.current?.stop();
    };
  }, []);

  // Update audio manager config
  useEffect(() => {
    audioManagerRef.current?.updateConfig(tts);
  }, [tts]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    if (!isConfigured()) {
      alert('请先在设置中配置 LLM 和 TTS 参数');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    processedTextsRef.current.clear();

    // Add empty assistant message
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      quotedTexts: [],
    }]);

    try {
      let fullContent = '';
      const allQuotedTexts: string[] = [];

      for await (const chunk of streamChatCompletion(llm, [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content },
      ])) {
        fullContent += chunk;

        // Extract quoted texts in real-time
        const quotedTexts = extractQuotedTexts(fullContent);
        const newTexts = quotedTexts.filter(
          text => !processedTextsRef.current.has(text)
        );

        // Enqueue new texts for TTS
        for (const text of newTexts) {
          processedTextsRef.current.add(text);
          allQuotedTexts.push(text);
          audioManagerRef.current?.enqueue(text);
        }

        // Update message
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: fullContent, quotedTexts: allQuotedTexts }
            : m
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: '抱歉，发生了错误。请检查配置或稍后重试。' }
          : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleReplay = (texts: string[]) => {
    texts.forEach(text => audioManagerRef.current?.enqueue(text));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`
              px-4 py-3 rounded-2xl
              ${isUser
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-100 border border-slate-700'
              }
            `}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          
          {!isUser && message.quotedTexts && message.quotedTexts.length > 0 && (
            <button
              onClick={() => handleReplay(message.quotedTexts!)}
              className="mt-2 text-xs text-slate-400 hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={12} />
              重播语音 ({message.quotedTexts.length})
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-white">AI 语音对话</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            双引号内的对话会自动转为语音播放
          </p>
        </div>
        {!isConfigured() && (
          <div className="text-sm text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
            ⚠️ 请先配置设置
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <p className="text-lg mb-2">开始对话</p>
              <p className="text-sm">输入消息，AI 的回复中引号内的内容会自动朗读</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 px-6 py-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isConfigured() ? "输入消息... (Shift+Enter 换行)" : "请先配置设置"}
            disabled={isStreaming || !isConfigured()}
            className="
              flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
              resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              outline-none disabled:opacity-50 disabled:cursor-not-allowed
              text-slate-100 placeholder-slate-500
              transition-all duration-200
            "
            rows={1}
            style={{ minHeight: '52px', maxHeight: '150px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !isConfigured()}
            className="
              px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center gap-2
              font-medium cursor-pointer
            "
          >
            {isStreaming ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                发送中
              </>
            ) : (
              <>
                <Send size={18} />
                发送
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
