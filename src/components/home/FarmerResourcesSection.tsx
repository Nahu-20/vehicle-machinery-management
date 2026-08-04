import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockPublications } from '../../data/mockData';
import {
  FileText,
  Calendar,
  BookOpen,
  Shield,
  Video,
  FileCheck,
  Download,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FarmerResourcesSection: React.FC = () => {
  const { t } = useLanguage();

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'calendar': return <Calendar className="h-6 w-6" />;
      case 'guidance': return <BookOpen className="h-6 w-6" />;
      case 'manual': return <FileText className="h-6 w-6" />;
      case 'policy': return <Shield className="h-6 w-6" />;
      case 'video': return <Video className="h-6 w-6" />;
      case 'form': default: return <FileCheck className="h-6 w-6" />;
    }
  };

  return (
    <section id="resources" className="relative bg-gradient-to-b from-white via-[#EFF8F2] to-white dark:from-[#0B1912] dark:via-[#0E2218] dark:to-[#0B1912] py-16 lg:py-24 border-b border-[#DDE8E1] dark:border-emerald-900/60 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/15 to-emerald-100 dark:from-[#087A4B]/30 dark:to-emerald-900/50 border border-[#087A4B]/25 text-[#087A4B] dark:text-emerald-300 text-xs font-black mb-3 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
              <span>Open Extension Publications & Manuals</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] dark:text-emerald-100 tracking-tight">
              {t('resources_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] dark:text-emerald-300/80 mt-2 max-w-2xl font-medium">
              {t('resources_subtitle')}
            </p>
          </div>
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-[#12281D] border border-[#DDE8E1] dark:border-emerald-800/60 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-[#063D2A] dark:text-emerald-200 hover:bg-[#063D2A] hover:text-white transition-all shadow-xs shrink-0 hover:shadow-md transform hover:-translate-y-0.5"
          >
            <span>Browse Full Library</span>
            <ArrowUpRight className="h-4 w-4 text-[#D7A928]" />
          </Link>
        </div>

        {/* 6 Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {mockPublications.map((pub) => (
            <div
              key={pub.id}
              className="group flex flex-col justify-between rounded-3xl border border-[#DDE8E1] dark:border-emerald-800/60 bg-white dark:bg-gradient-to-br dark:from-[#0D261B] dark:via-[#133425] dark:to-[#0A1F16] p-7 shadow-xs hover:shadow-xl hover:border-[#087A4B] dark:hover:border-emerald-400 dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] card-hover transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EFF8F2] to-emerald-100 dark:from-[#183B2A] dark:to-[#204E37] text-[#087A4B] dark:text-emerald-300 group-hover:bg-[#063D2A] dark:group-hover:bg-gradient-to-br dark:group-hover:from-emerald-500 dark:group-hover:to-emerald-700 group-hover:text-[#D7A928] dark:group-hover:text-white transition-all shadow-sm">
                    {getResourceIcon(pub.type)}
                  </div>
                  <span className="rounded-xl border border-[#DDE8E1] dark:border-emerald-700/60 bg-[#FAFAF7] dark:bg-[#153828] px-3.5 py-1 text-xs font-black text-[#637069] dark:text-emerald-200">
                    {pub.format} • {pub.fileSize || 'PDF'}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-black text-[#14251D] dark:text-emerald-50 group-hover:text-[#087A4B] dark:group-hover:text-emerald-300 transition-colors leading-snug">
                  {t(pub.titleKey)}
                </h3>

                <p className="mt-2.5 text-xs sm:text-sm text-[#637069] dark:text-emerald-200/80 leading-relaxed font-normal">
                  {t(pub.descriptionKey)}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#DDE8E1] dark:border-emerald-800/50 flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#087A4B] dark:text-emerald-300 bg-[#EFF8F2] dark:bg-[#153828] px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-700/60">
                  {pub.language}
                </span>
                <a
                  href={pub.downloadUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#087A4B] hover:bg-[#063D2A] dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-800 dark:hover:from-emerald-500 dark:hover:to-emerald-700 px-4.5 py-2.5 text-xs font-black text-white shadow-md dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4 text-[#D7A928]" />
                  <span>{t('res_download')}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
