import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LanguageCode } from '../../types';

interface LanguageSelectorProps {
  compact?: boolean;
  dropdownDirection?: 'up' | 'down';
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  dropdownDirection = 'down',
  isOpen: externalIsOpen,
  onToggle,
}) => {
  const { currentLang, setLanguage, languages } = useLanguage();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = typeof externalIsOpen === 'boolean';
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentObj = languages.find((l) => l.code === currentLang) || languages[0];

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
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    handleClose();
    buttonRef.current?.focus();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        id={`language-selector-button-${compact ? 'compact' : 'full'}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
        className={`flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/[0.09] bg-white dark:bg-[#111613] px-3 py-1.5 text-xs font-bold text-[#075D3A] dark:text-[#f5f6f3] shadow-xs transition-all hover:bg-emerald-50 dark:hover:bg-[#161d18] focus:outline-none focus:ring-2 focus:ring-[#087A4B] min-h-[44px] cursor-pointer ${
          compact ? 'px-2.5 py-1 text-xs' : ''
        }`}
      >
        <Globe className="h-4 w-4 text-[#075D3A] dark:text-[#74d62c] shrink-0" aria-hidden="true" />
        <span className="font-extrabold">{currentObj.nativeName}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 text-[#075D3A] dark:text-[#a5aba6] shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={`language-selector-button-${compact ? 'compact' : 'full'}`}
          className={`absolute right-0 z-[100] min-w-[200px] sm:min-w-[220px] rounded-2xl border border-emerald-200/90 dark:border-white/[0.12] bg-white dark:bg-[#181c19] py-2 shadow-2xl ring-1 ring-black/10 dark:ring-white/5 animate-in fade-in slide-in-from-top-2 duration-150 ${
            dropdownDirection === 'up' ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
          }`}
        >
          <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800/70 dark:text-[#737b75] border-b border-emerald-100 dark:border-white/[0.08] pb-2 mb-1">
            Filannoo Afaanii / Language
          </div>
          {languages.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(lang.code as LanguageCode)}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors min-h-[44px] cursor-pointer ${
                  isSelected
                    ? 'font-extrabold text-[#075D3A] dark:text-[#74d62c] bg-emerald-50 dark:bg-[#161d18]'
                    : 'text-[#17211B] dark:text-[#f5f6f3] font-semibold hover:bg-emerald-50/80 dark:hover:bg-[#161d18]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base shrink-0">{lang.flagEmoji}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-[#075D3A] dark:text-[#74d62c] shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

