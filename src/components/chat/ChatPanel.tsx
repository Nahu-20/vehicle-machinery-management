import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { sendChatMessage, ChatMessage } from '../../services/chatService';
import { ChatHeader } from './ChatHeader';
import { ChatDisclaimer } from './ChatDisclaimer';
import { ChatMessageList } from './ChatMessageList';
import { ChatQuickActions } from './ChatQuickActions';
import { ChatComposer } from './ChatComposer';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  setMessages,
}) => {
  const { currentLang, t } = useLanguage();
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape & trap focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling on mobile
      document.body.style.overflow = 'hidden';
      panelRef.current?.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      role: 'user',
      content: text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setIsTyping(true);

    try {
      const res = await sendChatMessage({
        message: text,
        language: currentLang as 'om' | 'am' | 'en',
      });

      const assistantMsg: ChatMessage = {
        id: 'ast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        role: 'assistant',
        content: res.message,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
        wasTranslated: res.wasTranslated,
        status: 'sent',
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: t('chat_connection_error'),
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'failed',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-end justify-end p-0 sm:p-4 bg-black/40 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-panel-title"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full sm:w-[420px] h-full sm:h-[620px] max-h-full sm:max-h-[calc(100vh-80px)] bg-white dark:bg-[#0B1912] sm:rounded-2xl border border-[#DDE8E1] dark:border-emerald-900/80 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 focus:outline-none"
      >
        <ChatHeader
          onClose={onClose}
          onClear={handleClearMessages}
          messageCount={messages.length}
        />
        <ChatDisclaimer />

        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          onRetry={(msg) => handleSendMessage(msg)}
          onNavigate={onClose}
        />

        <ChatQuickActions onSelectAction={(prompt) => handleSendMessage(prompt)} />

        <ChatComposer onSendMessage={handleSendMessage} isSending={isSending} />
      </div>
    </div>
  );
};
