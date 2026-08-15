import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, Wheat, Coffee, Droplets, Beef, Trees, ArrowRight, Sparkles } from 'lucide-react';

interface ZoneCorridor {
  id: string;
  name: string;
  nativeName: string;
  icon: React.ElementType;
  zones: string[];
  flagshipFocus: string;
  keyCommodities: string[];
  activePrograms: string[];
  keyHighlight: string;
}

export const ProgramsZonalMatrix: React.FC = () => {
  const { t } = useLanguage();
  const [activeCorridorId, setActiveCorridorId] = useState<string>('wheat-belt');

  const corridors: ZoneCorridor[] = [
    {
      id: 'wheat-belt',
      name: 'Highland Grain & Wheat Corridor',
      nativeName: 'Daandii Qamadii fi Midhaanii',
      icon: Wheat,
      zones: ['Arsi', 'West Arsi', 'Bale', 'East Bale', 'East Shewa', 'West Shewa'],
      flagshipFocus: 'Mechanized Cluster Farming & Precision Harvesting',
      keyCommodities: ['Bread Wheat', 'Durum Wheat', 'Malt Barley', 'Teff', 'Soybean'],
      activePrograms: ['Wheat Cluster Farming', 'Mechanization Hubs', 'Soil Nutrition Mapping'],
      keyHighlight: 'Produces over 58% of national wheat with 3.8M+ hectares under cluster management.'
    },
    {
      id: 'coffee-highlands',
      name: 'Specialty Coffee & Spices Basin',
      nativeName: 'Naannoo Bunaa fi Qurunfudii',
      icon: Coffee,
      zones: ['Jimma', 'Illu Abbaa Boor', 'Bunno Bedele', 'Guji', 'West Guji', 'East Hararghe'],
      flagshipFocus: 'Coffee Tree Rejuvenation & Specialty Direct Export',
      keyCommodities: ['Specialty Arabica Coffee', 'Cardamom', 'Ginger', 'Turmeric', 'Tea'],
      activePrograms: ['Coffee Rejuvenation', 'Eco-Washing Station Upgrade', 'Farmer Traceability'],
      keyHighlight: 'Over 2.1M coffee farming families generating $1.6B+ in foreign exchange exports.'
    },
    {
      id: 'irrigation-valleys',
      name: 'Rift Valley & Lowland River Basins',
      nativeName: 'Sulula Jallisii fi Laga Awash',
      icon: Droplets,
      zones: ['East Shewa', 'Arsi Lowlands', 'Borena Riverways', 'Rift Valley Corridor'],
      flagshipFocus: 'Solar Powered Irrigation & Triple-Harvest Crops',
      keyCommodities: ['Lowland Irrigated Wheat', 'Tomatoes', 'Onions', 'Papaya', 'Avocado'],
      activePrograms: ['Bona Summer/Winter Irrigation', 'Solar Pump Subsidy', 'Water User Unions'],
      keyHighlight: '600,000+ hectares under active irrigation enabling 3 continuous annual harvests.'
    },
    {
      id: 'livestock-shed',
      name: 'Pastoralist & Dairy Shed Corridors',
      nativeName: 'Misooma Aannanii fi Beeyladaa',
      icon: Beef,
      zones: ['Borena', 'Guji', 'Special Zone Surrounding Finfinne', 'West Shewa'],
      flagshipFocus: 'National Yelemat Tirufat Dairy, Poultry & Apiculture',
      keyCommodities: ['Boran Beef Cattle', 'Dairy Milk Heifers', 'Broiler Poultry', 'Organic Honey'],
      activePrograms: ['Yelemat Tirufat Dairy', 'Apiculture Modernization', 'Pasture Fodder Silos'],
      keyHighlight: '5.2 Billion liters annual regional milk production target with cold-chain collection.'
    },
    {
      id: 'green-watersheds',
      name: 'Montane Watershed & Soil Conservation',
      nativeName: 'Kunuunsa Qabeenya Uumamaa',
      icon: Trees,
      zones: ['All 22 Administrative Zones (Highland focus)'],
      flagshipFocus: 'Green Legacy Initiative & Micro-Watershed Terracing',
      keyCommodities: ['Grafted Avocado', 'Bamboo', 'Vetiver Contours', 'Indigenous Shade Trees'],
      activePrograms: ['Green Legacy Tree Nurseries', '40-Day Community Bunding', 'Slope Stabilization'],
      keyHighlight: 'Over 3.8 billion tree seedlings planted with an 88.4% survival rate in protected zones.'
    }
  ];

  const selectedCorridor = corridors.find(c => c.id === activeCorridorId) || corridors[0];
  const IconComponent = selectedCorridor.icon;

  return (
    <section id="programs-zonal-matrix-section" className="py-16 sm:py-20 bg-[#F4F8F3] dark:bg-[#080D0A] transition-colors duration-200 border-y border-[#E2EFE0] dark:border-white/[0.08]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5EFE2] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Regional Agro-Ecological Distribution</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A1912] dark:text-white tracking-tight">
            Flagship Programs Across Oromia's Agricultural Corridors
          </h2>

          <p className="text-sm sm:text-base text-[#56635B] dark:text-white/70">
            Tailoring specialized interventions to regional climate, soil classification, and commodity suitability.
          </p>
        </div>

        {/* Interactive Corridor Selector Tabs (Wrapped without horizontal scroll) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {corridors.map((c) => {
            const isSelected = activeCorridorId === c.id;
            const CIcon = c.icon;
            return (
              <button
                key={c.id}
                id={`corridor-tab-${c.id}`}
                onClick={() => setActiveCorridorId(c.id)}
                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#075B36] text-white shadow-lg scale-[1.02]'
                    : 'bg-white dark:bg-[#111613] text-[#3E4D43] dark:text-white/80 hover:bg-[#EBF5E8] dark:hover:bg-white/10 border border-[#E2EFE0] dark:border-white/10'
                }`}
              >
                <CIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#A3E635]' : 'text-[#075B36] dark:text-[#A3E635]'}`} />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Corridor Card */}
        <motion.div
          key={selectedCorridor.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 p-6 sm:p-8 lg:p-10 shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Col: Corridor Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#075B36] dark:text-[#A3E635] uppercase tracking-wider">
                  <IconComponent className="h-4 w-4" />
                  <span>{selectedCorridor.nativeName}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white">
                  {selectedCorridor.name}
                </h3>
                <p className="text-sm sm:text-base text-[#46534B] dark:text-white/80 leading-relaxed">
                  {selectedCorridor.keyHighlight}
                </p>
              </div>

              {/* Target Administrative Zones */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase text-[#075B36] dark:text-[#A3E635] tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Participating Administrative Zones:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCorridor.zones.map((zone, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-bold border border-[#E2EFE0] dark:border-white/10"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Commodities */}
              <div className="space-y-2.5">
                <span className="text-xs font-black uppercase text-[#075B36] dark:text-[#A3E635] tracking-wide">
                  Strategic Output Commodities:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCorridor.keyCommodities.map((comm, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-white/5 text-[#3E4D43] dark:text-white/80 text-xs font-semibold"
                    >
                      {comm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Active Program Deployments */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#075B36] to-[#0A2618] text-white p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#A3E635]">
                  Active Field Interventions
                </span>
                <h4 className="text-lg font-black">
                  {selectedCorridor.flagshipFocus}
                </h4>
              </div>

              <div className="space-y-3">
                {selectedCorridor.activePrograms.map((progName, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between text-xs sm:text-sm font-bold"
                  >
                    <span>{progName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#A3E635] text-[#0A1912] text-[10px] font-black uppercase">
                      Deployed
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200">
                <span>Bureau Directorate Coordination</span>
                <span className="font-bold text-white">Full Zonal Alignment</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
