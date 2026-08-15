import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  getPublicNewsArticlesPaginated,
  getPublicNewsSourceMode,
} from '../services/newsService';
import { NewsArticle } from '../types/news';
import { mockAnnouncements } from '../data/mockData';
import {
  comprehensiveEvents,
  comprehensiveTenders,
  EventItem,
  TenderItem,
} from '../data/newsEventsData';
import {
  Calendar,
  Download,
  Bell,
  ArrowRight,
  User,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  Filter,
  Newspaper,
  FileText,
  Radio,
  Building2,
  Sparkles,
} from 'lucide-react';

import { NewsHero } from '../components/news/NewsHero';
import { FeaturedStoriesSection } from '../components/news/FeaturedStoriesSection';
import { NewsSpotlightBanner } from '../components/news/NewsSpotlightBanner';
import { NewsArticlesGrid } from '../components/news/NewsArticlesGrid';
import { EventsCalendarSection } from '../components/news/EventsCalendarSection';
import { TendersSection } from '../components/news/TendersSection';
import { MediaRoomSection } from '../components/news/MediaRoomSection';
import { NewsAudioDispatch } from '../components/news/NewsAudioDispatch';
import { NewsNewsletterCTA } from '../components/news/NewsNewsletterCTA';
import { EventRSVPModal } from '../components/news/EventRSVPModal';
import { MediaAccreditationModal } from '../components/news/MediaAccreditationModal';
import { TenderDetailModal } from '../components/news/TenderDetailModal';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export const NewsPage: React.FC = () => {
  const { t, getLocalizedText, language } = useLanguage();
  const { showToast } = useToast();

  // Primary Tab Navigation
  const [activeMainTab, setActiveMainTab] = useState<'articles' | 'events' | 'tenders' | 'media'>('articles');

  // Category Filter for articles
  const [filter, setFilter] = useState<'all' | 'news' | 'training' | 'tender' | 'event'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Articles & Pagination
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [rsvpEvent, setRsvpEvent] = useState<EventItem | null>(null);
  const [selectedTender, setSelectedTender] = useState<TenderItem | null>(null);
  const [isAccreditationOpen, setIsAccreditationOpen] = useState(false);

  const isMockMode = getPublicNewsSourceMode() === 'mock';

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const startDoc = cursorStack[page - 1] || null;
        const res = await getPublicNewsArticlesPaginated(filter, 9, startDoc);
        setArticles(res.articles);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
        setTotalCount(res.totalCount);
      } catch (err) {
        console.warn('Failed to fetch paginated public news articles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [filter, page]);

  const handleCategoryChange = (newCategory: 'all' | 'news' | 'training' | 'tender' | 'event') => {
    setFilter(newCategory);
    setPage(1);
    setCursorStack([null]);
    setLastDoc(null);
  };

  const handleNextPage = () => {
    if (hasMore && lastDoc) {
      setCursorStack((prev) => [...prev, lastDoc]);
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setCursorStack((prev) => prev.slice(0, prev.length - 1));
      setPage((prev) => prev - 1);
    }
  };

  // Filter articles by search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((art) => {
      const title = getLocalizedText(art.title).toLowerCase();
      const excerpt = getLocalizedText(art.excerpt).toLowerCase();
      const tags = (art.tags || []).join(' ').toLowerCase();
      return title.includes(q) || excerpt.includes(q) || tags.includes(q);
    });
  }, [articles, searchQuery, getLocalizedText]);

  // Featured spotlight article
  const spotlightArticle = useMemo(() => {
    return articles.find((a) => a.featured) || articles[0] || null;
  }, [articles]);

  // Remaining articles excluding spotlight (when on page 1 of all)
  const regularArticles = useMemo(() => {
    if (page === 1 && filter === 'all' && !searchQuery.trim() && spotlightArticle) {
      return filteredArticles.filter((a) => a.slug !== spotlightArticle.slug);
    }
    return filteredArticles;
  }, [filteredArticles, spotlightArticle, page, filter, searchQuery]);

  const handleShareArticle = (article: NewsArticle) => {
    const title = getLocalizedText(article.title);
    const url = `${window.location.origin}/news/${article.slug}`;

    if (navigator.share) {
      navigator.share({
        title,
        url,
      }).catch(() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          showToast(t('news_share_copied'), 'success', title);
        }
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(t('news_share_copied'), 'success', title);
    }
  };

  return (
    <div className="bg-[#F8F7F2] dark:bg-gray-900 min-h-screen py-8 sm:py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Master Hero Banner */}
        <NewsHero
          articlesCount={totalCount || articles.length}
          eventsCount={comprehensiveEvents.length}
          tendersCount={comprehensiveTenders.length}
          activeTab={activeMainTab}
          onTabChange={(tab) => setActiveMainTab(tab)}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (activeMainTab !== 'articles') {
              setActiveMainTab('articles');
            }
          }}
          onOpenAccreditation={() => setIsAccreditationOpen(true)}
        />

        {/* Primary View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'articles', label: 'Press Releases & News', icon: Newspaper },
              { id: 'events', label: 'Events & Expos Calendar', icon: Calendar },
              { id: 'tenders', label: 'Procurement & Tenders', icon: FileText },
              { id: 'media', label: 'Media Room & Press Kits', icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMainTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-[#075D3A] dark:bg-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Source Notice indicator */}
          {isMockMode && (
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
              <Info className="w-3.5 h-3.5" />
              <span>Public Feed: Verified Bureau News</span>
            </div>
          )}
        </div>

        {/* TAB 1: ARTICLES & PRESS RELEASES */}
        {activeMainTab === 'articles' && (
          <div className="space-y-10">
            {/* 3-Column Featured Stories Grid matching reference image */}
            {page === 1 && !searchQuery.trim() && filter === 'all' && articles.length > 0 && (
              <FeaturedStoriesSection
                articles={articles}
                onViewAll={() => {
                  setFilter('all');
                  setSearchQuery('');
                  const el = document.getElementById('articles-feed-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}

            {/* Filter & Search Bar */}
            <div id="articles-feed-section" className="rounded-3xl bg-white dark:bg-gray-800 p-4 sm:p-6 border border-gray-200/80 dark:border-gray-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'news', 'training', 'tender', 'event'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition-all min-h-[40px] ${
                      filter === cat
                        ? 'bg-[#075D3A] dark:bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(`news_tab_${cat}`)}
                  </button>
                ))}
              </div>

              {/* Search & View Mode Controls */}
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search press releases..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    title="List view"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Articles List & Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Articles Feed */}
              <div className="lg:col-span-8 space-y-6">
                {loading ? (
                  <div className="py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xs">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">Loading published bulletins...</p>
                  </div>
                ) : (
                  <NewsArticlesGrid
                    articles={regularArticles}
                    viewMode={viewMode}
                    page={page}
                    totalCount={totalCount}
                    hasMore={hasMore}
                    onNextPage={handleNextPage}
                    onPrevPage={handlePrevPage}
                    onShare={handleShareArticle}
                    loading={loading}
                  />
                )}
              </div>

              {/* Sidebar: Urgent Notices, Active Bids & Upcoming Expos */}
              <div className="lg:col-span-4 space-y-6">
                {/* Urgent Announcements Box */}
                <div className="rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-2 text-[#075D3A] dark:text-emerald-400">
                      <Bell className="h-5 w-5 text-[#D5A62E]" />
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">
                        {t('announcements_header')}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mockAnnouncements.map((anc) => (
                      <div
                        key={anc.id}
                        className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 bg-[#F8F7F2] dark:bg-gray-700/40 hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                          <span className="font-bold uppercase text-[#075D3A] dark:text-emerald-400">
                            {anc.category}
                          </span>
                          <span>{anc.date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                          {anc.titleKey}
                        </h4>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            showToast(
                              `Downloading announcement document: ${anc.titleKey}`,
                              'info',
                              anc.category
                            );
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#075D3A] dark:text-emerald-400 hover:underline"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download Packet</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events Preview in Sidebar */}
                <div className="rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span>Next Regional Event</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('events')}
                      className="text-[11px] font-bold text-[#075D3A] dark:text-emerald-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {comprehensiveEvents[0] && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                        <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">
                          {comprehensiveEvents[0].startDate}
                        </span>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">
                          {getLocalizedText(comprehensiveEvents[0].title)}
                        </h4>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2">
                          {getLocalizedText(comprehensiveEvents[0].description)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setRsvpEvent(comprehensiveEvents[0])}
                          className="w-full mt-2 py-2 rounded-xl bg-[#075D3A] text-white text-xs font-bold hover:bg-[#05482d] transition-colors"
                        >
                          RSVP for Event
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Radio Audio Broadcast Dispatch */}
            <NewsAudioDispatch />

            {/* Weekly Newsletter & SMS Alerts CTA */}
            <NewsNewsletterCTA />
          </div>
        )}

        {/* TAB 2: EVENTS & EXPOS CALENDAR */}
        {activeMainTab === 'events' && (
          <div className="space-y-10">
            <EventsCalendarSection
              events={comprehensiveEvents}
              onOpenRSVP={(evt) => setRsvpEvent(evt)}
            />
            <NewsNewsletterCTA />
          </div>
        )}

        {/* TAB 3: PROCUREMENT & TENDERS */}
        {activeMainTab === 'tenders' && (
          <div className="space-y-10">
            <TendersSection
              tenders={comprehensiveTenders}
              onOpenTenderModal={(tnd) => setSelectedTender(tnd)}
            />
            <NewsNewsletterCTA />
          </div>
        )}

        {/* TAB 4: MEDIA ROOM & PRESS ASSETS */}
        {activeMainTab === 'media' && (
          <div className="space-y-10">
            <MediaRoomSection
              onOpenAccreditation={() => setIsAccreditationOpen(true)}
            />
            <NewsAudioDispatch />
            <NewsNewsletterCTA />
          </div>
        )}
      </div>

      {/* MODALS */}
      <EventRSVPModal
        event={rsvpEvent}
        onClose={() => setRsvpEvent(null)}
      />

      <MediaAccreditationModal
        isOpen={isAccreditationOpen}
        onClose={() => setIsAccreditationOpen(false)}
      />

      <TenderDetailModal
        tender={selectedTender}
        onClose={() => setSelectedTender(null)}
      />
    </div>
  );
};
