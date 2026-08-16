import React, { useState } from 'react';
import { resourceFAQs } from '../../data/resourcesData';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

export const ResourcesFAQ: React.FC = () => {
  const { language } = useLanguage();
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-16 bg-[#F6F7F3] dark:bg-[#0A110D] border-b border-[#E2E8E3] dark:border-white/10 transition-colors duration-200">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-emerald-950/60 border border-[#D5E8D0] dark:border-emerald-800/40 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Public Document Access Guidance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight">
            Frequently Asked Questions on Bureau Publications
          </h2>

          <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 max-w-lg mx-auto">
            Everything you need to know about downloading, reproducing, and requesting printed field manuals from Oromia Agricultural Bureau.
          </p>
        </div>

        <div className="space-y-3">
          {resourceFAQs.map((faq) => {
            const isOpen = openId === faq.id;
            const question =
              language === 'om'
                ? faq.questionOm
                : language === 'am'
                ? faq.questionAm
                : faq.question;
            const answer =
              language === 'om'
                ? faq.answerOm
                : language === 'am'
                ? faq.answerAm
                : faq.answer;

            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#111813] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-black text-sm sm:text-base text-[#0A1912] dark:text-white hover:text-[#075B36] dark:hover:text-[#A3E635] transition-colors"
                >
                  <span>{question}</span>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6F7F3] dark:bg-white/5 text-[#075B36] dark:text-[#A3E635] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#075B36] text-white dark:bg-[#A3E635] dark:text-[#053B23]' : ''
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#56635B] dark:text-white/80 leading-relaxed border-t border-gray-100 dark:border-white/5 bg-[#FAFCF9] dark:bg-white/2">
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
