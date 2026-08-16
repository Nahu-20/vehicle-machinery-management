import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockPublications } from '../../data/mockData';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { StaggerContainer, StaggerItem } from '../common/scroll/StaggerContainer';
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
    <section id="resources" className="relative bg-[#F6F7F3] dark:bg-[#0B1912] py-16 lg:py-24 border-b border-[#E2E8E3] dark:border-[#183327] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <AgriPillBadge variant="lime" icon={<Sparkles className="h-3.5 w-3.5 text-[#0A1912]" />}>
              Open Extension Publications & Manuals
            </AgriPillBadge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111310] dark:text-white tracking-tight leading-tight">
              {t('resources_title')}
            </h2>

            <p className="text-base text-[#56635B] dark:text-[#A7F3D0]/80 leading-relaxed font-normal">
              {t('resources_subtitle')}
            </p>
          </div>

          <Link
            to="/resources"
            className="inline-flex items-center gap-2.5 rounded-full bg-[#0A1912] dark:bg-emerald-800 text-white hover:bg-[#063D2A] px-6 py-3.5 text-sm font-extrabold transition-all duration-200 shadow-sm shrink-0"
          >
            <span>Browse Full Library</span>
            <ArrowUpRight className="h-4 w-4 text-[#A3E635]" />
          </Link>
        </div>

        {/* 6 Resource Cards Grid */}
        <StaggerContainer staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPublications.map((pub) => (
            <StaggerItem key={pub.id}>
              <div
                className="group flex flex-col justify-between h-full rounded-2xl border border-[#E2E8E3] dark:border-[#183327] bg-white dark:bg-[#0E241B] p-7 shadow-xs hover:border-[#087A4B] dark:hover:border-[#A3E635] hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F7F3] dark:bg-[#122E22] text-[#087A4B] dark:text-[#A3E635] group-hover:bg-[#A3E635] group-hover:text-[#0A1912] transition-colors duration-300">
                      {getResourceIcon(pub.type)}
                    </div>
                    <span className="rounded-full border border-[#E2E8E3] dark:border-[#183327] bg-[#F6F7F3] dark:bg-[#122E22] px-3 py-1 text-xs font-semibold text-[#56635B] dark:text-[#94A39A]">
                      {pub.format} • {pub.fileSize || 'PDF'}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-[#111310] dark:text-white group-hover:text-[#087A4B] dark:group-hover:text-[#A3E635] transition-colors">
                    {t(pub.titleKey)}
                  </h3>

                  <p className="mt-2 text-sm text-[#56635B] dark:text-[#94A39A] leading-relaxed">
                    {t(pub.descriptionKey)}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E2E8E3] dark:border-[#183327] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#087A4B] dark:text-[#A3E635] bg-[#F6F7F3] dark:bg-[#122E22] px-3 py-1 rounded-full border border-[#E2E8E3] dark:border-[#183327]">
                    {pub.language}
                  </span>
                  <a
                    href={pub.downloadUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0A1912] hover:bg-[#063D2A] text-white px-4.5 py-2.5 text-xs font-extrabold transition-all duration-200 shadow-sm"
                  >
                    <Download className="h-4 w-4 text-[#A3E635]" />
                    <span>{t('res_download')}</span>
                  </a>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

