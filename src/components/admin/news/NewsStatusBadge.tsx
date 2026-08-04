import React from 'react';
import { NewsStatus } from '../../../types/news';
import { FileText, Eye, CheckCircle2, EyeOff, Archive } from 'lucide-react';

interface NewsStatusBadgeProps {
  status: NewsStatus;
}

export const NewsStatusBadge: React.FC<NewsStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'draft':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Draft</span>
        </span>
      );
    case 'review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>In Review</span>
        </span>
      );
    case 'published':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Published</span>
        </span>
      );
    case 'unpublished':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <EyeOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Unpublished</span>
        </span>
      );
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
          <Archive className="w-3.5 h-3.5 text-gray-500" />
          <span>Archived</span>
        </span>
      );
    default:
      return null;
  }
};
