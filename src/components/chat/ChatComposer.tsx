import React, { useState, useRef, KeyboardEvent } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Send, Loader2 } from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (text: string) => void;
  isSending: boolean;
}

const MAX_CHARS = 500;

export const ChatComposer: React.FC<ChatComposerProps> = ({ onSendMessage, isSending }) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setText(val);
    }
  };

  const charsRemaining = MAX_CHARS - text.length;

  return (
    <div className="p-3 bg-white dark:bg-[#12281D] border-t border-gray-200 dark:border-emerald-900/60 shrink-0">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="space-y-1.5"
      >
        <div className="relative flex items-end gap-2">
          <label htmlFor="chat-message-input" className="sr-only">
            {t('chat_placeholder')}
          </label>
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            placeholder={t('chat_placeholder')}
            className="w-full resize-none rounded-xl border border-gray-300 dark:border-emerald-800 bg-[#FAFAF7] dark:bg-[#0B1912] px-3.5 py-2.5 text-xs text-[#14251D] dark:text-emerald-100 placeholder-[#637069] dark:placeholder-emerald-400/60 focus:border-[#087A4B] focus:bg-white dark:focus:bg-[#142C21] focus:outline-none transition-colors max-h-24 min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            aria-label={t('chat_send')}
            className="rounded-xl bg-[#087A4B] text-white p-2.5 hover:bg-[#063D2A] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-[#D7A928]" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-emerald-400/60 px-1">
          <span>Enter to send, Shift+Enter for new line</span>
          <span className={charsRemaining < 50 ? 'text-amber-500 font-bold' : ''}>
            {charsRemaining} chars
          </span>
        </div>
      </form>
    </div>
  );
};
