import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AlertCircle } from 'lucide-react';

export const ChatDisclaimer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-[#FFFBEB] dark:bg-[#282110] border-b border-[#FCD34D]/50 dark:border-[#92400E]/40 px-3.5 py-2 text-[11px] text-[#92400E] dark:text-[#FDE68A] flex items-start gap-2 shrink-0">
      <AlertCircle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
      <span className="leading-snug">{t('chat_disclaimer')}</span>
    </div>
  );
};
