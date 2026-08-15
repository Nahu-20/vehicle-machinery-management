import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { Sprout } from 'lucide-react';
import officialLogoUrl from '../../../assets/images/oromia_official_logo.svg';

export const FooterBrand: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-5 lg:pr-8">
      {/* Brand Identity & Logo */}
      <Link to="/" className="inline-flex items-center gap-3.5 group cursor-pointer" aria-label={t('bureau_title')}>
        <img
          src={officialLogoUrl}
          alt="Oromia Agricultural Bureau Official Emblem"
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#063D29] dark:text-[#f5f6f3] leading-tight tracking-tight">
            {t('bureau_title')}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-[#557161] dark:text-[#a5aba6]">
            {t('bureau_sub_title')}
          </p>
        </div>
      </Link>

      {/* Mission Text */}
      <p className="text-sm sm:text-base text-[#4C6054] dark:text-[#a5aba6] leading-relaxed font-normal max-w-xl">
        {t('footer_about')}
      </p>

      {/* Sustainability Statement */}
      <div className="flex items-start sm:items-center gap-2.5 pt-1 text-xs sm:text-sm font-semibold text-[#075B36] dark:text-[#74d62c]">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF5E7] dark:bg-[#161d18] text-[#075B36] dark:text-[#74d62c] shrink-0 mt-0.5 sm:mt-0">
          <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <span className="leading-snug">{t('footer_sustainability')}</span>
      </div>
    </div>
  );
};
