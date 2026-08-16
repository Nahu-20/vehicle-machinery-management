import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  PhoneCall,
  CheckCircle2,
  ShieldCheck,
  Sprout,
  TrendingUp,
  PackageCheck,
  Tractor,
  Droplets,
  Beef,
  FlaskConical,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from '../../assets/images/oromia_irrigation_program_1785782711113.jpg';

interface ServicesHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  totalCount: number;
}

export const ServicesHero: React.FC<ServicesHeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  totalCount,
}) => {
  const { t } = useLanguage();

  const categories = [
    { id: 'all', label: 'All Services', icon: Layers },
    { id: 'extension', label: 'Extension & Advisory', icon: Sprout },
    { id: 'market', label: 'Market & Pricing', icon: TrendingUp },
    { id: 'inputs', label: 'Inputs & Fertilizer', icon: PackageCheck },
    { id: 'crop', label: 'Crop & Soil Health', icon: FlaskConical },
    { id: 'livestock', label: 'Livestock & Veterinary', icon: Beef },
    { id: 'irrigation', label: 'Irrigation & Water', icon: Droplets },
    { id: 'mechanization', label: 'Mechanization & Machinery', icon: Tractor },
  ];

  return (
    <section
      id="services-hero-section"
      className="relative text-white pt-8 sm:pt-12 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[500px] flex flex-col justify-center"
    >
      {/* Background Photographic Layer with Parallax-ready Styling */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImg}
          alt="Oromia Agricultural Extension and Services"
          className="w-full h-full object-cover object-center scale-105 filter brightness-[0.70] contrast-[1.05]"
        />
        {/* Multi-layered cinematic gradient overlay for high contrast & elegance */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#03150D]/95 via-[#062919]/90 to-[#0A2618]/80" />
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
          <span className="text-[#A3E635] font-bold">e-Services & Extension Directorate</span>
        </nav>

        {/* Hero Grid: Left Content & Right Highlights Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Purpose */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#A3E635]/30 text-[#A3E635] text-xs font-black uppercase tracking-wider shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-[#A3E635]" />
              <span>{t('services_tagline') || 'Oromia Regional Agricultural Services'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              Empowering Smallholders with Modern Digital & Field Services
            </h1>

            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-2xl">
              Access digital input vouchers, on-demand agronomic advisory, soil acidity testing, livestock artificial insemination, and market price intelligence across all 22 administrative zones.
            </p>

            {/* Quick Micro-Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-200 font-medium">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                <CheckCircle2 className="h-4 w-4 text-[#A3E635]" />
                <span>15,000+ Kebele Development Agents</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                <PhoneCall className="h-4 w-4 text-[#A3E635]" />
                <span>Toll-Free Helpline: <strong>8888</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                <ShieldCheck className="h-4 w-4 text-[#A3E635]" />
                <span>100% Free Public Services</span>
              </div>
            </div>
          </div>

          {/* Right Column: e-Service Quick Dispatch Hub Glassmorphism Card */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#A3E635]" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    e-Services Dispatch Channels
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#A3E635] text-[#0A1912] text-[10px] font-black uppercase">
                  Active 24/7
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="p-2 rounded-lg bg-[#075B36] text-[#A3E635] shrink-0 mt-0.5">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Toll-Free Voice & SMS (8888)</h4>
                    <p className="text-[11px] text-emerald-200/80 leading-snug">
                      Dial 8888 from any phone in Oromia for pest alerts, weather forecasts, and DA consultations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="p-2 rounded-lg bg-[#075B36] text-[#A3E635] shrink-0 mt-0.5">
                    <PackageCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Digital Input Voucher Redemption</h4>
                    <p className="text-[11px] text-emerald-200/80 leading-snug">
                      Validate subsidized NPSB/Urea fertilizer allocations directly at Primary Cooperative Union depots.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="p-2 rounded-lg bg-[#075B36] text-[#A3E635] shrink-0 mt-0.5">
                    <FlaskConical className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Rapid Soil Acidity & Nutrient Testing</h4>
                    <p className="text-[11px] text-emerald-200/80 leading-snug">
                      Submit soil samples at any Woreda desk to receive customized agricultural lime formulations.
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
                id="services-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search services (e.g., fertilizer, soil testing, veterinary, market price, seeds)..."
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-white/15 text-white placeholder-emerald-200/70 border border-white/25 focus:outline-none focus:ring-2 focus:ring-[#A3E635] focus:border-transparent text-sm transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-bold shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-[#A3E635]" />
              <span>{totalCount} Service Portfolios</span>
            </div>
          </div>

          {/* Category Filter Chips - Wrapped cleanly with NO horizontal scroll */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  id={`service-filter-${cat.id}`}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#A3E635] text-[#0A1912] shadow-lg font-extrabold scale-[1.03]'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white border border-white/15'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#0A1912]' : 'text-[#A3E635]'}`} />
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
