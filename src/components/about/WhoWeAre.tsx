import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { Sprout, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import coffeeHarvestImg from '../../assets/images/oromia_coffee_harvest_1785782724559.jpg';
import irrigationImg from '../../assets/images/oromia_irrigation_program_1785782711113.jpg';

export const WhoWeAre: React.FC = () => {
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
    <section className="bg-[#FFFFFF] dark:bg-[#0D110F] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Overlapping Image Composition */}
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, x: -24 }}
            whileInView={isReducedMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative mx-auto max-w-md sm:max-w-lg lg:max-w-none pr-6 sm:pr-12 pb-8 sm:pb-12">
              
              {/* Primary Large Image */}
              <div className="relative rounded-3xl overflow-hidden border border-[#E2E8E3] dark:border-white/[0.1] shadow-xl bg-[#E8EFE9] dark:bg-[#161d18]">
                <img
                  src={coffeeHarvestImg}
                  alt="Farmers harvesting premium agricultural produce in Oromia"
                  className="w-full h-[380px] sm:h-[440px] object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white text-xs sm:text-sm font-medium bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
                  🌱 Smallholder Empowerment & High-Value Agro-Chains
                </div>
              </div>

              {/* Secondary Overlapping Small Card (Bottom Right) */}
              <div className="absolute -bottom-2 right-0 sm:right-2 w-3/5 rounded-2xl overflow-hidden border-2 border-white dark:border-[#0D110F] shadow-2xl bg-[#E8EFE9] dark:bg-[#161d18]">
                <img
                  src={irrigationImg}
                  alt="Modern agricultural irrigation development"
                  className="w-full h-36 sm:h-44 object-cover"
                  loading="lazy"
                />
              </div>

            </div>
          </motion.div>

          {/* Right Column: Editorial Narrative & Focus Areas */}
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, x: 24 }}
            whileInView={isReducedMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-6 space-y-6 sm:space-y-7"
          >
            <div className="flex items-center gap-3">
              <AgriPillBadge variant="lime" icon={<Sprout className="h-3.5 w-3.5 text-[#0A1912]" />}>
                {t('about_who_eyebrow')}
              </AgriPillBadge>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight leading-tight">
              {t('about_who_title')}
            </h2>

            <div className="space-y-4 text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
              <p>
                {t('about_who_p1')}
              </p>
              <p>
                {t('about_who_p2')}
              </p>
            </div>

            {/* Quick Institutional Highlights List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F6F7F3] dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.08]">
                <CheckCircle2 className="h-5 w-5 text-[#075B36] dark:text-[#74d62c] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-semibold text-[#0D1C13] dark:text-[#f5f6f3]">
                  Integrated Cluster Farming
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F6F7F3] dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.08]">
                <CheckCircle2 className="h-5 w-5 text-[#075B36] dark:text-[#74d62c] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-semibold text-[#0D1C13] dark:text-[#f5f6f3]">
                  Highland & Lowland Irrigation
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F6F7F3] dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.08]">
                <CheckCircle2 className="h-5 w-5 text-[#075B36] dark:text-[#74d62c] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-semibold text-[#0D1C13] dark:text-[#f5f6f3]">
                  Livestock Health & Dairy
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F6F7F3] dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.08]">
                <CheckCircle2 className="h-5 w-5 text-[#075B36] dark:text-[#74d62c] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-semibold text-[#0D1C13] dark:text-[#f5f6f3]">
                  Extension & Farmer Training
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="#mandate-section"
                onClick={handleScrollToMandate}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-[#075B36] dark:text-[#74d62c] hover:underline underline-offset-4"
              >
                <span>{t('about_hero_mandate_btn')}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};
