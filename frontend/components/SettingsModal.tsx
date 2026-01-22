'use client';

import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
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
            <h3 className="text-lg font-medium mb-4">TTS 配置</h3>
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

              <div>
                <label className="block text-sm font-medium mb-1">Character Voice</label>
                <input
                  type="text"
                  value={localTTS.voice}
                  onChange={(e) => setLocalTTS({ ...localTTS, voice: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="girl_01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  可选值: girl_01, girl_02, boy_01, boy_02 等
                </p>
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
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
