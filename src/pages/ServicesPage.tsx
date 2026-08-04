import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockServices } from '../data/mockData';
import { Service } from '../types';
import {
  Sprout,
  TrendingUp,
  Wheat,
  Beef,
  Droplets,
  PackageCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  ExternalLink,
  X,
  PhoneCall,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeServiceModal, setActiveServiceModal] = useState<Service | null>(null);

  const categories = [
    { id: 'all', labelKey: 'All Services / Services Hunda' },
    { id: 'extension', labelKey: 'Extension' },
    { id: 'market', labelKey: 'Market' },
    { id: 'crops', labelKey: 'Crops' },
    { id: 'livestock', labelKey: 'Livestock' },
    { id: 'irrigation', labelKey: 'Irrigation' },
    { id: 'inputs', labelKey: 'Inputs' },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout': return <Sprout className="h-7 w-7" />;
      case 'TrendingUp': return <TrendingUp className="h-7 w-7" />;
      case 'Wheat': return <Wheat className="h-7 w-7" />;
      case 'Beef': return <Beef className="h-7 w-7" />;
      case 'Droplets': return <Droplets className="h-7 w-7" />;
      case 'PackageCheck': default: return <PackageCheck className="h-7 w-7" />;
    }
  };

  const filteredServices = mockServices.filter((srv) => {
    const title = t(srv.titleKey).toLowerCase();
    const desc = t(srv.descriptionKey).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query) || desc.includes(query) || srv.category.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'all' || srv.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#FAFAF7] min-h-screen py-10 lg:py-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Hero Section Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-[#063D2A] text-white p-8 sm:p-12 lg:p-14 shadow-xl border border-emerald-900">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#3FAE5A]/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D7A928]/40 bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#D7A928] backdrop-blur-md shadow-xs">
              <Sparkles className="h-4 w-4 text-[#D7A928]" />
              <span>{t('services_tagline')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t('nav_services')}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
              {t('services_subtitle')}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-emerald-200 font-semibold border-t border-white/15">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#3FAE5A]" />
                <span>21 Zonal Branch Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#3FAE5A]" />
                <span>15,000+ Registered Extension Officers</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-[#D7A928]" />
                <span>Hotline: <strong className="text-white">8888</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar Header */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#DDE8E1] shadow-2xs">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-[#637069] pr-2 shrink-0 flex items-center gap-1">
              <Filter className="h-4 w-4 text-[#087A4B]" />
              <span>Category:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#063D2A] text-white shadow-xs'
                    : 'bg-[#FAFAF7] text-[#14251D] hover:bg-[#EFF8F2] border border-[#DDE8E1]'
                }`}
              >
                {cat.labelKey}
              </button>
            ))}
          </div>

          {/* Search Input Box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637069]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] pl-10 pr-4 py-2 text-xs font-semibold text-[#14251D] placeholder:text-[#637069] focus:bg-white focus:border-[#087A4B] focus:outline-none focus:ring-2 focus:ring-[#087A4B]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          {filteredServices.length === 0 ? (
            <div className="rounded-2xl border border-[#DDE8E1] bg-white p-12 text-center text-[#637069] space-y-3">
              <p className="text-base font-bold text-[#14251D]">No services found matching your criteria</p>
              <p className="text-xs">Try searching for a different keyword or select "All Services"</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#063D2A] px-4 py-2 text-xs font-bold text-white hover:bg-[#087A4B]"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredServices.map((srv) => (
              <div
                key={srv.id}
                id={srv.category}
                className="group rounded-2xl border border-[#DDE8E1] bg-white p-6 sm:p-8 card-hover shadow-xs flex flex-col md:flex-row gap-6 items-start justify-between"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF8F2] text-[#087A4B] group-hover:bg-[#063D2A] group-hover:text-[#D7A928] transition-all duration-300 shrink-0 border border-[#DDE8E1] shadow-2xs">
                  {getIcon(srv.iconName)}
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-[#EFF8F2] px-3 py-1 text-[11px] font-extrabold text-[#087A4B] border border-[#DDE8E1] uppercase tracking-wider">
                      {srv.category}
                    </span>
                    {srv.isPopular && (
                      <span className="rounded-full bg-[#D7A928]/20 px-3 py-1 text-[11px] font-extrabold text-[#063D2A] border border-[#D7A928]/30">
                        Popular Service
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#14251D] group-hover:text-[#087A4B] transition-colors leading-snug">
                    {t(srv.titleKey)}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#637069] leading-relaxed max-w-3xl">
                    {t(srv.descriptionKey)}
                  </p>

                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#14251D] font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#3FAE5A] shrink-0" />
                      <span>Available in all 21 Oromia Zones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#3FAE5A] shrink-0" />
                      <span>Supported by 15,000+ Extension Agents</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto self-end md:self-center shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#DDE8E1]">
                  <button
                    onClick={() => setActiveServiceModal(srv)}
                    className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-[#087A4B] hover:bg-[#063D2A] px-6 py-3 text-xs sm:text-sm font-extrabold text-white transition-all shadow-xs"
                  >
                    <span>{t('service_action')}</span>
                    <ArrowRight className="h-4 w-4 text-[#D7A928]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Service Portal Details Modal */}
      {activeServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#DDE8E1] space-y-5">
            <div className="flex items-start justify-between border-b border-[#DDE8E1] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#063D2A] text-[#D7A928]">
                  {getIcon(activeServiceModal.iconName)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#087A4B] bg-[#EFF8F2] px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeServiceModal.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#14251D] mt-1 leading-snug">
                    {t(activeServiceModal.titleKey)}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveServiceModal(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <p className="text-[#637069] leading-relaxed">
                {t(activeServiceModal.descriptionKey)}
              </p>

              <div className="rounded-xl bg-[#EFF8F2] p-4 space-y-2 border border-[#DDE8E1]">
                <h4 className="font-extrabold text-[#063D2A] text-xs uppercase tracking-wider">Service Coverage & Protocol</h4>
                <div className="space-y-1.5 text-xs text-[#14251D] font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3FAE5A]" />
                    <span>Free extension service provided by Oromia Regional Bureau</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3FAE5A]" />
                    <span>Walk-in assistance at any Zonal Agricultural Office</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-[#087A4B]" />
                    <span>Direct phone inquiry: <strong className="text-[#063D2A]">8888 (Toll-free)</strong></span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 font-semibold">
                ℹ️ Milestone 1 Prototype Portal: Demonstrating service dispatch workflow for Oromia farmers and extension agents.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveServiceModal(null)}
                className="rounded-xl bg-[#063D2A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#087A4B] transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
