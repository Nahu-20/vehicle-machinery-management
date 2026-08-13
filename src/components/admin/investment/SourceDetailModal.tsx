import React from 'react';
import { InvestmentSource } from '../../../types/investment';
import { FileText, X, ExternalLink, Calendar, Building, ShieldCheck, Tag } from 'lucide-react';

interface SourceDetailModalProps {
  source: InvestmentSource | null;
  onClose: () => void;
}

export function SourceDetailModal({ source, onClose }: SourceDetailModalProps) {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider block">
              Source ID: {source.sourceId}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              {source.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            source.verificationStatus === 'verified'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Status: <span className="capitalize">{source.verificationStatus}</span>
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
              <Building className="w-3 h-3 text-purple-600" /> Organization
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
              {source.organization || 'Not provided'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-600" /> Reference Period
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
              {source.referencePeriod?.label || source.referencePeriod?.startYear || 'Not provided'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
              <FileText className="w-3 h-3 text-purple-600" /> Document Title
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
              {source.documentTitle || 'Not provided'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
              <Tag className="w-3 h-3 text-purple-600" /> License
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">
              {source.license || 'Not provided'}
            </span>
          </div>
        </div>

        {/* URL / Reference Link */}
        {source.url && (
          <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300 block">External Document URL</span>
              <span className="font-mono text-[11px] text-purple-900 dark:text-purple-200 truncate block max-w-md">
                {source.url}
              </span>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Methodology Notes */}
        {source.methodologyNotes && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Methodology & Collector Notes</span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {source.methodologyNotes}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
