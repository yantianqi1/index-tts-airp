'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Settings, Trash2 } from 'lucide-react';
import { useChat } from '@/store/useChat';
import { useSettings } from '@/store/useSettings';
import { streamChatCompletion } from '@/utils/llmApi';
import { AudioQueueManager, extractQuotedTexts } from '@/utils/audioQueue';
import MessageBubble from './MessageBubble';
import SettingsModal from './SettingsModal';

export default function ChatInterface() {
  const { messages, isStreaming, addMessage, updateLastMessage, setStreaming, clearMessages } = useChat();
  const { llm, tts, isConfigured } = useSettings();
  
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(!isConfigured);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioManagerRef = useRef<AudioQueueManager | null>(null);
  const processedTextsRef = useRef<Set<string>>(new Set());

  // 初始化音频管理器
  useEffect(() => {
    audioManagerRef.current = new AudioQueueManager(tts.apiUrl, tts.voice);
  }, []);

  // 更新音频管理器配置
  useEffect(() => {
    audioManagerRef.current?.updateConfig(tts.apiUrl, tts.voice);
  }, [tts.apiUrl, tts.voice]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    if (!isConfigured) {
      setShowSettings(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    // 添加用户消息
    addMessage({ role: 'user', content: userMessage });
    
    // 添加空的助手消息
    addMessage({ role: 'assistant', content: '' });
    
    setStreaming(true);
    processedTextsRef.current.clear();

    try {
      let fullContent = '';
      const allExtractedTexts: string[] = [];

      for await (const chunk of streamChatCompletion(llm, [
        ...messages,
        { id: '', role: 'user', content: userMessage, timestamp: Date.now() }
      ])) {
        fullContent += chunk;
        
        // 实时提取引号内容
        const extractedTexts = extractQuotedTexts(fullContent);
        
        // 找出新增的文本
        const newTexts = extractedTexts.filter(
          text => !processedTextsRef.current.has(text)
        );

        // 将新文本加入队列
        for (const text of newTexts) {
          processedTextsRef.current.add(text);
          allExtractedTexts.push(text);
          audioManagerRef.current?.enqueue(text);
        }

        // 更新消息显示
        updateLastMessage(fullContent, allExtractedTexts);
      }

    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage('抱歉，发生了错误。请检查配置或稍后重试。');
    } finally {
      setStreaming(false);
    }
  };

  const handleReplay = (texts: string[]) => {
    texts.forEach(text => {
      audioManagerRef.current?.enqueue(text);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI 语音聊天</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm('确定要清空所有消息吗？')) {
                clearMessages();
                audioManagerRef.current?.stop();
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="清空对话"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="设置"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">开始对话</p>
              <p className="text-sm">AI 的回复中，双引号内的对话会自动转为语音播放</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onReplay={handleReplay}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConfigured ? "输入消息..." : "请先配置设置"}
            disabled={isStreaming}
            className="flex-1 px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={18} />
            {isStreaming ? '发送中...' : '发送'}
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
