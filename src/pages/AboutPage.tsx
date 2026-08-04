import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Target, Shield, Users, Award, Building2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-[#F8F7F2] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Page Banner */}
        <div className="rounded-2xl bg-[#075D3A] text-white p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D5A62E]">{t('bureau_title')}</span>
            <h1 className="text-3xl sm:text-4xl font-black">{t('nav_about')}</h1>
            <p className="text-sm text-emerald-100 max-w-2xl">{t('tagline')}</p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-white p-6 shadow-xs border space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF5EE] text-[#075D3A]">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-[#17211B]">Mission</h2>
            <p className="text-xs text-[#5E6B63] leading-relaxed">
              To modernize Oromia's agricultural production, enhance productivity through sustainable technology, ensure food security, and improve smallholder livelihoods.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-xs border space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF5EE] text-[#075D3A]">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-[#17211B]">Vision</h2>
            <p className="text-xs text-[#5E6B63] leading-relaxed">
              A prosperous, food-secure, and climate-resilient Oromia driven by a competitive, technology-led agricultural sector.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-xs border space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF5EE] text-[#075D3A]">
              <Award className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-[#17211B]">Core Values</h2>
            <p className="text-xs text-[#5E6B63] leading-relaxed">
              Integrity, farmer-centered service, environmental stewardship, innovation, transparency, and regional equity across all 21 zones.
            </p>
          </div>
        </div>

        {/* Bureau Structure */}
        <div className="rounded-xl bg-white p-8 shadow-xs border space-y-6">
          <h2 className="text-xl font-bold text-[#075D3A]">Organizational Hierarchy & Scope</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#F8F7F2] border space-y-1">
              <span className="font-bold text-[#075D3A] block">Regional Bureau Head</span>
              <p className="text-[#5E6B63]">Executive Cabinet & Regional Policy Steering</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8F7F2] border space-y-1">
              <span className="font-bold text-[#075D3A] block">21 Zonal Offices</span>
              <p className="text-[#5E6B63]">Direct zonal extension supervision & inputs</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8F7F2] border space-y-1">
              <span className="font-bold text-[#075D3A] block">330+ Woreda Offices</span>
              <p className="text-[#5E6B63]">District-level agricultural extension management</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8F7F2] border space-y-1">
              <span className="font-bold text-[#075D3A] block">15,000+ FTCs</span>
              <p className="text-[#5E6B63]">Farmer Training Centers directly serving communities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
