import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Publication } from '../types';
import { getPrototypeResourcePublications } from '../data/resourcePrototypeSeedData';
import { listPublishedResources, resourceToPublication } from '../services/resourceService';
import { ResourcesHero } from '../components/resources/ResourcesHero';
import { ResourcesStatsBanner } from '../components/resources/ResourcesStatsBanner';
import { FeaturedResourceSpotlight } from '../components/resources/FeaturedResourceSpotlight';
import { ResourceCard } from '../components/resources/ResourceCard';
import { ResourceDetailModal } from '../components/resources/ResourceDetailModal';
import { ResourceVideoModal } from '../components/resources/ResourceVideoModal';
import { ResourceRequestModal } from '../components/resources/ResourceRequestModal';
import { FarmerToolkitDownloads } from '../components/resources/FarmerToolkitDownloads';
import { ResourcesSMSKnowledgeHub } from '../components/resources/ResourcesSMSKnowledgeHub';
import { ResourcesFAQ } from '../components/resources/ResourcesFAQ';
import { ResourcesCTA } from '../components/resources/ResourcesCTA';
import {
  Search,
  LayoutGrid,
  List,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { t } = useLanguage();

  const [catalog, setCatalog] = useState<Publication[]>(() => getPrototypeResourcePublications());
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'newest' | 'title'>('downloads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selectedDocModal, setSelectedDocModal] = useState<Publication | null>(null);
  const [selectedVideoModal, setSelectedVideoModal] = useState<Publication | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    listPublishedResources()
      .then((rows) => {
        if (cancelled) return;
        if (rows.length > 0) {
          setCatalog(rows.map(resourceToPublication));
        } else {
          setCatalog(getPrototypeResourcePublications());
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCatalog(getPrototypeResourcePublications());
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const spotlightDoc = useMemo(() => {
    return catalog.find((p) => p.featured && p.format === 'PDF') || catalog[0] || null;
  }, [catalog]);

  const filteredPublications = useMemo(() => {
    return catalog
      .filter((pub) => {
        const title = (t(pub.titleKey) || pub.defaultTitle || '').toLowerCase();
        const desc = (t(pub.descriptionKey) || pub.defaultDescription || '').toLowerCase();
        const query = searchQuery.toLowerCase().trim();

        const matchesQuery =
          !query ||
          title.includes(query) ||
          desc.includes(query) ||
          (pub.category && pub.category.toLowerCase().includes(query)) ||
          (pub.tags && pub.tags.some((tag) => tag.toLowerCase().includes(query))) ||
          (pub.authorOrOffice && pub.authorOrOffice.toLowerCase().includes(query));

        const matchesCategory =
          selectedCategory === 'all' ||
          (pub.category && pub.category.toLowerCase() === selectedCategory.toLowerCase());

        const matchesFormat =
          selectedFormat === 'all' ||
          pub.format.toLowerCase() === selectedFormat.toLowerCase() ||
          (selectedFormat === 'mp4' && pub.type === 'video');

        const matchesLanguage =
          selectedLanguage === 'all' ||
          pub.language.toLowerCase().includes(selectedLanguage.toLowerCase());

        return matchesQuery && matchesCategory && matchesFormat && matchesLanguage;
      })
      .sort((a, b) => {
        if (sortBy === 'downloads') {
          return (b.downloadsCount || 0) - (a.downloadsCount || 0);
        }
        if (sortBy === 'newest') {
          return (b.publishedDate || '').localeCompare(a.publishedDate || '');
        }
        if (sortBy === 'title') {
          const titleA = t(a.titleKey) || a.defaultTitle || '';
          const titleB = t(b.titleKey) || b.defaultTitle || '';
          return titleA.localeCompare(titleB);
        }
        return 0;
      });
  }, [catalog, searchQuery, selectedCategory, selectedFormat, selectedLanguage, sortBy, t]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedFormat('all');
    setSelectedLanguage('all');
    setSortBy('downloads');
  };

  return (
    <div className="bg-[#F6F7F3] dark:bg-[#0A110D] min-h-screen text-[#111310] dark:text-white transition-colors duration-200 overflow-x-hidden">
      <ResourcesHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedFormat={selectedFormat}
        onSelectFormat={setSelectedFormat}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        totalFiltered={filteredPublications.length}
        totalAll={catalog.length}
        onRequestOpen={() => setIsRequestModalOpen(true)}
      />

      <ResourcesStatsBanner />

      {!searchQuery && selectedCategory === 'all' && spotlightDoc && (
        <section className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <FeaturedResourceSpotlight
            publication={spotlightDoc}
            onQuickPreview={(pub) => setSelectedDocModal(pub)}
          />
        </section>
      )}

      <section id="publications-grid" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight">
              Official Extension Documents & Manuals
            </h2>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70">
              {catalogLoading
                ? 'Loading verified publications…'
                : `Showing ${filteredPublications.length} verified publications available for open download`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-white dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 px-3 py-2 rounded-xl text-xs shadow-2xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-extrabold text-[#0A1912] dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="downloads" className="bg-[#F6F7F3] dark:bg-[#111813] text-[#111310] dark:text-white">
                  Most Downloaded
                </option>
                <option value="newest" className="bg-[#F6F7F3] dark:bg-[#111813] text-[#111310] dark:text-white">
                  Recently Updated
                </option>
                <option value="title" className="bg-[#F6F7F3] dark:bg-[#111813] text-[#111310] dark:text-white">
                  Alphabetical Order
                </option>
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 p-1 rounded-xl shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#075B36] text-white dark:bg-[#A3E635] dark:text-[#053B23]'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#075B36] text-white dark:bg-[#A3E635] dark:text-[#053B23]'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {(selectedCategory !== 'all' ||
              searchQuery ||
              selectedFormat !== 'all' ||
              selectedLanguage !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/10 text-xs font-bold text-[#075B36] dark:text-[#A3E635] border border-[#D5E8D0] dark:border-white/10 hover:bg-[#F0F7EE] transition-all shadow-2xs"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {filteredPublications.length === 0 ? (
          <div className="rounded-3xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#111813] p-12 sm:p-16 text-center space-y-4 shadow-sm">
            <div className="inline-flex p-4 rounded-2xl bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635]">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-[#0A1912] dark:text-white">
              No publications found matching your criteria
            </h3>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/60 max-w-md mx-auto">
              Try adjusting your search terms, changing the format filter, or contact our extension hotline at <strong>8844</strong>.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#075B36] hover:bg-[#054829] px-5 py-2.5 text-xs font-black text-white shadow-md transition-all"
            >
              <RotateCcw className="h-4 w-4 text-[#A3E635]" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredPublications.map((pub) => (
              <ResourceCard
                key={pub.id}
                publication={pub}
                viewMode={viewMode}
                onPreview={(p) => setSelectedDocModal(p)}
                onPlayVideo={(p) => setSelectedVideoModal(p)}
              />
            ))}
          </div>
        )}
      </section>

      <FarmerToolkitDownloads />
      <ResourcesSMSKnowledgeHub />
      <ResourcesFAQ />
      <ResourcesCTA onRequestOpen={() => setIsRequestModalOpen(true)} />

      <ResourceDetailModal
        publication={selectedDocModal}
        onClose={() => setSelectedDocModal(null)}
      />

      <ResourceVideoModal
        publication={selectedVideoModal}
        onClose={() => setSelectedVideoModal(null)}
      />

      <ResourceRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
};
