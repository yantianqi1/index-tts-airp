'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Volume2, Sparkles } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { streamChatCompletion, extractQuotedTexts, Message, CHAT_SYSTEM_PROMPT } from '@/utils/llmApi';
import { AudioQueueManager } from '@/utils/audioQueue';
import { motion, AnimatePresence } from 'framer-motion';

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
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
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

  const getPlayableTexts = (content: string) => {
    const quoted = extractQuotedTexts(content);
    if (quoted.length > 0) {
      return { texts: quoted, mode: 'quote' as const };
    }
    const trimmed = content.trim();
    return { texts: trimmed ? [trimmed] : [], mode: 'full' as const };
  };

  const handlePlayMessage = (content: string) => {
    const { texts } = getPlayableTexts(content);
    if (texts.length === 0) return;
    texts.forEach(text => audioManagerRef.current?.enqueue(text));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: index * 0.05
        }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={`max-w-[85%] sm:max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}
        >
          <div
            className={`
              px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base
              ${isUser
                ? 'bubble-user'
                : 'bubble-ai'
              }
            `}
          >
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          </div>

          {!isUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlayMessage(message.content)}
              disabled={!isConfigured()}
              className="mt-2 text-xs text-slate-500 hover:text-rose-500 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded-lg hover:bg-white/50"
              aria-label="播放语音"
            >
              <Volume2 size={14} />
              {(() => {
                const { texts, mode } = getPlayableTexts(message.content);
                if (texts.length === 0) return '无可播放内容';
                if (mode === 'quote') return `播放引号内容 (${texts.length})`;
                return '播放回复';
              })()}
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header with glass effect */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-14 sm:h-16 border-b border-white/30 px-4 sm:px-6 flex items-center justify-between glass-container-solid rounded-none flex-shrink-0"
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent truncate">
            AI 语音对话
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            双引号内的对话会自动转为语音播放
          </p>
        </div>
        {!isConfigured() && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-xs sm:text-sm text-amber-600 bg-amber-100/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-amber-200/50 backdrop-blur-sm ml-2 flex-shrink-0"
          >
            请先配置
          </motion.div>
        )}
      </motion.header>

      {/* Messages with transparent background */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center glass-container px-6 sm:px-12 py-8 sm:py-10 mx-4">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <Sparkles size={40} className="text-rose-400 sm:w-12 sm:h-12" />
                </motion.div>
                <p className="text-base sm:text-lg text-slate-700 mb-2 font-medium">开始对话</p>
                <p className="text-xs sm:text-sm text-slate-500">
                  AI 回复中引号内的内容会自动朗读
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  提示：聊天记录不会保存，刷新页面后将清空
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((msg, idx) => renderMessage(msg, idx))}
              <div ref={messagesEndRef} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Input area with glass effect */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-t border-white/30 px-3 sm:px-6 py-3 sm:py-4 glass-container-solid rounded-none flex-shrink-0"
      >
        <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isConfigured() ? "输入消息..." : "请先配置设置"}
            disabled={isStreaming || !isConfigured()}
            className="
              flex-1 px-4 py-3 sm:px-5 sm:py-3.5 bg-white/60 border border-white/50 rounded-2xl
              resize-none focus:ring-2 focus:ring-rose-300 focus:border-transparent
              outline-none disabled:opacity-50 disabled:cursor-not-allowed
              text-slate-800 placeholder-slate-400 text-sm sm:text-base
              transition-all duration-200 backdrop-blur-xl
              shadow-glass
            "
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !isConfigured()}
            className="
              px-4 sm:px-6 py-3 sm:py-3.5 btn-candy-pink
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              flex items-center gap-2 font-medium cursor-pointer flex-shrink-0
            "
          >
            {isStreaming ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="hidden sm:inline">发送中</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span className="hidden sm:inline">发送</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
