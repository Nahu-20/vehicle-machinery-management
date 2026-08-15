import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../services/chatService';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { Bot, Sprout } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onRetry: (messageText: string) => void;
  onNavigate?: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isTyping,
  onRetry,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAF7] dark:bg-[#0B1912]"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-[#EFF8F2] dark:bg-[#12281D] border border-[#DDE8E1] dark:border-emerald-800 flex items-center justify-center text-[#087A4B] dark:text-[#A3E635] shadow-xs">
            <Sprout className="h-7 w-7 text-[#D7A928]" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h3 className="text-sm font-bold text-[#14251D] dark:text-emerald-100">
              {t('chat_title')}
            </h3>
            <p className="text-xs text-[#637069] dark:text-emerald-300/80">
              {t('chat_placeholder')}
            </p>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onRetry={onRetry}
            onNavigate={onNavigate}
          />
        ))
      )}

      {isTyping && <ChatTypingIndicator />}
    </div>
  );
};
