import React from 'react';
import { InvestmentMethodology } from '../../../types/investment';
import { BookOpen, X, ShieldCheck, Layers, AlertCircle, Sparkles } from 'lucide-react';

interface MethodologyDetailModalProps {
  methodology: InvestmentMethodology | null;
  onClose: () => void;
}

export function MethodologyDetailModal({ methodology, onClose }: MethodologyDetailModalProps) {
  if (!methodology) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider block">
              Methodology ID: {methodology.methodologyId}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              {methodology.title}
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

        {/* Verification Status & Version Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            methodology.verificationStatus === 'verified'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Verification Status: <span className="capitalize">{methodology.verificationStatus}</span>
          </span>

          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono">
            Version: {methodology.versionLabel || '1.0'}
          </span>
        </div>

        {/* Description */}
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Description & Scope</span>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
            {methodology.description || 'No detailed methodology description provided.'}
          </p>
        </div>

        {/* Model Components / Weights if defined */}
        {methodology.components && methodology.components.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Analytical Components & Weight Distribution
            </span>

            <div className="space-y-1.5">
              {methodology.components.map((comp, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{comp.name}</span>
                    {comp.description && <p className="text-[10px] text-slate-400">{comp.description}</p>}
                  </div>
                  {comp.weight !== undefined && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold font-mono text-[11px]">
                      {(comp.weight * 100).toFixed(0)}% Weight
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limitations & Assumptions */}
        {methodology.limitations && (
          <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Limitations & Known Constraints
            </span>
            <p className="text-[11px] leading-relaxed">{methodology.limitations}</p>
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
