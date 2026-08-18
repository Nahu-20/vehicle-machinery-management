import React from 'react';
import { Publication } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { openResourceDownload } from '../../services/resourceService';
import {
  Download,
  Eye,
  Calendar,
  Sparkles,
  CheckCircle2,
  FileText,
  FileCheck,
  Languages,
} from 'lucide-react';

interface FeaturedResourceSpotlightProps {
  publication: Publication;
  onQuickPreview: (pub: Publication) => void;
}

export const FeaturedResourceSpotlight: React.FC<FeaturedResourceSpotlightProps> = ({
  publication,
  onQuickPreview,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    const title = t(publication.titleKey) || publication.defaultTitle || 'Publication';
    const opened = await openResourceDownload(publication.id, publication.downloadUrl);
    showToast(
      opened
        ? t('demo_download_notice') || 'Opening official document…'
        : 'Download link is not available yet for this item.',
      opened ? 'success' : 'info',
      title
    );
  };

  const title = t(publication.titleKey) || publication.defaultTitle;
  const description = t(publication.descriptionKey) || publication.defaultDescription;

  return (
    <div className="rounded-3xl border border-[#D5E8D0] dark:border-white/10 bg-gradient-to-br from-white via-[#F6FBF6] to-[#EEF8EC] dark:from-[#111B15] dark:via-[#0F2218] dark:to-[#0D1812] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
        {/* Left Visual Preview / Cover */}
        <div className="lg:col-span-4 relative group">
          <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-[#D5E8D0] dark:border-white/10 bg-[#075B36]">
            {publication.coverImage ? (
              <img
                src={publication.coverImage}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#075B36] text-white">
                <FileText className="h-16 w-16 text-[#A3E635]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#A3E635] text-[#053B23] text-[11px] font-black w-fit mb-2 shadow-xs">
                <Sparkles className="h-3 w-3" />
                <span>Season Spotlight</span>
              </span>
              <div className="text-xs font-bold text-emerald-200">
                {publication.pagesOrDuration || 'Complete Edition'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Details & Action Buttons */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#075B36] text-white text-xs font-black uppercase tracking-wider">
              {publication.format} • {publication.fileSize}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-bold border border-[#D5E8D0] dark:border-white/10">
              {publication.version || 'Official Bureau Release'}
            </span>
            <span className="text-xs text-[#56635B] dark:text-white/60 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
              {publication.updatedDate || publication.publishedDate}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight leading-snug">
              {title}
            </h2>
            <p className="text-sm text-[#56635B] dark:text-white/80 leading-relaxed font-normal">
              {description}
            </p>
          </div>

          {/* Quick Table of Contents / Highlights Preview */}
          {publication.tableOfContents && publication.tableOfContents.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-[#E2EFE0] dark:border-white/10 space-y-2.5">
              <div className="text-xs font-extrabold text-[#0A1912] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                <span>Key Included Sections & Guidelines</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#56635B] dark:text-white/70">
                {publication.tableOfContents.slice(0, 4).map((chapter, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
                    <span className="truncate">{chapter}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Badges & Download Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E2EFE0] dark:border-white/10">
            <div className="flex items-center gap-2 text-xs text-[#56635B] dark:text-white/70 font-semibold">
              <Languages className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
              <span>{publication.language}</span>
              <span className="text-gray-300 dark:text-white/20">•</span>
              <span>{publication.downloadsCount?.toLocaleString() || '12,000+'} Downloads</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuickPreview(publication)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/10 text-xs font-black text-[#075B36] dark:text-[#A3E635] border border-[#D5E8D0] dark:border-white/10 hover:bg-[#F0F7EE] transition-all shadow-xs"
              >
                <Eye className="h-4 w-4" />
                <span>Full Dossier & Index</span>
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#075B36] hover:bg-[#054829] text-white text-xs font-black shadow-md transition-all group"
              >
                <Download className="h-4 w-4 text-[#A3E635] group-hover:-translate-y-0.5 transition-transform" />
                <span>Download {publication.format} ({publication.fileSize})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
