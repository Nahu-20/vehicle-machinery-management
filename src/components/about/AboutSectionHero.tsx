import React from 'react';
import { motion } from 'framer-motion';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

interface AboutSectionHeroProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}

export const AboutSectionHero: React.FC<AboutSectionHeroProps> = ({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  children,
}) => {
  const isReducedMotion = useReducedMotionPreference();

  return (
    <section className="relative overflow-hidden border-b border-[#E2E8E3] dark:border-white/[0.08] pb-10 sm:pb-14">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-8 lg:gap-12 items-center ${imageSrc ? 'lg:grid-cols-12' : ''}`}>
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={imageSrc ? 'lg:col-span-6 space-y-4' : 'space-y-4 max-w-3xl'}
          >
            <AgriPillBadge variant="lime">{eyebrow}</AgriPillBadge>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.12] text-[#0D1C13] dark:text-[#f5f6f3]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed max-w-xl">
                {subtitle}
              </p>
            )}
            {children}
          </motion.div>

          {imageSrc && (
            <motion.div
              initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="lg:col-span-6"
            >
              <div className="relative overflow-hidden rounded-tl-[40px] rounded-br-[32px] rounded-tr-2xl rounded-bl-2xl border border-[#E2E8E3] dark:border-white/[0.1] shadow-lg aspect-[4/3] bg-[#E8EFE9] dark:bg-[#161d18]">
                <img
                  src={imageSrc}
                  alt={imageAlt || ''}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#063D2A]/25 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
