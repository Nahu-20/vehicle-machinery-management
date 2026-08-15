import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Program } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { AgriPillBadge } from '../common/AgriPillBadge';
import {
  Layers,
  MapPin,
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ProgramCardProps {
  program: Program;
  onOpenDossier: (program: Program) => void;
  index: number;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onOpenDossier, index }) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
      id={`program-card-${program.id}`}
      className="bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.04)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:border-[#74d62c]/50"
    >
      {/* Top Image & Badge Header */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <ImageWithFallback
          src={program.imageUrl}
          alt={t(program.titleKey)}
          containerClassName="h-full w-full"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          {program.badgeKey && (
            <span className="px-3 py-1 rounded-full bg-[#075B36] text-white text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-md">
              {program.badgeKey}
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${
            program.status === 'active'
              ? 'bg-[#A3E635] text-[#0A1912]'
              : 'bg-amber-400 text-[#0A1912]'
          }`}>
            {program.status === 'active' ? 'Active Flagship' : 'Ongoing Scale-up'}
          </span>
        </div>

        {/* Bottom Image Impact Highlight */}
        {program.impactMetric && (
          <div className="absolute bottom-3 left-4 right-4 bg-white/95 dark:bg-[#111613]/95 backdrop-blur-md py-2 px-3.5 rounded-xl border border-white/20 dark:border-white/10 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
              <span className="text-xs font-bold text-[#111613] dark:text-white">
                {program.impactMetric.label}
              </span>
            </div>
            <span className="text-xs font-black text-[#075B36] dark:text-[#A3E635] bg-[#EAF5E7] dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
              {program.impactMetric.value}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Category & Directorate */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#075B36] dark:text-[#A3E635] uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>{program.categoryKey}</span>
            </div>
            {program.directorate && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[#56635B] dark:text-gray-400 normal-case line-clamp-1">
                  {program.directorate}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black text-[#0A1912] dark:text-white leading-tight group-hover:text-[#075B36] dark:group-hover:text-[#A3E635] transition-colors">
            {t(program.titleKey)}
          </h2>

          {/* Description */}
          <p className="text-sm text-[#56635B] dark:text-white/70 leading-relaxed font-normal line-clamp-3">
            {t(program.descriptionKey)}
          </p>

          {/* Strategic Objectives Preview (First 2 bullets) */}
          {program.keyObjectives && program.keyObjectives.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase text-[#075B36] dark:text-[#A3E635] tracking-wide">
                Key Strategic Focus:
              </span>
              <ul className="space-y-1.5">
                {program.keyObjectives.slice(0, 2).map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#3E4D43] dark:text-white/80 leading-snug">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Meta & Button */}
        <div className="space-y-4 pt-4 border-t border-[#E8EFE5] dark:border-white/[0.08]">
          {/* Metadata Chips */}
          <div className="grid grid-cols-2 gap-2 text-xs text-[#56635B] dark:text-white/70 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0" />
              <span className="truncate" title={program.targetArea}>{program.targetArea}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Users className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0" />
              <span className="truncate" title={program.beneficiaries}>{program.beneficiaries}</span>
            </div>
          </div>

          {/* Milestones Progress Bar (Latest milestone) */}
          {program.milestones && program.milestones.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#56635B] dark:text-white/70">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#075B36] dark:text-[#A3E635]" />
                  <span>{program.milestones[program.milestones.length - 1].year} Goal</span>
                </span>
                <span className="text-[#075B36] dark:text-[#A3E635] font-black">
                  {program.milestones[program.milestones.length - 1].progress}%
                </span>
              </div>
              <div className="w-full bg-[#E5EFE2] dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#075B36] dark:bg-[#A3E635] h-full rounded-full transition-all duration-500"
                  style={{ width: `${program.milestones[program.milestones.length - 1].progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action CTA */}
          <button
            id={`btn-open-dossier-${program.id}`}
            onClick={() => onOpenDossier(program)}
            className="w-full py-3 px-4 rounded-xl bg-[#075B36] dark:bg-emerald-800 hover:bg-[#06472A] dark:hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm group/btn"
          >
            <span>{t('programs_view_details')}</span>
            <ArrowRight className="h-4 w-4 text-[#A3E635] group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
