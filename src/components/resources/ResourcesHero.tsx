import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { resourceCategories } from '../../data/resourcesData';
import {
  Search,
  BookOpen,
  Sparkles,
  RotateCcw,
  Download,
  Languages,
  Layers,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

interface ResourcesHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedFormat: string;
  onSelectFormat: (fmt: string) => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  totalFiltered: number;
  totalAll: number;
  onRequestOpen: () => void;
}

export const ResourcesHero: React.FC<ResourcesHeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedFormat,
  onSelectFormat,
  selectedLanguage,
  onSelectLanguage,
  totalFiltered,
  totalAll,
  onRequestOpen,
}) => {
  const { t, language } = useLanguage();

  const formats = [
    { id: 'all', label: 'All Formats' },
    { id: 'pdf', label: 'PDF Documents' },
    { id: 'mp4', label: 'MP4 Video' },
    { id: 'docx', label: 'DOCX Forms' },
  ];

  const languageOptions = [
    { id: 'all', label: 'All Languages' },
    { id: 'oromoo', label: 'Afaan Oromoo' },
    { id: 'amharic', label: 'Amharic' },
    { id: 'english', label: 'English' },
  ];

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedFormat !== 'all' ||
    selectedLanguage !== 'all';

  const handleReset = () => {
    onSearchChange('');
    onSelectCategory('all');
    onSelectFormat('all');
    onSelectLanguage('all');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#053B23] via-[#075B36] to-[#054829] text-white pt-10 pb-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-800/40">
      {/* Background Decorative Grid & Subtle Radial Glow */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#A3E635_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#A3E635]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0B2E1C]/80 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1380px] mx-auto space-y-8">
        {/* Top Eyebrow & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-[#A3E635]/30 text-[#A3E635] text-xs font-black tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5 text-[#A3E635]" />
            <span>Open Access Knowledge & Farmer Library</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRequestOpen}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all shadow-xs"
            >
              <FileCheck className="h-3.5 w-3.5 text-[#A3E635]" />
              <span>Request Printed Copy / Manual</span>
            </button>
          </div>
        </div>

        {/* Main Headline & Context */}
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {t('resources_title') || 'Oromia Agricultural Knowledge & Resource Repository'}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium">
            {t('resources_subtitle') ||
              'Access verified crop planting calendars, integrated pest emergency dossiers, veterinary field handbooks, irrigation blueprints, and official administrative application forms.'}
          </p>
        </div>

        {/* Unified Search & Multi-Filter Control Console */}
        <div className="rounded-2xl bg-black/30 backdrop-blur-xl border border-white/15 p-4 sm:p-5 shadow-2xl space-y-4">
          {/* Main Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-300 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by topic, crop, pest name, keyword (e.g. 'Wheat calendar', 'Desert Locust', 'Solar pump', 'Form AG-01')..."
              className="w-full pl-12 pr-10 py-3.5 bg-white/10 text-white placeholder-emerald-200/60 rounded-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A3E635] focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white text-xs font-bold px-2 py-1 rounded-md bg-white/10 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Secondary Filter Controls (Format & Language & Reset) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            {/* Format Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider mr-1">
                Format:
              </span>
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => onSelectFormat(fmt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFormat === fmt.id
                      ? 'bg-[#A3E635] text-[#053B23] shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Language Selector & Filter Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg text-xs text-white">
                <Languages className="h-3.5 w-3.5 text-[#A3E635]" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => onSelectLanguage(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-[#054829] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#A3E635] hover:text-white px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 border border-[#A3E635]/30 transition-all"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Carousel / Filter Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-200/80 font-bold uppercase tracking-wider">
            <span>Browse by Agricultural Domain ({resourceCategories.length} categories)</span>
            <span>
              Showing {totalFiltered} of {totalAll} resources
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            {resourceCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`snap-start shrink-0 px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-[#A3E635] text-[#053B23] border-[#A3E635] shadow-lg scale-102'
                      : 'bg-white/10 text-white hover:bg-white/20 border-white/10 backdrop-blur-xs'
                  }`}
                >
                  <span>
                    {language === 'om'
                      ? cat.labelOm
                      : language === 'am'
                      ? cat.labelAm
                      : cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
