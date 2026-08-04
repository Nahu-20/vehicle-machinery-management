import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockPrograms } from '../../data/mockData';
import { Layers, MapPin, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../common/ImageWithFallback';

export const FeaturedProgramsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="programs" className="relative bg-white py-16 lg:py-24 border-b border-[#DDE8E1]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/10 via-emerald-50 to-[#087A4B]/10 border border-[#087A4B]/20 text-[#087A4B] text-xs font-black mb-3 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Strategic Transformation Flagships</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] tracking-tight">
            {t('programs_title')}
          </h2>
          <p className="text-sm sm:text-base text-[#637069] mt-3 leading-relaxed font-medium">
            {t('programs_subtitle')}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockPrograms.map((prog) => (
            <div
              key={prog.id}
              className="group overflow-hidden rounded-3xl border border-[#DDE8E1] bg-gradient-to-b from-white to-[#FAFAF7] shadow-xs hover:shadow-xl hover:border-[#087A4B] card-hover flex flex-col lg:flex-row transition-all duration-300"
            >
              <div className="lg:w-5/12 relative h-56 lg:h-auto overflow-hidden shrink-0">
                <ImageWithFallback
                  src={prog.imageUrl}
                  alt={t(prog.titleKey)}
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/30" />
                <div className="absolute top-4 left-4 z-10">
                  <span className="rounded-xl bg-[#063D2A]/90 px-3.5 py-1.5 text-xs font-black text-[#D7A928] shadow-lg border border-[#D7A928]/40 backdrop-blur-md">
                    {prog.badgeKey}
                  </span>
                </div>
              </div>

              <div className="lg:w-7/12 p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-[#087A4B] uppercase tracking-wider">
                    <Layers className="h-4 w-4" />
                    <span>{prog.categoryKey}</span>
                  </div>

                  <h3 className="mt-3 text-lg sm:text-xl font-extrabold text-[#14251D] group-hover:text-[#087A4B] transition-colors leading-snug">
                    {t(prog.titleKey)}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-[#637069] leading-relaxed line-clamp-3">
                    {t(prog.descriptionKey)}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#DDE8E1] space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs text-[#637069] gap-2">
                    <span className="flex items-center gap-1.5 font-semibold bg-[#EFF8F2] px-2.5 py-1 rounded-lg border border-[#DDE8E1]">
                      <MapPin className="h-3.5 w-3.5 text-[#087A4B]" />
                      <strong className="text-[#14251D]">Target:</strong> {prog.targetArea}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold bg-[#EFF8F2] px-2.5 py-1 rounded-lg border border-[#DDE8E1]">
                      <Users className="h-3.5 w-3.5 text-[#087A4B]" />
                      <strong className="text-[#14251D]">Reach:</strong> {prog.beneficiaries}
                    </span>
                  </div>

                  <Link
                    to="/programs"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#063D2A] hover:text-[#087A4B] pt-1 group-hover:translate-x-1.5 transition-transform"
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
