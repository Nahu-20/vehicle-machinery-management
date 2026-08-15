import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { HelpCircle, ChevronDown, Sparkles, PhoneCall } from 'lucide-react';

export const ServicesFAQ: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I register for subsidized NPSB fertilizer and certified seed vouchers?',
      answer:
        'Registration is conducted annually through your Kebele Agricultural Development Agent (DA). Bring your Kebele resident ID and landholding certificate to your local Farmer Training Center (FTC). Once your farmland acreage is confirmed, your allocation voucher is registered digitally and redeemable at your Primary Cooperative Union warehouse.',
    },
    {
      question: 'Is the 8888 extension advisory hotline free of charge from mobile phones?',
      answer:
        'Yes. The 8888 helpline is 100% toll-free across all Ethio Telecom and Safaricom networks in Oromia. You can access interactive automated voice advisories (IVR) and connect directly with certified agricultural agronomists in Afaan Oromoo and Amharic.',
    },
    {
      question: 'How can smallholders access solar-powered irrigation pump subsidies?',
      answer:
        'Smallholder farmers located near rivers, streams, lakes, or shallow water tables can form or join a local Water User Association (WUA) with at least 5 adjacent farmers. Submit a group inquiry at your Woreda Irrigation Engineering Desk for a free hydrological site survey and subsidy approval.',
    },
    {
      question: 'What is the turnaround time for Woreda soil acidity (pH) and nutrient testing?',
      answer:
        'Standard soil pH testing and lime requirement estimation takes 24 to 48 hours at Woreda agricultural testing desks. Full macro/micronutrient laboratory profiles submitted to Regional Agricultural Research Centers (IQQO) take 5 to 7 working days.',
    },
    {
      question: 'Who qualifies for subsidized cluster combine harvester and tractor tillage booking?',
      answer:
        'Any group of smallholders with adjacent farmland plots totaling at least 20 to 30 hectares in crop priority corridors (Wheat, Maize, Barley, Teff, Soybean) can register as a mechanized cluster with their Woreda Mechanization Officer.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="services-faq-section" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 p-6 sm:p-10 shadow-sm space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight leading-tight">
            Agricultural Service Inquiries & Guidelines
          </h2>
          <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 leading-relaxed font-normal">
            Clear answers regarding eligibility, delivery timelines, required documentation, and farmer rights across all 22 administrative zones.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#F9FCF8] dark:bg-white/5 border-[#075B36] dark:border-[#A3E635]'
                    : 'bg-white dark:bg-[#181F1B] border-[#E2EFE0] dark:border-white/10 hover:border-[#075B36]/40'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-extrabold text-sm sm:text-base text-[#0A1912] dark:text-white transition-colors"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-[#075B36] text-[#A3E635] rotate-180'
                        : 'bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-white'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#3E4D43] dark:text-white/70 leading-relaxed border-t border-[#EDF4EC] dark:border-white/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
