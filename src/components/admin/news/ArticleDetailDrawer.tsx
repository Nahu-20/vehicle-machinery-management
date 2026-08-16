import React from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '../../../types/news';
import { NewsStatusBadge } from './NewsStatusBadge';
import {
  X,
  History,
  FileText,
  User,
  Clock,
  CheckCircle2,
  EyeOff,
  Archive,
  Trash2,
  RotateCcw,
  Tag,
  Building2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface ArticleDetailDrawerProps {
  isOpen: boolean;
  article: NewsArticle | null;
  onClose: () => void;
}

export const ArticleDetailDrawer: React.FC<ArticleDetailDrawerProps> = ({
  isOpen,
  article,
  onClose,
}) => {
  const { getLocalizedText } = useLanguage();

  if (!isOpen || !article) return null;

  const titleStr = getLocalizedText(article.title);
  const excerptStr = getLocalizedText(article.excerpt);
  const officeStr = getLocalizedText(article.responsibleOffice);

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleString();
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <NewsStatusBadge status={article.status} />
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  v{article.version || 1}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                {titleStr || article.slug}
              </h2>
              <p className="text-xs text-slate-500 font-mono font-medium">/{article.slug}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Excerpt */}
            {excerptStr && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Excerpt
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {excerptStr}
                </p>
              </div>
            )}

            {/* Quick Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-500" /> Category
                </span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  {article.category}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" /> Office
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {officeStr || 'Oromia Bureau'}
                </span>
              </div>
            </div>

            {/* Actor Audit Trail Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Administrative Lifecycle & Actors
              </h3>

              <div className="space-y-2.5 font-medium">
                {/* Created */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-bold flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" /> Created
                    </span>
                    <span>{formatDate(article.createdAt)}</span>
                  </div>
                  <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{article.createdByName || article.createdByEmail || article.createdBy || 'Unknown'}</span>
                  </div>
                </div>

                {/* Updated */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Last Updated
                    </span>
                    <span>{formatDate(article.updatedAt)}</span>
                  </div>
                  <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{article.updatedByName || article.updatedByEmail || article.updatedBy || 'Unknown'}</span>
                  </div>
                </div>

                {/* Submitted for Review */}
                {article.submittedForReviewAt && (
                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 space-y-1">
                    <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                      <span className="font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Submitted for Review
                      </span>
                      <span>{formatDate(article.submittedForReviewAt)}</span>
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-amber-600" />
                      <span>{article.submittedForReviewByName || article.submittedForReviewByEmail || 'Unknown'}</span>
                    </div>
                  </div>
                )}

                {/* Published */}
                {article.publishedAt && (
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[11px]">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-emerald-600" />
                      <span>{article.publishedByName || article.publishedByEmail || article.publishedBy || 'Unknown'}</span>
                    </div>
                  </div>
                )}

                {/* Unpublished */}
                {article.unpublishedAt && (
                  <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/80 space-y-1">
                    <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-[11px]">
                      <span className="font-bold flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Unpublished
                      </span>
                      <span>{formatDate(article.unpublishedAt)}</span>
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-rose-600" />
                      <span>{article.unpublishedByName || article.unpublishedByEmail || 'Unknown'}</span>
                    </div>
                  </div>
                )}

                {/* Archived */}
                {article.archivedAt && (
                  <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 space-y-1">
                    <div className="flex items-center justify-between text-gray-700 dark:text-gray-300 text-[11px]">
                      <span className="font-bold flex items-center gap-1">
                        <Archive className="w-3 h-3" /> Archived
                      </span>
                      <span>{formatDate(article.archivedAt)}</span>
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-gray-500" />
                      <span>{article.archivedByName || article.archivedByEmail || 'Unknown'}</span>
                    </div>
                  </div>
                )}

                {/* Trashed */}
                {article.trashedAt && (
                  <div className="p-3 rounded-xl bg-red-100/70 dark:bg-red-950/50 border border-red-300 dark:border-red-800 space-y-1.5">
                    <div className="flex items-center justify-between text-red-800 dark:text-red-300 text-[11px]">
                      <span className="font-bold flex items-center gap-1">
                        <Trash2 className="w-3 h-3 text-red-600" /> Moved to Trash
                      </span>
                      <span>{formatDate(article.trashedAt)}</span>
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-red-600" />
                      <span>{article.trashedByName || article.trashedByEmail || 'Unknown'}</span>
                    </div>
                    {article.trashReason && (
                      <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg text-slate-700 dark:text-slate-300 text-[11px] italic">
                        "{article.trashReason}"
                      </div>
                    )}
                  </div>
                )}

                {/* Restored */}
                {article.restoredAt && (
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/80 space-y-1">
                    <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-[11px]">
                      <span className="font-bold flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Restored
                      </span>
                      <span>{formatDate(article.restoredAt)}</span>
                    </div>
                    <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-blue-600" />
                      <span>{article.restoredByName || article.restoredByEmail || 'Unknown'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
            <Link
              to={`/news/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" /> Public View
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              to={`/admin/news/${article.slug}/history`}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#075D3A] hover:bg-emerald-800 text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" /> Full Audit History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
