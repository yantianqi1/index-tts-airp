'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wand2, Loader2, Trash2, Download, Play, Pause, Sparkles, Music, Tag, X, Sliders } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { generateSpeech, fetchVoices, fetchQueueStatus, QueueStatus } from '@/utils/ttsApi';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedAudio {
  id: string;
  studioText: string;
  blob: Blob;
  timestamp: number;
  voice: string;
  emotion: string;
  color: 'pink' | 'cyan' | 'violet' | 'amber';
}

const EMOTIONS = [
  { value: 'default', label: '默认' },
  { value: 'happy', label: '开心' },
  { value: 'sad', label: '悲伤' },
  { value: 'angry', label: '愤怒' },
  { value: 'fearful', label: '恐惧' },
  { value: 'surprised', label: '惊讶' },
  { value: 'disgusted', label: '厌恶' },
];

const CARD_COLORS = ['pink', 'cyan', 'violet', 'amber'] as const;

// Default tags for audio
const DEFAULT_TAGS = ['男声', '女声', '旁白', '角色', '情感', '自然'];

// Waveform visualizer component
function WaveformVisualizer({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const bars = 6;
  const colorMap = {
    pink: 'from-rose-400 to-pink-500',
    cyan: 'from-cyan-400 to-blue-500',
    violet: 'from-violet-400 to-purple-500',
    amber: 'from-amber-400 to-orange-500',
  };

  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full bg-gradient-to-t ${colorMap[color as keyof typeof colorMap] || colorMap.cyan}`}
          animate={isPlaying ? {
            height: [8, 24, 12, 28, 16, 8],
          } : {
            height: 8,
          }}
          transition={isPlaying ? {
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          } : {
            duration: 0.3,
          }}
          style={{ minHeight: 8 }}
        />
      ))}
    </div>
  );
}

// Audio card component
function AudioCard({
  audio,
  onDelete,
}: {
  audio: GeneratedAudio;
  onDelete: (id: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(audio.blob);
    setObjectUrl(url);
    const el = new Audio(url);
    el.onended = () => setIsPlaying(false);
    setAudioElement(el);
    return () => {
      URL.revokeObjectURL(url);
      el.pause();
    };
  }, [audio.blob]);

  const togglePlay = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `voice-${Date.now()}.wav`;
    a.click();
  };

  const colorMap = {
    pink: 'from-rose-400 to-pink-500',
    cyan: 'from-cyan-400 to-blue-500',
    violet: 'from-violet-400 to-purple-500',
    amber: 'from-amber-400 to-orange-500',
  };

  const bgColorMap = {
    pink: 'bg-rose-50',
    cyan: 'bg-cyan-50',
    violet: 'bg-violet-50',
    amber: 'bg-amber-50',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`
        relative p-3 sm:p-4 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-glass
        hover:shadow-glass-lg transition-shadow duration-300
        ${bgColorMap[audio.color]}/30
      `}
    >
      {/* Delete button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(audio.id)}
        className="absolute top-2 right-2 p-1.5 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
      >
        <Trash2 size={14} className="studioText-slate-400 hover:studioText-rose-500" />
      </motion.button>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Play button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className={`
            w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0
            bg-gradient-to-br ${colorMap[audio.color]} shadow-lg
            cursor-pointer
          `}
        >
          {isPlaying ? (
            <Pause size={18} className="studioText-white" />
          ) : (
            <Play size={18} className="studioText-white ml-0.5" />
          )}
        </motion.button>

        {/* Waveform */}
        <div className="flex-1 min-w-0">
          <WaveformVisualizer isPlaying={isPlaying} color={audio.color} />
          <p className="studioText-xs studioText-slate-500 mt-1 line-clamp-1">{audio.studioText}</p>
        </div>

        {/* Download */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          className="p-2 hover:bg-white/60 rounded-xl transition-colors cursor-pointer flex-shrink-0"
        >
          <Download size={18} className="studioText-slate-400 hover:studioText-cyan-500" />
        </motion.button>
      </div>

      {/* Metadata */}
      <div className="flex gap-2 mt-2 sm:mt-3 studioText-xs studioText-slate-500 flex-wrap">
        <span className="bg-white/60 px-2 py-0.5 rounded-md">{audio.voice}</span>
        <span className="bg-white/60 px-2 py-0.5 rounded-md">{audio.emotion}</span>
        <span className="studioText-slate-400 ml-auto">{new Date(audio.timestamp).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

export default function StudioPage() {
  const { tts, studioTTS, setStudioTTS, voices, setVoices, isConfigured, studioText, setStudioText } = useGlobalStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [localEmotion, setLocalEmotion] = useState(studioTTS.emotion);
  const [localVoice, setLocalVoice] = useState(studioTTS.voice);
  const [localSpeed, setLocalSpeed] = useState(studioTTS.speed);
  const [localTemperature, setLocalTemperature] = useState(studioTTS.temperature);
  const [localTopP, setLocalTopP] = useState(studioTTS.topP);
  const [localTopK, setLocalTopK] = useState(studioTTS.topK);
  const [localRepetitionPenalty, setLocalRepetitionPenalty] = useState(studioTTS.repetitionPenalty);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveToRepo, setSaveToRepo] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  // 加载队列状态
  const loadQueueStatus = useCallback(async () => {
    try {
      const status = await fetchQueueStatus(tts.baseUrl);
      setQueueStatus(status);
    } catch {
      setQueueStatus(null);
    }
  }, [tts.baseUrl]);

  // 定期刷新队列状态
  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 3000);
    return () => clearInterval(interval);
  }, [loadQueueStatus]);

  // 从持久化的 store 同步 TTS 参数（处理 hydration）
  useEffect(() => {
    setLocalVoice(studioTTS.voice);
    setLocalEmotion(studioTTS.emotion);
    setLocalSpeed(studioTTS.speed);
    setLocalTemperature(studioTTS.temperature);
    setLocalTopP(studioTTS.topP);
    setLocalTopK(studioTTS.topK);
    setLocalRepetitionPenalty(studioTTS.repetitionPenalty);
  }, [studioTTS.voice, studioTTS.emotion, studioTTS.speed, studioTTS.temperature, studioTTS.topP, studioTTS.topK, studioTTS.repetitionPenalty]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // Load voices on mount
  useEffect(() => {
    if (tts.baseUrl && voices.length === 0) {
      fetchVoices(tts.baseUrl)
        .then(data => {
          if (data.voices) {
            setVoices(data.voices);
          }
        })
        .catch(console.error);
    }
  }, [tts.baseUrl]);

  const handleGenerate = async () => {
    if (!studioText.trim() || isGenerating) return;

    if (!isConfigured()) {
      alert('请先在设置中配置 TTS 参数');
      return;
    }

    // 检查队列是否已满
    if (queueStatus && !queueStatus.can_submit) {
      alert('队列已满（最大50），请稍后重试');
      return;
    }

    if (saveToRepo && !saveName.trim()) {
      alert('请填写保存的音频名称');
      return;
    }

    setIsGenerating(true);

    try {
      // 保存本地参数到 studioTTS 配置
      setStudioTTS({
        voice: localVoice,
        emotion: localEmotion,
        speed: localSpeed,
        temperature: localTemperature,
        topP: localTopP,
        topK: localTopK,
        repetitionPenalty: localRepetitionPenalty,
      });

      const blob = await generateSpeech(
        {
          ...tts,
          voice: localVoice,
          emotion: localEmotion,
          speed: localSpeed,
          temperature: localTemperature,
          topP: localTopP,
          topK: localTopK,
          repetitionPenalty: localRepetitionPenalty,
        },
        studioText,
        saveToRepo ? { saveAudio: true, saveName: saveName.trim() } : undefined
      );

      const audio: GeneratedAudio = {
        id: Date.now().toString(),
        studioText: studioText.slice(0, 100),
        blob,
        timestamp: Date.now(),
        voice: localVoice,
        emotion: localEmotion,
        color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
      };

      setHistory(prev => [audio, ...prev]);
      setStudioText('');
      setSaveName('');
      setSelectedTags([]);
      // On mobile, show gallery after generating
      if (window.innerWidth < 1024) {
        setShowGallery(true);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('生成失败，请检查配置或稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex border-b border-white/30 glass-container-solid rounded-none">
        <button
          onClick={() => setShowGallery(false)}
          className={`flex-1 py-3 studioText-sm font-medium transition-colors ${
            !showGallery
              ? 'studioText-cyan-600 border-b-2 border-cyan-500'
              : 'studioText-slate-500'
          }`}
        >
          创作
        </button>
        <button
          onClick={() => setShowGallery(true)}
          className={`flex-1 py-3 studioText-sm font-medium transition-colors relative ${
            showGallery
              ? 'studioText-cyan-600 border-b-2 border-cyan-500'
              : 'studioText-slate-500'
          }`}
        >
          成果
          {history.length > 0 && (
            <span className="absolute top-2 right-1/4 w-5 h-5 bg-rose-500 studioText-white studioText-xs rounded-full flex items-center justify-center">
              {history.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Creator Canvas */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={`lg:w-[65%] flex flex-col lg:border-r border-white/30 ${showGallery ? 'hidden lg:flex' : 'flex'}`}
        >
          {/* Header - Desktop only */}
          <header className="hidden lg:flex h-16 border-b border-white/30 px-6 items-center glass-container-solid rounded-none">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl">
                <Music size={20} className="studioText-white" />
              </div>
              <h1 className="studioText-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-studioText studioText-transparent">
                创作工坊
              </h1>
            </div>
          </header>

          {/* Canvas Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* The Notepad - Main Input */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-container p-4 sm:p-6 mb-4 sm:mb-6"
            >
              <div className="relative">
                {/* Notepad Header */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-white/30">
                  <Sparkles size={16} className="studioText-cyan-500" />
                  <span className="studioText-xs sm:studioText-sm font-medium studioText-slate-600">创作画布</span>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={studioText}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 500) {
                        setStudioText(value);
                      }
                    }}
                    maxLength={500}
                    placeholder="在这里写下你想要转化为声音的文字..."
                    className="
                      w-full h-40 sm:h-64 px-4 py-3 sm:px-5 sm:py-4
                      bg-white/40 backdrop-blur-sm
                      rounded-2xl border-0
                      resize-none outline-none
                      studioText-slate-700 placeholder-slate-400
                      leading-relaxed studioText-sm sm:studioText-base
                      focus:ring-2 focus:ring-cyan-200
                      shadow-inner
                      caret-cyan-500
                      transition-all duration-300
                    "
                    style={{
                      backgroundImage: 'linear-gradient(transparent 31px, rgba(56, 189, 248, 0.1) 31px)',
                      backgroundSize: '100% 32px',
                      lineHeight: '32px',
                    }}
                  />
                  {/* Character counter badge */}
                  <div className={`absolute bottom-3 right-3 px-2 sm:px-3 py-1 rounded-full studioText-xs font-medium shadow-lg ${
                    studioText.length >= 500
                      ? 'bg-gradient-to-r from-rose-400 to-pink-500 studioText-white'
                      : studioText.length >= 400
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 studioText-white'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 studioText-white'
                  }`}>
                    {studioText.length}/500 字
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Candy Control Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-container p-4 sm:p-5"
            >
              <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 sm:gap-4">
                {/* Voice Selector */}
                <div className="col-span-1 lg:flex-1 lg:min-w-[150px]">
                  <label className="block studioText-xs font-medium studioText-slate-500 mb-1 sm:mb-2">音色</label>
                  <select
                    value={localVoice}
                    onChange={(e) => setLocalVoice(e.target.value)}
                    className="
                      w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 hover:bg-blue-50
                      rounded-full border-0 outline-none studioText-sm
                      studioText-slate-700 hover:studioText-blue-500
                      cursor-pointer transition-all duration-200
                      shadow-sm hover:shadow-md
                      focus:ring-2 focus:ring-cyan-200
                    "
                  >
                    {voices.length > 0 ? (
                      voices.map(voice => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name || voice.id}
                        </option>
                      ))
                    ) : (
                      <option value={localVoice}>{localVoice}</option>
                    )}
                  </select>
                </div>

                {/* Emotion Selector */}
                <div className="col-span-1 lg:flex-1 lg:min-w-[120px]">
                  <label className="block studioText-xs font-medium studioText-slate-500 mb-1 sm:mb-2">情感</label>
                  <select
                    value={localEmotion}
                    onChange={(e) => setLocalEmotion(e.target.value)}
                    className="
                      w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 hover:bg-violet-50
                      rounded-full border-0 outline-none studioText-sm
                      studioText-slate-700 hover:studioText-violet-500
                      cursor-pointer transition-all duration-200
                      shadow-sm hover:shadow-md
                      focus:ring-2 focus:ring-violet-200
                    "
                  >
                    {EMOTIONS.map(emotion => (
                      <option key={emotion.value} value={emotion.value}>
                        {emotion.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Slider */}
                <div className="col-span-2 lg:flex-1 lg:min-w-[180px]">
                  <label className="block studioText-xs font-medium studioText-slate-500 mb-1 sm:mb-2">
                    语速 <span className="studioText-cyan-500 font-bold">{localSpeed.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={localSpeed}
                    onChange={(e) => setLocalSpeed(parseFloat(e.target.value))}
                    className="
                      w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-gradient-to-br
                      [&::-webkit-slider-thumb]:from-cyan-400
                      [&::-webkit-slider-thumb]:to-blue-500
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-white
                    "
                  />
                </div>
              </div>

              {/* Voice Quality (Advanced Parameters) */}
              <div className="mt-4 pt-4 border-t border-white/30">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 studioText-sm studioText-slate-600 hover:studioText-cyan-600 cursor-pointer transition-colors w-full"
                >
                  <Sliders size={14} className="studioText-cyan-500" />
                  <span className="font-medium">声音画质</span>
                  <motion.span
                    animate={{ rotate: showAdvanced ? 180 : 0 }}
                    className="ml-auto studioText-slate-400"
                  >
                    ▼
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4 p-3 sm:p-4 bg-white/40 rounded-xl">
                        <div>
                          <label className="block studioText-xs sm:studioText-sm studioText-slate-600 mb-1">
                            温度系数: <span className="studioText-rose-500 font-semibold">{localTemperature}</span>
                          </label>
                          <p className="studioText-xs studioText-slate-400 mb-2 hidden sm:block">控制语音的随机性和创造性</p>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={localTemperature}
                            onChange={(e) => setLocalTemperature(parseFloat(e.target.value))}
                            className="
                              w-full h-2 bg-gradient-to-r from-rose-200 to-pink-200 rounded-lg appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-5
                              [&::-webkit-slider-thumb]:h-5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-gradient-to-r
                              [&::-webkit-slider-thumb]:from-rose-400
                              [&::-webkit-slider-thumb]:to-pink-500
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:border-2
                              [&::-webkit-slider-thumb]:border-white
                            "
                          />
                        </div>

                        <div>
                          <label className="block studioText-xs sm:studioText-sm studioText-slate-600 mb-1">
                            核采样概率: <span className="studioText-cyan-500 font-semibold">{localTopP}</span>
                          </label>
                          <p className="studioText-xs studioText-slate-400 mb-2 hidden sm:block">限制采样范围，值越小越稳定</p>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={localTopP}
                            onChange={(e) => setLocalTopP(parseFloat(e.target.value))}
                            className="
                              w-full h-2 bg-gradient-to-r from-cyan-200 to-blue-200 rounded-lg appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-5
                              [&::-webkit-slider-thumb]:h-5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-gradient-to-r
                              [&::-webkit-slider-thumb]:from-cyan-400
                              [&::-webkit-slider-thumb]:to-blue-500
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:border-2
                              [&::-webkit-slider-thumb]:border-white
                            "
                          />
                        </div>

                        <div>
                          <label className="block studioText-xs sm:studioText-sm studioText-slate-600 mb-1">
                            候选词数量: <span className="studioText-violet-500 font-semibold">{localTopK}</span>
                          </label>
                          <p className="studioText-xs studioText-slate-400 mb-2 hidden sm:block">每步考虑的候选数量</p>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={localTopK}
                            onChange={(e) => setLocalTopK(parseInt(e.target.value))}
                            className="
                              w-full h-2 bg-gradient-to-r from-violet-200 to-purple-200 rounded-lg appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-5
                              [&::-webkit-slider-thumb]:h-5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-gradient-to-r
                              [&::-webkit-slider-thumb]:from-violet-400
                              [&::-webkit-slider-thumb]:to-purple-500
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:border-2
                              [&::-webkit-slider-thumb]:border-white
                            "
                          />
                        </div>

                        <div>
                          <label className="block studioText-xs sm:studioText-sm studioText-slate-600 mb-1">
                            重复惩罚: <span className="studioText-amber-500 font-semibold">{localRepetitionPenalty}</span>
                          </label>
                          <p className="studioText-xs studioText-slate-400 mb-2 hidden sm:block">抑制重复，值越高越少重复</p>
                          <input
                            type="range"
                            min="1"
                            max="2"
                            step="0.1"
                            value={localRepetitionPenalty}
                            onChange={(e) => setLocalRepetitionPenalty(parseFloat(e.target.value))}
                            className="
                              w-full h-2 bg-gradient-to-r from-amber-200 to-orange-200 rounded-lg appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-5
                              [&::-webkit-slider-thumb]:h-5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-gradient-to-r
                              [&::-webkit-slider-thumb]:from-amber-400
                              [&::-webkit-slider-thumb]:to-orange-500
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:border-2
                              [&::-webkit-slider-thumb]:border-white
                            "
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Save to repo option */}
              <div className="mt-4 pt-4 border-t border-white/30 space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 studioText-sm studioText-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToRepo}
                      onChange={(e) => setSaveToRepo(e.target.checked)}
                      className="w-4 h-4 studioText-cyan-500 rounded-lg focus:ring-cyan-400 cursor-pointer"
                    />
                    保存到仓库
                  </label>
                  {saveToRepo && (
                    <motion.input
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      type="studioText"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="音频名称"
                      className="
                        flex-1 min-w-[120px] px-3 sm:px-4 py-2 bg-white/60 rounded-full
                        studioText-sm studioText-slate-700 placeholder-slate-400
                        outline-none focus:ring-2 focus:ring-cyan-200
                        transition-all duration-200
                      "
                    />
                  )}
                </div>

                {/* Tags Selection */}
                {saveToRepo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <div className="flex items-center gap-2 studioText-sm studioText-slate-600">
                      <Tag size={14} className="studioText-cyan-500" />
                      <span>选择标签</span>
                    </div>

                    {/* Default tags */}
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_TAGS.map(tag => (
                        <motion.button
                          key={tag}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleTag(tag)}
                          className={`
                            px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full studioText-xs sm:studioText-sm font-medium cursor-pointer
                            transition-all duration-200
                            ${selectedTags.includes(tag)
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 studioText-white shadow-md'
                              : 'bg-white/60 studioText-slate-600 hover:bg-white/80 border border-white/50'
                            }
                          `}
                        >
                          {tag}
                        </motion.button>
                      ))}
                    </div>

                    {/* Selected custom tags */}
                    {selectedTags.filter(t => !DEFAULT_TAGS.includes(t)).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.filter(t => !DEFAULT_TAGS.includes(t)).map(tag => (
                          <motion.span
                            key={tag}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="
                              px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full studioText-xs sm:studioText-sm font-medium
                              bg-gradient-to-r from-violet-400 to-purple-500 studioText-white
                              flex items-center gap-1.5
                            "
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}

                    {/* Custom tag input */}
                    <div className="flex gap-2">
                      <input
                        type="studioText"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                        placeholder="添加自定义标签..."
                        className="
                          flex-1 px-3 sm:px-4 py-2 bg-white/40 rounded-full
                          studioText-sm studioText-slate-700 placeholder-slate-400
                          outline-none focus:ring-2 focus:ring-violet-200
                          transition-all duration-200
                        "
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addCustomTag}
                        disabled={!customTag.trim()}
                        className="
                          px-3 sm:px-4 py-2 bg-gradient-to-r from-violet-400 to-purple-500
                          studioText-white studioText-sm font-medium rounded-full
                          disabled:opacity-50 disabled:cursor-not-allowed
                          cursor-pointer transition-all duration-200
                        "
                      >
                        添加
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!studioText.trim() || isGenerating || !isConfigured() || (queueStatus !== null && !queueStatus.can_submit)}
                className={`
                  w-full mt-4 sm:mt-5 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl
                  font-bold studioText-base sm:studioText-lg studioText-white
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  flex items-center justify-center gap-2 sm:gap-3 cursor-pointer
                  transition-all duration-300
                  ${isGenerating
                    ? 'bg-gradient-to-r from-slate-400 to-slate-500'
                    : queueStatus && !queueStatus.can_submit
                      ? 'bg-gradient-to-r from-rose-400 to-pink-500'
                      : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 hover:shadow-xl hover:shadow-blue-200'
                  }
                `}
                style={{
                  backgroundSize: isGenerating ? '100%' : '200% 200%',
                  animation: !isGenerating ? 'gradient-shift 3s ease infinite' : 'none',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    正在生成...
                  </>
                ) : queueStatus && !queueStatus.can_submit ? (
                  <>
                    <Wand2 size={22} />
                    队列已满
                  </>
                ) : (
                  <>
                    <Wand2 size={22} />
                    生成语音
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Right: Result Gallery */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className={`lg:w-[35%] flex flex-col ${showGallery ? 'flex' : 'hidden lg:flex'}`}
        >
          {/* Header - Desktop only */}
          <header className="hidden lg:flex h-16 border-b border-white/30 px-6 items-center justify-between glass-container-solid rounded-none">
            <h2 className="studioText-lg font-semibold studioText-slate-700">成果画廊</h2>
            {history.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setHistory([])}
                className="studioText-sm studioText-slate-500 hover:studioText-rose-500 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-rose-50"
              >
                清空
              </motion.button>
            )}
          </header>

          {/* Mobile header with clear button */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/30">
            <span className="studioText-sm studioText-slate-600">共 {history.length} 个音频</span>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="studioText-sm studioText-rose-500 px-3 py-1 rounded-lg bg-rose-50"
              >
                清空
              </button>
            )}
          </div>

          {/* Gallery */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {history.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full"
                >
                  <div className="glass-container px-6 sm:px-8 py-8 sm:py-10 studioText-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-block mb-4"
                    >
                      <Music size={40} className="studioText-cyan-400" />
                    </motion.div>
                    <p className="studioText-base sm:studioText-lg studioText-slate-600 mb-2 font-medium">等待创作</p>
                    <p className="studioText-xs sm:studioText-sm studioText-slate-500">生成的音频会出现在这里</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {history.map((audio) => (
                    <AudioCard
                      key={audio.id}
                      audio={audio}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
