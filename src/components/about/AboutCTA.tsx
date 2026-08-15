import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight, PhoneCall, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonHoverTap } from '../../animation/motionVariants';

export const AboutCTA: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  return (
    <section className="bg-[#F8F7F2] dark:bg-[#070908] py-16 sm:py-20 lg:py-24 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight">
            {t('about_cta_heading')}
          </h2>

          <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
            {t('about_cta_sub')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <motion.div {...buttonHoverTap}>
              <Link
                to="/programs"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#075B36] hover:bg-[#064a2c] text-white font-semibold text-sm sm:text-base shadow-xs transition-colors duration-200"
              >
                <span>{t('hero_btn_programs')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div {...buttonHoverTap}>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#075B36]/30 dark:border-white/[0.15] bg-white/80 dark:bg-[#161d18] text-[#075B36] dark:text-[#f5f6f3] hover:bg-white dark:hover:bg-[#1d2520] font-semibold text-sm sm:text-base transition-colors duration-200"
              >
                <PhoneCall className="h-4 w-4 opacity-70" />
                <span>{t('contact_btn')}</span>
              </Link>
            </motion.div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6B60] dark:text-[#a5aba6]">
            <span className="h-2 w-2 rounded-full bg-[#075B36] dark:bg-[#74d62c]" />
            <span>Toll-Free Farmer Hotline: <strong className="text-[#0D1C13] dark:text-[#f5f6f3]">8844</strong> (Free nationwide)</span>
          </div>

        </div>

      </div>
    </section>
  );
};
