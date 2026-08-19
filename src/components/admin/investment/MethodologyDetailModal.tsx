import React from 'react';
import { InvestmentMethodology } from '../../../types/investment';
import { BookOpen, X, ShieldCheck, Layers, AlertCircle, Pencil, Trash2 } from 'lucide-react';

interface MethodologyDetailModalProps {
  methodology: InvestmentMethodology | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MethodologyDetailModal({
  methodology,
  onClose,
  onEdit,
  onDelete,
}: MethodologyDetailModalProps) {
  if (!methodology) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 text-xs">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider block">
              Methodology ID: {methodology.methodologyId}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{methodology.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              methodology.verificationStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="capitalize">{methodology.verificationStatus}</span>
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase">
            {methodology.status || 'unknown'}
          </span>
          {methodology.versionLabel && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {methodology.versionLabel}
            </span>
          )}
        </div>

        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{methodology.description}</p>

        {(methodology.components || []).length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Components
            </span>
            <ul className="space-y-1.5">
              {methodology.components.map((c, idx) => (
                <li
                  key={`${c.name}-${idx}`}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {c.name}
                    {c.weight != null ? (
                      <span className="ml-2 font-mono text-[10px] text-blue-700 dark:text-blue-300">
                        weight {c.weight}
                      </span>
                    ) : null}
                  </div>
                  {c.description && (
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{c.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {methodology.calculationNotes && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Calculation notes</span>
            <p className="mt-1 text-slate-700 dark:text-slate-300">{methodology.calculationNotes}</p>
          </div>
        )}

        {methodology.limitations && (
          <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                Limitations
              </span>
              <p className="mt-0.5 text-amber-900 dark:text-amber-100">{methodology.limitations}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-700 hover:bg-blue-800 text-white"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-300 text-rose-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
