import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MapPin,
  Sprout,
  Truck,
  Briefcase,
  Users,
  Building2,
  ArrowRight,
  Phone,
  Mail,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sampleZonePotentials } from '../data/investmentData';
import { PublicInvestmentMapShell } from '../components/investment/PublicInvestmentMapShell';
import { listPublicOpportunities } from '../services/investment/investmentOpportunityService';
import { PublicInvestmentOpportunity } from '../types/investment';
import { CANONICAL_ZONE_METADATA, CanonicalZoneId } from '../features/investment-map/constants/canonicalZones';
import heroFarmlandImg from '../assets/images/oromia_hero_farmland_1785782697065.jpg';

const TABS = [
  { id: 'map', labelKey: 'investment_map_title', fallback: 'Interactive Map', icon: MapPin },
  { id: 'production', labelKey: 'investment_production_title', fallback: 'Production', icon: Sprout },
  { id: 'infrastructure', labelKey: 'investment_infra_title', fallback: 'Infrastructure', icon: Truck },
  { id: 'opportunities', labelKey: 'investment_land_title', fallback: 'Opportunities', icon: Briefcase },
  { id: 'suppliers', labelKey: 'investment_suppliers_title', fallback: 'Suppliers', icon: Users },
  { id: 'requirements', labelKey: 'investment_reqs_title', fallback: 'How to invest', icon: Building2 },
] as const;

