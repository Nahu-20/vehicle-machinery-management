import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { fadeUp, buttonHoverTap } from '../../animation/motionVariants';
import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

export const AboutHero: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const handleScrollToMandate = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('mandate-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#F8F7F2] dark:bg-[#070908] pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      {/* Subtle organic ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#087A4B]/5 dark:bg-[#74d62c]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#D5A62E]/5 dark:bg-[#e4ad37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Headline, Story & Navigation */}
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-6 space-y-6 sm:space-y-8"
          >
            {/* Pill Badge */}
            <div className="flex items-center gap-3">
              <AgriPillBadge variant="lime" icon={<ShieldCheck className="h-3.5 w-3.5 text-[#0A1912]" />}>
                {t('about_hero_badge')}
              </AgriPillBadge>
              <span className="text-xs font-semibold text-[#5B6B60] dark:text-[#a5aba6] tracking-wider uppercase">
                {t('bureau_sub_title')}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight leading-[1.12]">
              {t('about_hero_title')}
            </h1>

            {/* Supporting Editorial Description */}
            <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed max-w-xl font-normal">
              {t('about_hero_sub')}
            </p>

            {/* Dual Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <motion.a
                href="#mandate-section"
                onClick={handleScrollToMandate}
                {...buttonHoverTap}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#075B36] hover:bg-[#064a2c] text-white font-semibold text-sm sm:text-base shadow-sm transition-colors duration-200"
              >
                <span>{t('about_hero_mandate_btn')}</span>
                <ArrowRight className="h-4 w-4" />
              </motion.a>

              <motion.div {...buttonHoverTap}>
                <Link
                  to="/programs"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#075B36]/30 dark:border-white/[0.15] bg-white/80 dark:bg-[#161d18] text-[#075B36] dark:text-[#f5f6f3] hover:bg-white dark:hover:bg-[#1d2520] font-semibold text-sm sm:text-base transition-colors duration-200"
                >
                  <span>{t('about_hero_programs_btn')}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-70" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column: Reference-Inspired Visual Composition */}
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, scale: 0.97 }}
            animate={isReducedMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative mx-auto max-w-md sm:max-w-lg lg:max-w-none">
              
              {/* Asymmetric Cropped Primary Photo */}
              <div className="relative rounded-tl-[48px] rounded-br-[40px] rounded-tr-[24px] rounded-bl-[24px] overflow-hidden border border-[#E2E8E3] dark:border-white/[0.12] shadow-xl bg-[#E8EFE9] dark:bg-[#161d18]">
                <img
                  src={heroFarmlandImg}
                  alt="Oromia agricultural landscapes and farming communities"
                  className="w-full h-[360px] sm:h-[420px] lg:h-[460px] object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1912]/70 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Statistic Card (Top Right / Asymmetric) */}
              <motion.div
                initial={isReducedMotion ? undefined : { opacity: 0, y: -16 }}
                animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="absolute -top-6 -right-4 sm:-right-6 bg-white dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.12] rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md max-w-[210px] sm:max-w-[240px]"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#075B36] dark:text-[#74d62c] tracking-tight">
                    {t('about_hero_stat_number')}
                  </span>
                  <div className="p-2 rounded-lg bg-[#075B36]/10 dark:bg-[#74d62c]/10 text-[#075B36] dark:text-[#74d62c]">
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3] leading-tight">
                  {t('about_hero_stat_label')}
                </h4>
                <p className="text-xs text-[#5B6B60] dark:text-[#a5aba6] mt-1">
                  {t('about_hero_stat_sub')}
                </p>
                {/* Visual Progress/Accent Line */}
                <div className="w-full h-1 bg-[#E8EFE9] dark:bg-white/[0.1] rounded-full mt-3 overflow-hidden">
                  <div className="w-4/5 h-full bg-[#075B36] dark:bg-[#74d62c] rounded-full" />
                </div>
              </motion.div>

              {/* Dark Overlapping Commitment Card (Bottom Left / Asymmetric) */}
              <motion.div
                initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
                animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="absolute -bottom-8 -left-4 sm:-left-6 bg-[#0E241A] dark:bg-[#111613] text-[#F5F7F4] dark:text-[#f5f6f3] border border-[#1E4A35]/60 dark:border-white/[0.14] rounded-2xl p-5 sm:p-6 shadow-2xl max-w-[280px] sm:max-w-[340px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[#A3E635] dark:bg-[#74d62c] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#A3E635] dark:text-[#74d62c] tracking-wider uppercase">
                    {t('about_commitment_eyebrow')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#E2E8E3] dark:text-[#d1d5d3] leading-relaxed">
                  {t('about_commitment_text')}
                </p>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
