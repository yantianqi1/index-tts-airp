'use client';

import { useState } from 'react';
import { Play, Pause, Download, Search, Filter } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

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
}

// Mock data - 实际应用中从 API 获取
const MOCK_SHARED_AUDIOS: SharedAudio[] = [
  {
    id: '1',
    title: '欢迎语音',
    text: '欢迎使用 Voice AI Workbench，这是一个强大的语音合成工作台。',
    voice: 'girl_01',
    duration: 8,
    author: '系统',
    tags: ['欢迎', '介绍'],
    audioUrl: '/api/shared/1.wav',
    createdAt: Date.now() - 86400000,
  },
  {
    id: '2',
    title: '产品介绍',
    text: '我们的产品提供了三大核心功能：AI 语音对话、文本转语音工坊和语音仓库。',
    voice: 'boy_01',
    duration: 12,
    author: '产品团队',
    tags: ['产品', '功能'],
    audioUrl: '/api/shared/2.wav',
    createdAt: Date.now() - 172800000,
  },
  {
    id: '3',
    title: '技术说明',
    text: '本系统基于 IndexTTS 技术，支持多种音色和情感控制。',
    voice: 'girl_02',
    duration: 10,
    author: '技术团队',
    tags: ['技术', 'TTS'],
    audioUrl: '/api/shared/3.wav',
    createdAt: Date.now() - 259200000,
  },
];

export default function DepotPage() {
  const [audios] = useState<SharedAudio[]>(MOCK_SHARED_AUDIOS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-white">语音仓库</h1>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`
                px-3 py-1.5 rounded text-sm transition-all duration-200 cursor-pointer
                ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}
              `}
            >
              网格
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                px-3 py-1.5 rounded text-sm transition-all duration-200 cursor-pointer
                ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}
              `}
            >
              列表
            </button>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="border-b border-slate-800 px-6 py-4 bg-slate-900/30">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标题或内容..."
              className="
                w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                outline-none text-slate-100 placeholder-slate-500
                transition-all duration-200
              "
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="
                px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                outline-none text-slate-100 cursor-pointer
                transition-all duration-200
              "
            >
              <option value="">全部标签</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAudios.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <p className="text-lg mb-2">未找到匹配的语音</p>
              <p className="text-sm">尝试调整搜索条件</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAudios.map(audio => (
              <div
                key={audio.id}
                className="
                  p-5 bg-slate-800/50 border border-slate-700 rounded-xl
                  hover:border-slate-600 transition-all duration-200 cursor-pointer
                "
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {audio.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                    {audio.text}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {audio.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>音色: {audio.voice}</span>
                    <span>{formatDuration(audio.duration)}</span>
                  </div>
                </div>
                <AudioPlayer
                  audioUrl={audio.audioUrl}
                  text={audio.text}
                  showDownload={true}
                />
                <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
                  <span>{audio.author}</span>
                  <span>{formatDate(audio.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredAudios.map(audio => (
              <div
                key={audio.id}
                className="
                  p-5 bg-slate-800/50 border border-slate-700 rounded-xl
                  hover:border-slate-600 transition-all duration-200
                "
              >
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {audio.title}
                        </h3>
                        <p className="text-sm text-slate-400 mb-2">
                          {audio.text}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {audio.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div>{audio.author}</div>
                        <div className="mt-1">{formatDate(audio.createdAt)}</div>
                      </div>
                    </div>
                    <AudioPlayer
                      audioUrl={audio.audioUrl}
                      text={audio.text}
                      showDownload={true}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
