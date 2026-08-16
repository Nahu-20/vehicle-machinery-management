import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const ImpactStats: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const stats = [
    {
      value: '22',
      label: 'Administrative Zones',
      subtext: 'Comprehensive coverage across regional ecosystems',
    },
    {
      value: '50+',
      label: 'Agricultural Commodities',
      subtext: 'Major cereals, pulses, coffee, oilseeds & livestock',
    },
    {
      value: '5M+',
      label: 'Farming Households',
      subtext: 'Supported through extension, seeds, and fertilizer',
    },
    {
      value: '15K+',
      label: 'Farmer Training Centers',
      subtext: 'Active grassroots demonstration & education plots',
    },
    {
      value: '8844',
      label: 'Toll-Free Support Line',
      subtext: 'Real-time agronomic and advisory hotline for farmers',
    },
    {
      value: '330+',
      label: 'Woreda Field Offices',
      subtext: 'Local technical teams and extension supervisors',
    },
  ];

  return (
    <section className="bg-[#FFFFFF] dark:bg-[#0D110F] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 lg:mb-16">
          <AgriPillBadge variant="lime" icon={<BarChart3 className="h-3.5 w-3.5 text-[#0A1912]" />}>
            {t('about_reach_eyebrow')}
          </AgriPillBadge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight">
            {t('about_reach_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6]">
            Verified operational reach and institutional infrastructure powering Oromia's agricultural transformation.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: idx * 0.07 }}
              className="flex flex-col justify-between p-7 rounded-2xl bg-[#F8F7F2] dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.08] hover:border-[#075B36]/30 dark:hover:border-white/[0.16] transition-colors duration-200"
            >
              <div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#075B36] dark:text-[#74d62c] tracking-tight mb-2">
                  {stat.value}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0D1C13] dark:text-[#f5f6f3] mb-1.5">
                  {stat.label}
                </h3>
                <p className="text-xs sm:text-sm text-[#5B6B60] dark:text-[#a5aba6] leading-relaxed">
                  {stat.subtext}
                </p>
              </div>

              <div className="w-12 h-1 bg-[#075B36]/20 dark:bg-[#74d62c]/30 rounded-full mt-6" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
