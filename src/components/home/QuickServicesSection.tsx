import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockServices } from '../../data/mockData';
import {
  Sprout,
  TrendingUp,
  Wheat,
  Beef,
  Droplets,
  PackageCheck,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickServicesSection: React.FC = () => {
  const { t } = useLanguage();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout': return <Sprout className="h-6 w-6" />;
      case 'TrendingUp': return <TrendingUp className="h-6 w-6" />;
      case 'Wheat': return <Wheat className="h-6 w-6" />;
      case 'Beef': return <Beef className="h-6 w-6" />;
      case 'Droplets': return <Droplets className="h-6 w-6" />;
      case 'PackageCheck': default: return <PackageCheck className="h-6 w-6" />;
    }
  };

  return (
    <section id="services" className="relative bg-gradient-to-b from-[#EFF8F2] via-white to-[#EFF8F2] py-16 lg:py-24 border-b border-[#DDE8E1]">
      {/* Decorative ambient background accents */}
      <div className="absolute top-10 left-0 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/15 to-emerald-100 border border-[#087A4B]/25 text-[#087A4B] text-xs font-black mb-3 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#087A4B]" />
              <span>{t('services_tagline')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] tracking-tight">
              {t('services_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] mt-2 max-w-2xl leading-relaxed font-medium">
              {t('services_subtitle')}
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-white to-[#EFF8F2] border border-[#DDE8E1] px-6 py-3.5 text-xs sm:text-sm font-extrabold text-[#063D2A] hover:bg-[#063D2A] hover:text-white transition-all shadow-sm shrink-0 hover:shadow-md transform hover:-translate-y-0.5"
          >
            <span>{t('all_services_btn')}</span>
            <ChevronRight className="h-4 w-4 text-[#D7A928]" />
          </Link>
        </div>

        {/* 6 Cards Grid with expressive featured hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {mockServices.map((srv, index) => {
            const isFeatured = index === 0;

            return (
              <div
                key={srv.id}
                className={`group relative flex flex-col justify-between rounded-3xl p-7 card-hover transition-all duration-300 ${
                  isFeatured
                    ? 'border-2 border-[#087A4B]/40 bg-gradient-to-br from-white via-emerald-50/60 to-white shadow-md ring-1 ring-emerald-500/10'
                    : 'border border-[#DDE8E1] bg-white shadow-xs hover:shadow-xl hover:border-[#087A4B]'
                }`}
              >
                {/* Decorative corner accent for featured card */}
                {isFeatured && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#087A4B]/15 via-emerald-300/10 to-transparent rounded-tr-3xl pointer-events-none" />
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 shadow-md ${
                      isFeatured
                        ? 'bg-[#063D2A] text-[#D7A928] group-hover:scale-110'
                        : 'bg-gradient-to-br from-[#EFF8F2] to-emerald-100 text-[#087A4B] group-hover:bg-[#063D2A] group-hover:text-[#D7A928]'
                    }`}>
                      {getIcon(srv.iconName)}
                    </div>
                    {srv.isPopular && (
                      <span className="rounded-full bg-gradient-to-r from-[#D7A928]/30 to-amber-200/50 px-3.5 py-1 text-[11px] font-black text-[#063D2A] border border-[#D7A928]/40 shadow-2xs">
                        ⭐ Popular
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-extrabold text-[#14251D] group-hover:text-[#087A4B] transition-colors leading-snug">
                    {t(srv.titleKey)}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-[#637069] leading-relaxed font-normal">
                    {t(srv.descriptionKey)}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#DDE8E1]/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#637069]">Oromia Extension</span>
                  <Link
                    to="/services"
                    className="flex items-center gap-1.5 text-xs font-extrabold text-[#063D2A] group-hover:text-[#087A4B] transition-colors"
                  >
                    <span>{t('service_action')}</span>
                    <ArrowRight className="h-4 w-4 text-[#D7A928] transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
