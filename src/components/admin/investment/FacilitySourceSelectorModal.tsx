import React, { useState } from 'react';
import {
  FileText,
  Search,
  X,
  ShieldCheck,
  ShieldAlert,
  Building,
  Calendar,
  Check,
  ExternalLink,
} from 'lucide-react';
import { InvestmentSource } from '../../../types/investment';

interface FacilitySourceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSources: InvestmentSource[];
  selectedSourceIds: string[];
  onToggleSource: (sourceId: string) => void;
  onInspectSource?: (source: InvestmentSource) => void;
}

export function FacilitySourceSelectorModal({
  isOpen,
  onClose,
  availableSources,
  selectedSourceIds,
  onToggleSource,
  onInspectSource,
}: FacilitySourceSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredSources = availableSources.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.title?.toLowerCase().includes(term) ||
      s.organization?.toLowerCase().includes(term) ||
      s.sourceId?.toLowerCase().includes(term) ||
      s.referencePeriod?.toLowerCase().includes(term)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-selector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <div>
              <h3
                id="source-selector-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Attach Authoritative Data Sources
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Select verified data sources to substantiate this infrastructure facility.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close source selector"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, organization, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* List of Sources */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredSources.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-1">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-semibold">No data sources found</p>
              <p className="text-[11px]">Try adjusting your search criteria or add new sources in Source Management.</p>
            </div>
          ) : (
            filteredSources.map((source) => {
              const isSelected = selectedSourceIds.includes(source.sourceId);
              const isVerified = source.verificationStatus === 'verified';

              return (
                <div
                  key={source.sourceId}
                  className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                        {source.sourceId}
                      </span>
                      {isVerified ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug">
                      {source.title}
                    </h4>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {source.organization || 'OAB'}
                      </span>
                      {source.referencePeriod && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {source.referencePeriod}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 shrink-0">
                    {onInspectSource && (
                      <button
                        type="button"
                        onClick={() => onInspectSource(source)}
                        className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="Inspect full source metadata"
                      >
                        Inspect
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleSource(source.sourceId)}
                      className={`px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3" /> Attached
                        </>
                      ) : (
                        'Attach'
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedSourceIds.length} source{selectedSourceIds.length === 1 ? '' : 's'} currently attached
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
