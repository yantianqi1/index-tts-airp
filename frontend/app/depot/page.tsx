'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, AlertTriangle, Package, Grid, List } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';
import { useGlobalStore } from '@/store/useGlobalStore';
import { buildTtsUrl } from '@/utils/ttsApi';
import { motion, AnimatePresence } from 'framer-motion';

interface SharedAudio {
  id: string;
  title: string;
  text: string;
  voice: string;
  duration: number;
  author: string;
  tags: string[];
  audioUrl: string;
  createdAt: number;
  sizeBytes?: number;
}

interface RepositoryItem {
  id: string;
  filename: string;
  url: string;
  created_at: number;
  size_bytes: number;
}

interface RepositoryResponse {
  items: RepositoryItem[];
}

const mapRepositoryItem = (item: RepositoryItem, baseUrl: string): SharedAudio => ({
  id: item.id,
  title: item.filename.replace(/\.(wav|mp3)$/i, ''),
  text: '保存生成的语音',
  voice: '未知',
  duration: 0,
  author: '本地仓库',
  tags: [],
  audioUrl: buildTtsUrl(baseUrl, item.url),
  createdAt: item.created_at,
  sizeBytes: item.size_bytes,
});



export default function DepotPage() {
  const { tts } = useGlobalStore();
  const [audios, setAudios] = useState<SharedAudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    let isMounted = true;
    const loadRepository = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(buildTtsUrl(tts.baseUrl, '/v1/audio/repository'));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as RepositoryResponse;
        const items = data.items || [];
        if (isMounted) {
          setAudios(items.map(item => mapRepositoryItem(item, tts.baseUrl)));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : '加载失败');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRepository();
    return () => {
      isMounted = false;
    };
  }, [tts.baseUrl]);


  // Get all unique tags
  const allTags = Array.from(new Set(audios.flatMap(audio => audio.tags)));

  // Filter audios
  const filteredAudios = audios.filter(audio => {
    const matchesSearch = audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         audio.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || audio.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (sizeBytes?: number) => {
    if (!sizeBytes) return '-';
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-14 sm:h-16 border-b border-white/30 px-4 sm:px-6 flex items-center justify-between glass-container-solid rounded-none flex-shrink-0"
      >
        <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
          语音仓库
        </h1>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-white/40 rounded-xl p-1 backdrop-blur-sm">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`
                px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2
                ${viewMode === 'grid'
                  ? 'bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-800'
                }
              `}
            >
              <Grid size={14} />
              <span className="hidden sm:inline">网格</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('list')}
              className={`
                px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2
                ${viewMode === 'list'
                  ? 'bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-800'
                }
              `}
            >
              <List size={14} />
              <span className="hidden sm:inline">列表</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="border-b border-white/30 px-4 sm:px-6 py-3 sm:py-4 glass-container-solid rounded-none flex-shrink-0"
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标题或内容..."
              className="
                w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/60 border border-white/50 rounded-xl
                focus:ring-2 focus:ring-violet-300 focus:border-transparent
                outline-none text-slate-800 placeholder-slate-400 text-sm
                transition-all duration-200 backdrop-blur-xl
              "
            />
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Filter size={16} className="text-slate-500 hidden sm:block" />
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="
                  flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-white/60 border border-white/50 rounded-xl
                  focus:ring-2 focus:ring-violet-300 focus:border-transparent
                  outline-none text-slate-800 cursor-pointer text-sm
                  transition-all duration-200 backdrop-blur-xl
                "
              >
                <option value="">全部标签</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="glass-container px-8 sm:px-10 py-6 sm:py-8 text-center">
                <Loader2 size={36} className="animate-spin text-violet-400 mx-auto mb-4" />
                <p className="text-slate-600 text-sm sm:text-base">正在加载语音仓库...</p>
              </div>
            </motion.div>
          ) : loadError ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="glass-container px-8 sm:px-10 py-6 sm:py-8 text-center">
                <AlertTriangle size={36} className="text-rose-400 mx-auto mb-4" />
                <p className="text-rose-600 font-medium mb-2 text-sm sm:text-base">加载失败</p>
                <p className="text-xs sm:text-sm text-slate-500">{loadError}</p>
              </div>
            </motion.div>
          ) : filteredAudios.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="glass-container px-8 sm:px-10 py-6 sm:py-8 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Package size={40} className="text-violet-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-base sm:text-lg text-slate-600 mb-2 font-medium">未找到匹配的语音</p>
                <p className="text-xs sm:text-sm text-slate-500">尝试调整搜索条件</p>
              </div>
            </motion.div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredAudios.map((audio, index) => (
                <motion.div
                  key={audio.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="glass-container p-4 sm:p-5 cursor-pointer"
                >
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2 truncate">
                      {audio.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-2 sm:mb-3">
                      {audio.text}
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {audio.tags.length > 0 && audio.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 sm:py-1 text-xs bg-violet-100 text-violet-600 rounded-lg font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="bg-white/60 px-2 py-0.5 rounded-md truncate max-w-[80px]">音色: {audio.voice}</span>
                      <span>{formatDuration(audio.duration)}</span>
                      <span>{formatSize(audio.sizeBytes)}</span>
                    </div>
                  </div>
                  <AudioPlayer
                    audioUrl={audio.audioUrl}
                    text={audio.text}
                    showDownload={true}
                  />
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/40 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium truncate max-w-[100px]">{audio.author}</span>
                    <span>{formatDate(audio.createdAt)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3 sm:space-y-4">
              {filteredAudios.map((audio, index) => (
                <motion.div
                  key={audio.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="glass-container p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3 gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 truncate">
                            {audio.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 mb-2 line-clamp-1">
                            {audio.text}
                          </p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {audio.tags.length > 0 && audio.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 sm:py-1 text-xs bg-violet-100 text-violet-600 rounded-lg font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex sm:flex-col sm:items-end gap-2 sm:gap-1 text-xs text-slate-500 flex-shrink-0">
                          <span className="font-medium">{audio.author}</span>
                          <span>{formatDate(audio.createdAt)}</span>
                          <span className="bg-white/60 px-2 py-0.5 rounded-md">{formatSize(audio.sizeBytes)}</span>
                        </div>
                      </div>
                      <AudioPlayer
                        audioUrl={audio.audioUrl}
                        text={audio.text}
                        showDownload={true}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
