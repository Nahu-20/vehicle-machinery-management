import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Bot, MessageSquareText, Sparkles } from 'lucide-react';

interface ChatLauncherProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}

export const ChatLauncher: React.FC<ChatLauncherProps> = ({ onClick, isOpen, unreadCount = 0 }) => {
  const { t } = useLanguage();

  if (isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden pb-[env(safe-area-inset-bottom)]">
      <button
        type="button"
        onClick={onClick}
        aria-label={t('chat_launcher')}
        title={t('chat_title')}
        className="group relative flex items-center justify-center gap-2 rounded-full bg-[#063D2A] dark:bg-emerald-800 text-white p-3.5 sm:px-4 sm:py-3.5 shadow-2xl hover:bg-[#087A4B] dark:hover:bg-emerald-700 active:scale-95 transition-all border border-emerald-500/40 ring-4 ring-emerald-900/10 min-h-[48px] min-w-[48px] sm:min-h-[54px]"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="h-6 w-6 text-[#D7A928] group-hover:rotate-12 transition-transform duration-300" />
          <Sparkles className="h-3 w-3 text-emerald-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        <span className="hidden md:inline text-xs font-extrabold tracking-wide text-white pr-1">
          {t('chat_title')}
        </span>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D7A928] text-[10px] font-black text-[#063D2A] shadow-md ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
