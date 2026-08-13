import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { CountUpStat } from '../common/scroll/CountUpStat';
import { AgriPillBadge } from '../common/AgriPillBadge';
import {
  ArrowUpRight,
  ShieldCheck,
  Sprout,
  CloudSun,
  MapPin,
  TrendingUp,
} from 'lucide-react';

import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

export const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, 35]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.035]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -18]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.85]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#F6F7F3] dark:bg-[#0B1912] py-10 sm:py-14 md:py-20 transition-colors duration-300"
    >
      <motion.div
        style={{ y: textY, opacity: contentOpacity }}
        className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Asymmetrical Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Small Eyebrow Badge */}
            <div className="flex items-center gap-3">
              <AgriPillBadge variant="lime" icon={<Sprout className="h-3.5 w-3.5 text-[#0A1912]" />}>
                {t('hero_badge')}
              </AgriPillBadge>
              <span className="text-xs font-semibold text-[#56635B] dark:text-[#94A39A] uppercase tracking-wider">
                {t('gov_name')}
              </span>
            </div>

            {/* Editorial Headline */}
            <h1 className="text-[clamp(2.5rem,5.5vw,5.2rem)] font-extrabold tracking-tight text-[#111310] dark:text-white leading-[1.06] hyphens-none">
              {t('hero_headline')}
            </h1>

            {/* Supporting paragraph */}
            <p className="text-base sm:text-lg text-[#56635B] dark:text-[#A7F3D0]/80 max-w-2xl leading-relaxed font-normal">
              {t('hero_supporting')}
            </p>

            {/* Reference-style Button Duo: [ Main CTA ] + [ Circular Arrow ] */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#A3E635] hover:bg-[#92D022] text-[#0A1912] font-extrabold text-base h-13 px-8 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{t('hero_btn_services')}</span>
              </a>

              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-full bg-[#0A1912] dark:bg-emerald-800 hover:bg-[#063D2A] text-[#A3E635] h-13 w-13 transition-all duration-200 transform hover:scale-105 shadow-sm"
                aria-label="Explore Services"
              >
                <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
              </a>

              <a
                href="#programs"
                className="ml-2 inline-flex items-center gap-2 text-sm font-bold text-[#063D2A] dark:text-emerald-300 hover:text-[#087A4B] dark:hover:text-emerald-200 transition-colors py-2 px-4 rounded-full border border-gray-200 dark:border-emerald-800/80 bg-white/80 dark:bg-black/20"
              >
                <span>{t('hero_btn_programs')}</span>
              </a>
            </div>

            {/* Quick Stat Highlights Bar */}
            <div className="pt-8 border-t border-[#E2E8E3] dark:border-[#183327] grid grid-cols-3 gap-6 max-w-xl">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#111310] dark:text-white tracking-tight">
                  <CountUpStat value="12.4M+" />
                </p>
                <p className="text-xs text-[#56635B] dark:text-emerald-300/80 font-medium mt-1">
                  Farming Families
                </p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#087A4B] dark:text-[#A3E635] tracking-tight">
                  <CountUpStat value="21" />
                </p>
                <p className="text-xs text-[#56635B] dark:text-emerald-300/80 font-medium mt-1">
                  Zonal Hubs
                </p>
              </div>

              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#111310] dark:text-white tracking-tight">
                  <CountUpStat value="15,000+" />
                </p>
                <p className="text-xs text-[#56635B] dark:text-emerald-300/80 font-medium mt-1">
                  Extension Agents
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Container with Scroll Parallax */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black/10 aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] max-h-[580px] w-full">
              <motion.img
                src={heroFarmlandImg}
                alt="Oromia Agricultural Farmland"
                referrerPolicy="no-referrer"
                style={{ scale: bgScale, y: bgY }}
                className="h-full w-full object-cover object-center will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Floating Quick Advisory Card */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 rounded-2xl bg-[#0A1912]/90 backdrop-blur-md p-4 sm:p-5 border border-white/15 text-white shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudSun className="h-4 w-4 text-[#A3E635]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#A3E635]">
                      Live Regional Network
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-medium text-emerald-200">
                    Oromia Wide
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs text-gray-300">Seasonal Advisory Window</p>
                    <p className="text-sm font-semibold text-white">Wheat & Maize Sowing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-300">Optimal Moisture</p>
                    <p className="text-sm font-bold text-[#A3E635]">Arsi & Shewa</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/90">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#A3E635]" />
                    {t('hero_trust_text')}
                  </span>
                  <a href="#market" className="text-[#A3E635] font-semibold hover:underline flex items-center gap-0.5 text-[11px]">
                    Market Rates <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

