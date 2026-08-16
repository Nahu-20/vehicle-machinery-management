import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import {
  FileText,
  MapPin,
  Building2,
  GraduationCap,
  Users2,
  ArrowRight,
} from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const RegionalRole: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const steps = [
    {
      step: '01',
      title: 'Policy Formulation & Strategy',
      description:
        'Setting regional agricultural goals, input subsidy policies, irrigation targets, and climate-adaptation frameworks.',
      icon: FileText,
    },
    {
      step: '02',
      title: '22 Zonal Directorates',
      description:
        'Coordinating input supplies, pest monitoring, weather advisories, and mechanization across all administrative zones.',
      icon: MapPin,
    },
    {
      step: '03',
      title: '330+ Woreda Offices',
      description:
        'Overseeing technical extension specialists, soil testing labs, animal vaccination points, and seed certification.',
      icon: Building2,
    },
    {
      step: '04',
      title: '15,000+ FTC Networks',
      description:
        'Delivering direct farmer training, demonstration plots, practical irrigation techniques, and improved agronomic practices.',
      icon: GraduationCap,
    },
    {
      step: '05',
      title: 'Farmers & Agro-Pastoralists',
      description:
        'Empowering over 12 million farming households with higher productivity, food sovereignty, and transparent market access.',
      icon: Users2,
    },
  ];

  return (
    <section className="bg-[#F8F7F2] dark:bg-[#070908] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 lg:mb-16">
          <AgriPillBadge variant="lime" icon={<MapPin className="h-3.5 w-3.5 text-[#0A1912]" />}>
            {t('about_role_eyebrow')}
          </AgriPillBadge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight">
            {t('about_role_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6]">
            {t('about_role_sub')}
          </p>
        </div>

        {/* 5-Step Operational Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
                whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="relative flex flex-col justify-between rounded-2xl p-6 bg-white dark:bg-[#111613] border border-[#E2E8E3] dark:border-white/[0.08] shadow-2xs hover:shadow-sm transition-all duration-200"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#075B36]/10 dark:bg-[#74d62c]/10 text-[#075B36] dark:text-[#74d62c]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-black text-[#D5A62E] dark:text-[#e4ad37]">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3] mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#5B6B60] dark:text-[#a5aba6]/40 pointer-events-none">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
