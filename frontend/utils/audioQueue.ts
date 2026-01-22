interface AudioTask {
  text: string;
  id: string;
}

export interface TTSParams {
  apiUrl: string;
  voice: string;
  emotion: string;
  speed: number;
  responseFormat: 'wav' | 'mp3';
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
}

export class AudioQueueManager {
  private queue: AudioTask[] = [];
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private ttsParams: TTSParams;

  constructor(ttsParams: TTSParams) {
    this.ttsParams = ttsParams;
  }

  updateConfig(ttsParams: TTSParams) {
    this.ttsParams = ttsParams;
  }

  async enqueue(text: string) {
    const task: AudioTask = {
      text,
      id: Date.now().toString() + Math.random(),
    };
    
    this.queue.push(task);
    console.log(`[AudioQueue] Enqueued: "${text}"`);
    
    if (!this.isPlaying) {
      await this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const task = this.queue.shift()!;

    try {
      console.log(`[AudioQueue] Processing: "${task.text}"`);
      const audioBlob = await this.synthesizeSpeech(task.text);
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('[AudioQueue] Error processing task:', error);
    }

    // 播放完毕后处理下一个
    await this.processQueue();
  }

  private async synthesizeSpeech(text: string): Promise<Blob> {
    const response = await fetch(this.ttsParams.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        voice: this.ttsParams.voice,
        emotion: this.ttsParams.emotion,
        speed: this.ttsParams.speed,
        response_format: this.ttsParams.responseFormat,
        temperature: this.ttsParams.temperature,
        top_p: this.ttsParams.topP,
        top_k: this.ttsParams.topK,
        repetition_penalty: this.ttsParams.repetitionPenalty,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    return await response.blob();
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
    this.isPlaying = false;
  }

  clear() {
    this.queue = [];
  }
}

// 提取双引号内的文本
export function extractQuotedTexts(text: string): string[] {
  // 匹配中文双引号 "..." 和英文双引号 "..."
  const chineseQuotes = text.match(/[""]([^""]+)[""]|"([^"]+)"/g) || [];
  
  return chineseQuotes.map(match => {
    // 去除引号
    return match.replace(/^[""]|[""]$/g, '').replace(/^"|"$/g, '');
  }).filter(t => t.trim().length > 0);
}
