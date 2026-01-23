'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Volume2, Sparkles, Trash2, Settings, ChevronDown, User } from 'lucide-react';
import { useGlobalStore, ChatMessage, Character } from '@/store/useGlobalStore';
import { streamChatCompletion, extractQuotedTexts, CHAT_SYSTEM_PROMPT } from '@/utils/llmApi';
import { AudioQueueManager } from '@/utils/audioQueue';
import { fetchCharacters, fetchVoices } from '@/utils/ttsApi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const {
    llm,
    tts,
    chatTTS,
    setChatTTS,
    isConfigured,
    chatMessages,
    addChatMessage,
    updateChatMessage,
    clearChatMessages,
    voices,
    setVoices,
    characters,
    setCharacters,
    selectedCharacter,
    setSelectedCharacter,
  } = useGlobalStore();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioManagerRef = useRef<AudioQueueManager | null>(null);
  const processedTextsRef = useRef<Set<string>>(new Set());

  // Initialize audio manager with combined config
  useEffect(() => {
    const combinedConfig = {
      ...tts,
      voice: chatTTS.voice,
      speed: chatTTS.speed,
      temperature: chatTTS.temperature,
    };
    audioManagerRef.current = new AudioQueueManager(combinedConfig);
    return () => {
      audioManagerRef.current?.stop();
    };
  }, []);

  // Update audio manager config when chatTTS changes
  useEffect(() => {
    const combinedConfig = {
      ...tts,
      voice: chatTTS.voice,
      speed: chatTTS.speed,
      temperature: chatTTS.temperature,
    };
    audioManagerRef.current?.updateConfig(combinedConfig);
  }, [tts, chatTTS]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch characters and voices on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [charData, voiceData] = await Promise.all([
          fetchCharacters(tts.baseUrl),
          fetchVoices(tts.baseUrl)
        ]);
        setCharacters(charData.characters);
        if (voiceData.voices) {
          setVoices(voiceData.voices);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    loadData();
  }, [tts.baseUrl, setCharacters, setVoices]);

  const handleCharacterSelect = (character: Character | null) => {
    setSelectedCharacter(character);
    if (character && character.voice) {
      // 从角色音色文件中提取音色名（去掉 .wav 后缀）
      const voiceName = character.voice.replace(/\.wav$/i, '');
      // 使用角色专属音色
      setChatTTS({ voice: `char/${character.id}/${voiceName}` });
    } else {
      // 切换到默认助手或角色无音色时，重置为默认音色
      setChatTTS({ voice: 'default' });
    }
    setShowSettings(false);
  };

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
    addChatMessage(userMessage);
    setIsStreaming(true);
    processedTextsRef.current.clear();

    // Add empty assistant message
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      quotedTexts: [],
    };
    addChatMessage(assistantMessage);

    try {
      let fullContent = '';
      const allQuotedTexts: string[] = [];

      // 构建系统提示词：基础 + 角色附加
      let systemPrompt = CHAT_SYSTEM_PROMPT;
      if (selectedCharacter && selectedCharacter.system_prompt) {
        systemPrompt = `${CHAT_SYSTEM_PROMPT}\n\n【角色设定】\n${selectedCharacter.system_prompt}`;
      }

      for await (const chunk of streamChatCompletion(llm, [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map(m => ({ role: m.role, content: m.content })),
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
        updateChatMessage(assistantId, {
          content: fullContent,
          quotedTexts: allQuotedTexts,
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateChatMessage(assistantId, {
        content: '抱歉，发生了错误。请检查配置或稍后重试。',
      });
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
        </div>

        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(!showSettings)}
          className={`ml-2 p-2 rounded-xl transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5 ${
            showSettings
              ? 'text-rose-500 bg-rose-50'
              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
          }`}
          title="音色与角色设置"
        >
          {selectedCharacter ? (
            <span className="text-xs font-medium text-rose-500 mr-1">{selectedCharacter.name}</span>
          ) : null}
          <Settings size={18} />
          <ChevronDown size={14} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </motion.button>

        {!isConfigured() && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-xs sm:text-sm text-amber-600 bg-amber-100/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-amber-200/50 backdrop-blur-sm ml-2 flex-shrink-0"
          >
            请先配置
          </motion.div>
        )}
        {chatMessages.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChatMessages}
            className="ml-2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex-shrink-0"
            title="清空聊天记录"
          >
            <Trash2 size={18} />
          </motion.button>
        )}
      </motion.header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-white/30 glass-container-solid rounded-none"
          >
            <div className="px-4 sm:px-6 py-4">
              <div className="max-w-4xl mx-auto">
                {/* Character Selection */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <User size={16} />
                    角色选择
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCharacterSelect(null)}
                      className={`px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                        !selectedCharacter
                          ? 'bg-gradient-to-r from-rose-500 to-violet-500 text-white shadow-md'
                          : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
                      }`}
                    >
                      默认助手
                    </motion.button>
                    {characters.map((char) => (
                      <motion.button
                        key={char.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCharacterSelect(char)}
                        className={`px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                          selectedCharacter?.id === char.id
                            ? 'bg-gradient-to-r from-rose-500 to-violet-500 text-white shadow-md'
                            : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
                        }`}
                      >
                        {char.name}
                      </motion.button>
                    ))}
                  </div>
                  {characters.length === 0 && (
                    <p className="text-xs text-slate-400 mt-2">
                      暂无自定义角色，请在项目根目录的 char 文件夹中添加角色
                    </p>
                  )}
                </div>

                {/* Voice Selection - 只在未选择角色时显示 */}
                {!selectedCharacter && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Volume2 size={16} />
                    音色选择
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {voices.map((voice) => (
                      <motion.button
                        key={voice.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setChatTTS({ voice: voice.id });
                          setSelectedCharacter(null);
                        }}
                        className={`px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                          chatTTS.voice === voice.id && !selectedCharacter
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                            : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
                        }`}
                      >
                        {voice.name}
                      </motion.button>
                    ))}
                  </div>
                  {voices.length === 0 && (
                    <p className="text-xs text-slate-400 mt-2">
                      暂无可用音色，请检查后端服务
                    </p>
                  )}
                </div>
                )}

                {/* TTS Parameters - 语速和温度调节 */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <Settings size={16} />
                    语音参数
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 语速调节 */}
                    <div className="bg-white/40 rounded-xl p-3 border border-white/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-600">语速</span>
                        <span className="text-xs font-medium text-rose-500">{chatTTS.speed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={chatTTS.speed}
                        onChange={(e) => setChatTTS({ speed: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gradient-to-r from-rose-200 to-violet-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>0.5x</span>
                        <span>2.0x</span>
                      </div>
                    </div>

                    {/* 温度调节 */}
                    <div className="bg-white/40 rounded-xl p-3 border border-white/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-600">温度</span>
                        <span className="text-xs font-medium text-rose-500">{chatTTS.temperature.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={chatTTS.temperature}
                        onChange={(e) => setChatTTS({ temperature: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gradient-to-r from-rose-200 to-violet-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>稳定</span>
                        <span>多样</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Selection Info */}
                {selectedCharacter && (
                  <div className="mt-4 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                    <p className="text-xs text-rose-600">
                      当前角色: <span className="font-medium">{selectedCharacter.name}</span>
                      {selectedCharacter.voice && (
                        <span className="ml-2">| 专属音色: {selectedCharacter.voice}</span>
                      )}
                    </p>
                    {selectedCharacter.system_prompt && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        角色设定: {selectedCharacter.system_prompt.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages with transparent background */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
        <AnimatePresence>
          {chatMessages.length === 0 ? (
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
                  {selectedCharacter
                    ? `正在与「${selectedCharacter.name}」对话`
                    : '点击右上角设置按钮选择角色或音色'}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  聊天记录会自动保存到浏览器
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {chatMessages.map((msg, idx) => renderMessage(msg, idx))}
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
