import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  Search,
  ArrowRight,
  Calendar,
  Building2,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  TrendingUp,
  Sprout,
  Beef,
  Trees,
  Droplets,
  GraduationCap,
  Users,
  ChevronLeft,
  Quote,
  FileText,
  Download,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  mockTimeline,
  mockProgramImpacts,
  mockBeforeAfter,
  mockReports,
} from '../data/mockData';
import { PublicAchievement, AchievementCategory } from '../types/achievement';
import { getPublishedAchievementsPaginated } from '../services/achievementService';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export const AchievementsPage: React.FC = () => {
  const { language, t, getLocalizedText } = useLanguage();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Pagination state
  const [achievements, setAchievements] = useState<PublicAchievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [cursorStack, setCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);

  // Categories list
  const categories: { key: string; label: string }[] = [
    { key: 'all', label: t('achievements_all_programs') || 'All Programs' },
    { key: 'productivity', label: 'Productivity & Crop Output' },
    { key: 'irrigation', label: 'Irrigation & Water' },
    { key: 'livestock', label: 'Livestock & Health' },
    { key: 'extension', label: 'Agronomy Extension' },
    { key: 'mechanization', label: 'Mechanization' },
    { key: 'natural-resources', label: 'Natural Resources' },
    { key: 'market-access', label: 'Market Access' },
    { key: 'youth-and-women', label: 'Youth & Women' },
    { key: 'other', label: 'Other Initiatives' },
  ];

  // Fetch paginated achievements
  useEffect(() => {
    let isMounted = true;
    async function loadAchievements() {
      setLoading(true);
      setError(null);
      try {
        const catFilter = selectedCategory === 'all' ? undefined : (selectedCategory as AchievementCategory);
        const lastDoc = cursorStack[page - 1] || undefined;
        
        const result = await getPublishedAchievementsPaginated(
          {
            category: catFilter,
            searchQuery: searchQuery.trim() || undefined,
          },
          9,
          lastDoc
        );

        if (isMounted) {
          setAchievements(result.achievements);
          setHasMore(result.hasMore);
          if (result.hasMore && result.lastDocSnapshot && cursorStack.length <= page) {
            setCursorStack((prev) => {
              const next = [...prev];
              next[page] = result.lastDocSnapshot;
              return next;
            });
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[AchievementsPage] Failed to load achievements:', err);
          setError(err.message || 'Failed to load achievements.');
          setAchievements([]);
          setLoading(false);
        }
      }
    }

    loadAchievements();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery, page]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    setCursorStack([null]);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setCursorStack([null]);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPage(1);
    setCursorStack([null]);
  };

  const nextPage = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  // Helper function to render Program Icon
  const renderProgramIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout': return <Sprout className="w-6 h-6" />;
      case 'Beef': return <Beef className="w-6 h-6" />;
      case 'Trees': return <Trees className="w-6 h-6" />;
      case 'Droplets': return <Droplets className="w-6 h-6" />;
      case 'GraduationCap': return <GraduationCap className="w-6 h-6" />;
      case 'Users': return <Users className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Breadcrumb Header */}
      <div className="bg-slate-900 text-white py-12 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-900/40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-4">
            <Link to="/" className="hover:underline">
              {t('nav_home')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-300">{t('nav_achievements')}</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-4">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>{t('achievements_label')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t('achievements_title')}
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed">
            {t('achievements_subtitle')}
          </p>

          {/* Aggregate Regional Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">2.4M+</div>
              <div className="text-xs text-slate-400 mt-1">{t('farmers_supported')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">450,000+</div>
              <div className="text-xs text-slate-400 mt-1">{t('hectares_improved')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">320+</div>
              <div className="text-xs text-slate-400 mt-1">{t('training_delivered')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">180+</div>
              <div className="text-xs text-slate-400 mt-1">{t('projects_completed')}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Section: Search and Filter Bar */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('achievements_filter_search')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters:</span>
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Clear Filters Button */}
              {(selectedCategory !== 'all' || searchQuery !== '') && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('achievements_clear_filters')}</span>
                </button>
              )}
            </div>

          </div>
        </section>

        {/* Section: Filtered Achievements Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>{t('achievements_in_action')}</span>
            </h2>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Page {page} {achievements.length > 0 ? `(${achievements.length} items)` : ''}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse space-y-4">
                  <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-8 text-center border border-red-200 dark:border-red-800/60">
              <Award className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
                Failed to load achievements
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2 max-w-md mx-auto">
                {error}
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-medium text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          ) : achievements.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('achievements_no_results')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                No published achievements found matching your selected filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('achievements_clear_filters')}</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {achievements.map((item) => {
                  const title = getLocalizedText(item.title);
                  const summary = getLocalizedText(item.summary);
                  const imageAlt = getLocalizedText(item.imageAlt) || title;
                  const office = getLocalizedText(item.responsibleOffice);
                  const displayImage = item.featuredImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80';

                  return (
                    <motion.div
                      key={item.slug}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                    >
                      {/* Image Container */}
                      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <img
                          src={displayImage}
                          alt={imageAlt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                        
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 font-bold text-xs backdrop-blur-md border border-emerald-500/30 capitalize">
                            {item.category}
                          </span>
                          {item.featured && (
                            <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold text-xs shadow">
                              Featured
                            </span>
                          )}
                        </div>

                        {item.publishedAt && (
                          <div className="absolute bottom-3 right-3 text-xs text-white font-bold px-2 py-0.5 rounded bg-slate-900/60 backdrop-blur-sm">
                            {new Date(item.publishedAt).getFullYear()}
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-3">
                            <Link to={`/achievements/${item.slug}`}>
                              {title}
                            </Link>
                          </h3>

                          <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-6">
                            {summary}
                          </p>
                        </div>

                        <div>
                          {/* Key metrics pill preview */}
                          {item.metrics && item.metrics.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 mb-6">
                              {item.metrics.slice(0, 2).map((m, idx) => (
                                <div key={m.id || idx} className="text-center">
                                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {m.value}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {getLocalizedText(m.label)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{office}</span>
                            </span>

                            <Link
                              to={`/achievements/${item.slug}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform"
                            >
                              <span>{t('view_full_story')}</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              <div className="flex items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-700 mt-12">
                <button
                  onClick={prevPage}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Page</span>
                </button>

                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Page {page}
                </span>

                <button
                  onClick={nextPage}
                  disabled={!hasMore}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next Page</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </section>

        {/* Section: Timeline of Milestones */}
        <section id="timeline" className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Historical Milestones</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t('achievement_timeline')}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Key developmental milestones and high-impact interventions implemented by the Oromia Agricultural Bureau across successive agricultural cycles.
            </p>
          </div>

          <div className="relative border-l-2 border-emerald-500/30 ml-4 sm:ml-6 space-y-8 pl-6 sm:pl-8">
            {mockTimeline.map((item) => (
              <div key={item.id} className="relative group">
                {/* Bullet */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white dark:border-slate-800 shadow-md" />

                <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-700 text-white font-extrabold text-xs">
                      {item.year}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.zone[language]} • {item.program[language]}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {item.title[language]}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {item.description[language]}
                  </p>

                  <Link
                    to={`/achievements/${item.achievementSlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <span>Read detailed report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Impact by Program */}
        <section>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t('impact_by_program')}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Systemic transformation delivered across core agricultural sectors in Oromia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProgramImpacts.map((prog) => (
              <div
                key={prog.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {renderProgramIcon(prog.iconName)}
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {prog.initiativesCount}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {prog.title[language]}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {prog.summary[language]}
                  </p>
                </div>

                <div className="relative h-32 rounded-xl overflow-hidden mt-4">
                  <img
                    src={prog.image}
                    alt={prog.title[language]}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Interactive Before-and-After Showcase */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('before_after_title')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              {mockBeforeAfter.projectTitle[language]}
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Comparing landscape rehabilitation and soil protection outcomes in {mockBeforeAfter.zone[language]} ({mockBeforeAfter.period}).
            </p>
          </div>

          {/* Image Comparison Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Before View */}
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 p-4">
              <div className="relative h-64 rounded-xl overflow-hidden mb-4">
                <img
                  src={mockBeforeAfter.beforeImage}
                  alt="Before Intervention"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-950/90 text-red-300 text-xs font-bold border border-red-500/30">
                  BEFORE INTERVENTION
                </span>
              </div>
              <p className="text-sm text-slate-300">
                {mockBeforeAfter.beforeDescription[language]}
              </p>
            </div>

            {/* After View */}
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-emerald-500/40 p-4">
              <div className="relative h-64 rounded-xl overflow-hidden mb-4">
                <img
                  src={mockBeforeAfter.afterImage}
                  alt="After Intervention"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  AFTER INTERVENTION
                </span>
              </div>
              <p className="text-sm text-slate-300">
                {mockBeforeAfter.afterDescription[language]}
              </p>
            </div>

          </div>

          {/* Metrics bar for Before-After */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            {mockBeforeAfter.metrics.map((m, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-extrabold text-emerald-400">{m.value}</div>
                <div className="text-xs text-slate-300 mt-1">{m.label[language]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Farmer Success Story Spotlight */}
        <section className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-5 relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-xl border border-emerald-700">
              <img
                src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=800"
                alt="Farmer Success Story"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-700">
                <Quote className="w-3.5 h-3.5" />
                <span>{t('success_story_spotlight')}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                "Modern Row Planting & High-Yield Seed Tripled My Harvest"
              </h2>

              <blockquote className="text-slate-200 text-base sm:text-lg italic leading-relaxed">
                "Working with the local extension agent from Sinana Woreda transformed my 3-hectare farm. Through crop rotation and certified seed distribution from the Bureau, I harvested over 120 quintals of wheat."
              </blockquote>

              <div className="pt-4 border-t border-emerald-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-white text-base">Obbo Kabiiraa Ahimad</div>
                  <div className="text-xs text-emerald-300">Smallholder Grain Farmer, Sinana Woreda, Bale Zone</div>
                </div>

                <Link
                  to="/achievements/improving-wheat-productivity-bale-zone"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 hover:bg-emerald-100 font-bold text-sm transition-colors shadow"
                >
                  <span>Read Full Case Study</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Official Reports & Evidence Download */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Impact Assessment Documentation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {t('reports_evidence')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {report.title[language]}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{report.year}</span>
                      <span>•</span>
                      <span>{report.format}</span>
                      <span>•</span>
                      <span>{report.fileSize}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={report.downloadUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Demo Mode: Downloading official report "${report.title[language]}" (${report.fileSize})`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-700 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Prototype Data Notice Banner */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
          {t('demo_data_notice')}
        </div>

      </main>
    </div>
  );
};
