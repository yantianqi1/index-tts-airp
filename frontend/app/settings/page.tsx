'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, XCircle, Wifi, WifiOff, Settings2, Volume2 } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { fetchVoices, testTTSConnection } from '@/utils/ttsApi';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { tts, setTTS, voices, setVoices } = useGlobalStore();

  // Local state for form
  const [localTTS, setLocalTTS] = useState(tts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setLocalTTS(tts);
  }, [tts]);

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
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
      alert('加载音色失败，请检查后端服务是否正常运行');
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    try {
      const result = await testTTSConnection(localTTS.baseUrl);
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: '测试失败: ' + (error instanceof Error ? error.message : '未知错误')
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 h-14 sm:h-16 border-b border-white/30 px-4 sm:px-6 flex items-center justify-between glass-container-solid rounded-none"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Settings2 className="text-amber-500" size={20} />
          <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            全局设置
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isSaving}
          className={`
            px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium cursor-pointer text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center gap-1.5 sm:gap-2
            ${saveStatus === 'success'
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
              : saveStatus === 'error'
                ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                : 'btn-candy-pink'
            }
          `}
        >
          {saveStatus === 'success' ? (
            <>
              <CheckCircle size={16} />
              <span className="hidden sm:inline">已保存</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <XCircle size={16} />
              <span className="hidden sm:inline">失败</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span className="hidden sm:inline">保存设置</span>
            </>
          )}
        </motion.button>
      </motion.header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* TTS Configuration */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-container p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-violet-400 to-purple-500 rounded-xl">
                <Volume2 size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">语音合成配置</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate max-w-[200px] sm:max-w-none">后端: {localTTS.baseUrl || "/api"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="
                  flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm bg-white/60 hover:bg-white/80 text-slate-700 rounded-xl
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer
                  border border-white/50
                "
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span className="hidden sm:inline">测试中...</span>
                  </>
                ) : connectionStatus?.success ? (
                  <>
                    <Wifi size={14} className="text-green-500" />
                    <span>测试</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-slate-500" />
                    <span>测试</span>
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLoadVoices}
                disabled={isLoadingVoices}
                className="
                  flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm bg-white/60 hover:bg-white/80 text-slate-700 rounded-xl
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer
                  border border-white/50
                "
              >
                <RefreshCw size={14} className={isLoadingVoices ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isLoadingVoices ? '加载中...' : '获取音色'}</span>
                <span className="sm:hidden">音色</span>
              </motion.button>
            </div>
          </div>

          {/* Connection Status */}
          {connectionStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl flex items-start gap-2 sm:gap-3 ${
                connectionStatus.success
                  ? 'bg-green-100/80 border border-green-200'
                  : 'bg-rose-100/80 border border-rose-200'
              }`}
            >
              {connectionStatus.success ? (
                <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle size={18} className="text-rose-600 mt-0.5 flex-shrink-0" />
              )}
              <p className={`text-xs sm:text-sm ${
                connectionStatus.success ? 'text-green-700' : 'text-rose-700'
              }`}>
                {connectionStatus.message}
              </p>
            </motion.div>
          )}

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1.5 sm:mb-2">
                默认音色
              </label>
              {voices.length > 0 ? (
                <select
                  value={localTTS.voice}
                  onChange={(e) => setLocalTTS({ ...localTTS, voice: e.target.value })}
                  className="
                    w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 border border-white/50 rounded-xl
                    focus:ring-2 focus:ring-violet-300 focus:border-transparent
                    outline-none text-slate-800 cursor-pointer text-sm
                    transition-all duration-200 backdrop-blur-xl
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
                    w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 border border-white/50 rounded-xl
                    focus:ring-2 focus:ring-violet-300 focus:border-transparent
                    outline-none text-slate-800 placeholder-slate-400 text-sm
                    transition-all duration-200 backdrop-blur-xl
                  "
                />
              )}
            </div>
          </div>
        </motion.section>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-xs sm:text-sm text-slate-500 pb-24 md:pb-8"
        >
          <p className="bg-white/40 inline-block px-4 sm:px-6 py-2 rounded-xl backdrop-blur-sm">
            配置会自动保存到本地存储
          </p>
        </motion.div>
      </div>
    </div>
  );
}
