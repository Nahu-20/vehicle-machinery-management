import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Program } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  X,
  Layers,
  MapPin,
  Users,
  CheckCircle2,
  TrendingUp,
  Building2,
  Calendar,
  PhoneCall,
  Handshake,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProgramDossierModalProps {
  program: Program | null;
  onClose: () => void;
}

export const ProgramDossierModal: React.FC<ProgramDossierModalProps> = ({ program, onClose }) => {
  const { t } = useLanguage();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (program) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [program, onClose]);

  if (!program) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm">
        {/* Backdrop dismiss */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#111613] rounded-3xl shadow-2xl border border-[#E2EFE0] dark:border-white/10 overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#075B36] to-[#0A2618] text-white flex items-start justify-between gap-4 shrink-0">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#A3E635] text-xs font-black uppercase tracking-wider">
                  {program.badgeKey || 'Flagship Program'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-900/60 text-white text-xs font-semibold">
                  {program.categoryKey}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {t(program.titleKey)}
              </h2>
              {program.directorate && (
                <div className="flex items-center gap-2 text-xs text-emerald-200">
                  <Building2 className="h-4 w-4 text-[#A3E635]" />
                  <span>{program.directorate}</span>
                </div>
              )}
            </div>

            <button
              id="btn-close-dossier-modal"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Scrollable Content */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-[#17211B] dark:text-white">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 rounded-2xl overflow-hidden shadow-md aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                <ImageWithFallback
                  src={program.imageUrl}
                  alt={t(program.titleKey)}
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="md:col-span-7 space-y-4">
                <h3 className="text-lg font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Program Executive Summary</span>
                </h3>
                <p className="text-sm sm:text-base text-[#46534B] dark:text-white/80 leading-relaxed">
                  {t(program.descriptionKey)}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E8EFE5] dark:border-white/10">
                  <div className="bg-[#F6FAF4] dark:bg-white/5 p-3 rounded-xl">
                    <span className="text-xs text-[#56635B] dark:text-white/60 font-semibold block">Target Geographic Scope</span>
                    <span className="text-xs sm:text-sm font-black text-[#075B36] dark:text-white mt-0.5 block">{program.targetArea}</span>
                  </div>
                  <div className="bg-[#F6FAF4] dark:bg-white/5 p-3 rounded-xl">
                    <span className="text-xs text-[#56635B] dark:text-white/60 font-semibold block">Beneficiaries Reached</span>
                    <span className="text-xs sm:text-sm font-black text-[#075B36] dark:text-white mt-0.5 block">{program.beneficiaries}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Objectives */}
            {program.keyObjectives && program.keyObjectives.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#075B36] dark:text-[#A3E635]" />
                  <span>{t('programs_objectives_title')}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {program.keyObjectives.map((obj, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#F8FAF7] dark:bg-white/5 border border-[#E5EFE2] dark:border-white/10 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#075B36] text-[#A3E635] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-[#3E4D43] dark:text-white/90 leading-snug font-medium">
                        {obj}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Interventions */}
            {program.interventions && program.interventions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wide flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#075B36] dark:text-[#A3E635]" />
                  <span>{t('programs_interventions_title')}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {program.interventions.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-[#E5EFE2] dark:border-white/10 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-[#46534B] dark:text-white/80 font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-Year Milestones */}
            {program.milestones && program.milestones.length > 0 && (
              <div className="space-y-4 bg-[#F5F9F3] dark:bg-white/5 p-6 rounded-2xl border border-[#E2EFE0] dark:border-white/10">
                <h3 className="text-base sm:text-lg font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#075B36] dark:text-[#A3E635]" />
                  <span>{t('programs_milestones_title')}</span>
                </h3>
                <div className="space-y-4">
                  {program.milestones.map((m, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-[#075B36] dark:text-white font-black">{m.year}: {m.target}</span>
                        <span className="text-[#075B36] dark:text-[#A3E635] font-black">{m.progress}% Completed</span>
                      </div>
                      <div className="w-full bg-[#E5EFE2] dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#075B36] dark:bg-[#A3E635] h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commodities & Target Zones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {program.commodities && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wider">
                    {t('programs_key_commodities')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {program.commodities.map((comm, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#EBF5E8] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-bold"
                      >
                        {comm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {program.partners && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wider">
                    {t('programs_partners')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {program.partners.map((partner, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#F0F4F1] dark:bg-white/10 text-[#3E4D43] dark:text-gray-300 text-xs font-semibold"
                      >
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* How Farmers Participate Guide */}
            {program.enrollmentSteps && program.enrollmentSteps.length > 0 && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#075B36] to-[#0A2618] text-white space-y-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#A3E635]" />
                  <h3 className="text-base sm:text-lg font-black tracking-wide">
                    {t('programs_enrollment_title')}
                  </h3>
                </div>
                <ol className="space-y-2.5">
                  {program.enrollmentSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-emerald-100 font-medium">
                      <span className="w-5 h-5 rounded-full bg-[#A3E635] text-[#0A1912] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
                    <PhoneCall className="h-4 w-4 text-[#A3E635]" />
                    <span>Advisory Toll-Free Hotline: <strong>8844</strong></span>
                  </div>
                  <Link
                    to="/contact"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[#A3E635] hover:bg-[#8CD823] text-[#0A1912] font-extrabold text-xs transition-colors"
                  >
                    Contact Local Directorate
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-6 bg-[#F8FAF7] dark:bg-[#0C120E] border-t border-[#E8EFE5] dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
            <button
              id="btn-close-modal-bottom"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#075B36] hover:bg-[#06472A] text-white font-black text-xs sm:text-sm transition-colors"
            >
              {t('programs_modal_close')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
