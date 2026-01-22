'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2 } from 'lucide-react';

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

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
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
      <button
        onClick={handlePlayPause}
        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex-shrink-0"
        aria-label={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? (
          <Pause size={18} className="text-white" />
        ) : (
          <Play size={18} className="text-white" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Download Button */}
      {showDownload && (
        <button
          onClick={handleDownload}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          aria-label="下载音频"
          title="下载音频"
        >
          <Download size={18} className="text-slate-400" />
        </button>
      )}

      {/* Volume Icon */}
      <Volume2 size={18} className="text-slate-400 flex-shrink-0" />
    </div>
  );
}
