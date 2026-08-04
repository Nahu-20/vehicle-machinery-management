import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LocalizedText } from '../types';
import { translations, languages } from '../i18n/translations';

const STORAGE_KEY = 'oromia-agriculture-language';

interface LanguageContextType {
  language: LanguageCode;
  currentLang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  getLocalizedText: (value: LocalizedText | Record<string, string> | undefined) => string;
  languages: typeof languages;
  
  // Accessibility state
  textSize: 'normal' | 'large' | 'xlarge';
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
  isHighContrast: boolean;
  setIsHighContrast: (high: boolean) => void;
  resetAccessibility: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('oab_language');
      if (saved === 'om' || saved === 'am' || saved === 'en') {
        return saved as LanguageCode;
      }
    } catch {
      // localStorage may not be available in some environments
    }
    return 'om';
  });

  const [textSize, setTextSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isHighContrast, setIsHighContrastState] = useState<boolean>(false);

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem('oab_language', lang);
    } catch {
      // localStorage ignore
    }
    document.documentElement.lang = lang;
  };

  const setTextSize = (size: 'normal' | 'large' | 'xlarge') => {
    setTextSizeState(size);
    let mult = '1';
    if (size === 'large') mult = '1.15';
    if (size === 'xlarge') mult = '1.3';
    document.documentElement.style.setProperty('--font-size-multiplier', mult);
  };

  const setIsHighContrast = (contrast: boolean) => {
    setIsHighContrastState(contrast);
    if (contrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const resetAccessibility = () => {
    setTextSize('normal');
    setIsHighContrast(false);
  };

  // Translation function with fallback to Afaan Oromo (om)
  const t = (key: string): string => {
    if (!key) return '';
    const dict = translations[currentLang];
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to Afaan Oromo if key missing in selected language
    const fallbackDict = translations['om'];
    if (fallbackDict && fallbackDict[key] !== undefined) {
      return fallbackDict[key];
    }
    // Return key if no translation exists
    return key;
  };

  // Helper function to resolve LocalizedText objects or keys with fallback to 'om'
  const getLocalizedText = (value: LocalizedText | Record<string, string> | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') {
      const dict = translations[currentLang];
      if (dict && dict[value] !== undefined) {
        return dict[value];
      }
      const fallbackDict = translations['om'];
      if (fallbackDict && fallbackDict[value] !== undefined) {
        return fallbackDict[value];
      }
      return value;
    }
    const activeLang = currentLang || 'om';
    if (value[activeLang]) {
      return value[activeLang]!;
    }
    if (value['om']) {
      return value['om']!;
    }
    if (value['en']) {
      return value['en']!;
    }
    if (value['am']) {
      return value['am']!;
    }
    const firstVal = Object.values(value)[0];
    return typeof firstVal === 'string' ? firstVal : '';
  };

  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  return (
    <LanguageContext.Provider
      value={{
        language: currentLang,
        currentLang,
        setLanguage,
        t,
        getLocalizedText,
        languages,
        textSize,
        setTextSize,
        isHighContrast,
        setIsHighContrast,
        resetAccessibility,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
