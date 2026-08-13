import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MapPin,
  Sprout,
  Truck,
  Briefcase,
  Users,
  Building2,
  ArrowRight,
  Compass,
  CheckCircle2,
  Info,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { HomepageInvestmentMapPreview } from './HomepageInvestmentMapPreview';

export const AgriculturalInvestmentSection: React.FC = () => {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="agricultural-investment"
      aria-labelledby="investment-heading"
      className="relative py-16 sm:py-20 lg:py-24 bg-[#FAF9F5] dark:bg-[#071610] text-[#12241A] dark:text-[#E8F3ED] transition-colors duration-300 overflow-hidden"
    >
      {/* Decorative background art - botanical SVG motif */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04] text-[#063D2A] dark:text-[#A3E635] overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="400" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="1200" cy="700" r="500" stroke="currentColor" strokeWidth="1.5" />
          <path d="M -100 450 Q 300 300 700 450 T 1500 450" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div className="max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* SECTION HEADER */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16 pb-6 border-b border-[#063D2A]/10 dark:border-emerald-800/30"
        >
          <div className="max-w-3xl">
            {/* Small agricultural-green eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#063D2A]/10 dark:bg-[#A3E635]/15 text-[#063D2A] dark:text-[#A3E635] text-xs font-bold tracking-widest uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#347622] dark:bg-[#A3E635] animate-pulse" />
              <span>{t('investment_eyebrow') || 'AGRICULTURAL INVESTMENT'}</span>
            </div>

            {/* Main heading */}
            <h2
              id="investment-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#063D2A] dark:text-white leading-[1.15]"
            >
              {t('investment_main_heading') || 'Invest in Oromia Agriculture'}
            </h2>

            {/* Supporting text */}
            <p className="mt-4 text-base sm:text-lg text-[#3E4E44] dark:text-emerald-100/80 leading-relaxed max-w-2xl">
              {t('investment_supporting_text') ||
                "Investors can explore Oromia's agricultural production potential, strategic infrastructure, investment projects, supplier networks, and official government support."}
            </p>
          </div>

          {/* Primary CTA button */}
          <div className="shrink-0">
            <Link to="/investment/map">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-[#063D2A] hover:bg-[#0c5634] dark:bg-[#A3E635] dark:hover:bg-[#b5f048] text-white dark:text-[#063D2A] font-extrabold text-sm sm:text-base shadow-md transition-all group"
              >
                <span>{t('investment_main_cta') || 'Explore Investment Opportunities'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]" />
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* ASYMMETRICAL BENTO COMPOSITION */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* TOP ASYMMETRICAL ROW (DESKTOP: LEFT ~58%, RIGHT ~42%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* 1. INTERACTIVE AGRICULTURAL MAPS (PRIMARY FEATURE - 7 COLS) */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-7 flex flex-col justify-between"
            >
              <HomepageInvestmentMapPreview className="h-full min-h-[520px]" />
            </motion.div>

            {/* RIGHT SIDE COLUMN (2 STACKED CARDS - 5 COLS / ~42%) */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
              
              {/* 2. PRODUCTION DATA CARD */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.01 }}
                className="flex-1 flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0E241B] p-6 sm:p-7 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-[#063D2A]/10 dark:bg-[#A3E635]/15 text-[#063D2A] dark:text-[#A3E635]">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#063D2A] dark:text-[#A3E635] border border-emerald-200/50 dark:border-emerald-800/40">
                      Verified Data
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#063D2A] dark:text-white mb-2">
                    {t('investment_production_title') || 'Production Data'}
                  </h3>

                  <p className="text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed mb-4">
                    {t('investment_production_desc') ||
                      'Explore major crop production volumes, livestock density, yields, agricultural potential, and regional production trends.'}
                  </p>

                  <ul className="space-y-2 text-xs font-medium text-[#2C3B32] dark:text-emerald-200/90 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                      <span>Major Crop Volume & Yield Trends (Wheat, Maize, Coffee)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                      <span>Livestock Density & Milk/Meat Commercialization</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-emerald-900/40 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-emerald-300/60 font-medium">Regional Dataset</span>
                  <Link
                    to="/investment/production"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] group-hover:underline"
                  >
                    <span>{t('investment_production_cta') || 'View Production Data'}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>

              {/* 3. INFRASTRUCTURE INFORMATION CARD */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.01 }}
                className="flex-1 flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0E241B] p-6 sm:p-7 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-[#063D2A]/10 dark:bg-[#A3E635]/15 text-[#063D2A] dark:text-[#A3E635]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#063D2A] dark:text-[#A3E635] border border-emerald-200/50 dark:border-emerald-800/40">
                      Logistics Gateway
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#063D2A] dark:text-white mb-2">
                    {t('investment_infra_title') || 'Infrastructure Information'}
                  </h3>

                  <p className="text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed mb-4">
                    {t('investment_infra_desc') ||
                      'Logistics data covering rural feeder roads, irrigation schemes, power grid access, cold storage, and processing hubs.'}
                  </p>

                  <ul className="space-y-2 text-xs font-medium text-[#2C3B32] dark:text-emerald-200/90 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                      <span>Road Networks, Power & Water Availability</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                      <span>Cold Storage & Aggregation Facilities</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-emerald-900/40 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-emerald-300/60 font-medium">Infrastructure Map</span>
                  <Link
                    to="/investment/infrastructure"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] group-hover:underline"
                  >
                    <span>{t('investment_infra_cta') || 'Explore Infrastructure'}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>

            </div>
          </div>

          {/* BOTTOM ROW (THREE CARDS GRID: 4, 5, 6) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* 4. AVAILABLE LAND & PROJECTS */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.01 }}
              className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0E241B] p-6 sm:p-7 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-[#063D2A]/10 dark:bg-[#A3E635]/15 text-[#063D2A] dark:text-[#A3E635]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    Official Portal
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#063D2A] dark:text-white mb-2">
                  {t('investment_land_title') || 'Available Land & Projects'}
                </h3>

                <p className="text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed mb-4">
                  {t('investment_land_desc') ||
                    'Commercial investment opportunities, agro-processing clusters, irrigation projects, and public-private partnerships.'}
                </p>

                {/* CRITICAL VERIFIED PLACEHOLDER NOTICE */}
                <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-amber-500/20 text-xs text-[#2A3830] dark:text-amber-100/90 font-medium mb-4 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {t('investment_land_placeholder') || 'Verified investment opportunities will be published here.'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-emerald-900/40 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-emerald-300/60 font-medium">Pipeline Projects</span>
                <Link
                  to="/investment/opportunities"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] group-hover:underline"
                >
                  <span>{t('investment_land_cta') || 'View Opportunities'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>

            {/* 5. SUPPLIERS & COOPERATIVES */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.01 }}
              className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0E241B] p-6 sm:p-7 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-[#063D2A]/10 dark:bg-[#A3E635]/15 text-[#063D2A] dark:text-[#A3E635]">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#063D2A] dark:text-[#A3E635] border border-emerald-200/50 dark:border-emerald-800/40">
                    Network
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#063D2A] dark:text-white mb-2">
                  {t('investment_suppliers_title') || 'Suppliers & Cooperatives'}
                </h3>

                <p className="text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed mb-4">
                  {t('investment_suppliers_desc') ||
                    'Discover cooperative unions, input distributors, seed producers, machinery suppliers, and agro-processors.'}
                </p>

                <ul className="space-y-2 text-xs font-medium text-[#2C3B32] dark:text-emerald-200/90 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                    <span>Primary Farmers' Unions & Cooperative Federation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                    <span>Certified Seed & Agro-Input Distributors</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-emerald-900/40 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-emerald-300/60 font-medium">Directory</span>
                <Link
                  to="/investment/suppliers"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] group-hover:underline"
                >
                  <span>{t('investment_suppliers_cta') || 'Explore Network'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>

            {/* 6. GOVERNMENT REQUIREMENTS & CONTACTS */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.01 }}
              className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0E241B] p-6 sm:p-7 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-[#063D2A]/10 dark:bg-[#A3E635]/15 text-[#063D2A] dark:text-[#A3E635]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#063D2A] dark:text-[#A3E635] border border-emerald-200/50 dark:border-emerald-800/40">
                    Bureau Guidance
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#063D2A] dark:text-white mb-2">
                  {t('investment_reqs_title') || 'Government Requirements & Contacts'}
                </h3>

                <p className="text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed mb-4">
                  {t('investment_reqs_desc') ||
                    'Investment procedures, required documentation, environmental permits, Bureau contacts, and policy guidance.'}
                </p>

                <ul className="space-y-2 text-xs font-medium text-[#2C3B32] dark:text-emerald-200/90 mb-4">
                  <li className="flex items-center gap-2">
                    <FileCheck2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                    <span>Official Bureau Investment Guidelines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileCheck2 className="w-3.5 h-3.5 text-[#347622] dark:text-[#A3E635] shrink-0" />
                    <span>Regional Desk & Desk Officers Contacts</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-emerald-900/40 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-emerald-300/60 font-medium">Investor Gateway</span>
                <Link
                  to="/investment/requirements"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] group-hover:underline"
                >
                  <span>{t('investment_reqs_cta') || 'View Requirements'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>

        {/* BOTTOM PUBLIC DATA SAFETY DISCLAIMER */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500 dark:text-emerald-300/60 max-w-2xl mx-auto flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#347622] dark:text-[#A3E635] shrink-0" />
            <span>
              {t('investment_disclaimer_notice') ||
                'Official investment portal of the Oromia Agricultural Bureau. Verified public dataset gateway.'}
            </span>
          </p>
        </div>

      </div>
    </section>
  );
};
