import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calculator,
  Wheat,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  Scale,
} from 'lucide-react';

export const ServicesCalculator: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'fertilizer' | 'lime'>('fertilizer');

  // Fertilizer & Seed Calculator State
  const [selectedCrop, setSelectedCrop] = useState<'wheat' | 'maize' | 'teff' | 'barley' | 'soybean'>('wheat');
  const [farmSize, setFarmSize] = useState<number>(2);
  const [unitType, setUnitType] = useState<'hectares' | 'timad'>('hectares');

  // Soil Lime Calculator State
  const [soilPh, setSoilPh] = useState<number>(5.0);
  const [soilTexture, setSoilTexture] = useState<'clay' | 'loam' | 'sandy'>('clay');
  const [limeFarmSize, setLimeFarmSize] = useState<number>(2);

  // Conversion: 1 Hectare = 4 Timad in Ethiopia
  const hectares = unitType === 'hectares' ? farmSize : farmSize / 4;

  // Crop formulas per hectare (Ethiopian MOA / OAB standards)
  const cropFormulas = {
    wheat: {
      seedRateKgPerHa: 125,
      npsbKgPerHa: 100,
      ureaKgPerHa: 100,
      expectedYieldQPerHa: 52,
      variety: 'Kingbird / Dandaa (Certified Rust-Resistant)',
    },
    maize: {
      seedRateKgPerHa: 25,
      npsbKgPerHa: 150,
      ureaKgPerHa: 150,
      expectedYieldQPerHa: 75,
      variety: 'BH-661 / BH-546 (Hybrid High-Yield)',
    },
    teff: {
      seedRateKgPerHa: 12,
      npsbKgPerHa: 100,
      ureaKgPerHa: 50,
      expectedYieldQPerHa: 24,
      variety: 'Quncho (DZ-Cr-387) / Dagim (Row Planting)',
    },
    barley: {
      seedRateKgPerHa: 100,
      npsbKgPerHa: 100,
      ureaKgPerHa: 50,
      expectedYieldQPerHa: 45,
      variety: 'Traveler / Singitan (Malt Barley)',
    },
    soybean: {
      seedRateKgPerHa: 60,
      npsbKgPerHa: 100,
      ureaKgPerHa: 0, // Legume fixes nitrogen, bio-inoculant used
      expectedYieldQPerHa: 30,
      variety: 'Clark 63k / Gidami with Bio-Inoculant Rhizobium',
    },
  };

  const currentCrop = cropFormulas[selectedCrop];
  const totalSeedKg = Math.round(currentCrop.seedRateKgPerHa * hectares);
  const totalNpsbKg = Math.round(currentCrop.npsbKgPerHa * hectares);
  const totalUreaKg = Math.round(currentCrop.ureaKgPerHa * hectares);
  const totalYieldQuintals = Math.round(currentCrop.expectedYieldQPerHa * hectares);
  const totalBags50kg = Math.ceil((totalNpsbKg + totalUreaKg) / 50);

  // Soil Lime calculation (Tons per hectare to raise pH to 6.5)
  // Highly acidic (pH < 5.0): Clay requires ~3.5 T/ha, Loam ~2.5 T/ha, Sandy ~1.8 T/ha
  const getLimeTonsPerHa = (ph: number, texture: 'clay' | 'loam' | 'sandy') => {
    if (ph >= 6.5) return 0;
    const phDeficit = 6.5 - ph;
    const multiplier = texture === 'clay' ? 2.2 : texture === 'loam' ? 1.6 : 1.1;
    return Math.max(0, +(phDeficit * multiplier).toFixed(1));
  };

  const limeTonsPerHa = getLimeTonsPerHa(soilPh, soilTexture);
  const totalLimeTons = +(limeTonsPerHa * limeFarmSize).toFixed(1);
  const totalLimeQuintals = Math.round(totalLimeTons * 10);

  return (
    <section id="services-calculators-section" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 p-6 sm:p-8 lg:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] space-y-8">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#EDF4EC] dark:border-white/10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
              <Calculator className="h-3.5 w-3.5" />
              <span>Smart Agricultural Decision Support</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A1912] dark:text-white tracking-tight leading-tight">
              Interactive Input & Soil Lime Calculators
            </h2>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 leading-relaxed">
              Calculate exact certified seed quantities, subsidized blended NPSB/Urea fertilizer allocations, and agricultural lime requirements according to Oromia Agricultural Bureau agronomic formulas.
            </p>
          </div>

          {/* Calculator Selector Tabs (No horizontal scroll: flex-wrap) */}
          <div className="flex flex-wrap items-center gap-2 bg-[#F0F7EE] dark:bg-white/5 p-1.5 rounded-2xl border border-[#E2EFE0] dark:border-white/10 shrink-0">
            <button
              id="tab-calc-fertilizer"
              onClick={() => setActiveTab('fertilizer')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === 'fertilizer'
                  ? 'bg-[#075B36] text-white shadow-md'
                  : 'text-[#3E4D43] dark:text-white/70 hover:text-[#075B36] dark:hover:text-white'
              }`}
            >
              <Wheat className="h-4 w-4" />
              <span>Seed & Fertilizer Estimator</span>
            </button>

            <button
              id="tab-calc-lime"
              onClick={() => setActiveTab('lime')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                activeTab === 'lime'
                  ? 'bg-[#075B36] text-white shadow-md'
                  : 'text-[#3E4D43] dark:text-white/70 hover:text-[#075B36] dark:hover:text-white'
              }`}
            >
              <FlaskConical className="h-4 w-4" />
              <span>Soil Acidity (Lime) Estimator</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Fertilizer & Seed Calculator */}
        {activeTab === 'fertilizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Controls Left Column */}
            <div className="lg:col-span-5 space-y-5 bg-[#F9FCF8] dark:bg-white/5 p-6 rounded-2xl border border-[#E2EFE0] dark:border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635] flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Select Farmland Parameters
              </h3>

              {/* Crop Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A1912] dark:text-white">
                  Target Crop
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181F1B] border border-[#D5E8D0] dark:border-white/10 text-xs sm:text-sm font-bold text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                >
                  <option value="wheat">Wheat (Qamadii - Cluster Priority)</option>
                  <option value="maize">Maize (Boqqoolloo - Hybrid High-Yield)</option>
                  <option value="teff">Teff (Xaafii - Quncho Row Sowing)</option>
                  <option value="barley">Malt Barley (Garbuu - Agro-Processing)</option>
                  <option value="soybean">Soybean (Sooyaa - High Protein & Inoculant)</option>
                </select>
              </div>

              {/* Farm Size & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0A1912] dark:text-white">
                    Farm Area
                  </label>
                  <input
                    type="number"
                    min="0.25"
                    max="500"
                    step="0.25"
                    value={farmSize}
                    onChange={(e) => setFarmSize(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181F1B] border border-[#D5E8D0] dark:border-white/10 text-xs sm:text-sm font-bold text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#0A1912] dark:text-white">
                    Unit
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181F1B] border border-[#D5E8D0] dark:border-white/10 text-xs sm:text-sm font-bold text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                  >
                    <option value="hectares">Hectares (Ha)</option>
                    <option value="timad">Timad (1 Ha = 4 Timad)</option>
                  </select>
                </div>
              </div>

              {/* Recommended Variety Info */}
              <div className="p-3.5 rounded-xl bg-[#EBF5E8] dark:bg-white/10 border border-[#D5E8D0] dark:border-white/10 text-xs space-y-1">
                <span className="font-extrabold text-[#075B36] dark:text-[#A3E635] block">
                  Recommended Bureau Variety:
                </span>
                <p className="text-[#3E4D43] dark:text-white/80 font-medium">
                  {currentCrop.variety}
                </p>
              </div>
            </div>

            {/* Results Right Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seed Required Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#56635B] dark:text-white/60">Certified Seed Required</span>
                    <PackageCheck className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white">
                    {totalSeedKg} <span className="text-sm font-bold text-[#56635B]">kg</span>
                  </div>
                  <p className="text-[11px] text-[#075B36] dark:text-[#A3E635] font-semibold">
                    Standard rate: {currentCrop.seedRateKgPerHa} kg/hectare
                  </p>
                </div>

                {/* Blended NPSB Fertilizer */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#56635B] dark:text-white/60">Blended NPSB Fertilizer</span>
                    <FlaskConical className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white">
                    {totalNpsbKg} <span className="text-sm font-bold text-[#56635B]">kg</span>
                  </div>
                  <p className="text-[11px] text-[#075B36] dark:text-[#A3E635] font-semibold">
                    Apply at planting time ({Math.ceil(totalNpsbKg / 50)} bags of 50kg)
                  </p>
                </div>

                {/* Urea Top-Dressing */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#56635B] dark:text-white/60">Urea Nitrogen Top-Dress</span>
                    <Sparkles className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white">
                    {totalUreaKg} <span className="text-sm font-bold text-[#56635B]">kg</span>
                  </div>
                  <p className="text-[11px] text-[#075B36] dark:text-[#A3E635] font-semibold">
                    Split apply at 30 & 60 days after emergence
                  </p>
                </div>

                {/* Expected Yield Potential */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#075B36] to-[#04331E] text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-200">Expected Yield Potential</span>
                    <TrendingUp className="h-4 w-4 text-[#A3E635]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#A3E635]">
                    {totalYieldQuintals} <span className="text-sm font-bold text-white">Quintals</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 font-semibold">
                    Benchmark: ~{(totalYieldQuintals * 0.1).toFixed(1)} Metric Tons grain
                  </p>
                </div>
              </div>

              {/* Total Voucher Bags Summary */}
              <div className="p-4 rounded-xl bg-[#F0F7EE] dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 flex items-center justify-between text-xs text-[#2A3830] dark:text-white/80">
                <span>
                  Total 50kg Fertilizer Bags to Request at Union: <strong className="text-[#075B36] dark:text-[#A3E635] font-black">{totalBags50kg} Bags</strong>
                </span>
                <span className="font-bold text-[#075B36] dark:text-[#A3E635]">
                  Calculated for {hectares.toFixed(2)} Hectares
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Soil Acidity (Lime) Calculator */}
        {activeTab === 'lime' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Controls Left Column */}
            <div className="lg:col-span-5 space-y-5 bg-[#F9FCF8] dark:bg-white/5 p-6 rounded-2xl border border-[#E2EFE0] dark:border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635] flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Soil Lab Parameters
              </h3>

              {/* Soil pH Slider / Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0A1912] dark:text-white">
                    Tested Soil pH (Acidity Level)
                  </label>
                  <span className="text-xs font-black text-[#075B36] dark:text-[#A3E635] bg-[#EBF5E8] dark:bg-white/10 px-2 py-0.5 rounded-md">
                    pH {soilPh.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="7.0"
                  step="0.1"
                  value={soilPh}
                  onChange={(e) => setSoilPh(parseFloat(e.target.value))}
                  className="w-full accent-[#075B36]"
                />
                <div className="flex justify-between text-[10px] text-[#56635B] font-bold">
                  <span>pH 4.0 (Severely Acidic)</span>
                  <span>pH 5.5 (Moderate)</span>
                  <span>pH 6.5 (Optimal)</span>
                </div>
              </div>

              {/* Soil Texture */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A1912] dark:text-white">
                  Soil Texture Type
                </label>
                <select
                  value={soilTexture}
                  onChange={(e) => setSoilTexture(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181F1B] border border-[#D5E8D0] dark:border-white/10 text-xs sm:text-sm font-bold text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                >
                  <option value="clay">Heavy Clay / Vertisol (High buffer capacity)</option>
                  <option value="loam">Loam / Nitisol (Medium buffer capacity)</option>
                  <option value="sandy">Sandy Loam / Luvisol (Low buffer capacity)</option>
                </select>
              </div>

              {/* Farm Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A1912] dark:text-white">
                  Farmland Area (Hectares)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="200"
                  step="0.5"
                  value={limeFarmSize}
                  onChange={(e) => setLimeFarmSize(Math.max(0.25, parseFloat(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181F1B] border border-[#D5E8D0] dark:border-white/10 text-xs sm:text-sm font-bold text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                />
              </div>
            </div>

            {/* Results Right Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Lime Tons */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#56635B] dark:text-white/60">Total Agricultural Lime Required</span>
                    <Scale className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white">
                    {totalLimeTons} <span className="text-sm font-bold text-[#56635B]">Metric Tons</span>
                  </div>
                  <p className="text-[11px] text-[#075B36] dark:text-[#A3E635] font-semibold">
                    Equals {totalLimeQuintals} Quintals (100kg bags)
                  </p>
                </div>

                {/* Application Rate Per Ha */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#56635B] dark:text-white/60">Application Rate</span>
                    <FlaskConical className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white">
                    {limeTonsPerHa} <span className="text-sm font-bold text-[#56635B]">Tons / Hectare</span>
                  </div>
                  <p className="text-[11px] text-[#075B36] dark:text-[#A3E635] font-semibold">
                    Target soil pH: 6.5 (Neutral rooting zone)
                  </p>
                </div>
              </div>

              {/* Lime Application Guidelines */}
              <div className="p-5 rounded-2xl bg-[#F0F7EE] dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635]">
                  Agronomic Lime Application Protocol
                </h4>
                <div className="space-y-2 text-xs text-[#3E4D43] dark:text-white/80">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
                    <span>Apply agricultural lime (calcium carbonate / CaCO3) at least <strong>1 month before planting</strong> during first tillage.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
                    <span>Incorporate into top 15–20 cm soil layer with moldboard or disc plow for uniform dissolution.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
                    <span>One standard lime application remains effective for <strong>3 consecutive crop years</strong>.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
