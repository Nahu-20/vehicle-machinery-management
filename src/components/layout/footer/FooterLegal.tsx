import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { LanguageSelector } from '../../common/LanguageSelector';
import { ThemeToggle } from '../../common/ThemeToggle';
import { FooterLegalModals, LegalModalType } from './FooterLegalModals';

export const FooterLegal: React.FC = () => {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const currentYear = new Date().getFullYear();

  const copyrightText = t('footer_copyright').replace('{year}', String(currentYear));

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#637A6E] dark:text-[#a5aba6]">
        {/* Left: Dynamic Copyright */}
        <div className="text-center md:text-left font-medium">
          <p>{copyrightText}</p>
        </div>

        {/* Center: Legal Links */}
        <div className="flex items-center flex-wrap justify-center gap-x-3 gap-y-1 font-semibold text-[#4C6054] dark:text-[#a5aba6]">
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="hv-underline hover:text-[#075B36] dark:hover:text-[#74d62c] transition-colors cursor-pointer"
          >
            {t('footer_privacy')}
          </button>
          <span className="text-[#A4B8AC] dark:text-white/[0.2]" aria-hidden="true">•</span>
          <button
            type="button"
            onClick={() => setActiveModal('accessibility')}
            className="hv-underline hover:text-[#075B36] dark:hover:text-[#74d62c] transition-colors cursor-pointer"
          >
            {t('footer_accessibility')}
          </button>
          <span className="text-[#A4B8AC] dark:text-white/[0.2]" aria-hidden="true">•</span>
          <button
            type="button"
            onClick={() => setActiveModal('terms')}
            className="hv-underline hover:text-[#075B36] dark:hover:text-[#74d62c] transition-colors cursor-pointer"
          >
            {t('footer_terms')}
          </button>
        </div>

        {/* Right: Language, then the theme switch — which steps back from the
            header so the hotline and advisories can lead there (note 16). */}
        <div className="flex items-center gap-2">
          <LanguageSelector compact dropdownDirection="up" />
          <ThemeToggle compact dropdownDirection="up" />
        </div>
      </div>

      {/* Interactive Modals for Privacy, Accessibility, and Terms */}
      <FooterLegalModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};
