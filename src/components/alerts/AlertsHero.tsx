import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Bell,
  Search,
  ShieldAlert,
  AlertTriangle,
  Radio,
  PhoneCall,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Bug,
  Droplets,
  CloudSun,
  X,
  PlusCircle,
} from 'lucide-react';

interface AlertsHeroProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSeverity: string;
  onSelectSeverity: (sev: string) => void;
  activeCount: number;
  criticalCount: number;
  warningCount: number;
  totalFiltered: number;
  onOpenReportModal: () => void;
}

export const AlertsHero: React.FC<AlertsHeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedSeverity,
  onSelectSeverity,
  activeCount,
  criticalCount,
  warningCount,
  totalFiltered,
  onOpenReportModal,
}) => {
  const { t } = useLanguage();

  const categories = [
    { id: 'all', label: 'All Alerts', icon: Sparkles },
    { id: 'weather', label: 'Weather & Climate', icon: CloudSun },
    { id: 'pest', label: 'Pests & Invasives', icon: Bug },
    { id: 'crop', label: 'Crop Diseases', icon: Flame },
    { id: 'livestock', label: 'Animal Health', icon: ShieldAlert },
    { id: 'irrigation', label: 'Water & Irrigation', icon: Droplets },
  ];

  const severities = [
    { id: 'all', label: 'All Severities' },
    { id: 'critical', label: 'Critical Alert', dot: 'bg-red-500' },
    { id: 'warning', label: 'Warning', dot: 'bg-amber-500' },
    { id: 'advisory', label: 'Advisory', dot: 'bg-[#A3E635]' },
    { id: 'info', label: 'Information', dot: 'bg-blue-400' },
  ];

  return (
    <div className="relative bg-gradient-to-b from-[#062417] via-[#073D26] to-[#0A110D] text-white pt-10 sm:pt-14 pb-12 sm:pb-16 overflow-hidden border-b border-white/10">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle Radar Concentric Rings */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full pointer-events-none hidden lg:block" />
      <div className="absolute right-28 top-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/5 rounded-full pointer-events-none hidden lg:block" />
      <div className="absolute right-48 top-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/5 rounded-full pointer-events-none hidden lg:block" />

      <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Eyebrow & Status Beacons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#A3E635] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/15">
            <Radio className="h-3.5 w-3.5 animate-pulse text-[#A3E635]" />
            <span>Oromia Regional Early Warning & Plant Health Center</span>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="tel:8888"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-xs font-black transition-all shadow-md hover:scale-105"
            >
              <PhoneCall className="h-3.5 w-3.5 animate-bounce" />
              <span>Emergency Hotline: Dial 8888</span>
            </a>

            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#A3E635]" />
              <span>Report Pest / Hazard</span>
            </button>
          </div>
        </div>

        {/* Headline & Description */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
              Agricultural Early Warning & <br className="hidden sm:inline" />
              <span className="text-[#A3E635]">Rapid Response Advisories</span>
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed font-normal">
              Real-time agro-meteorological bulletins, pest outbreak alerts, stripe rust warnings, and livestock health dispatches protecting smallholder harvests across all 22 administrative zones.
            </p>
          </div>

          {/* Real-time Status Card */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/15 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                Network Status
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#A3E635]">
                <span className="h-2 w-2 rounded-full bg-[#A3E635] animate-ping" />
                Live Monitoring
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-red-950/50 border border-red-500/30 text-left">
                <span className="text-2xl font-black text-red-400 block">{criticalCount}</span>
                <span className="text-[11px] font-bold text-red-200">Critical Red Alerts</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-500/30 text-left">
                <span className="text-2xl font-black text-amber-300 block">{warningCount}</span>
                <span className="text-[11px] font-bold text-amber-200">Warning Advisories</span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-200/80 font-medium">
              <span>📡 340+ Woreda Weather Desks</span>
              <span>🛡️ 22 Zonal Defense Squads</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Control Bar */}
        <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/15 space-y-4">
          {/* Search Input Row */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search alerts by crop, disease (e.g., Yellow Rust, Locust), zone, woreda, or action..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-black/30 border border-white/20 text-white placeholder-emerald-200/60 text-sm font-medium focus:outline-none focus:border-[#A3E635] focus:ring-2 focus:ring-[#A3E635]/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter Chips - Wrapped cleanly without horizontal scroll */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#A3E635]" />
                <span>Filter by Advisory Category:</span>
              </span>
              <span className="text-[11px] text-white/70 font-normal">
                {totalFiltered} advisory notice(s) available
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#A3E635] text-[#0A1912] shadow-md scale-105 font-black'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
