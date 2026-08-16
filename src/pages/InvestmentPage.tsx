import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Sprout,
  Truck,
  Briefcase,
  Users,
  Building2,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sampleZonePotentials } from '../data/investmentData';
import { PublicInvestmentMapShell } from '../components/investment/PublicInvestmentMapShell';

export const InvestmentPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on path suffix
  const getTabFromPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/map')) return 'map';
    if (path.includes('/production')) return 'production';
    if (path.includes('/infrastructure')) return 'infrastructure';
    if (path.includes('/opportunities')) return 'opportunities';
    if (path.includes('/suppliers')) return 'suppliers';
    if (path.includes('/requirements')) return 'requirements';
    return 'map';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/investment/${tabId}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#071610] text-[#12241A] dark:text-[#E8F3ED] transition-colors duration-200">
      
      {/* BREADCRUMB & HERO BANNER */}
      <div className="bg-[linear-gradient(110deg,#063D2A_0%,#09563B_50%,#03261A_100%)] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-12 relative overflow-hidden border-b border-emerald-900/40">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#A3E635_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-[1860px] mx-auto relative z-10">
          {/* Breadcrumb nav */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-emerald-200/80 mb-4" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white transition-colors">
              {t('nav_home') || 'Home'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#A3E635]">Agricultural Investment</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#A3E635] text-xs font-bold tracking-widest uppercase mb-3 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Bureau Investment Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t('investment_page_title') || 'Oromia Agricultural Investment Portal'}
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 max-w-3xl leading-relaxed">
            {t('investment_page_subtitle') ||
              'Official gateway for investors, agribusinesses, cooperatives, and development partners in Oromia.'}
          </p>
        </div>
      </div>

      {/* TAB NAVIGATION STRIP */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-[#0E241B]/90 backdrop-blur-md border-b border-[#063D2A]/10 dark:border-emerald-800/30 shadow-xs">
        <div className="max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-3 no-scrollbar">
            {[
              { id: 'map', label: t('investment_map_title') || 'Interactive Maps', icon: MapPin },
              { id: 'production', label: t('investment_production_title') || 'Production Data', icon: Sprout },
              { id: 'infrastructure', label: t('investment_infra_title') || 'Infrastructure', icon: Truck },
              { id: 'opportunities', label: t('investment_land_title') || 'Available Land & Projects', icon: Briefcase },
              { id: 'suppliers', label: t('investment_suppliers_title') || 'Suppliers & Cooperatives', icon: Users },
              { id: 'requirements', label: t('investment_reqs_title') || 'Requirements & Contacts', icon: Building2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#063D2A] text-white dark:bg-[#A3E635] dark:text-[#063D2A] shadow-xs'
                      : 'text-[#3E4E44] dark:text-emerald-100/70 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN TAB CONTENT */}
      <div className="max-w-[1860px] mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        
        {/* MAP TAB */}
        {activeTab === 'map' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <PublicInvestmentMapShell />
          </motion.div>
        )}

        {/* PRODUCTION DATA TAB */}
        {activeTab === 'production' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white dark:bg-[#0E241B] rounded-3xl p-6 sm:p-8 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-white mb-3">
                {t('investment_production_title') || 'Production Data'}
              </h2>
              <p className="text-sm sm:text-base text-[#4E5E53] dark:text-emerald-100/80 mb-6">
                {t('investment_production_desc') ||
                  'Discover major crop and livestock production volumes, yield potential, and geographic agricultural concentrations in verified Oromia zones.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sampleZonePotentials.map((zone) => (
                  <div key={zone.id} className="p-5 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                    <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#063D2A]/10 dark:bg-[#A3E635]/20 text-[#063D2A] dark:text-[#A3E635] text-xs font-bold mb-2">
                      {zone.agroZone}
                    </div>
                    <h3 className="text-lg font-bold text-[#063D2A] dark:text-white mb-2">{zone.zoneName}</h3>
                    <div className="space-y-2 text-xs text-[#3E4E44] dark:text-emerald-100/80 mb-4">
                      <p><strong>Major Commodities:</strong> {zone.majorCrops.join(', ')}</p>
                      <p><strong>Irrigation Access:</strong> {zone.irrigationAccess}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-emerald-900/40 text-[11px] font-semibold text-[#347622] dark:text-[#A3E635]">
                      ✓ {zone.verifiedNotice}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* INFRASTRUCTURE TAB */}
        {activeTab === 'infrastructure' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white dark:bg-[#0E241B] rounded-3xl p-6 sm:p-8 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-white mb-3">
                {t('investment_infra_title') || 'Infrastructure Information'}
              </h2>
              <p className="text-sm sm:text-base text-[#4E5E53] dark:text-emerald-100/80 mb-6">
                {t('investment_infra_desc') ||
                  'Logistics data covering rural feeder roads, irrigation schemes, power grid access, cold storage, and processing hubs.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                  <Truck className="w-8 h-8 text-[#063D2A] dark:text-[#A3E635] mb-3" />
                  <h3 className="text-xl font-bold text-[#063D2A] dark:text-white mb-2">Transport & Feeder Roads</h3>
                  <p className="text-xs sm:text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed">
                    Oromia features primary asphalt arteries connecting main agricultural zones to Djibouti export corridors and Finfinnee central markets.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                  <Sprout className="w-8 h-8 text-[#063D2A] dark:text-[#A3E635] mb-3" />
                  <h3 className="text-xl font-bold text-[#063D2A] dark:text-white mb-2">Irrigation & Power Supply</h3>
                  <p className="text-xs sm:text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed">
                    Awash basin, Rift Valley, and Wabe Shebelle river systems support commercial irrigation expansion with expanding rural power grids.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* OPPORTUNITIES TAB */}
        {activeTab === 'opportunities' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white dark:bg-[#0E241B] rounded-3xl p-6 sm:p-8 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-white mb-3">
                {t('investment_land_title') || 'Available Land & Projects'}
              </h2>
              <p className="text-sm sm:text-base text-[#4E5E53] dark:text-emerald-100/80 mb-6">
                {t('investment_land_desc') ||
                  'Commercial investment opportunities, agro-processing clusters, irrigation projects, and public-private partnerships.'}
              </p>

              <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/50 text-center max-w-2xl mx-auto my-6">
                <ShieldCheck className="w-12 h-12 text-amber-700 dark:text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                  Official Public Notice
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mb-4">
                  {t('investment_land_placeholder') || 'Verified investment opportunities will be published here.'}
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  The Oromia Agricultural Bureau publishes land availability and project tenders following rigorous legal and environmental verification.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white dark:bg-[#0E241B] rounded-3xl p-6 sm:p-8 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-white mb-3">
                {t('investment_suppliers_title') || 'Suppliers & Cooperatives'}
              </h2>
              <p className="text-sm sm:text-base text-[#4E5E53] dark:text-emerald-100/80 mb-6">
                {t('investment_suppliers_desc') ||
                  'Discover cooperative unions, input distributors, seed producers, machinery suppliers, and agro-processors.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                  <Users className="w-6 h-6 text-[#063D2A] dark:text-[#A3E635] mb-2" />
                  <h3 className="text-base font-bold text-[#063D2A] dark:text-white">Cooperative Unions</h3>
                  <p className="text-xs text-[#4E5E53] dark:text-emerald-100/80 mt-1">
                    Over 10,000 primary cooperatives and regional unions providing aggregation & input supply.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                  <Sprout className="w-6 h-6 text-[#063D2A] dark:text-[#A3E635] mb-2" />
                  <h3 className="text-base font-bold text-[#063D2A] dark:text-white">Certified Seed Enterprises</h3>
                  <p className="text-xs text-[#4E5E53] dark:text-emerald-100/80 mt-1">
                    Public and private seed multipliers delivering climate-resilient hybrid varieties.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                  <Building2 className="w-6 h-6 text-[#063D2A] dark:text-[#A3E635] mb-2" />
                  <h3 className="text-base font-bold text-[#063D2A] dark:text-white">Agro-Processors Network</h3>
                  <p className="text-xs text-[#4E5E53] dark:text-emerald-100/80 mt-1">
                    Flour mills, coffee washing stations, dairy plants, and edible oil processors.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* REQUIREMENTS TAB */}
        {activeTab === 'requirements' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white dark:bg-[#0E241B] rounded-3xl p-6 sm:p-8 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-white mb-3">
                {t('investment_reqs_title') || 'Government Requirements & Contacts'}
              </h2>
              <p className="text-sm sm:text-base text-[#4E5E53] dark:text-emerald-100/80 mb-6">
                {t('investment_reqs_desc') ||
                  'Essential guidance on investment procedures, required permits, application steps, and official Bureau contacts.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                  <h3 className="text-lg font-bold text-[#063D2A] dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#347622] dark:text-[#A3E635]" />
                    <span>Key Application Steps</span>
                  </h3>
                  <ol className="space-y-2 text-xs text-[#3E4E44] dark:text-emerald-100/80 list-decimal list-inside">
                    <li>Submit Commercial Investment Proposal to Oromia Investment Commission</li>
                    <li>Technical Evaluation by Oromia Agricultural Bureau Experts</li>
                    <li>Environmental & Social Impact Assessment (ESIA) Review</li>
                    <li>Investment Permit Issuance & Land Lease Agreement Execution</li>
                  </ol>
                </div>

                <div className="p-6 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/30">
                  <h3 className="text-lg font-bold text-[#063D2A] dark:text-white mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#347622] dark:text-[#A3E635]" />
                    <span>Official Bureau Investment Desk</span>
                  </h3>
                  <div className="space-y-2 text-xs text-[#3E4E44] dark:text-emerald-100/80">
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#347622] dark:text-[#A3E635]" />
                      <span>Oromia Agricultural Bureau — Investment & Agribusiness Directorate</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#347622] dark:text-[#A3E635]" />
                      <span>investment@oromiaagri.gov.et</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#347622] dark:text-[#A3E635]" />
                      <span>+251 11 551 7000 (Finfinnee / Addis Ababa)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
