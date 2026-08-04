import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockPrograms } from '../../data/mockData';
import { Layers, MapPin, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../common/ImageWithFallback';

export const FeaturedProgramsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="programs" className="relative bg-white dark:bg-[#0B1912] py-16 lg:py-24 border-b border-[#DDE8E1] dark:border-emerald-900/60 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/10 via-emerald-50 to-[#087A4B]/10 dark:from-emerald-900/40 dark:via-[#12281D] dark:to-emerald-900/40 border border-[#087A4B]/20 dark:border-emerald-700/50 text-[#087A4B] dark:text-emerald-300 text-xs font-black mb-3 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
            <span>Strategic Transformation Flagships</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] dark:text-emerald-100 tracking-tight">
            {t('programs_title')}
          </h2>
          <p className="text-sm sm:text-base text-[#637069] dark:text-emerald-300/80 mt-3 leading-relaxed font-medium">
            {t('programs_subtitle')}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockPrograms.map((prog) => (
            <div
              key={prog.id}
              className="group overflow-hidden rounded-3xl border border-[#DDE8E1] dark:border-emerald-800/60 bg-gradient-to-b from-white to-[#FAFAF7] dark:from-[#0F2E20] dark:via-[#143828] dark:to-[#0A2116] shadow-xs hover:shadow-xl hover:border-[#087A4B] dark:hover:border-emerald-400 dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] card-hover flex flex-col lg:flex-row transition-all duration-300"
            >
              <div className="lg:w-5/12 relative h-56 lg:h-auto overflow-hidden shrink-0">
                <ImageWithFallback
                  src={prog.imageUrl}
                  alt={t(prog.titleKey)}
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/40" />
                <div className="absolute top-4 left-4 z-10">
                  <span className="rounded-xl bg-[#063D2A]/90 dark:bg-gradient-to-r dark:from-amber-500 dark:to-yellow-500 px-3.5 py-1.5 text-xs font-black text-[#D7A928] dark:text-[#061810] shadow-lg border border-[#D7A928]/40 dark:border-amber-300 backdrop-blur-md dark:shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    {prog.badgeKey}
                  </span>
                </div>
              </div>

              <div className="lg:w-7/12 p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-[#087A4B] dark:text-emerald-300 uppercase tracking-wider">
                    <Layers className="h-4 w-4 text-[#D7A928]" />
                    <span>{prog.categoryKey}</span>
                  </div>

                  <h3 className="mt-3 text-lg sm:text-xl font-extrabold text-[#14251D] dark:text-emerald-50 group-hover:text-[#087A4B] dark:group-hover:text-emerald-300 transition-colors leading-snug">
                    {t(prog.titleKey)}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-[#637069] dark:text-emerald-200/80 leading-relaxed line-clamp-3">
                    {t(prog.descriptionKey)}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#DDE8E1] dark:border-emerald-800/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs text-[#637069] dark:text-emerald-200/80 gap-2">
                    <span className="flex items-center gap-1.5 font-semibold bg-[#EFF8F2] dark:bg-[#163B2B] px-2.5 py-1 rounded-lg border border-[#DDE8E1] dark:border-emerald-700/60">
                      <MapPin className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
                      <strong className="text-[#14251D] dark:text-emerald-100">Target:</strong> {prog.targetArea}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold bg-[#EFF8F2] dark:bg-[#163B2B] px-2.5 py-1 rounded-lg border border-[#DDE8E1] dark:border-emerald-700/60">
                      <Users className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
                      <strong className="text-[#14251D] dark:text-emerald-100">Reach:</strong> {prog.beneficiaries}
                    </span>
                  </div>

                  <Link
                    to="/programs"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#063D2A] dark:text-emerald-300 hover:text-[#087A4B] dark:hover:text-emerald-200 pt-1 group-hover:translate-x-1.5 transition-transform"
                  >
                    <span>Read Full Program Brief</span>
                    <ArrowUpRight className="h-4 w-4 text-[#D7A928]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
