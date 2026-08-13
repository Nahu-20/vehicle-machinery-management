import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FeedbackModal } from '../common/FeedbackModal';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { PhoneCall, Clock, MessageSquare, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactFeedbackCTA: React.FC = () => {
  const { t } = useLanguage();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden bg-[#0A1912] text-white py-16 lg:py-24 border-t border-[#183327]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-3xl border border-[#183327] bg-[#0E241B] p-8 sm:p-12 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: CTA Headings & Buttons */}
              <div className="lg:col-span-7 space-y-5">
                <AgriPillBadge variant="lime" icon={<ShieldCheck className="h-3.5 w-3.5 text-[#0A1912]" />}>
                  Public Assistance & Farmer Support Line
                </AgriPillBadge>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
                  {t('contact_title')}
                </h2>

                <p className="text-base text-[#A7F3D0]/80 max-w-xl leading-relaxed font-normal">
                  {t('contact_subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#A3E635] text-[#0A1912] hover:bg-[#92D022] px-7 py-4 text-sm font-extrabold transition-all duration-200 shadow-sm"
                  >
                    <span>{t('contact_btn')}</span>
                    <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                  </Link>

                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="inline-flex items-center justify-center gap-2.5 rounded-full border border-[#183327] bg-[#122E22] hover:bg-[#183B2C] px-7 py-4 text-sm font-extrabold text-white transition-all duration-200"
                  >
                    <MessageSquare className="h-4 w-4 text-[#A3E635]" />
                    <span>{t('feedback_btn')}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Hotline & Office Hours */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-[#0A1912] p-6 sm:p-8 border border-[#183327] space-y-6">
                  <div className="flex items-center gap-4 border-b border-[#183327] pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#A3E635] text-[#0A1912] shrink-0 font-extrabold">
                      <PhoneCall className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#A7F3D0]/80 block uppercase tracking-wider">{t('hotline_label')}</span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">{t('hotline_number')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#122E22] text-[#A3E635] shrink-0 border border-[#183327]">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#A7F3D0]/80 block uppercase tracking-wider">{t('hours_label')}</span>
                      <span className="text-sm font-bold text-white">{t('hours_text')}</span>
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

