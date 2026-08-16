import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';

interface ThemeToggleProps {
  compact?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = false,
  isOpen: externalIsOpen,
  onToggle,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof externalIsOpen === 'boolean';
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    const nextState = !isOpen;
    if (onToggle) {
      onToggle(nextState);
    }
    if (!isControlled) {
      setInternalIsOpen(nextState);
    }
  };

  const handleClose = () => {
    if (onToggle) {
      onToggle(false);
    }
    if (!isControlled) {
      setInternalIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${t('theme_title')} (${t(`theme_${theme}`)})`}
        className={`flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/[0.09] bg-white dark:bg-[#111613] px-2.5 py-1.5 text-xs font-bold text-[#14251D] dark:text-[#f5f6f3] hover:bg-emerald-50 dark:hover:bg-[#161d18] transition-colors focus:outline-none min-h-[44px] cursor-pointer ${
          compact ? 'px-2 py-1' : ''
        }`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-[#74d62c] shrink-0" aria-hidden="true" />
        ) : (
          <Sun className="h-4 w-4 text-[#D7A928] shrink-0" aria-hidden="true" />
        )}
        <span className="hidden md:inline text-[11px] font-bold capitalize">
          {t(`theme_${theme}`)}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 text-gray-500 dark:text-[#a5aba6] shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label={t('theme_title')}
          className="absolute right-0 mt-2 min-w-[180px] sm:min-w-[190px] origin-top-right rounded-2xl border border-emerald-200/90 dark:border-white/[0.12] bg-white dark:bg-[#181c19] p-2 shadow-2xl ring-1 ring-black/10 dark:ring-white/5 focus:outline-none z-[100] animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800/70 dark:text-[#737b75] border-b border-emerald-100 dark:border-white/[0.08] mb-1">
            HAALA HALLUU / THEME
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
                  handleClose();
                  buttonRef.current?.focus();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-extrabold transition-colors min-h-[44px] cursor-pointer ${
                  isSelected
                    ? 'bg-[#087A4B] dark:bg-[#74d62c] text-white dark:text-[#070908] shadow-xs'
                    : 'text-[#14251D] dark:text-[#f5f6f3] hover:bg-emerald-50 dark:hover:bg-[#161d18]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {opt.icon}
                  <span>{t(opt.labelKey)}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-white dark:text-[#070908] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

