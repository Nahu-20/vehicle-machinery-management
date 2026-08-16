import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Wheat, Quote } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const LargeAgriculturalStatement: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  return (
    <section className="relative overflow-hidden bg-[#F3F5EE] dark:bg-[#090E0B] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      {/* Subtle organic light accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#075B36]/5 dark:bg-[#74d62c]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Wheat Icon Badge */}
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#D5A62E]/10 dark:bg-[#e4ad37]/10 text-[#D5A62E] dark:text-[#e4ad37] mb-2">
          <Wheat className="h-6 w-6" />
        </div>

        {/* Large Statement Quote */}
        <motion.blockquote
          initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight leading-relaxed sm:leading-snug"
        >
          "{t('about_statement_quote')}"
        </motion.blockquote>

        {/* Attribution */}
        <div className="pt-2">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#075B36] dark:text-[#74d62c]">
            {t('bureau_full_name')}
          </p>
          <p className="text-xs text-[#5B6B60] dark:text-[#a5aba6] mt-0.5">
            {t('bureau_sub_title')}
          </p>
        </div>

      </div>
    </section>
  );
};
