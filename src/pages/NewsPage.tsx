import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  getPublicNewsArticlesPaginated,
  getPublicNewsSourceMode,
} from '../services/newsService';
import { NewsArticle } from '../types/news';
import { mockAnnouncements } from '../data/mockData';
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
} from 'lucide-react';
import { NewsImage } from '../components/news/NewsImage';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export const NewsPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'news' | 'training' | 'tender' | 'event'>('all');

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

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

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'training':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'tender':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'event':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <div className="bg-[#F8F7F2] dark:bg-gray-900 min-h-screen py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="rounded-2xl bg-[#075D3A] dark:bg-emerald-950 text-white p-8 md:p-12 shadow-xl border border-emerald-800/40">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D5A62E]">Official Bulletins & Press Releases</span>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">{t('nav_news')}</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-2xl">{t('news_subtitle')}</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'news', 'training', 'tender', 'event'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition-all min-h-[44px] ${
                filter === cat
                  ? 'bg-[#075D3A] dark:bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t(`news_tab_${cat}`)}
            </button>
          ))}
        </div>

        {/* Dev Mock Mode Notice */}
        {isMockMode && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Developer Mode: VITE_PUBLIC_NEWS_SOURCE is set to 'mock'. Displaying static demonstration articles.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* News articles */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500">Loading published news...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
                <Info className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Published Articles Available</p>
                <p className="text-xs text-gray-500">Check back later for official news updates from the Oromia Bureau of Agriculture.</p>
              </div>
            ) : (
              <>
                {articles.map((article) => {
                  const titleText = getLocalizedText(article.title);
                  const summaryText = getLocalizedText(article.excerpt);
                  const authorText = article.authorName
                    ? getLocalizedText(article.authorName)
                    : getLocalizedText(article.responsibleOffice) || 'Oromia Bureau';

                  return (
                    <article
                      key={article.slug}
                      className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6"
                    >
                      <div className="md:w-64 shrink-0">
                        <NewsImage
                          src={article.featuredImage}
                          alt={titleText}
                          aspect="card"
                          objectPosition={article.imagePosition || 'center'}
                        />
                      </div>
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeClass(article.category)}`}>
                              {t(`news_tab_${article.category}`)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>

                          <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#075D3A] dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {titleText}
                          </h2>

                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-2 line-clamp-3">
                            {summaryText}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{authorText}</span>
                          </div>

                          <Link
                            to={`/news/${article.slug}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                          >
                            <span>Read Story</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs">
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Showing Page {page} {totalCount > 0 ? `(${totalCount} total articles)` : ''}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={page === 1 || loading}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={!hasMore || loading}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Side Bulletins & Tenders */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[#075D3A] dark:text-emerald-400 border-b border-gray-100 dark:border-gray-700 pb-3">
                <Bell className="h-5 w-5 text-[#D5A62E]" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('announcements_header')}</h3>
              </div>
              <div className="space-y-3">
                {mockAnnouncements.map((anc) => (
                  <div key={anc.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 space-y-2 bg-[#F8F7F2] dark:bg-gray-700/40">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                      <span className="font-bold uppercase text-[#075D3A] dark:text-emerald-400">{anc.category}</span>
                      <span>{anc.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{anc.titleKey}</h4>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        showToast(t('demo_download_notice'), 'info', anc.titleKey);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#075D3A] dark:text-emerald-400 hover:underline min-h-[44px]"
                    >
                      <Download className="h-3 w-3" /> Download Tender Packet
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
