import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { Target, Compass, ShieldCheck, Check } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { fadeUp } from '../../animation/motionVariants';

export const MissionVisionMandate: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const cards = [
    {
      id: 'mission',
      title: t('about_mission_card_title'),
      desc: t('about_mission_card_desc'),
      icon: Target,
      accentColor: 'border-[#075B36] dark:border-[#74d62c]',
      badgeColor: 'bg-[#075B36]/10 text-[#075B36] dark:bg-[#74d62c]/10 dark:text-[#74d62c]',
      iconColor: 'text-[#075B36] dark:text-[#74d62c]',
      bgGlow: 'from-[#075B36]/5 to-transparent dark:from-[#74d62c]/5',
      highlights: [
        'Modernizing farming technologies',
        'Enhancing crop and livestock yields',
        'Securing household food sovereignty',
      ],
    },
    {
      id: 'vision',
      title: t('about_vision_card_title'),
      desc: t('about_vision_card_desc'),
      icon: Compass,
      accentColor: 'border-[#D5A62E] dark:border-[#e4ad37]',
      badgeColor: 'bg-[#D5A62E]/10 text-[#A87B10] dark:bg-[#e4ad37]/10 dark:text-[#e4ad37]',
      iconColor: 'text-[#D5A62E] dark:text-[#e4ad37]',
      bgGlow: 'from-[#D5A62E]/5 to-transparent dark:from-[#e4ad37]/5',
      highlights: [
        'Climate-resilient regional ecosystem',
        'Agro-processing & value addition',
        'Inclusive rural economic prosperity',
      ],
    },
    {
      id: 'mandate',
      title: t('about_mandate_card_title'),
      desc: t('about_mandate_card_desc'),
      icon: ShieldCheck,
      accentColor: 'border-[#1E4A35] dark:border-white/[0.2]',
      badgeColor: 'bg-[#1E4A35]/10 text-[#1E4A35] dark:bg-white/[0.1] dark:text-white',
      iconColor: 'text-[#1E4A35] dark:text-[#E2E8E3]',
      bgGlow: 'from-[#1E4A35]/5 to-transparent dark:from-white/[0.03]',
      highlights: [
        'Farmer-first public extension',
        'Transparent regional input allocation',
        'Equity across all 22 administrative zones',
      ],
    },
  ];

  return (
    <section
      id="mandate-section"
      className="bg-[#F8F7F2] dark:bg-[#070908] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-20"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 lg:mb-16">
          <AgriPillBadge variant="lime" icon={<ShieldCheck className="h-3.5 w-3.5 text-[#0A1912]" />}>
            FOUNDATIONAL PILLARS
          </AgriPillBadge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight">
            Mission, Vision & Core Mandate
          </h2>
          <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6]">
            The foundational directives that guide our agricultural policies, technical directorates, and field operations.
          </p>
        </div>

        {/* 3 Foundation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={isReducedMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className={`relative flex flex-col justify-between rounded-3xl p-8 bg-white dark:bg-[#111613] border border-[#E2E8E3] dark:border-white/[0.1] shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-b ${card.bgGlow}`}
              >
                <div>
                  {/* Top Bar with Icon */}
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className={`p-3.5 rounded-2xl ${card.badgeColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-[#5B6B60] dark:text-[#a5aba6] tracking-widest uppercase">
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Card Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0D1C13] dark:text-[#f5f6f3] mb-3 tracking-tight">
                    {card.title}
                  </h3>

                  {/* Card Description */}
                  <p className="text-sm sm:text-base text-[#4E6155] dark:text-[#a5aba6] leading-relaxed mb-6">
                    {card.desc}
                  </p>
                </div>

                {/* Sub Highlights */}
                <div className="pt-4 border-t border-[#E8EFE9] dark:border-white/[0.08] space-y-2.5">
                  {card.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2 text-xs sm:text-sm text-[#0D1C13] dark:text-[#d1d5d3]">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${card.iconColor}`} />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
