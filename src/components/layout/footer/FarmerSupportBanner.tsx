import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { FeedbackModal } from '../../common/FeedbackModal';
import {
  Headphones,
  Phone,
  Clock,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import {
  WheatLeftIllustration,
  WheatRightIllustration,
  RollingHillsLandscape,
  FloatingGrainsScattered,
} from './WheatArtwork';

export const FarmerSupportBanner: React.FC = () => {
  const { t } = useLanguage();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <section
        id="farmer-assistance-support-banner"
        aria-label={t('public_assistance_pill')}
        className="relative mb-6 sm:mb-8 overflow-hidden rounded-[28px] sm:rounded-[36px] bg-white dark:bg-[#111613] border border-[#E5EFE2] dark:border-white/[0.09] shadow-[0_15px_45px_rgba(0,0,0,0.04)] dark:shadow-[0_15px_45px_rgba(0,0,0,0.6)] transition-colors duration-200"
      >
        {/* Subtle cultivated rolling hills background */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-40 dark:opacity-5 overflow-hidden">
          <RollingHillsLandscape className="w-full h-24 sm:h-36" />
        </div>

        {/* Scattered subtle grain kernels */}
        <FloatingGrainsScattered className="opacity-30 dark:opacity-5" />

        {/* Decorative Wheat Ears Left */}
        <div className="absolute -left-6 sm:-left-4 -bottom-6 sm:-bottom-4 pointer-events-none z-0 opacity-85 dark:opacity-20 hidden xs:block sm:block">
          <WheatLeftIllustration className="w-36 sm:w-48 md:w-64 h-auto" />
        </div>

        {/* Decorative Wheat Ears Right */}
        <div className="absolute -right-6 sm:-right-4 -bottom-6 sm:-bottom-4 pointer-events-none z-0 opacity-85 dark:opacity-20 hidden sm:block">
          <WheatRightIllustration className="w-44 sm:w-56 md:w-80 h-auto" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 sm:p-10 md:p-12 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (Headline & Actions) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F2F7EF] dark:bg-[#161d18] border border-[#D9EADB] dark:border-white/[0.12] px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#075B36] dark:text-[#74d62c] shadow-2xs">
                <Headphones className="h-3.5 w-3.5 text-[#075B36] dark:text-[#74d62c] shrink-0" aria-hidden="true" />
                <span>{t('public_assistance_pill')}</span>
              </div>

              {/* Main Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-5xl font-extrabold text-[#063D29] dark:text-[#f5f6f3] leading-[1.12] tracking-tight">
                {t('contact_title')}
              </h2>

              {/* Supporting Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-[#4E6155] dark:text-[#a5aba6] max-w-xl font-normal leading-relaxed">
                {t('contact_subtitle')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  to="/contact"
                  id="farmer-cta-contact-us-btn"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#075B36] hover:bg-[#064A2C] dark:bg-[#74d62c] dark:hover:bg-[#8be63a] text-white dark:text-[#070908] px-7 py-3.5 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[48px]"
                >
                  <Headphones className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t('contact_btn')}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  id="farmer-cta-feedback-modal-btn"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white dark:bg-[#181c19] hover:bg-[#F4F9F2] dark:hover:bg-[#1e2420] border border-[#CCDDC8] dark:border-white/[0.12] text-[#063D29] dark:text-[#f5f6f3] px-6 py-3.5 text-sm sm:text-base font-bold shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer min-h-[48px]"
                >
                  <MessageSquare className="h-4 w-4 text-[#075B36] dark:text-[#74d62c] shrink-0" aria-hidden="true" />
                  <span>{t('feedback_btn')}</span>
                </button>
              </div>
            </div>

            {/* Right Column (Floating Assistance Card) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#181c19] backdrop-blur-xs p-6 sm:p-7 md:p-8 border border-[#E0EBE0] dark:border-white/[0.09] shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] space-y-5">
                {/* Row 1: Toll-Free Hotline */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#EDF6EA] dark:bg-[#161d18] text-[#075B36] dark:text-[#74d62c] shrink-0 shadow-2xs">
                    <Phone className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#637A6E] dark:text-[#a5aba6] block">
                      {t('hotline_label')}
                    </span>
                    <a
                      href="tel:8844"
                      id="farmer-cta-hotline-link"
                      className="text-2xl sm:text-3xl font-black text-[#063D29] dark:text-[#f5f6f3] tracking-wide hover:text-[#075B36] dark:hover:text-[#74d62c] transition-colors block"
                    >
                      {t('hotline_number')}
                    </a>
                    <p className="text-xs text-[#7A8E83] dark:text-[#737b75] font-medium">
                      {t('hotline_subtext')}
                    </p>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div className="border-b border-[#E8EFE5] dark:border-white/[0.08]" />

                {/* Row 2: Official Working Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#EDF6EA] dark:bg-[#161d18] text-[#075B36] dark:text-[#74d62c] shrink-0 shadow-2xs">
                    <Clock className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#637A6E] dark:text-[#a5aba6] block">
                      {t('hours_label')}
                    </span>
                    <p className="text-sm sm:text-base font-extrabold text-[#063D29] dark:text-[#f5f6f3] leading-snug">
                      {t('hours_text')}
                    </p>
                    <p className="text-xs text-[#7A8E83] dark:text-[#737b75] font-medium">
                      {t('hours_subtext')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Modal Trigger */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
};
