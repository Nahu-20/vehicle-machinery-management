import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChatConnectionStatus } from './ChatConnectionStatus';
import { Bot, X, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onClear: () => void;
  messageCount: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose, onClear, messageCount }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-[#063D2A] dark:bg-[#052C1E] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-emerald-900/80 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-[#D7A928] shrink-0">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold truncate text-white tracking-wide">
              {t('chat_title')}
            </h2>
          </div>
          <div className="mt-0.5">
            <ChatConnectionStatus />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {messageCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            title={t('chat_clear')}
            aria-label={t('chat_clear')}
            className="p-2 rounded-xl text-emerald-200 hover:bg-emerald-900/60 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('chat_close')}
          className="p-2 rounded-xl text-emerald-200 hover:bg-emerald-900/60 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
