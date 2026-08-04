import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { value: Theme; labelKey: string; icon: React.ReactNode }[] = [
    { value: 'light', labelKey: 'theme_light', icon: <Sun className="h-4 w-4 text-[#D7A928]" /> },
    { value: 'dark', labelKey: 'theme_dark', icon: <Moon className="h-4 w-4 text-emerald-400" /> },
    { value: 'system', labelKey: 'theme_system', icon: <Monitor className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${t('theme_title')} (${t(`theme_${theme}`)})`}
        className={`flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-emerald-800/60 bg-white dark:bg-[#12281D] px-2.5 py-1.5 text-xs font-bold text-[#14251D] dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-[#1A382A] transition-colors focus:outline-none min-h-[44px] ${
          compact ? 'px-2 py-1' : ''
        }`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
        ) : (
          <Sun className="h-4 w-4 text-[#D7A928] shrink-0" aria-hidden="true" />
        )}
        <span className="hidden md:inline text-[11px] font-bold capitalize">
          {t(`theme_${theme}`)}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label={t('theme_title')}
          className="absolute right-0 mt-2 w-44 origin-top-right rounded-xl border border-gray-200 dark:border-emerald-800/80 bg-white dark:bg-[#12281D] p-1.5 shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-emerald-400/70 border-b border-gray-100 dark:border-emerald-900/40 mb-1">
            {t('theme_title')}
          </div>

          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-bold transition-colors min-h-[44px] ${
                  isSelected
                    ? 'bg-[#087A4B] text-white'
                    : 'text-[#14251D] dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-[#1A382A]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{t(opt.labelKey)}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