export const InvestmentPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  const getTabFromPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/production')) return 'production';
    if (path.includes('/infrastructure')) return 'infrastructure';
    if (path.includes('/opportunities')) return 'opportunities';
    if (path.includes('/suppliers')) return 'suppliers';
    if (path.includes('/requirements')) return 'requirements';
    if (path.includes('/map')) return 'map';
    return 'map';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath());
  const [publicOpportunities, setPublicOpportunities] = useState<PublicInvestmentOpportunity[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppsError, setOppsError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab !== 'opportunities') return;
    let cancelled = false;
    setOppsLoading(true);
    setOppsError(null);
    listPublicOpportunities()
      .then((rows) => {
        if (!cancelled) setPublicOpportunities(rows);
      })
      .catch((err) => {
        if (!cancelled) setOppsError(err?.message || 'Failed to load opportunities');
      })
      .finally(() => {
        if (!cancelled) setOppsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/investment/${tabId}`);
    contentRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const openMapWith = (query: string) => {
    navigate(`/investment/map?${query}`);
  };

  const formatUsdRange = (min?: number, max?: number) => {
    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n);
    if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
    if (min != null) return `From ${fmt(min)}`;
    if (max != null) return `Up to ${fmt(max)}`;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F3F5F0] dark:bg-[#071610] text-[#12241A] dark:text-[#E8F3ED] transition-colors duration-200">
      {/* Full-bleed hero — brand, one headline, one line, CTAs */}
      <section className="relative min-h-[min(88vh,720px)] flex flex-col justify-end overflow-hidden">
        <motion.img
          src={heroFarmlandImg}
          alt=""
          aria-hidden
          initial={reduceMotion ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,30,20,0.92)_0%,rgba(6,40,26,0.72)_42%,rgba(6,40,26,0.35)_70%,rgba(6,40,26,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(163,230,53,0.12),transparent_55%)]" />

        <div className="relative z-10 w-full max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-12 pb-14 sm:pb-20 pt-28">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-[#C8F06A] mb-4">
              {t('gov_name') || 'Oromia Agriculture Bureau'}
            </p>
            <h1 className="text-[clamp(2.4rem,5.5vw,4.4rem)] font-extrabold tracking-tight text-white leading-[1.05] mb-5">
              {t('investment_page_title') || 'Invest in Oromia Agriculture'}
            </h1>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mb-8">
              {t('investment_page_subtitle') ||
                'Zone-level production, verified facilities, and official pathways for agribusiness investment.'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleTabChange('map')}
                className="inline-flex items-center gap-2 h-12 px-6 bg-[#A3E635] hover:bg-[#b5f048] text-[#0A1912] font-extrabold text-sm transition-colors"
              >
                {t('investment_map_cta') || 'Explore the map'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('requirements')}
                className="inline-flex items-center gap-2 h-12 px-6 border border-white/35 text-white hover:bg-white/10 font-semibold text-sm transition-colors"
              >
                {t('investment_reqs_cta') || 'How to invest'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section navigation */}
      <nav
        ref={contentRef}
        className="sticky top-16 z-30 border-b border-[#063D2A]/10 dark:border-emerald-900/40 bg-[#F3F5F0]/95 dark:bg-[#071610]/95 backdrop-blur-md"
        aria-label="Investment sections"
      >
        <div className="max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-stretch gap-0 overflow-x-auto no-scrollbar -mx-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative shrink-0 px-4 sm:px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#063D2A] dark:text-[#A3E635]'
                      : 'text-[#5A6B61] dark:text-emerald-100/55 hover:text-[#063D2A] dark:hover:text-emerald-100'
                  }`}
                >
                  {t(tab.labelKey) || tab.fallback}
                  {isActive && (
                    <motion.span
                      layoutId="investment-tab-underline"
                      className="absolute left-4 right-4 bottom-0 h-0.5 bg-[#347622] dark:bg-[#A3E635]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className={activeTab === 'map' ? '' : 'max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16'}>
        {activeTab === 'map' && (
          <motion.div
            key="map"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8"
          >
            <PublicInvestmentMapShell />
          </motion.div>
        )}

        {activeTab === 'production' && (
          <motion.section
            key="production"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl"
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#347622] dark:text-[#A3E635] mb-3">
              {t('investment_production_title') || 'Production'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#063D2A] dark:text-white mb-4">
              {t('investment_production_heading') || 'Where Oromia grows'}
            </h2>
            <p className="text-base sm:text-lg text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed mb-10 max-w-2xl">
              {t('investment_production_desc') ||
                'Verified zone datasets for coffee, wheat, and maize—production, suitability, and investment potential.'}
            </p>

            <div className="divide-y divide-[#063D2A]/10 dark:divide-emerald-900/40 border-y border-[#063D2A]/10 dark:border-emerald-900/40 mb-10">
              {sampleZonePotentials.map((zone) => (
                <div key={zone.id} className="py-6 sm:py-7 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6">
                  <div className="sm:col-span-4">
                    <h3 className="text-lg font-bold text-[#063D2A] dark:text-white">{zone.zoneName}</h3>
                    <p className="text-xs font-medium text-[#5A6B61] dark:text-emerald-200/60 mt-1">{zone.agroZone}</p>
                  </div>
                  <div className="sm:col-span-8 space-y-2 text-sm text-[#3E4E44] dark:text-emerald-100/80">
                    <p>
                      <span className="font-semibold text-[#063D2A] dark:text-emerald-100">Commodities — </span>
                      {zone.majorCrops.join(', ')}
                    </p>
                    <p>
                      <span className="font-semibold text-[#063D2A] dark:text-emerald-100">Irrigation — </span>
                      {zone.irrigationAccess}
                    </p>
                    <p className="text-xs text-[#347622] dark:text-[#A3E635] pt-1">{zone.verifiedNotice}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openMapWith('commodity=coffee&metric=production')}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] hover:gap-3 transition-all"
            >
              {t('investment_production_cta') || 'Open production on the map'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.section>
        )}

        {activeTab === 'infrastructure' && (
          <motion.section
            key="infrastructure"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl"
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#347622] dark:text-[#A3E635] mb-3">
              {t('investment_infra_title') || 'Infrastructure'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#063D2A] dark:text-white mb-4">
              {t('investment_infra_heading') || 'Logistics that move harvests'}
            </h2>
            <p className="text-base sm:text-lg text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed mb-10 max-w-2xl">
              {t('investment_infra_desc') ||
                'Published warehouses, cold storage, processing sites, irrigation, and market facilities—filterable on the public map.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-10">
              <div>
                <Truck className="w-7 h-7 text-[#347622] dark:text-[#A3E635] mb-3" />
                <h3 className="text-xl font-bold text-[#063D2A] dark:text-white mb-2">
                  {t('investment_infra_transport_title') || 'Corridors & feeder roads'}
                </h3>
                <p className="text-sm text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed">
                  {t('investment_infra_transport_desc') ||
                    'Primary routes connect production zones to Finfinnee markets and export corridors toward Djibouti.'}
                </p>
              </div>
              <div>
                <Sprout className="w-7 h-7 text-[#347622] dark:text-[#A3E635] mb-3" />
                <h3 className="text-xl font-bold text-[#063D2A] dark:text-white mb-2">
                  {t('investment_infra_water_title') || 'Irrigation & power'}
                </h3>
                <p className="text-sm text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed">
                  {t('investment_infra_water_desc') ||
                    'Awash, Rift Valley, and Wabe Shebelle systems support irrigated commercial agriculture as rural electrification expands.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openMapWith('infrastructure=1')}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] hover:gap-3 transition-all"
            >
              {t('investment_infra_cta') || 'Show facilities on the map'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.section>
        )}

        {activeTab === 'opportunities' && (
          <motion.section
            key="opportunities"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl"
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#347622] dark:text-[#A3E635] mb-3">
              {t('investment_land_title') || 'Opportunities'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#063D2A] dark:text-white mb-4">
              {t('investment_land_heading') || 'Land & projects'}
            </h2>
            <p className="text-base sm:text-lg text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed mb-8 max-w-3xl">
              {t('investment_land_desc') ||
                'Agro-processing clusters, irrigation schemes, and partnership opportunities published by the Bureau.'}
            </p>

            {oppsLoading ? (
              <p className="text-sm text-[#4E5E53] dark:text-emerald-100/70 animate-pulse">
                Loading published opportunities…
              </p>
            ) : oppsError ? (
              <p className="text-sm text-rose-700 dark:text-rose-300">{oppsError}</p>
            ) : publicOpportunities.length === 0 ? (
              <div className="border-l-2 border-[#347622] dark:border-[#A3E635] pl-5 py-1">
                <p className="text-sm font-semibold text-[#063D2A] dark:text-white mb-1">
                  {t('investment_land_notice_title') || 'Publication status'}
                </p>
                <p className="text-sm text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed">
                  {t('investment_land_placeholder') ||
                    'Verified investment opportunities will be published as they clear Bureau review.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-0 divide-y divide-[#063D2A]/10 dark:divide-emerald-900/40 border-y border-[#063D2A]/10 dark:border-emerald-900/40">
                {publicOpportunities.map((opp) => {
                  const range = formatUsdRange(
                    opp.estimatedInvestmentRange?.minUsd,
                    opp.estimatedInvestmentRange?.maxUsd
                  );
                  const zones = (opp.zoneIds || [])
                    .map((z) => CANONICAL_ZONE_METADATA[z as CanonicalZoneId]?.displayName || z)
                    .join(' · ');
                  const primaryZone = opp.zoneIds?.[0];
                  return (
                    <li key={opp.opportunityId} className="py-6 sm:py-7">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#347622] dark:text-[#A3E635] mb-1">
                            {(opp.opportunityType || 'opportunity').replace(/_/g, ' ')}
                            {opp.commodityKeys?.length
                              ? ` · ${opp.commodityKeys.join(', ')}`
                              : ''}
                          </p>
                          <h3 className="text-lg sm:text-xl font-extrabold text-[#063D2A] dark:text-white mb-2">
                            {opp.title}
                          </h3>
                          <p className="text-sm text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed mb-3">
                            {opp.summary}
                          </p>
                          <p className="text-xs text-[#5A6B61] dark:text-emerald-200/60">
                            {zones}
                            {range ? ` · ${range}` : ''}
                            {opp.landInformation?.totalHa
                              ? ` · ${opp.landInformation.totalHa} ha`
                              : ''}
                          </p>
                          {opp.responsibleOffice && (
                            <p className="text-[11px] text-[#5A6B61] dark:text-emerald-200/50 mt-2">
                              {opp.responsibleOffice}
                            </p>
                          )}
                        </div>
                        {primaryZone && (
                          <button
                            type="button"
                            onClick={() => openMapWith(`zone=${primaryZone}&commodity=${opp.commodityKeys?.[0] || 'coffee'}`)}
                            className="inline-flex items-center gap-2 self-start text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] hover:gap-3 transition-all shrink-0"
                          >
                            View on map
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        )}

        {activeTab === 'suppliers' && (
          <motion.section
            key="suppliers"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl"
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#347622] dark:text-[#A3E635] mb-3">
              {t('investment_suppliers_title') || 'Suppliers'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#063D2A] dark:text-white mb-4">
              {t('investment_suppliers_heading') || 'Supply chain partners'}
            </h2>
            <p className="text-base sm:text-lg text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed mb-10 max-w-2xl">
              {t('investment_suppliers_desc') ||
                'Cooperatives, seed enterprises, and processors that anchor Oromia’s agricultural value chains.'}
            </p>

            <ul className="space-y-0 divide-y divide-[#063D2A]/10 dark:divide-emerald-900/40 border-y border-[#063D2A]/10 dark:border-emerald-900/40">
              {[
                {
                  icon: Users,
                  title: t('investment_suppliers_coop_title') || 'Cooperative unions',
                  body:
                    t('investment_suppliers_coop_desc') ||
                    'Primary cooperatives and regional unions for aggregation and input supply across the region.',
                },
                {
                  icon: Sprout,
                  title: t('investment_suppliers_seed_title') || 'Certified seed enterprises',
                  body:
                    t('investment_suppliers_seed_desc') ||
                    'Public and private multipliers delivering climate-resilient varieties.',
                },
                {
                  icon: Building2,
                  title: t('investment_suppliers_proc_title') || 'Agro-processors',
                  body:
                    t('investment_suppliers_proc_desc') ||
                    'Flour mills, coffee washing stations, dairy plants, and edible oil processors.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="py-6 flex gap-4 sm:gap-5">
                    <Icon className="w-5 h-5 mt-1 shrink-0 text-[#347622] dark:text-[#A3E635]" />
                    <div>
                      <h3 className="text-base font-bold text-[#063D2A] dark:text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {activeTab === 'requirements' && (
          <motion.section
            key="requirements"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl"
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#347622] dark:text-[#A3E635] mb-3">
              {t('investment_reqs_title') || 'How to invest'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#063D2A] dark:text-white mb-4">
              {t('investment_reqs_heading') || 'Official pathway'}
            </h2>
            <p className="text-base sm:text-lg text-[#4E5E53] dark:text-emerald-100/75 leading-relaxed mb-10 max-w-2xl">
              {t('investment_reqs_desc') ||
                'Procedures, permits, and the Bureau desk that guides agribusiness proposals through review.'}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#063D2A] dark:text-white mb-5">
                  <FileText className="w-5 h-5 text-[#347622] dark:text-[#A3E635]" />
                  {t('investment_reqs_steps_title') || 'Application steps'}
                </h3>
                <ol className="space-y-4">
                  {[
                    t('investment_reqs_step_1') ||
                      'Submit a commercial proposal to the Oromia Investment Commission',
                    t('investment_reqs_step_2') ||
                      'Technical evaluation by Oromia Agriculture Bureau experts',
                    t('investment_reqs_step_3') || 'Environmental & social impact assessment review',
                    t('investment_reqs_step_4') ||
                      'Investment permit issuance and land lease execution',
                  ].map((step, i) => (
                    <li key={step} className="flex gap-4 text-sm text-[#3E4E44] dark:text-emerald-100/80">
                      <span className="font-extrabold text-[#347622] dark:text-[#A3E635] tabular-nums w-6 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#063D2A] dark:text-white mb-5">
                  <Building2 className="w-5 h-5 text-[#347622] dark:text-[#A3E635]" />
                  {t('investment_reqs_desk_title') || 'Investment desk'}
                </h3>
                <div className="space-y-4 text-sm text-[#3E4E44] dark:text-emerald-100/80">
                  <p className="leading-relaxed">
                    {t('investment_reqs_desk_org') ||
                      'Oromia Agriculture Bureau — Investment & Agribusiness Directorate'}
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#347622] dark:text-[#A3E635] shrink-0" />
                    <a
                      href="mailto:investment@oromiaagri.gov.et"
                      className="hover:text-[#063D2A] dark:hover:text-[#A3E635] underline-offset-2 hover:underline"
                    >
                      investment@oromiaagri.gov.et
                    </a>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#347622] dark:text-[#A3E635] shrink-0" />
                    <span>+251 11 551 7000</span>
                  </p>
                  <p className="flex items-start gap-2.5 text-xs text-[#5A6B61] dark:text-emerald-200/50 pt-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Finfinnee / Addis Ababa</span>
                  </p>
                </div>

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 mt-8 text-sm font-extrabold text-[#063D2A] dark:text-[#A3E635] hover:gap-2.5 transition-all"
                >
                  {t('nav_contact') || 'Contact the Bureau'}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
};
