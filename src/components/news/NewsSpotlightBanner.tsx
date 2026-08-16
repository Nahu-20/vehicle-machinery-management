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
  Sparkles,
  Share2,
  Building2,
} from 'lucide-react';

interface NewsSpotlightBannerProps {
  article: NewsArticle;
  onShare: (article: NewsArticle) => void;
}

export const NewsSpotlightBanner: React.FC<NewsSpotlightBannerProps> = ({
  article,
  onShare,
}) => {
  const { t, getLocalizedText, language } = useLanguage();

  if (!article) return null;

  const title = getLocalizedText(article.title);
  const excerpt = getLocalizedText(article.excerpt);
  const author = article.authorName
    ? getLocalizedText(article.authorName)
    : (article as any).author
    ? typeof (article as any).author === 'string'
      ? (article as any).author
      : getLocalizedText((article as any).author)
    : 'Oromia Agricultural Bureau';

  const office = article.responsibleOffice
    ? typeof article.responsibleOffice === 'string'
      ? article.responsibleOffice
      : getLocalizedText(article.responsibleOffice)
    : 'Bureau Press Directorate';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-xl transition-all duration-300 group">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Visual Column */}
        <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-[440px] overflow-hidden bg-gray-900">
          <NewsImage
            src={article.featuredImage || (article as any).imageUrl}
            alt={title}
            aspect="hero"
            objectPosition={article.imagePosition || 'center'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Badges on image */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#D5A62E] text-gray-900 shadow-md flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
              Featured Headline
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md border border-white/20 capitalize">
              {article.category || 'News'}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">
              <Building2 className="w-3.5 h-3.5 text-[#A3E635]" />
              <span className="truncate max-w-[200px]">{office}</span>
            </span>
            <span className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{article.readingTime || article.readTime || '4 min read'}</span>
            </span>
          </div>
        </div>

        {/* Right Content Column */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                <Calendar className="w-3.5 h-3.5" />
                {article.publishedAt || article.date || 'Recent'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {author}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-snug group-hover:text-[#075D3A] dark:group-hover:text-emerald-400 transition-colors">
              <Link to={`/news/${article.slug}`}>
                {title}
              </Link>
            </h2>

            {/* Summary */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 sm:line-clamp-4">
              {excerpt}
            </p>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {article.tags.slice(0, 4).map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onShare(article)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Share Story</span>
            </button>

            <Link
              to={`/news/${article.slug}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#075D3A] hover:bg-[#05482D] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-md hover:shadow-lg transform active:scale-95"
            >
              <span>Read Full Story</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
