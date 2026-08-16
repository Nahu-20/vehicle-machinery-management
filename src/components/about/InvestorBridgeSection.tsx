import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { Landmark, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonHoverTap } from '../../animation/motionVariants';

export const InvestorBridgeSection: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const investmentHighlights = [
    { title: 'Agro-Ecological Diversity', desc: 'From highland wheat and pulses to lowland cotton, sesame, and sugar.' },
    { title: 'Coffee & High-Value Exports', desc: 'Global specialty origins including Jimma, Harar, Guji, and Limmu.' },
    { title: 'Agri-Processing Corridors', desc: 'Integrated agro-industrial parks with power, water, and road connectivity.' },
    { title: 'Bureau Investor Support', desc: 'Facilitating technical clearances, soil data, and direct farmer union ties.' },
  ];

  return (
    <section className="bg-[#FFFFFF] dark:bg-[#0D110F] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-3xl p-8 sm:p-12 lg:p-16 bg-[#0E241A] dark:bg-[#111613] text-[#F5F7F4] dark:text-[#f5f6f3] border border-[#1E4A35]/60 dark:border-white/[0.12] shadow-xl relative overflow-hidden">
          
          {/* Subtle wheat glow background */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#D5A62E]/10 dark:bg-[#e4ad37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Heading & Pitch */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-3">
                <AgriPillBadge variant="lime" icon={<Landmark className="h-3.5 w-3.5 text-[#0A1912]" />}>
                  {t('about_invest_eyebrow')}
                </AgriPillBadge>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {t('about_invest_title')}
              </h2>

              <p className="text-base sm:text-lg text-[#D1D9D3] dark:text-[#a5aba6] leading-relaxed">
                {t('about_invest_sub')}
              </p>

              <div className="pt-2">
                <motion.div {...buttonHoverTap} className="inline-block">
                  <Link
                    to="/investment"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#A3E635] hover:bg-[#b0ef46] text-[#0A1912] font-bold text-sm sm:text-base shadow-sm transition-colors duration-200"
                  >
                    <span>{t('about_invest_cta')}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Right Column: 4 Key Value Points */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {investmentHighlights.map((item, idx) => (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl bg-white/[0.06] dark:bg-white/[0.04] border border-white/[0.1] backdrop-blur-xs"
                >
                  <div className="h-2 w-2 rounded-full bg-[#A3E635] mb-3" />
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#CBD5CE] dark:text-[#a5aba6] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
