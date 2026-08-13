import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockServices } from '../../data/mockData';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { StaggerContainer, StaggerItem } from '../common/scroll/StaggerContainer';
import {
  Sprout,
  TrendingUp,
  Wheat,
  Beef,
  Droplets,
  PackageCheck,
  ArrowUpRight,
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
    <section id="services" className="relative bg-[#F6F7F3] dark:bg-[#0B1912] py-16 lg:py-24 border-b border-[#E2E8E3] dark:border-[#183327] transition-colors duration-200">
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row with Bento Title & CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <AgriPillBadge variant="lime" icon={<Sparkles className="h-3.5 w-3.5 text-[#0A1912]" />}>
              {t('services_tagline')}
            </AgriPillBadge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111310] dark:text-white tracking-tight leading-tight">
              {t('services_title')}
            </h2>

            <p className="text-base text-[#56635B] dark:text-[#A7F3D0]/80 leading-relaxed font-normal">
              {t('services_subtitle')}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              to="/services"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#0A1912] dark:bg-emerald-800 text-white hover:bg-[#063D2A] px-6 py-3.5 text-sm font-extrabold transition-all duration-200 shadow-sm"
            >
              <span>{t('all_services_btn')}</span>
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center rounded-full bg-[#A3E635] text-[#0A1912] hover:bg-[#92D022] h-12 w-12 transition-all duration-200"
              aria-label="View All Services"
            >
              <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* Bento Grid Composition (2 Columns on MD, 3 Columns on LG) */}
        <StaggerContainer staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockServices.map((srv, index) => {
            const isFeatured = index === 0;

            return (
              <StaggerItem key={srv.id} className={isFeatured ? 'md:col-span-2 lg:col-span-1' : ''}>
                <div
                  className={`group relative flex flex-col justify-between h-full rounded-2xl p-7 transition-all duration-300 border ${
                    isFeatured
                      ? 'bg-white dark:bg-[#0E241B] border-[#A3E635] shadow-sm'
                      : 'bg-white dark:bg-[#0E241B] border-[#E2E8E3] dark:border-[#183327] hover:border-[#087A4B] dark:hover:border-[#A3E635] hover:-translate-y-1'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F7F3] dark:bg-[#122E22] text-[#087A4B] dark:text-[#A3E635] group-hover:bg-[#A3E635] group-hover:text-[#0A1912] transition-colors duration-300">
                        {getIcon(srv.iconName)}
                      </div>
                      {srv.isPopular && (
                        <AgriPillBadge variant="lime">
                          Featured
                        </AgriPillBadge>
                      )}
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-[#111310] dark:text-white group-hover:text-[#087A4B] dark:group-hover:text-[#A3E635] transition-colors">
                      {t(srv.titleKey)}
                    </h3>

                    <p className="mt-2 text-sm text-[#56635B] dark:text-[#94A39A] leading-relaxed">
                      {t(srv.descriptionKey)}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#E2E8E3] dark:border-[#183327] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#56635B] dark:text-emerald-400">Oromia Agriculture</span>
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#063D2A] dark:text-[#A3E635] group-hover:underline"
                    >
                      <span>{t('service_action')}</span>
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
};

