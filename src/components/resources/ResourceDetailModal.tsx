import React, { useState } from 'react';
import { Publication } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Download,
  Calendar,
  Layers,
  FileCheck,
  CheckCircle2,
  Share2,
  Printer,
  Building,
  UserCheck,
  Tag,
  Languages,
  BookOpen,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ResourceDetailModalProps {
  publication: Publication | null;
  onClose: () => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  publication,
  onClose,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!publication) return null;

  const title = t(publication.titleKey) || publication.defaultTitle || 'Publication Dossier';
  const description = t(publication.descriptionKey) || publication.defaultDescription;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      showToast(
        t('demo_download_notice') || 'File downloaded successfully to your device.',
        'success',
        title
      );
    }, 1200);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    showToast('Direct resource link copied to clipboard!', 'info', title);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#111813] border border-[#D5E8D0] dark:border-white/10 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col text-[#111310] dark:text-white">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#053B23] to-[#075B36] text-white p-6 sm:p-8 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#A3E635] text-[#053B23] text-xs font-black uppercase tracking-wider">
                {publication.format} • {publication.fileSize}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold">
                {publication.version || 'v2026.1 Official'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {title}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Overview & Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#075B36] dark:text-[#A3E635] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Official Executive Summary</span>
            </h3>
            <p className="text-sm text-[#56635B] dark:text-white/80 leading-relaxed">
              {publication.previewSummary || description}
            </p>
          </div>

          {/* Form instructions if available */}
          {publication.formInstructions && publication.formInstructions.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5" />
                <span>Submission Instructions for Applicants</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-200/90 font-medium">
                {publication.formInstructions.map((inst, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold">•</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Table of Contents / Key Chapters */}
          {publication.tableOfContents && publication.tableOfContents.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#F6F7F3] dark:bg-white/5 border border-[#E2EFE0] dark:border-white/10 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0A1912] dark:text-white flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                <span>Document Table of Contents & Chapter Index</span>
              </h3>
              <div className="space-y-2">
                {publication.tableOfContents.map((chapter, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-[#56635B] dark:text-white/80 p-2 rounded-xl bg-white dark:bg-[#152019] border border-gray-100 dark:border-white/5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
                    <span>{chapter}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F6FBF6] dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-[#56635B] dark:text-white/60">Publishing Directorate:</span>
              <div className="font-extrabold text-[#0A1912] dark:text-white">
                {publication.authorOrOffice || 'Oromia Agricultural Bureau'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#56635B] dark:text-white/60">Document Length / Format:</span>
              <div className="font-extrabold text-[#0A1912] dark:text-white">
                {publication.pagesOrDuration || 'Complete Field Manual'} ({publication.fileSize})
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#56635B] dark:text-white/60">Supported Languages:</span>
              <div className="font-extrabold text-[#0A1912] dark:text-white flex items-center gap-1">
                <Languages className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                <span>{publication.language}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#56635B] dark:text-white/60">Release & Revision Date:</span>
              <div className="font-extrabold text-[#0A1912] dark:text-white flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                <span>{publication.updatedDate || publication.publishedDate || '2026 Edition'}</span>
              </div>
            </div>
          </div>

          {/* Target Audience & Tags */}
          {publication.targetAudience && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#56635B] dark:text-white/60 uppercase tracking-wider">
                Intended Audience:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {publication.targetAudience.map((aud, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#EAF5EE] dark:bg-emerald-950/60 text-[#075B36] dark:text-[#A3E635] text-xs font-bold border border-[#D5E8D0] dark:border-white/10"
                  >
                    {aud}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#F6F7F3] dark:bg-[#0E1510] border-t border-[#E2EFE0] dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/10 text-xs font-bold text-[#0A1912] dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-100 transition-colors shadow-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied Link!' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/10 text-xs font-bold text-[#0A1912] dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-100 transition-colors shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-white/70 dark:hover:text-white transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#075B36] hover:bg-[#054829] text-white text-xs font-black shadow-md transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-[#A3E635]" />
              <span>
                {downloading
                  ? 'Preparing Download...'
                  : `Download ${publication.format} (${publication.fileSize})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
