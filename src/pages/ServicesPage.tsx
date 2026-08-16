import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { detailedServices, DetailedService } from '../data/servicesData';
import { ServicesHero } from '../components/services/ServicesHero';
import { ServicesImpactStats } from '../components/services/ServicesImpactStats';
import { ServiceCard } from '../components/services/ServiceCard';
import { ServiceDetailModal } from '../components/services/ServiceDetailModal';
import { ServicesCalculator } from '../components/services/ServicesCalculator';
import { ServicesProcessWorkflow } from '../components/services/ServicesProcessWorkflow';
import { ServicesFAQ } from '../components/services/ServicesFAQ';
import { ServicesCTA } from '../components/services/ServicesCTA';
import { Search, SlidersHorizontal, RotateCcw, Sparkles } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeServiceModal, setActiveServiceModal] = useState<DetailedService | null>(null);

  // Filter services based on category & search query
  const filteredServices = useMemo(() => {
    return detailedServices.filter((srv) => {
      const title = (t(srv.titleKey) || srv.defaultTitle).toLowerCase();
      const desc = (t(srv.descriptionKey) || srv.defaultDesc).toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        desc.includes(query) ||
        srv.category.toLowerCase().includes(query) ||
        srv.categoryLabel.toLowerCase().includes(query) ||
        srv.keyFeatures.some((feat) => feat.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'all' || srv.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, t]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="bg-[#F6F7F3] dark:bg-[#0A110D] min-h-screen text-[#111310] dark:text-white transition-colors duration-200 overflow-x-hidden">
      {/* 1. Hero Section with Photographic Backdrop & Wrapped Search/Filter Header */}
      <ServicesHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalCount={filteredServices.length}
      />

      {/* 2. Key Operational Metrics & Delivery Capabilities Banner */}
      <ServicesImpactStats />

      {/* 3. Main Services Catalog Grid */}
      <section id="services-grid-section" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight">
              Official Agricultural Portfolios
            </h2>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70">
              Showing {filteredServices.length} of {detailedServices.length} regional services
            </p>
          </div>

          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 text-xs font-bold text-[#075B36] dark:text-[#A3E635] border border-[#D5E8D0] dark:border-white/10 hover:bg-[#F0F7EE] transition-all shrink-0 self-start sm:self-auto shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Services List / Cards */}
        {filteredServices.length === 0 ? (
          <div className="rounded-3xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#111613] p-12 sm:p-16 text-center space-y-4 shadow-sm">
            <div className="inline-flex p-4 rounded-2xl bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635]">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-[#0A1912] dark:text-white">
              No services found matching "{searchQuery}"
            </h3>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/60 max-w-md mx-auto">
              Try adjusting your search terms, removing category filters, or dial <strong>8888</strong> for general operator guidance.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#075B36] hover:bg-[#054629] px-5 py-2.5 text-xs font-black text-white shadow-md transition-all"
            >
              <RotateCcw className="h-4 w-4 text-[#A3E635]" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredServices.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                onOpenModal={setActiveServiceModal}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Interactive Agronomic & Soil Lime Calculators */}
      <ServicesCalculator />

      {/* 5. 4-Step Standardized Service Access Workflow */}
      <ServicesProcessWorkflow />

      {/* 6. Frequently Asked Questions (FAQ) */}
      <ServicesFAQ />

      {/* 7. Closing Action Banner */}
      <ServicesCTA />

      {/* 8. Service Detail & Request Modal */}
      <ServiceDetailModal
        service={activeServiceModal}
        onClose={() => setActiveServiceModal(null)}
      />
    </div>
  );
};
