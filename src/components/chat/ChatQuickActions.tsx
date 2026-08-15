import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Sprout, ShieldAlert, TrendingUp, Bug, Droplets, PhoneCall } from 'lucide-react';

interface ChatQuickActionsProps {
  onSelectAction: (prompt: string) => void;
}

export const ChatQuickActions: React.FC<ChatQuickActionsProps> = ({ onSelectAction }) => {
  const { t } = useLanguage();

  const actions = [
    { key: 'chat_quick_crop', icon: <Sprout className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#A3E635]" /> },
    { key: 'chat_quick_livestock', icon: <ShieldAlert className="h-3.5 w-3.5 text-[#D7A928] dark:text-[#D7A928]" /> },
    { key: 'chat_quick_market', icon: <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> },
    { key: 'chat_quick_pest', icon: <Bug className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /> },
    { key: 'chat_quick_irrigation', icon: <Droplets className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> },
    { key: 'chat_quick_contact', icon: <PhoneCall className="h-3.5 w-3.5 text-[#D7A928]" /> },
  ];

  return (
    <div className="p-3 border-t border-[#DDE8E1] dark:border-emerald-900/40 bg-[#FAFAF7] dark:bg-[#0E2018] shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#637069] dark:text-emerald-400/80 mb-2">
        Suggested Inquiries:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((act) => {
          const label = t(act.key);
          return (
            <button
              key={act.key}
              type="button"
              onClick={() => onSelectAction(label)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDE8E1] dark:border-emerald-800/60 bg-white dark:bg-[#142C21] px-2.5 py-1.5 text-xs font-semibold text-[#14251D] dark:text-emerald-100 hover:bg-[#EFF8F2] dark:hover:bg-[#1C3B2D] hover:border-[#087A4B] transition-colors shadow-2xs min-h-[44px] sm:min-h-[auto]"
            >
              {act.icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
