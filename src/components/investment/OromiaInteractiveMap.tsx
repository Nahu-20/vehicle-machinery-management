import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  X,
  Sprout,
  Truck,
  Briefcase,
  ChevronRight,
  Info,
  CheckCircle2,
  Building2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { InvestmentZonePotential } from '../../types/investment';
import { oromiaAllZonesData } from '../../data/investmentData';

interface OromiaInteractiveMapProps {
  onSelectZone?: (zone: InvestmentZonePotential) => void;
  selectedZoneId?: string | null;
  className?: string;
  showDetailsModal?: boolean;
}

export const OromiaInteractiveMap: React.FC<OromiaInteractiveMapProps> = ({
  onSelectZone,
  selectedZoneId: externalSelectedZoneId,
  className = '',
  showDetailsModal = true,
}) => {
  const { t, language } = useLanguage();
  const [internalSelectedZone, setInternalSelectedZone] = useState<InvestmentZonePotential | null>(null);
  const [hoveredZone, setHoveredZone] = useState<InvestmentZonePotential | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCommodity, setFilterCommodity] = useState<string>('all');
  const [activeLayer, setActiveLayer] = useState<'all' | 'coffee' | 'cereal' | 'irrigation'>('all');

  const selectedZone = externalSelectedZoneId
    ? oromiaAllZonesData.find((z) => z.id === externalSelectedZoneId) || internalSelectedZone
    : internalSelectedZone;

  const handleZoneClick = (zone: InvestmentZonePotential) => {
    setInternalSelectedZone(zone);
    if (onSelectZone) {
      onSelectZone(zone);
    }
  };

  const getZoneDisplayName = (zone: InvestmentZonePotential) => {
    if (language === 'om' && zone.oromoName) return zone.oromoName;
    if (language === 'am' && zone.amharicName) return zone.amharicName;
    return zone.zoneName;
  };

  const filteredZones = oromiaAllZonesData.filter((zone) => {
    const matchesSearch =
      zone.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (zone.oromoName && zone.oromoName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      zone.majorCrops.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterCommodity === 'all') return matchesSearch;
    const matchesCommodity = zone.majorCrops.some((crop) =>
      crop.toLowerCase().includes(filterCommodity.toLowerCase())
    );
    return matchesSearch && matchesCommodity;
  });

  // Highlight check based on active layer
  const isZoneHighlighted = (zone: InvestmentZonePotential) => {
    if (activeLayer === 'coffee') {
      return zone.majorCrops.some((c) => c.toLowerCase().includes('coffee'));
    }
    if (activeLayer === 'cereal') {
      return zone.majorCrops.some((c) =>
        ['wheat', 'maize', 'barley', 'teff', 'tef'].some((grain) => c.toLowerCase().includes(grain))
      );
    }
    if (activeLayer === 'irrigation') {
      return (
        zone.irrigationAccess.toLowerCase().includes('river') ||
        zone.irrigationAccess.toLowerCase().includes('lake') ||
        zone.irrigationAccess.toLowerCase().includes('basin')
      );
    }
    return true;
  };

  return (
    <div className={`relative w-full rounded-3xl bg-[#031D13] border border-emerald-800/40 text-white overflow-hidden shadow-2xl ${className}`}>
      
      {/* BACKGROUND DECORATIVE GRID */}
      <div className="absolute inset-0 bg-[radial-gradient(#A3E635_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* MAP HEADER BAR & FILTERS */}
      <div className="relative z-10 p-4 sm:p-6 bg-gradient-to-b from-[#02150D] to-transparent border-b border-emerald-900/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] text-xs font-bold uppercase tracking-wider mb-1.5 border border-[#A3E635]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Oromia Regional GIS Map</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            21 Administrative Zones of Oromia
          </h3>
          <p className="text-xs sm:text-sm text-emerald-200/80">
            Click any zone to inspect agricultural crop clusters, production potential, and investment opportunities.
          </p>
        </div>

        {/* SEARCH & LAYER CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-48 lg:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search zone or crop..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 text-xs text-white placeholder-emerald-300/50 border border-emerald-800/60 focus:outline-none focus:border-[#A3E635] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Commodity Layer Pill Buttons */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-emerald-800/60 text-xs">
            {[
              { id: 'all', label: 'All Zones' },
              { id: 'coffee', label: '☕ Coffee' },
              { id: 'cereal', label: '🌾 Wheat & Grains' },
              { id: 'irrigation', label: '💧 Irrigation' },
            ].map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveLayer(layer.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeLayer === layer.id
                    ? 'bg-[#A3E635] text-[#063D2A] shadow-xs'
                    : 'text-emerald-200/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG INTERACTIVE MAP CANVAS */}
      <div className="relative w-full aspect-[16/11] sm:aspect-[16/10] max-h-[620px] p-2 sm:p-4 flex items-center justify-center select-none overflow-hidden">
        <svg
          viewBox="0 0 1000 780"
          className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-all duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow Filter for Selected / Hovered Zone */}
            <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <linearGradient id="gridBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#042318" />
              <stop offset="100%" stopColor="#01120B" />
            </linearGradient>
          </defs>

          {/* MAP VECTOR PATHS FOR ALL 21 ZONES OF OROMIA */}
          <g className="zones-group">
            {oromiaAllZonesData.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const isHovered = hoveredZone?.id === zone.id;
              const highlighted = isZoneHighlighted(zone);
              const isSearchResult =
                !searchQuery ||
                zone.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (zone.oromoName && zone.oromoName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                zone.majorCrops.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

              const fillOpacity = isSelected ? 0.95 : isHovered ? 0.85 : highlighted && isSearchResult ? 0.75 : 0.25;
              const strokeColor = isSelected
                ? '#A3E635'
                : isHovered
                ? '#FFFFFF'
                : highlighted && isSearchResult
                ? zone.color || '#34D399'
                : '#064E3B';
              const strokeWidth = isSelected ? 3.5 : isHovered ? 2.5 : 1.2;

              return (
                <g key={zone.id} className="zone-item group/path">
                  {/* Zone Polygon Path */}
                  <path
                    d={zone.svgPath}
                    fill={zone.color || '#10B981'}
                    fillOpacity={fillOpacity}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-200 hover:filter hover:drop-shadow-lg"
                    filter={isSelected ? 'url(#mapGlow)' : undefined}
                    onClick={() => handleZoneClick(zone)}
                    onMouseEnter={() => setHoveredZone(zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                  />

                  {/* Zone Label Text */}
                  {zone.labelX && zone.labelY && (
                    <g
                      transform={`translate(${zone.labelX}, ${zone.labelY})`}
                      className="pointer-events-none cursor-pointer"
                    >
                      {/* Background pill behind label for contrast */}
                      <rect
                        x="-42"
                        y="-11"
                        width="84"
                        height="18"
                        rx="9"
                        fill="#02120B"
                        fillOpacity={isSelected ? 0.95 : isHovered ? 0.9 : 0.75}
                        stroke={isSelected ? '#A3E635' : isHovered ? '#FFFFFF' : 'transparent'}
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        y="1.5"
                        className={`text-[10.5px] font-extrabold tracking-tight transition-all ${
                          isSelected
                            ? 'fill-[#A3E635] text-[#A3E635]'
                            : isHovered
                            ? 'fill-white'
                            : highlighted && isSearchResult
                            ? 'fill-emerald-100'
                            : 'fill-emerald-600/50'
                        }`}
                      >
                        {getZoneDisplayName(zone)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* CAPITAL FINFINNEE MARKER */}
          <g transform="translate(502, 148)" className="pointer-events-none">
            <circle r="8" fill="#F43F5E" fillOpacity="0.3" className="animate-ping" />
            <circle r="4" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="8" y="3" fill="#FFFFFF" className="text-[10px] font-black tracking-wider uppercase">
              Finfinnee
            </text>
          </g>
        </svg>

        {/* HOVER TOOLTIP CARD */}
        <AnimatePresence>
          {hoveredZone && !selectedZone && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-4 left-4 z-20 p-4 rounded-2xl bg-black/90 backdrop-blur-md border border-[#A3E635]/40 text-white max-w-xs shadow-xl pointer-events-none"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredZone.color || '#A3E635' }} />
                <h4 className="font-extrabold text-sm text-[#A3E635]">{getZoneDisplayName(hoveredZone)}</h4>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium mb-1.5">{hoveredZone.agroZone}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {hoveredZone.majorCrops.slice(0, 3).map((crop) => (
                  <span key={crop} className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-[10px] text-emerald-300 border border-emerald-800/50">
                    {crop}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-gray-300 flex items-center gap-1">
                <Info className="w-3 h-3 text-[#A3E635]" />
                Click to view full investment breakdown
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAP LEGEND / FOOTER STATS */}
      <div className="relative z-10 p-4 bg-[#02150D] border-t border-emerald-900/40 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200/80">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#34D399]" />
            <span>Coffee & Agro-Forestry</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FACC15]" />
            <span>Grain & Cereal Belt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E879F9]" />
            <span>Irrigated Horticulture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F97316]" />
            <span>Pastoral & Livestock</span>
          </div>
        </div>

        <div className="font-semibold text-emerald-400">
          Click any zone to inspect verified Bureau dataset
        </div>
      </div>

      {/* SELECTED ZONE DETAILS MODAL / SIDE DRAWER */}
      <AnimatePresence>
        {selectedZone && showDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setInternalSelectedZone(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-3xl bg-[#082218] border border-emerald-500/30 text-white p-6 sm:p-8 shadow-2xl overflow-hidden my-auto"
            >
              {/* Background gradient banner */}
              <div
                className="absolute top-0 left-0 right-0 h-3"
                style={{ backgroundColor: selectedZone.color || '#A3E635' }}
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setInternalSelectedZone(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* ZONE HEADER */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3E635]/20 text-[#A3E635] text-xs font-bold uppercase mb-2 border border-[#A3E635]/30">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Administrative Zone • Oromia Regional State</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {getZoneDisplayName(selectedZone)}
                </h3>
                {selectedZone.oromoName && (
                  <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                    {selectedZone.oromoName} {selectedZone.amharicName ? `• ${selectedZone.amharicName}` : ''}
                  </p>
                )}
                <p className="text-sm text-emerald-200/90 mt-2 font-medium">
                  <strong>Agro-ecological Belt:</strong> {selectedZone.agroZone}
                </p>
              </div>

              {/* GRID BREAKDOWN OF ZONE DATA */}
              <div className="space-y-4">
                
                {/* 1. MAJOR COMMODITIES & CROPS */}
                <div className="p-4 rounded-2xl bg-black/40 border border-emerald-800/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A3E635] mb-2 flex items-center gap-2">
                    <Sprout className="w-4 h-4" />
                    <span>Major Agricultural Commodities & Crops</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedZone.majorCrops.map((crop) => (
                      <span
                        key={crop}
                        className="px-3 py-1 rounded-xl bg-[#063D2A] text-emerald-100 text-xs font-bold border border-emerald-600/40"
                      >
                        ✓ {crop}
                      </span>
                    ))}
                  </div>
                  {selectedZone.annualProduction && (
                    <p className="text-xs text-emerald-200/90 mt-3 pt-2 border-t border-emerald-900/50">
                      <strong>Annual Estimate:</strong> {selectedZone.annualProduction}
                    </p>
                  )}
                </div>

                {/* 2. IRRIGATION & WATER SYSTEMS */}
                <div className="p-4 rounded-2xl bg-black/40 border border-emerald-800/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A3E635] mb-1.5 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Irrigation Access & Water Basins</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    {selectedZone.irrigationAccess}
                  </p>
                </div>

                {/* 3. PRIORITY PROJECTS & OPPORTUNITIES */}
                {selectedZone.keyProjects && selectedZone.keyProjects.length > 0 && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-emerald-800/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#A3E635] mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>Priority Bureau Agribusiness Projects</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-emerald-100/90">
                      {selectedZone.keyProjects.map((proj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635] shrink-0 mt-0.5" />
                          <span>{proj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 4. VERIFIED NOTICE */}
                {selectedZone.verifiedNotice && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#A3E635] shrink-0" />
                    <span>{selectedZone.verifiedNotice}</span>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="mt-6 pt-4 border-t border-emerald-900/60 flex items-center justify-between">
                <span className="text-xs text-emerald-300/70">Source: Oromia Agricultural Bureau Dataset</span>
                <button
                  type="button"
                  onClick={() => setInternalSelectedZone(null)}
                  className="px-5 py-2 rounded-xl bg-[#A3E635] hover:bg-[#b5f048] text-[#063D2A] font-extrabold text-xs sm:text-sm transition-colors"
                >
                  Done Inspecting
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
