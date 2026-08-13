import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { mockPrograms } from '../../data/mockData';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { Layers, MapPin, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { fadeUp, buttonHoverTap } from '../../animation/motionVariants';

export const FeaturedProgramsSection: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  return (
    <section id="programs" className="relative bg-[#F6F7F3] dark:bg-[#0B1912] py-16 lg:py-24 border-b border-[#E2E8E3] dark:border-[#183327] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24">
        {/* Section Header */}
        <motion.div
          initial={isReducedMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <AgriPillBadge variant="lime" icon={<Sparkles className="h-3.5 w-3.5 text-[#0A1912]" />}>
            Strategic Flagship Programs
          </AgriPillBadge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111310] dark:text-white tracking-tight">
            {t('programs_title')}
          </h2>

          <p className="text-base text-[#56635B] dark:text-[#A7F3D0]/80 leading-relaxed font-normal">
            {t('programs_subtitle')}
          </p>
        </motion.div>

        {/* Alternating Editorial Program Blocks */}
        <div className="space-y-16 lg:space-y-24">
          {mockPrograms.map((prog, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={prog.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                  isEven ? '' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Image Block (7 columns) with Framer Motion slide */}
                <motion.div
                  initial={isReducedMotion ? undefined : { opacity: 0, x: isEven ? 30 : -30 }}
                  whileInView={isReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className={`lg:col-span-7 ${
                    isEven ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#E2E8E3] dark:border-[#183327] aspect-[16/10] w-full group">
                    <ImageWithFallback
                      src={prog.imageUrl}
                      alt={t(prog.titleKey)}
                      containerClassName="h-full w-full"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <AgriPillBadge variant="lime">
                        {prog.badgeKey}
                      </AgriPillBadge>
                    </div>
                  </div>
                </motion.div>

                {/* Content Block (5 columns) with Framer Motion fade-up */}
                <motion.div
                  initial={isReducedMotion ? undefined : { opacity: 0, y: 20 }}
                  whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className={`lg:col-span-5 space-y-5 ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#087A4B] dark:text-[#A3E635] uppercase tracking-wider">
                    <Layers className="h-4 w-4" />
                    <span>{prog.categoryKey}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111310] dark:text-white leading-tight">
                    {t(prog.titleKey)}
                  </h3>

                  <p className="text-base text-[#56635B] dark:text-[#94A39A] leading-relaxed font-normal">
                    {t(prog.descriptionKey)}
                  </p>

                  <div className="pt-4 border-t border-[#E2E8E3] dark:border-[#183327] flex flex-wrap items-center gap-4 text-xs font-semibold text-[#56635B] dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" />
                      <span><strong>Target Area:</strong> {prog.targetArea}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" />
                      <span><strong>Reach:</strong> {prog.beneficiaries}</span>
                    </span>
                  </div>

                  <div className="pt-2">
                    <motion.div {...(isReducedMotion ? {} : buttonHoverTap)}>
                      <Link
                        to="/programs"
                        className="inline-flex items-center gap-2.5 rounded-full bg-[#0A1912] dark:bg-emerald-800 text-white hover:bg-[#063D2A] px-6 py-3.5 text-sm font-extrabold transition-all duration-200 shadow-sm group"
                      >
                        <span>Explore Program Brief</span>
                        <ArrowUpRight className="h-4 w-4 text-[#A3E635] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
