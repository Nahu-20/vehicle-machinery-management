import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FeedbackModal } from '../common/FeedbackModal';
import { PhoneCall, Clock, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactFeedbackCTA: React.FC = () => {
  const { t } = useLanguage();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#021810] via-[#063D2A] to-[#0A5439] text-white py-16 lg:py-24 border-t border-white/10">
        {/* Ambient Glow background accents */}
        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-[#087A4B]/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-[#D7A928]/20 blur-3xl pointer-events-none" />

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-3xl border border-white/25 bg-gradient-to-b from-white/15 via-white/10 to-black/30 p-8 sm:p-12 backdrop-blur-2xl shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: CTA Headings & Buttons */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#D7A928]/30 to-amber-300/10 px-4 py-1.5 text-xs font-black text-[#D7A928] border border-[#D7A928]/50 shadow-md">
                  <ShieldCheck className="h-4 w-4 text-[#D7A928]" />
                  <span>Public Assistance & Farmer Support Line</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                  {t('contact_title')}
                </h2>

                <p className="text-sm sm:text-base text-emerald-100/90 max-w-xl leading-relaxed font-normal">
                  {t('contact_subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
                  <Link
                    to="/contact"
                    className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#D7A928] via-[#F7C948] to-[#D7A928] hover:from-[#F7C948] hover:to-[#D7A928] px-7 py-4 text-xs sm:text-sm font-black text-[#063D2A] shadow-xl border border-amber-300/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
                  >
                    <span>{t('contact_btn')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/40 bg-white/10 px-7 py-4 text-xs sm:text-sm font-extrabold text-white backdrop-blur-md hover:bg-white/20 transition-all shadow-md min-h-[44px]"
                  >
                    <MessageSquare className="h-4 w-4 text-[#D7A928]" />
                    <span>{t('feedback_btn')}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Hotline & Office Hours */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-gradient-to-b from-black/50 via-black/40 to-black/60 p-6 sm:p-8 border border-white/15 space-y-6 shadow-inner">
                  <div className="flex items-center gap-4 border-b border-white/15 pb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F7C948] to-[#D7A928] text-[#063D2A] shrink-0 shadow-lg font-black">
                      <PhoneCall className="h-7 w-7" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-emerald-200 block uppercase tracking-wider">{t('hotline_label')}</span>
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-wide">{t('hotline_number')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-900/80 text-[#D7A928] shrink-0 border border-emerald-500/40">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-200 block uppercase tracking-wide">{t('hours_label')}</span>
                      <span className="text-xs sm:text-sm font-extrabold text-white">{t('hours_text')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
};
