import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Radar,
  CloudRain,
  Flame,
  Bug,
  Droplets,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Info,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CorridorRisk {
  id: string;
  name: string;
  zones: string[];
  primaryCrops: string[];
  overallRisk: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
  riskColor: string;
  bgLight: string;
  factors: {
    name: string;
    level: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Optimal' | 'Low-Watch' | 'Good';
    score: number; // 0 - 100
    icon: any;
  }[];
  advisoryNote: string;
  recommendedAction: string;
}

interface AlertsRiskRadarProps {
  onFilterByZone?: (zoneName: string) => void;
}

export const AlertsRiskRadar: React.FC<AlertsRiskRadarProps> = ({ onFilterByZone }) => {
  const { t } = useLanguage();
  const [activeCorridorId, setActiveCorridorId] = useState<string>('highland');

  const corridors: CorridorRisk[] = [
    {
      id: 'highland',
      name: 'Highland Wheat & Barley Belt',
      zones: ['Arsi', 'West Arsi', 'Bale', 'West Shewa', 'North Shewa'],
      primaryCrops: ['Wheat', 'Barley', 'Faba Bean', 'Teff'],
      overallRisk: 'Elevated',
      riskColor: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-500/10 border-amber-500/30',
      factors: [
        { name: 'Stripe / Stem Rust Spores', level: 'High', score: 78, icon: Flame },
        { name: 'Cold Night / Frost Risk', level: 'Moderate', score: 45, icon: Thermometer },
        { name: 'Soil Waterlogging', level: 'Moderate', score: 55, icon: Droplets },
        { name: 'Armyworm Infestation', level: 'Low', score: 20, icon: Bug },
      ],
      advisoryNote:
        'Continuous overcast humidity in Arsi and Bale highlands has created favorable microclimates for stripe rust (Puccinia striiformis). Early fungicide spraying is required before flag leaf emergence.',
      recommendedAction:
        'Deploy motorized sprayers with Tilt or Rex Duo on susceptible varieties (e.g., Ogolcho, Danda’a). Clear drainage furrows in Vertisol fields.',
    },
    {
      id: 'mid-altitude',
      name: 'Mid-Altitude Maize & Coffee Corridors',
      zones: ['Jimma', 'Illubabor', 'East Wollega', 'West Wollega', 'Horo Guduru'],
      primaryCrops: ['Maize', 'Coffee', 'Soybean', 'Sorghum'],
      overallRisk: 'Moderate',
      riskColor: 'text-emerald-600 dark:text-[#A3E635]',
      bgLight: 'bg-emerald-500/10 border-emerald-500/30',
      factors: [
        { name: 'Fall Armyworm (FAW) Egg Masses', level: 'Moderate', score: 52, icon: Bug },
        { name: 'Coffee Berry Disease (CBD)', level: 'Moderate', score: 40, icon: Flame },
        { name: 'Rainfall Infiltration Rate', level: 'Good', score: 85, icon: CloudRain },
        { name: 'Heat Stress Index', level: 'Low', score: 18, icon: Thermometer },
      ],
      advisoryNote:
        'FAW scouting trap captures show 2nd generation larval hatchings in low-lying river valleys around Jimma and Buno Bedele. Coffee cherries entering expansion stage require preventive copper sprays.',
      recommendedAction:
        'Apply biological neem extract or approved pheromone traps at 5% whorl damage threshold. Maintain shade tree pruning for coffee aeration.',
    },
    {
      id: 'rift-valley',
      name: 'Rift Valley & Awash Basin',
      zones: ['East Shewa', 'West Arsi (Lowlands)', 'Adama Corridor'],
      primaryCrops: ['Teff', 'Vegetables / Tomato', 'Onion', 'Haricot Bean'],
      overallRisk: 'Elevated',
      riskColor: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-500/10 border-amber-500/30',
      factors: [
        { name: 'Awash Canal Discharge Stress', level: 'High', score: 72, icon: Droplets },
        { name: 'Tuta Absoluta (Tomato Borer)', level: 'High', score: 70, icon: Bug },
        { name: 'Salinity / Evaporative Loss', level: 'Moderate', score: 48, icon: Thermometer },
        { name: 'Flash Flood Runoff', level: 'Low', score: 25, icon: CloudRain },
      ],
      advisoryNote:
        'Peak dry intervals and high evapotranspiration in Meki-Ziway basins require strict rotational irrigation scheduling to preserve lake catchment storage.',
      recommendedAction:
        'Shift horticultural pump irrigation to dusk/dawn hours. Install delta pheromone delta traps for Tuta absoluta monitoring in tomato greenhouses.',
    },
    {
      id: 'lowland-pastoral',
      name: 'Lowland Pastoral & Agro-Pastoral Corridors',
      zones: ['Borena', 'Guji', 'East Hararghe (Lowlands)', 'West Hararghe'],
      primaryCrops: ['Livestock (Cattle/Camels)', 'Sorghum', 'Sesame', 'Forage'],
      overallRisk: 'Critical',
      riskColor: 'text-red-600 dark:text-red-400',
      bgLight: 'bg-red-500/10 border-red-500/30',
      factors: [
        { name: 'Forage Biomass Deficit (NDVI)', level: 'Severe', score: 88, icon: Flame },
        { name: 'Pastoral Water Point Depletion', level: 'High', score: 79, icon: Droplets },
        { name: 'Livestock Vector-Borne Risk', level: 'Moderate', score: 44, icon: ShieldCheck },
        { name: 'Desert Locust Border Influx', level: 'Low-Watch', score: 32, icon: Bug },
      ],
      advisoryNote:
        'NDVI satellite vegetation indices show localized biomass deficits in Southern rangelands. Emergency commercial de-stocking and supplementary fodder supply depots are operational.',
      recommendedAction:
        'Utilize feed voucher subsidies at Woreda livestock centers. Report any atypical transboundary desert locust hopper sightings via 8888 immediately.',
    },
  ];

  const currentCorridor = corridors.find((c) => c.id === activeCorridorId) || corridors[0];

  return (
    <section id="alerts-risk-radar" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EDF4EC] dark:border-white/10 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
              <Radar className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] animate-spin-slow" />
              <span>Agro-Ecological Risk Radar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight leading-tight">
              Regional Crop, Pest & Climate Risk Indices
            </h2>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 leading-relaxed font-normal">
              Integrated real-time surveillance cross-referencing satellite meteorological data, pest pheromone traps, and on-ground Woreda extension bulletins.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F0F7EE] dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 text-xs font-bold text-[#075B36] dark:text-[#A3E635] shrink-0 self-start md:self-auto">
            <Sparkles className="h-4 w-4" />
            <span>Updated Daily: 06:00 EAT</span>
          </div>
        </div>

        {/* Corridor Selector Tabs - Responsive Wrap (NO horizontal scroll) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {corridors.map((corr) => {
            const isActive = corr.id === activeCorridorId;
            return (
              <button
                key={corr.id}
                onClick={() => setActiveCorridorId(corr.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#075B36] text-white shadow-md scale-102'
                    : 'bg-[#F0F7EE] dark:bg-white/10 text-[#3E4D43] dark:text-white/80 hover:bg-[#E2EFE0] dark:hover:bg-white/15'
                }`}
              >
                <span>{corr.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    corr.overallRisk === 'Critical'
                      ? 'bg-red-500 text-white'
                      : corr.overallRisk === 'Elevated'
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#A3E635] text-[#0A1912]'
                  }`}
                >
                  {corr.overallRisk}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Corridor Risk Dossier Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#F9FCF8] dark:bg-white/5 p-6 rounded-3xl border border-[#EDF4EC] dark:border-white/10">
          
          {/* Left Column: Corridor Summary & Zone Tagging */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#56635B] dark:text-white/60 uppercase tracking-wider">
                  Monitored Corridor
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${currentCorridor.bgLight} ${currentCorridor.riskColor}`}>
                  Risk Status: {currentCorridor.overallRisk}
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0A1912] dark:text-white">
                {currentCorridor.name}
              </h3>
            </div>

            {/* Covered Zones Pills */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#56635B] dark:text-white/60 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                <span>Associated Administrative Zones:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentCorridor.zones.map((z) => (
                  <button
                    key={z}
                    onClick={() => onFilterByZone?.(z)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-[#D5E8D0] dark:border-white/10 text-xs font-bold text-[#075B36] dark:text-[#A3E635] hover:bg-[#075B36] hover:text-white transition-all shadow-2xs"
                  >
                    {z} ↗
                  </button>
                ))}
              </div>
            </div>

            {/* Key Crops */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#56635B] dark:text-white/60 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                <span>Primary Priority Commodities:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentCorridor.primaryCrops.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-lg bg-[#E2EFE0] dark:bg-white/10 text-xs font-bold text-[#14251D] dark:text-white"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Advisory Note */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 space-y-2">
              <span className="text-xs font-black text-[#075B36] dark:text-[#A3E635] flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                <span>Surveillance Summary</span>
              </span>
              <p className="text-xs text-[#3E4D43] dark:text-white/80 leading-relaxed font-normal">
                {currentCorridor.advisoryNote}
              </p>
            </div>
          </div>

          {/* Right Column: 4 Factor Metric Gauges & Urgent Action */}
          <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-black text-[#56635B] dark:text-white/60 uppercase tracking-wider block">
                Agro-Climatic & Biotic Stress Indicators
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentCorridor.factors.map((factor, idx) => {
                  const Icon = factor.icon;
                  const isHigh = factor.level === 'High' || factor.level === 'Severe';
                  const isMod = factor.level === 'Moderate';
                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#181F1B] rounded-2xl p-4 border border-[#E2EFE0] dark:border-white/10 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-black text-[#0A1912] dark:text-white leading-tight">
                            {factor.name}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-[#56635B] dark:text-white/60">Risk Level:</span>
                          <span
                            className={
                              isHigh
                                ? 'text-red-600 dark:text-red-400'
                                : isMod
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-[#A3E635]'
                            }
                          >
                            {factor.level} ({factor.score}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-[#EDF4EC] dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHigh
                                ? 'bg-red-500'
                                : isMod
                                ? 'bg-amber-500'
                                : 'bg-[#075B36] dark:bg-[#A3E635]'
                            }`}
                            style={{ width: `${factor.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Action Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#075B36] text-white space-y-2 shadow-md">
              <div className="flex items-center gap-2 text-xs font-black text-[#A3E635] uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Standard Agronomic Action Protocol</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
                {currentCorridor.recommendedAction}
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
