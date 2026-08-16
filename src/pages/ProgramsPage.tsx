import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockPrograms } from '../data/mockData';
import { Program } from '../types';
import { ProgramsHero } from '../components/programs/ProgramsHero';
import { ProgramsImpactStats } from '../components/programs/ProgramsImpactStats';
import { ProgramCard } from '../components/programs/ProgramCard';
import { ProgramDossierModal } from '../components/programs/ProgramDossierModal';
import { ProgramsZonalMatrix } from '../components/programs/ProgramsZonalMatrix';
import { ProgramsEnrollmentGuide } from '../components/programs/ProgramsEnrollmentGuide';
import { ProgramsCTA } from '../components/programs/ProgramsCTA';
import { Sparkles, SearchX, RefreshCcw } from 'lucide-react';

export const ProgramsPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeDossierProgram, setActiveDossierProgram] = useState<Program | null>(null);

  // Filter programs based on search query and category selection
  const filteredPrograms = useMemo(() => {
    return mockPrograms.filter((prog) => {
      const matchesCategory =
        selectedCategory === 'all' || prog.categoryKey === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const title = (t(prog.titleKey) || '').toLowerCase();
      const desc = (t(prog.descriptionKey) || '').toLowerCase();
      const area = (prog.targetArea || '').toLowerCase();
      const badge = (prog.badgeKey || '').toLowerCase();
      const commodities = (prog.commodities || []).join(' ').toLowerCase();
      const zones = (prog.zones || []).join(' ').toLowerCase();

      return (
        title.includes(q) ||
        desc.includes(q) ||
        area.includes(q) ||
        badge.includes(q) ||
        commodities.includes(q) ||
        zones.includes(q)
      );
    });
  }, [searchQuery, selectedCategory, t]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div id="programs-page-main" className="min-h-screen bg-[#F8FAF7] dark:bg-[#070908] transition-colors duration-200">
      {/* 1. Hero with Live Search & Category Filter */}
      <ProgramsHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalCount={filteredPrograms.length}
      />

      {/* 2. Key Scale Impact Statistics */}
      <ProgramsImpactStats />

      {/* 3. Main Programs Grid Section */}
      <section id="programs-grid-section" className="py-16 sm:py-20 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#075B36] dark:text-[#A3E635] tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Flagship Strategic Initiatives ({filteredPrograms.length})</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight">
              Active Regional Transformation Portfolios
            </h2>
          </div>

          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E5EFE2] dark:bg-white/10 hover:bg-[#D5E6D1] text-[#075B36] dark:text-[#A3E635] text-xs font-bold transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPrograms.map((prog, idx) => (
              <ProgramCard
                key={prog.id}
                program={prog}
                index={idx}
                onOpenDossier={(p) => setActiveDossierProgram(p)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 p-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-white/5 flex items-center justify-center mx-auto text-[#075B36] dark:text-[#A3E635]">
              <SearchX className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-[#0A1912] dark:text-white">
              No matching programs found
            </h3>
            <p className="text-sm text-[#56635B] dark:text-white/60 max-w-md mx-auto">
              We couldn't find any agricultural programs matching "{searchQuery}". Try adjusting your keywords or clearing the category filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-xl bg-[#075B36] text-white font-bold text-xs hover:bg-[#06472A] transition-colors"
            >
              Show All Flagship Programs
            </button>
          </div>
        )}
      </section>

      {/* 4. Agro-Ecological Corridor & Regional Zonal Matrix */}
      <ProgramsZonalMatrix />

      {/* 5. Farmer & Cooperative Participation Roadmap */}
      <ProgramsEnrollmentGuide />

      {/* 6. Closing Bureau Action Section */}
      <ProgramsCTA />

      {/* 7. Deep-Dive Dossier Modal Dialog */}
      <ProgramDossierModal
        program={activeDossierProgram}
        onClose={() => setActiveDossierProgram(null)}
      />
    </div>
  );
};
