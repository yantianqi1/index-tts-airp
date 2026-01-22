'use client';

import { useState, useEffect } from 'react';
import { Wand2, Loader2, Trash2 } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { generateSpeech, fetchVoices } from '@/utils/ttsApi';
import AudioPlayer from '@/components/AudioPlayer';

interface GeneratedAudio {
  id: string;
  text: string;
  blob: Blob;
  timestamp: number;
  voice: string;
  emotion: string;
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

export default function StudioPage() {
  const { tts, setTTS, voices, setVoices, isConfigured } = useGlobalStore();
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [localEmotion, setLocalEmotion] = useState(tts.emotion);
  const [localVoice, setLocalVoice] = useState(tts.voice);
  const [localSpeed, setLocalSpeed] = useState(tts.speed);

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
    if (!text.trim() || isGenerating) return;

    if (!isConfigured()) {
      alert('请先在设置中配置 TTS 参数');
      return;
    }

    setIsGenerating(true);

    try {
      // Update global config with local settings
      setTTS({
        voice: localVoice,
        emotion: localEmotion,
        speed: localSpeed,
      });

      const blob = await generateSpeech(
        { ...tts, voice: localVoice, emotion: localEmotion, speed: localSpeed },
        text
      );

      const audio: GeneratedAudio = {
        id: Date.now().toString(),
        text,
        blob,
        timestamp: Date.now(),
        voice: localVoice,
        emotion: localEmotion,
      };

      setHistory(prev => [audio, ...prev]);
      setText('');
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
    <div className="h-screen bg-slate-950 flex">
      {/* Left Panel - Input */}
      <div className="w-1/2 border-r border-slate-800 flex flex-col">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center bg-slate-900/50 backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-white">文本转语音工坊</h1>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              输入文本
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此粘贴或输入要转换的文本..."
              className="
                w-full h-64 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
                resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                outline-none text-slate-100 placeholder-slate-500
                transition-all duration-200
              "
            />
            <div className="mt-2 text-xs text-slate-400">
              {text.length} 字符
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                音色
              </label>
              <select
                value={localVoice}
                onChange={(e) => setLocalVoice(e.target.value)}
                className="
                  w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none text-slate-100 cursor-pointer
                  transition-all duration-200
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

            {/* Emotion Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                情感
              </label>
              <select
                value={localEmotion}
                onChange={(e) => setLocalEmotion(e.target.value)}
                className="
                  w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none text-slate-100 cursor-pointer
                  transition-all duration-200
                "
              >
                {EMOTIONS.map(emotion => (
                  <option key={emotion.value} value={emotion.value}>
                    {emotion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                语速: {localSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={localSpeed}
                onChange={(e) => setLocalSpeed(parseFloat(e.target.value))}
                className="
                  w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-500
                  [&::-webkit-slider-thumb]:cursor-pointer
                "
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!text.trim() || isGenerating || !isConfigured()}
            className="
              w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center gap-2
              font-medium cursor-pointer
            "
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                生成语音
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel - History */}
      <div className="w-1/2 flex flex-col">
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">生成历史</h2>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-sm text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              清空历史
            </button>
          )}
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <p className="text-lg mb-2">暂无生成记录</p>
                <p className="text-sm">在左侧输入文本并生成语音</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 line-clamp-2 mb-2">
                        {item.text}
                      </p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>音色: {item.voice}</span>
                        <span>•</span>
                        <span>情感: {item.emotion}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="删除"
                    >
                      <Trash2 size={16} className="text-slate-400" />
                    </button>
                  </div>
                  <AudioPlayer audioBlob={item.blob} showDownload={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
