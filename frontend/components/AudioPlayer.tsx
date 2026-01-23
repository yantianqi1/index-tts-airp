'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  audioUrl?: string;
  audioBlob?: Blob;
  text?: string;
  onEnded?: () => void;
  showDownload?: boolean;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  audioUrl,
  audioBlob,
  text,
  onEnded,
  showDownload = true,
  autoPlay = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Create object URL from blob
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  // Auto play
  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, objectUrl, audioUrl]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onEnded?.();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    const url = objectUrl || audioUrl;
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const src = objectUrl || audioUrl;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 shadow-glass">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Play/Pause Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handlePlayPause}
        className={`
          p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0
          ${isPlaying
            ? 'bg-gradient-to-r from-rose-400 to-pink-500 shadow-candy'
            : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-candy-blue'
          }
        `}
        aria-label={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? (
          <Pause size={18} className="text-white" />
        ) : (
          <Play size={18} className="text-white" />
        )}
      </motion.button>

      {/* Progress Bar */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="relative w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
          {/* Progress fill */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-400 to-violet-400 rounded-full"
            style={{ width: `${progress}%` }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
          {/* Interactive range input */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span className="font-medium">{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Download Button */}
      {showDownload && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          className="p-2 hover:bg-white/60 rounded-xl transition-colors cursor-pointer flex-shrink-0"
          aria-label="下载音频"
          title="下载音频"
        >
          <Download size={18} className="text-slate-500 hover:text-violet-500 transition-colors" />
        </motion.button>
      )}

      {/* Volume Icon */}
      <Volume2 size={18} className="text-slate-400 flex-shrink-0" />
    </div>
  );
}
