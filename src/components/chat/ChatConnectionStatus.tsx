import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const ChatConnectionStatus: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold">
      <span className="h-1.5 w-1.5 rounded-full bg-[#D7A928] animate-pulse" aria-hidden="true" />
      <span>{t('chat_status_demo')}</span>
    </div>
  );
};
