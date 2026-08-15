import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { Handshake, Users, Microscope, Globe, Building } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const PartnershipSection: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const partners = [
    {
      title: 'Farmers & Primary Cooperatives',
      desc: 'Smallholder unions driving high-yield cluster cultivation, seed multiplications, and regional grain reserves.',
      icon: Users,
      badge: 'Grassroots Foundation',
    },
    {
      title: 'Agricultural Research Institutes',
      desc: 'Partnering with IQQO, CIMMYT, and ILRI to breed disease-resistant crops, improve livestock genetics, and test soil.',
      icon: Microscope,
      badge: 'Science & Innovation',
    },
    {
      title: 'Development Agencies & Federal MoA',
      desc: 'Coordinating with the Ministry of Agriculture, FAO, World Bank AGP, and ATI to scale mechanization and irrigation.',
      icon: Globe,
      badge: 'Policy & Program Scaling',
    },
    {
      title: 'Financial Institutions & Agribusinesses',
      desc: 'Working with Cooperative Bank of Oromia and CBE to expand input credit, insurance, and agro-processing investments.',
      icon: Building,
      badge: 'Finance & Markets',
    },
  ];

  return (
    <section className="bg-[#F8F7F2] dark:bg-[#070908] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 lg:mb-16">
          <AgriPillBadge variant="lime" icon={<Handshake className="h-3.5 w-3.5 text-[#0A1912]" />}>
            {t('about_partner_eyebrow')}
          </AgriPillBadge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight">
            {t('about_partner_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6]">
            {t('about_partner_sub')}
          </p>
        </div>

        {/* 4 Pillars of Collaboration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {partners.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
                whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="flex flex-col justify-between rounded-2xl p-6 bg-white dark:bg-[#111613] border border-[#E2E8E3] dark:border-white/[0.08] shadow-2xs hover:shadow-sm transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#075B36]/10 dark:bg-[#74d62c]/10 text-[#075B36] dark:text-[#74d62c]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <span className="inline-block text-[11px] font-bold text-[#5B6B60] dark:text-[#a5aba6] tracking-wider uppercase mb-2">
                    {item.badge}
                  </span>

                  <h3 className="text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3] mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
