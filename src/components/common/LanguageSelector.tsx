import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LanguageCode } from '../../types';

export const LanguageSelector: React.FC<{ compact?: boolean; dropdownDirection?: 'up' | 'down' }> = ({
  compact = false,
  dropdownDirection = 'down',
}) => {
  const { currentLang, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentObj = languages.find((l) => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
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
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        id={`language-selector-button-${compact ? 'compact' : 'full'}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
        className={`flex items-center gap-1.5 rounded-lg border border-emerald-700/30 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#075D3A] shadow-xs transition-all hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-[#087A4B] min-h-[32px] ${
          compact ? 'px-2 py-1 text-xs min-h-[28px]' : ''
        }`}
      >
        <Globe className="h-4 w-4 text-[#075D3A] shrink-0" aria-hidden="true" />
        <span className="font-bold">{currentObj.nativeName}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70 shrink-0" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={`language-selector-button-${compact ? 'compact' : 'full'}`}
          className={`absolute right-0 z-[100] min-w-[190px] rounded-xl border border-emerald-100 bg-white py-1.5 shadow-2xl ring-1 ring-black/10 animate-in fade-in duration-100 ${
            dropdownDirection === 'up' ? 'bottom-full mb-1 origin-bottom-right' : 'top-full mt-1 origin-top-right'
          }`}
        >
          <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#5E6B63] border-b border-emerald-100/60 pb-1.5 mb-1">
            Filannoo Afaanii / Language
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(lang.code as LanguageCode)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-[#EAF5EE] focus:bg-[#EAF5EE] focus:outline-none ${
                currentLang === lang.code ? 'font-black text-[#075D3A] bg-emerald-50' : 'text-[#17211B] font-medium'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{lang.flagEmoji}</span>
                <span>{lang.nativeName}</span>
              </div>
              {currentLang === lang.code && <Check className="h-4 w-4 text-[#075D3A]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
