'use client';

import { useState } from 'react';
import { X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { fetchModels } from '@/utils/llmApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { llm, tts, setLLMConfig, setTTSConfig, markConfigured } = useSettings();
  
  const [localLLM, setLocalLLM] = useState(llm);
  const [localTTS, setLocalTTS] = useState(tts);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const modelList = await fetchModels(localLLM.baseUrl, localLLM.apiKey);
      setModels(modelList);
    } catch (error) {
      alert('获取模型列表失败，请检查 Base URL 和 API Key');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = () => {
    if (!localLLM.apiKey || !localLLM.model) {
      alert('请填写完整的 LLM 配置');
      return;
    }
    
    setLLMConfig(localLLM);
    setTTSConfig(localTTS);
    markConfigured();
    onClose();
  };

  const resetToDefaults = () => {
    setLocalTTS({
      ...localTTS,
      speed: 1.0,
      temperature: 1.0,
      topP: 0.8,
      topK: 20,
      repetitionPenalty: 1.0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">设置</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* LLM 配置 */}
          <section>
            <h3 className="text-lg font-medium mb-4">LLM 配置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Base URL</label>
                <input
                  type="text"
                  value={localLLM.baseUrl}
                  onChange={(e) => setLocalLLM({ ...localLLM, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={localLLM.apiKey}
                  onChange={(e) => setLocalLLM({ ...localLLM, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localLLM.model}
                    onChange={(e) => setLocalLLM({ ...localLLM, model: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="gpt-4"
                    list="models-list"
                  />
                  <button
                    onClick={handleFetchModels}
                    disabled={isLoadingModels}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isLoadingModels ? 'animate-spin' : ''} />
                    获取列表
                  </button>
                </div>
                {models.length > 0 && (
                  <datalist id="models-list">
                    {models.map(model => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>
          </section>

          {/* TTS 配置 */}
          <section>
            <h3 className="text-lg font-medium mb-4">TTS 语音配置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">TTS API URL</label>
                <input
                  type="text"
                  value={localTTS.apiUrl}
                  onChange={(e) => setLocalTTS({ ...localTTS, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="http://localhost:8080/v1/audio/speech"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">音色 (Voice)</label>
                  <input
                    type="text"
                    value={localTTS.voice}
                    onChange={(e) => setLocalTTS({ ...localTTS, voice: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="default"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    对应 presets 目录下的文件夹名
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">情感 (Emotion)</label>
                  <select
                    value={localTTS.emotion}
                    onChange={(e) => setLocalTTS({ ...localTTS, emotion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="default">默认 (default)</option>
                    <option value="auto">智能分析 (auto)</option>
                    <option value="happy">开心 (happy)</option>
                    <option value="sad">悲伤 (sad)</option>
                    <option value="angry">愤怒 (angry)</option>
                    <option value="fear">恐惧 (fear)</option>
                    <option value="surprise">惊讶 (surprise)</option>
                    <option value="neutral">中性 (neutral)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  语速 (Speed): {localTTS.speed.toFixed(2)}x
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 w-12">0.5x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={localTTS.speed}
                    onChange={(e) => setLocalTTS({ ...localTTS, speed: parseFloat(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-gray-500 w-12 text-right">2.0x</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-12">
                  <span>慢速</span>
                  <span>正常</span>
                  <span>快速</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">输出格式</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="wav"
                      checked={localTTS.responseFormat === 'wav'}
                      onChange={(e) => setLocalTTS({ ...localTTS, responseFormat: 'wav' })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">WAV (高质量)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="mp3"
                      checked={localTTS.responseFormat === 'mp3'}
                      onChange={(e) => setLocalTTS({ ...localTTS, responseFormat: 'mp3' })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">MP3 (压缩)</span>
                  </label>
                </div>
              </div>

              {/* 高级参数 */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  高级参数 (Advanced)
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-600">
                        这些参数影响语音生成的质量和特性，建议保持默认值
                      </p>
                      <button
                        onClick={resetToDefaults}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        恢复默认
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Temperature (温度): {localTTS.temperature.toFixed(2)}
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-12">0.1</span>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={localTTS.temperature}
                          onChange={(e) => setLocalTTS({ ...localTTS, temperature: parseFloat(e.target.value) })}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs text-gray-500 w-12 text-right">2.0</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        控制生成的随机性。越高越随机，越低越稳定
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Top P (核采样): {localTTS.topP.toFixed(2)}
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-12">0.1</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={localTTS.topP}
                          onChange={(e) => setLocalTTS({ ...localTTS, topP: parseFloat(e.target.value) })}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs text-gray-500 w-12 text-right">1.0</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        影响音色的多样性。推荐值: 0.8
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Top K (候选数量): {localTTS.topK}
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-12">5</span>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="5"
                          value={localTTS.topK}
                          onChange={(e) => setLocalTTS({ ...localTTS, topK: parseInt(e.target.value) })}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs text-gray-500 w-12 text-right">50</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        控制候选 token 数量。推荐值: 20
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Repetition Penalty (重复惩罚): {localTTS.repetitionPenalty.toFixed(1)}
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 w-12">0.5</span>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={localTTS.repetitionPenalty}
                          onChange={(e) => setLocalTTS({ ...localTTS, repetitionPenalty: parseFloat(e.target.value) })}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs text-gray-500 w-12 text-right">2.0</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        防止重复生成。推荐值: 1.0
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
}
