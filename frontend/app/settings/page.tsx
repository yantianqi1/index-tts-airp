'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { fetchModels } from '@/utils/llmApi';
import { fetchVoices } from '@/utils/ttsApi';

export default function SettingsPage() {
  const { llm, tts, setLLM, setTTS, models, setModels, voices, setVoices } = useGlobalStore();
  
  // Local state for form
  const [localLLM, setLocalLLM] = useState(llm);
  const [localTTS, setLocalTTS] = useState(tts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  useEffect(() => {
    setLocalLLM(llm);
    setLocalTTS(tts);
  }, [llm, tts]);

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      setLLM(localLLM);
      setTTS(localTTS);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadModels = async () => {
    setIsLoadingModels(true);
    try {
      const modelList = await fetchModels(localLLM);
      setModels(modelList);
      alert(`成功加载 ${modelList.length} 个模型`);
    } catch (error) {
      console.error('Load models error:', error);
      alert('加载模型失败，请检查配置');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleLoadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const data = await fetchVoices(localTTS.baseUrl);
      if (data.voices) {
        setVoices(data.voices);
        alert(`成功加载 ${data.voices.length} 个音色`);
      }
    } catch (error) {
      console.error('Load voices error:', error);
      alert('加载音色失败，请检查配置');
    } finally {
      setIsLoadingVoices(false);
    }
  };

  return (
    <div className="h-screen bg-slate-950 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-white">全局设置</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="
            px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center gap-2
            font-medium cursor-pointer
          "
        >
          {saveStatus === 'success' ? (
            <>
              <CheckCircle size={18} />
              已保存
            </>
          ) : saveStatus === 'error' ? (
            <>
              <XCircle size={18} />
              保存失败
            </>
          ) : (
            <>
              <Save size={18} />
              保存设置
            </>
          )}
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* LLM Configuration */}
        <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">大语言模型配置</h2>
            <button
              onClick={handleLoadModels}
              disabled={isLoadingModels}
              className="
                px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 flex items-center gap-2 cursor-pointer
              "
            >
              <RefreshCw size={14} className={isLoadingModels ? 'animate-spin' : ''} />
              {isLoadingModels ? '加载中...' : '获取模型列表'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Base URL
              </label>
              <input
                type="text"
                value={localLLM.baseUrl}
                onChange={(e) => setLocalLLM({ ...localLLM, baseUrl: e.target.value })}
                placeholder="http://localhost:11434/v1"
                className="
                  w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none text-slate-100 placeholder-slate-500
                  transition-all duration-200
                "
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={localLLM.apiKey}
                onChange={(e) => setLocalLLM({ ...localLLM, apiKey: e.target.value })}
                placeholder="your-api-key"
                className="
                  w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none text-slate-100 placeholder-slate-500
                  transition-all duration-200
                "
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                模型名称
              </label>
              {models.length > 0 ? (
                <select
                  value={localLLM.model}
                  onChange={(e) => setLocalLLM({ ...localLLM, model: e.target.value })}
                  className="
                    w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    outline-none text-slate-100 cursor-pointer
                    transition-all duration-200
                  "
                >
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={localLLM.model}
                  onChange={(e) => setLocalLLM({ ...localLLM, model: e.target.value })}
                  placeholder="qwen2.5:latest"
                  className="
                    w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    outline-none text-slate-100 placeholder-slate-500
                    transition-all duration-200
                  "
                />
              )}
            </div>
          </div>
        </section>

        {/* TTS Configuration */}
        <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">语音合成配置</h2>
            <button
              onClick={handleLoadVoices}
              disabled={isLoadingVoices}
              className="
                px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 flex items-center gap-2 cursor-pointer
              "
            >
              <RefreshCw size={14} className={isLoadingVoices ? 'animate-spin' : ''} />
              {isLoadingVoices ? '加载中...' : '获取音色列表'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                TTS Base URL
              </label>
              <input
                type="text"
                value={localTTS.baseUrl}
                onChange={(e) => setLocalTTS({ ...localTTS, baseUrl: e.target.value })}
                placeholder="http://localhost:9880"
                className="
                  w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none text-slate-100 placeholder-slate-500
                  transition-all duration-200
                "
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                默认音色
              </label>
              {voices.length > 0 ? (
                <select
                  value={localTTS.voice}
                  onChange={(e) => setLocalTTS({ ...localTTS, voice: e.target.value })}
                  className="
                    w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    outline-none text-slate-100 cursor-pointer
                    transition-all duration-200
                  "
                >
                  {voices.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name || voice.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={localTTS.voice}
                  onChange={(e) => setLocalTTS({ ...localTTS, voice: e.target.value })}
                  placeholder="girl_01"
                  className="
                    w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    outline-none text-slate-100 placeholder-slate-500
                    transition-all duration-200
                  "
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Temperature: {localTTS.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localTTS.temperature}
                  onChange={(e) => setLocalTTS({ ...localTTS, temperature: parseFloat(e.target.value) })}
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Top P: {localTTS.topP}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localTTS.topP}
                  onChange={(e) => setLocalTTS({ ...localTTS, topP: parseFloat(e.target.value) })}
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Top K: {localTTS.topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={localTTS.topK}
                  onChange={(e) => setLocalTTS({ ...localTTS, topK: parseInt(e.target.value) })}
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Repetition Penalty: {localTTS.repetitionPenalty}
                </label>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={localTTS.repetitionPenalty}
                  onChange={(e) => setLocalTTS({ ...localTTS, repetitionPenalty: parseFloat(e.target.value) })}
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
          </div>
        </section>

        {/* Info */}
        <div className="text-center text-sm text-slate-500">
          <p>配置会自动保存到本地存储</p>
        </div>
      </div>
    </div>
  );
}
