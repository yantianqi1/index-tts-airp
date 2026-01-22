'use client';

import { Volume2 } from 'lucide-react';
import { Message } from '@/store/useChat';

interface MessageBubbleProps {
  message: Message;
  onReplay?: (texts: string[]) => void;
}

export default function MessageBubble({ message, onReplay }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const renderContent = () => {
    if (!message.extractedTexts || message.extractedTexts.length === 0) {
      return <span>{message.content}</span>;
    }

    // 高亮显示被提取的文本
    let content = message.content;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // 找到所有引号位置并高亮
    const quoteRegex = /[""]([^""]+)[""]|"([^"]+)"/g;
    let match;

    while ((match = quoteRegex.exec(message.content)) !== null) {
      // 添加引号前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {message.content.slice(lastIndex, match.index)}
          </span>
        );
      }

      // 添加高亮的引号内容
      parts.push(
        <span
          key={`quote-${match.index}`}
          className="font-semibold text-blue-600 bg-blue-50 px-1 rounded"
        >
          {match[0]}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < message.content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {message.content.slice(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {renderContent()}
          </div>
        </div>

        {!isUser && message.extractedTexts && message.extractedTexts.length > 0 && (
          <button
            onClick={() => onReplay?.(message.extractedTexts!)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="重播语音"
          >
            <Volume2 size={18} className="text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}
