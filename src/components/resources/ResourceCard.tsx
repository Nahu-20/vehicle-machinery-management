import React from 'react';
import { Publication } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  Download,
  Eye,
  FileText,
  Calendar,
  BookOpen,
  Shield,
  Video,
  FileCheck,
  Languages,
  PlayCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface ResourceCardProps {
  publication: Publication;
  onPreview: (pub: Publication) => void;
  onPlayVideo?: (pub: Publication) => void;
  viewMode?: 'grid' | 'list';
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  publication,
  onPreview,
  onPlayVideo,
  viewMode = 'grid',
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const title = t(publication.titleKey) || publication.defaultTitle || 'Publication';
    showToast(
      t('demo_download_notice') || 'Downloading official document...',
      'success',
      title
    );
  };

  const getFormatBadgeStyle = (format: string) => {
    switch (format?.toUpperCase()) {
      case 'MP4':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
      case 'DOCX':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
      case 'XLSX':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      case 'PDF':
      default:
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
    }
  };

  const getCategoryIcon = (category?: string, type?: string) => {
    if (type === 'video' || formatIsVideo) return <Video className="h-5 w-5" />;
    switch (category) {
      case 'crop':
        return <Calendar className="h-5 w-5" />;
      case 'pest':
        return <Shield className="h-5 w-5" />;
      case 'livestock':
        return <BookOpen className="h-5 w-5" />;
      case 'irrigation':
        return <FileText className="h-5 w-5" />;
      case 'ftc':
        return <GraduationCap className="h-5 w-5" />;
      case 'form':
        return <FileCheck className="h-5 w-5" />;
      case 'policy':
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatIsVideo = publication.format === 'MP4' || publication.type === 'video';
  const title = t(publication.titleKey) || publication.defaultTitle;
  const description = t(publication.descriptionKey) || publication.defaultDescription;

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onPreview(publication)}
        className="group cursor-pointer rounded-2xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#111813] p-4 sm:p-5 hover:border-[#075B36] dark:hover:border-[#A3E635] hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] dark:bg-emerald-950/60 text-[#075B36] dark:text-[#A3E635]">
            {getCategoryIcon(publication.category, publication.type)}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getFormatBadgeStyle(
                  publication.format
                )}`}
              >
                {publication.format}
              </span>
              <span className="text-[11px] font-bold text-[#56635B] dark:text-white/60">
                {publication.fileSize}
              </span>
              <span className="text-gray-300 dark:text-white/20">•</span>
              <span className="text-[11px] text-[#56635B] dark:text-white/60">
                {publication.language}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-[#0A1912] dark:text-white group-hover:text-[#075B36] dark:group-hover:text-[#A3E635] transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-xs text-[#56635B] dark:text-white/70 line-clamp-1">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-white/5">
          {formatIsVideo ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayVideo ? onPlayVideo(publication) : onPreview(publication);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs transition-all"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Watch Video</span>
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#075B36] hover:bg-[#054829] text-white text-xs font-black shadow-xs transition-all"
            >
              <Download className="h-3.5 w-3.5 text-[#A3E635]" />
              <span>{t('res_download') || 'Download'}</span>
            </button>
          )}

          <button
            onClick={() => onPreview(publication)}
            className="p-2 rounded-xl text-gray-400 hover:text-[#075B36] dark:hover:text-[#A3E635] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div
      onClick={() => onPreview(publication)}
      className="group cursor-pointer rounded-2xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#111813] p-5 hover:border-[#075B36] dark:hover:border-[#A3E635] hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
    >
      {/* Top Banner & Header Icon */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] dark:bg-emerald-950/60 text-[#075B36] dark:text-[#A3E635] group-hover:scale-105 transition-transform">
            {getCategoryIcon(publication.category, publication.type)}
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getFormatBadgeStyle(
                publication.format
              )}`}
            >
              {publication.format} • {publication.fileSize || 'PDF'}
            </span>
            {publication.featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#A3E635]/20 text-[#075B36] dark:text-[#A3E635] text-[9px] font-black">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Featured</span>
              </span>
            )}
          </div>
        </div>

        {/* Title and Summary */}
        <div className="mt-4 space-y-2">
          <h3 className="text-sm sm:text-base font-extrabold text-[#0A1912] dark:text-white group-hover:text-[#075B36] dark:group-hover:text-[#A3E635] transition-colors leading-snug line-clamp-2">
            {title}
          </h3>
          <p className="text-xs text-[#56635B] dark:text-white/70 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>

        {/* Tags preview */}
        {publication.tags && publication.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {publication.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#F6F7F3] dark:bg-white/5 text-[#56635B] dark:text-white/60 text-[10px] font-bold"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Action Bar */}
      <div className="pt-3 border-t border-[#E2EFE0] dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-[#56635B] dark:text-white/60 truncate">
          <Languages className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0" />
          <span className="truncate">{publication.language}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(publication);
            }}
            className="p-2 rounded-xl text-gray-500 hover:text-[#075B36] dark:hover:text-[#A3E635] hover:bg-[#F0F7EE] dark:hover:bg-white/10 transition-colors"
            title="Read Full Dossier"
          >
            <Eye className="h-4 w-4" />
          </button>

          {formatIsVideo ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayVideo ? onPlayVideo(publication) : onPreview(publication);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs transition-all"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Watch</span>
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#075B36] hover:bg-[#054829] text-white text-xs font-black shadow-xs transition-all group/btn"
            >
              <Download className="h-3.5 w-3.5 text-[#A3E635] group-hover/btn:-translate-y-0.5 transition-transform" />
              <span>{t('res_download') || 'Download'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
