import React from 'react';
import { ChatMessage } from '../../services/chatService';
import { Link } from 'react-router-dom';
import { Bot, User, ExternalLink, RefreshCw, AlertCircle, Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: (messageText: string) => void;
  onNavigate?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onRetry, onNavigate }) => {
  const { t } = useLanguage();
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2.5 my-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? 'bg-[#087A4B] text-white'
            : 'bg-[#063D2A] dark:bg-emerald-900 border border-emerald-700/50 text-[#D7A928]'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[80%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
            isUser
              ? 'rounded-tr-none bg-[#087A4B] text-white font-medium'
              : 'rounded-tl-none bg-white dark:bg-[#142C21] border border-[#DDE8E1] dark:border-emerald-900/60 text-[#14251D] dark:text-emerald-100'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Machine-translation notice: only Afaan Oromo is mandatory for staff,
              so Amharic and English answers are often translated from om records. */}
          {message.wasTranslated && (
            <p className="mt-2 flex items-start gap-1 text-[10px] italic text-[#7A5B0B] dark:text-[#D7A928]">
              <Languages className="h-3 w-3 shrink-0 mt-px" />
              <span>{t('chat_machine_translated')}</span>
            </p>
          )}

          {/* Sources if present */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-[#DDE8E1] dark:border-emerald-900/40 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#087A4B] dark:text-[#A3E635]">
                {t('chat_related_info')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((src, i) => {
                  if (src.url?.startsWith('/')) {
                    return (
                      <Link
                        key={i}
                        to={src.url}
                        onClick={onNavigate}
                        className="inline-flex items-center gap-1 rounded-md bg-[#EFF8F2] dark:bg-[#1A382A] border border-[#DDE8E1] dark:border-emerald-800/80 px-2 py-1 text-[11px] font-semibold text-[#087A4B] dark:text-emerald-300 hover:underline min-h-[44px] sm:min-h-[auto]"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    );
                  }
                  return (
                    <a
                      key={i}
                      href={src.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-[#EFF8F2] dark:bg-[#1A382A] border border-[#DDE8E1] dark:border-emerald-800/80 px-2 py-1 text-[11px] font-semibold text-[#087A4B] dark:text-emerald-300 hover:underline min-h-[44px] sm:min-h-[auto]"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status / Timestamp */}
        <div className={`flex items-center gap-2 text-[10px] text-[#637069] dark:text-emerald-400/60 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{message.createdAt}</span>
          {message.status === 'failed' && (
            <div className="flex items-center gap-1 text-red-500 font-bold">
              <AlertCircle className="h-3 w-3" />
              <span>Failed</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(message.content)}
                  className="ml-1 inline-flex items-center gap-0.5 text-xs text-[#087A4B] hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t('chat_retry')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
