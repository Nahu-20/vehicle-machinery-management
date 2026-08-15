import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { NewsArticle } from '../../types/news';
import { NewsImage } from './NewsImage';
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Share2,
  Building2,
  Tag,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface NewsArticlesGridProps {
  articles: NewsArticle[];
  viewMode: 'grid' | 'list';
  page: number;
  totalCount: number;
  hasMore: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onShare: (article: NewsArticle) => void;
  loading: boolean;
}

export const NewsArticlesGrid: React.FC<NewsArticlesGridProps> = ({
  articles,
  viewMode,
  page,
  totalCount,
  hasMore,
  onNextPage,
  onPrevPage,
  onShare,
  loading,
}) => {
  const { t, getLocalizedText } = useLanguage();

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

  if (articles.length === 0 && !loading) {
    return (
      <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 space-y-3 shadow-xs">
        <Info className="w-10 h-10 text-gray-400 mx-auto" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No Matching Articles Found</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Try clearing your search query or selecting a different category filter to view published bulletins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid View Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const title = getLocalizedText(article.title);
            const summary = getLocalizedText(article.excerpt);
            const author = article.authorName
              ? getLocalizedText(article.authorName)
              : (article as any).author
              ? typeof (article as any).author === 'string'
                ? (article as any).author
                : getLocalizedText((article as any).author)
              : 'Oromia Agricultural Bureau';

            return (
              <article
                key={article.slug}
                className="group rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
                    <NewsImage
                      src={article.featuredImage || (article as any).imageUrl}
                      alt={title}
                      aspect="card"
                      objectPosition={article.imagePosition || 'center'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md ${getCategoryBadgeClass(article.category)}`}>
                        {t(`news_tab_${article.category}`)}
                      </span>
                    </div>
                    {article.featured && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D5A62E] text-gray-900 shadow-xs uppercase tracking-wider">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {article.publishedAt || article.date || 'Recent'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {article.readingTime || article.readTime || '4 min'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-[#075D3A] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      <Link to={`/news/${article.slug}`}>
                        {title}
                      </Link>
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {summary}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium truncate max-w-[150px]">
                    <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{author}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onShare(article)}
                      aria-label="Share article"
                      className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/news/${article.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-all shadow-xs"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* List View Mode */
        <div className="space-y-4">
          {articles.map((article) => {
            const title = getLocalizedText(article.title);
            const summary = getLocalizedText(article.excerpt);
            const author = article.authorName
              ? getLocalizedText(article.authorName)
              : (article as any).author
              ? typeof (article as any).author === 'string'
                ? (article as any).author
                : getLocalizedText((article as any).author)
              : 'Oromia Agricultural Bureau';

            return (
              <article
                key={article.slug}
                className="group rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-6 items-center"
              >
                <div className="w-full md:w-64 h-44 shrink-0 rounded-2xl overflow-hidden bg-gray-900 relative">
                  <NewsImage
                    src={article.featuredImage || (article as any).imageUrl}
                    alt={title}
                    aspect="card"
                    objectPosition={article.imagePosition || 'center'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${getCategoryBadgeClass(article.category)}`}>
                      {t(`news_tab_${article.category}`)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 flex flex-col justify-between w-full">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {article.publishedAt || article.date || 'Recent'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {article.readingTime || article.readTime || '4 min read'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-semibold">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        {author}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-[#075D3A] dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      <Link to={`/news/${article.slug}`}>
                        {title}
                      </Link>
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 mt-2">
                      {summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {article.tags && article.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={`${tag}-${idx}`}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onShare(article)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-semibold flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </button>

                      <Link
                        to={`/news/${article.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-colors shadow-xs"
                      >
                        <span>Read Full Story</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-xs">
        <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
          Showing Page {page} {totalCount > 0 ? `(${totalCount} total published)` : ''}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={onNextPage}
            disabled={!hasMore || loading}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
