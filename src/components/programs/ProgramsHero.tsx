import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  Wheat,
  Droplets,
  Tractor,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

interface ProgramsHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  totalCount: number;
}

export const ProgramsHero: React.FC<ProgramsHeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalCount,
}) => {
  const { t } = useLanguage();

  const categories = [
    { id: 'all', label: t('programs_filter_all') },
    { id: 'Crop Production', label: t('programs_filter_crop') },
    { id: 'Livestock Development', label: t('programs_filter_livestock') },
    { id: 'Irrigation Development', label: t('programs_filter_irrigation') },
    { id: 'Natural Resource Mgt', label: t('programs_filter_nrm') },
    { id: 'High-Value Commercial Crops', label: t('programs_filter_coffee') },
    { id: 'Agricultural Technology & Inputs', label: t('programs_filter_tech') },
  ];

  return (
    <section
      id="programs-hero-section"
      className="relative text-white pt-8 sm:pt-12 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[480px] flex flex-col justify-center"
    >
      {/* Background Photographic Layer with Parallax-ready Styling */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroFarmlandImg}
          alt="Oromia Agricultural Landscape"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.75] contrast-[1.05]"
        />
        {/* Multi-layered cinematic gradient overlay for high contrast & elegance */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#03150D]/95 via-[#062919]/90 to-[#0A2618]/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04160E] via-transparent to-black/40" />
        
        {/* Subtle decorative dot matrix texture */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(#A3E635 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1380px] mx-auto w-full space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90">
          <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[#A3E635] font-bold">Strategic Flagship Programs</span>
        </nav>

        {/* Hero Grid: Left Content & Right Highlights Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Purpose */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#A3E635]/30 text-[#A3E635] text-xs font-black uppercase tracking-wider shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-[#A3E635]" />
              <span>{t('programs_hero_badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {t('programs_hero_title')}
            </h1>

            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-2xl">
              {t('programs_hero_subtitle')}
            </p>

            {/* Quick Micro-Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-200 font-medium">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />
                <span>3.8M+ Hectares in Clusters</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />
                <span>Triple Harvest Irrigation</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />
                <span>22 Zonal Footprint</span>
              </div>
            </div>
          </div>

          {/* Right Column: Strategic Pillars Glassmorphism Card (Large Screens) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#A3E635]" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Regional Modernization Framework
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#A3E635] text-[#0A1912] text-[10px] font-black uppercase">
                  2026/27 Goal
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="p-2 rounded-lg bg-[#075B36] text-[#A3E635] shrink-0 mt-0.5">
                    <Tractor className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Mechanized Cluster Farming</h4>
                    <p className="text-[11px] text-emerald-200/80 leading-snug">
                      Consolidated smallholder acreage with subsidized combine harvesters and high-yield seeds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="p-2 rounded-lg bg-[#075B36] text-[#A3E635] shrink-0 mt-0.5">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Lowland Summer & Winter Irrigation</h4>
                    <p className="text-[11px] text-emerald-200/80 leading-snug">
                      Harnessing Awash & Rift Valley basins for continuous triple annual wheat and horticultural output.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="p-2 rounded-lg bg-[#075B36] text-[#A3E635] shrink-0 mt-0.5">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Yelemat Tirufat & Specialty Coffee</h4>
                    <p className="text-[11px] text-emerald-200/80 leading-snug">
                      Multi-billion birr dairy genetics and heirloom specialty coffee value chain direct export.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar (No horizontal scroll: flex-wrap layout) */}
        <div className="bg-black/40 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/20 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A3E635]" />
              <input
                id="programs-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('programs_search_placeholder')}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/15 text-white placeholder-emerald-200/70 border border-white/25 focus:outline-none focus:ring-2 focus:ring-[#A3E635] focus:border-transparent text-sm transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-bold shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-[#A3E635]" />
              <span>{totalCount} Initiatives Active</span>
            </div>
          </div>

          {/* Category Filter Chips - Wrapped cleanly with NO horizontal scroll */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`program-filter-${cat.id}`}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#A3E635] text-[#0A1912] shadow-lg font-extrabold scale-[1.03]'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white border border-white/15'
                  }`}
                >
                  <Layers className={`h-3.5 w-3.5 ${isActive ? 'text-[#0A1912]' : 'text-[#A3E635]'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
