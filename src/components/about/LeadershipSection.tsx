import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import {
  Layers,
  ArrowRight,
  Sparkles,
  Cpu,
  Sprout,
  Beef,
  Droplets,
  TrendingUp,
  TreeDeciduous,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const LeadershipSection: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const directorates = [
    {
      title: 'Crop Development & Agronomy',
      description: 'Overseeing certified seed systems, fertilizer supply chains, and cluster mechanization.',
      icon: Sprout,
    },
    {
      title: 'Livestock & Veterinary Health',
      description: 'Managing disease surveillance, artificial insemination, dairy hubs, and poultry packages.',
      icon: Beef,
    },
    {
      title: 'Irrigation & Drainage Schemes',
      description: 'Designing small-scale river diversions, solar pump installations, and micro-basin irrigation.',
      icon: Droplets,
    },
    {
      title: 'Natural Resources & Soil Conservation',
      description: 'Leading regional terracing campaigns, soil fertility mapping, and Green Legacy afforestation.',
      icon: TreeDeciduous,
    },
    {
      title: 'Agricultural Extension & FTCs',
      description: 'Supervising frontline development agents and practical curriculums across 15,000+ centers.',
      icon: GraduationCap,
    },
    {
      title: 'Marketing, Inputs & Investment',
      description: 'Tracking commodity markets, empowering cooperative unions, and facilitating agro-processors.',
      icon: TrendingUp,
    },
  ];

  return (
    <section className="bg-[#FFFFFF] dark:bg-[#0D110F] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Governance Narrative & Contact CTA */}
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, x: -20 }}
            whileInView={isReducedMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="flex items-center gap-3">
              <AgriPillBadge variant="lime" icon={<Layers className="h-3.5 w-3.5 text-[#0A1912]" />}>
                {t('about_leadership_eyebrow')}
              </AgriPillBadge>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight leading-tight">
              {t('about_leadership_title')}
            </h2>

            <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
              {t('about_leadership_desc')}
            </p>

            <div className="pt-2">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#075B36] hover:bg-[#064a2c] text-white font-semibold text-sm sm:text-base shadow-xs transition-colors duration-200"
              >
                <span>{t('about_leadership_cta')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Key Technical Directorates Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {directorates.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={isReducedMotion ? undefined : { opacity: 0, y: 14 }}
                  whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  className="p-5 rounded-2xl bg-[#F8F7F2] dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.08] hover:border-[#075B36]/30 dark:hover:border-white/[0.15] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#111613] text-[#075B36] dark:text-[#74d62c] border border-[#E2E8E3] dark:border-white/[0.08] shadow-2xs">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#5B6B60] dark:text-[#a5aba6] leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
