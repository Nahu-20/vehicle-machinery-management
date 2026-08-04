import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sprout,
  Building2,
  Users,
  TrendingUp,
  CloudSun,
  MapPin,
} from 'lucide-react';

import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

export const HeroSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#021810] via-[#063D2A] to-[#0A5439] text-white min-h-0 md:min-h-[660px] lg:min-h-[720px] flex items-center py-8 sm:py-12 md:py-16 lg:py-20">
      {/* Background Image with Rich Linear & Radial Gradient Overlays */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={heroFarmlandImg}
          alt="Oromia Agricultural Farmland"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center scale-105 opacity-45 transition-transform duration-1000 ease-out hover:scale-100"
        />
        {/* Multilayer linear gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#021810] via-[#063D2A]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#021810] via-transparent to-[#021810]/70" />
        {/* Modern glowing ambient lights */}
        <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[#087A4B]/35 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-10 h-96 w-96 rounded-full bg-[#D7A928]/20 blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1360px] mx-auto px-5 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 lg:space-y-7">
            {/* Bureau Badge with Gradient Border */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D7A928]/50 bg-gradient-to-r from-white/15 via-white/10 to-white/5 px-3.5 py-1.5 text-[11px] sm:text-xs font-black text-[#D7A928] backdrop-blur-md shadow-lg shadow-black/10 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              <Sprout className="h-4 w-4 text-[#D7A928] shrink-0 animate-bounce" />
              <span className="truncate">{t('hero_badge')}</span>
            </div>

            {/* Main Headline with clamp text sizing & tight line-height */}
            <h1 className="text-[clamp(2.25rem,11vw,3.25rem)] sm:text-5xl lg:text-[58px] font-black tracking-tight text-white leading-[1.02] sm:leading-[1.12] break-words hyphens-none">
              <span className="bg-gradient-to-r from-white via-emerald-100 to-[#EAF7F0] bg-clip-text text-transparent">
                {t('hero_headline')}
              </span>
            </h1>

            {/* Sub-paragraph */}
            <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 max-w-xl leading-relaxed font-normal">
              {t('hero_supporting')}
            </p>

            {/* Action Buttons (Stacked full-width on mobile) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2 w-full sm:w-auto">
              <a
                href="#services"
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#087A4B] via-[#09995E] to-[#087A4B] hover:from-[#09995E] hover:to-[#063D2A] text-white font-black text-sm sm:text-base h-12 sm:h-14 px-7 shadow-xl shadow-[#087A4B]/40 border border-emerald-400/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 min-h-[44px] w-full sm:w-auto text-center"
              >
                <span>{t('hero_btn_services')}</span>
                <ArrowRight className="h-5 w-5 text-[#D7A928]" />
              </a>

              <a
                href="#programs"
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-gradient-to-r from-white/10 via-white/15 to-white/10 hover:bg-white/20 text-white font-extrabold text-sm sm:text-base h-12 sm:h-14 px-7 backdrop-blur-md transition-all shadow-md min-h-[44px] w-full sm:w-auto text-center"
              >
                <span>{t('hero_btn_programs')}</span>
              </a>
            </div>

            {/* Desktop Statistics bar (Visible on ≥1024px) */}
            <div className="hidden lg:grid pt-6 border-t border-white/15 grid-cols-3 gap-4 max-w-xl">
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs border border-white/10">
                <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">12.4M+</p>
                <p className="text-xs text-emerald-200/80 font-bold mt-0.5">Farming Households</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs border border-white/10">
                <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#F7C948] to-[#D7A928] bg-clip-text text-transparent">21</p>
                <p className="text-xs text-emerald-200/80 font-bold mt-0.5">Zonal Offices</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs border border-white/10">
                <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">15,000+</p>
                <p className="text-xs text-emerald-200/80 font-bold mt-0.5">Extension Workers</p>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Advisory & Market Snapshot Card */}
          <div className="lg:col-span-5 space-y-4 w-full">
            {/* Primary Glassmorphic Hero Card */}
            <div className="rounded-3xl border border-white/25 bg-gradient-to-b from-white/20 via-white/10 to-black/30 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-4 sm:space-y-5 w-full">
              <div className="flex items-center justify-between border-b border-white/15 pb-3.5 sm:pb-4 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F7C948] to-[#D7A928] text-[#063D2A] font-black shadow-md">
                    <CloudSun className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#F7C948] to-[#D7A928] bg-clip-text text-transparent block truncate">
                      Live Regional Advisory
                    </span>
                    <span className="text-[11px] text-emerald-100 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 text-[#3FAE5A] shrink-0" />
                      Oromia Regional Network
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-gradient-to-r from-[#087A4B]/40 to-emerald-600/40 px-2.5 py-1 text-[10px] font-black text-emerald-200 border border-emerald-400/40">
                  Updated Today
                </span>
              </div>

              {/* Weather & Advisory Snippet */}
              <div className="rounded-2xl bg-gradient-to-r from-black/40 to-black/20 p-3.5 sm:p-4 border border-white/10 space-y-1.5 sm:space-y-2">
                <div className="flex flex-wrap items-center justify-between text-xs font-bold text-white gap-1">
                  <span>Seasonal Planting Window:</span>
                  <span className="text-[#D7A928]">Arsi & Shewa</span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Optimal soil humidity detected for early wheat and maize sowing. Ensure certified seed applications before mid-week precipitation.
                </p>
              </div>

              {/* Market Quick Row */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-2xl bg-gradient-to-b from-white/15 to-white/5 p-3.5 sm:p-4 border border-white/15 shadow-inner min-w-0">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-200">
                    <span className="truncate">Teff Agamsa</span>
                    <TrendingUp className="h-3.5 w-3.5 text-[#3FAE5A] shrink-0" />
                  </div>
                  <p className="text-base sm:text-lg font-black text-white mt-1">ETB 11,200</p>
                  <p className="text-[10px] text-emerald-300 font-semibold truncate">Per Quintal (Bishoftu)</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-b from-white/15 to-white/5 p-3.5 sm:p-4 border border-white/15 shadow-inner min-w-0">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-200">
                    <span className="truncate">White Wheat</span>
                    <TrendingUp className="h-3.5 w-3.5 text-[#3FAE5A] shrink-0" />
                  </div>
                  <p className="text-base sm:text-lg font-black text-white mt-1">ETB 6,450</p>
                  <p className="text-[10px] text-emerald-300 font-semibold truncate">Per Quintal (Asella)</p>
                </div>
              </div>

              {/* Trust Badge footer */}
              <div className="flex items-center gap-2 pt-1 text-xs text-emerald-200">
                <ShieldCheck className="h-4 w-4 text-[#D7A928] shrink-0" />
                <span className="font-semibold leading-tight">{t('hero_trust_text')}</span>
              </div>
            </div>

            {/* Mobile Statistics Grid (Visible on <1024px) */}
            <div className="grid lg:hidden grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 pt-1 sm:pt-2">
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs border border-white/10">
                <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">12.4M+</p>
                <p className="text-[11px] sm:text-xs text-emerald-200/90 font-bold mt-0.5">Farming Households</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 backdrop-blur-xs border border-white/10">
                <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#F7C948] to-[#D7A928] bg-clip-text text-transparent">21</p>
                <p className="text-[11px] sm:text-xs text-emerald-200/90 font-bold mt-0.5">Zonal Offices</p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/5 p-3 backdrop-blur-xs border border-white/10">
                <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">15,000+</p>
                <p className="text-[11px] sm:text-xs text-emerald-200/90 font-bold mt-0.5">Extension Workers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
