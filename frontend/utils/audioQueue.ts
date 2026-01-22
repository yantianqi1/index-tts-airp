import { generateSpeech } from './ttsApi';
import { TTSConfig } from '@/store/useGlobalStore';

interface QueueItem {
  text: string;
  blob?: Blob;
  status: 'pending' | 'generating' | 'ready' | 'playing' | 'completed' | 'error';
}

export class AudioQueueManager {
  private queue: QueueItem[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private isProcessing = false;
  private config: TTSConfig;

  constructor(config: TTSConfig) {
    this.config = config;
  }

  updateConfig(config: TTSConfig) {
    this.config = config;
  }

  async enqueue(text: string) {
    // Check if already in queue
    if (this.queue.some(item => item.text === text)) {
      return;
    }

    const item: QueueItem = {
      text,
      status: 'pending',
    };

    this.queue.push(item);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        // Generate audio if not ready
        if (item.status === 'pending') {
          item.status = 'generating';
          item.blob = await generateSpeech(this.config, item.text);
          item.status = 'ready';
        }

        // Play audio
        if (item.status === 'ready' && item.blob) {
          item.status = 'playing';
          await this.playAudio(item.blob);
          item.status = 'completed';
        }

        // Remove completed item
        this.queue.shift();
      } catch (error) {
        console.error('Audio queue error:', error);
        item.status = 'error';
        this.queue.shift();
      }
    }

    this.isProcessing = false;
  }

  private playAudio(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(url);
        this.currentAudio = null;
        reject(error);
      };

      audio.play().catch(reject);
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.queue = [];
    this.isProcessing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}
