import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { NewsArticle } from '../../types/news';
import { Calendar, ArrowRight } from 'lucide-react';
import { NewsImage } from './NewsImage';

interface FeaturedStoriesSectionProps {
  articles: NewsArticle[];
  onViewAll?: () => void;
  onEventClick?: (article: NewsArticle) => void;
}

export const FeaturedStoriesSection: React.FC<FeaturedStoriesSectionProps> = ({
  articles,
  onViewAll,
  onEventClick,
}) => {
  const { t, getLocalizedText, language } = useLanguage();

  // Get the top 3 featured stories (or fallback to top 3 articles)
  const stories = articles.slice(0, 3);

  const getSectionTitle = () => {
    switch (language) {
      case 'om':
        return 'Oduu Filatamaa';
      case 'am':
        return 'ተለይተው የቀረቡ ዜናዎች';
      default:
        return 'Featured Stories';
    }
  };

  const getSectionSubtitle = () => {
    switch (language) {
      case 'om':
        return 'Gabaasaalee fi qophiiwwan ijoo sektera qonna Oromiyaa';
      case 'am':
        return 'ከኦሮሚያ ግብርና ዘርፍ የተመረጡ ዋና ዋና መረጃዎች';
      default:
        return "Highlights from Oromia's agricultural sector";
    }
  };

  const getEyebrow = () => {
    switch (language) {
      case 'om':
        return 'ODUU HAARAA';
      case 'am':
        return 'የቅርብ ጊዜ ዜና';
      default:
        return 'LATEST NEWS';
    }
  };

  const getViewAllText = () => {
    switch (language) {
      case 'om':
        return 'Oduu Hundaa Ilaali';
      case 'am':
        return 'ሁሉንም ዜናዎች ይመልከቱ';
      default:
        return 'View All News';
    }
  };

  return (
    <section className="space-y-6 pt-2">
      {/* Header Container */}
      <div className="relative flex flex-col items-center text-center">
        {/* Eyebrow with green accent dash */}
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-5 h-0.5 bg-[#15803d] rounded-full" />
          <span className="text-xs font-black tracking-widest text-[#15803d] dark:text-emerald-400 uppercase">
            {getEyebrow()}
          </span>
        </div>

        {/* Main Title */}
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          {getSectionTitle()}
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
          {getSectionSubtitle()}
        </p>

        {/* Right-aligned 'View All News' link on larger screens */}
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="md:absolute md:right-0 md:bottom-2 mt-3 md:mt-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#15803d] dark:text-emerald-400 hover:text-[#0f5b2b] dark:hover:text-emerald-300 hover:underline transition-colors"
          >
            <span>{getViewAllText()}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3-Column Card Grid matching reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {stories.map((story) => {
          const title = getLocalizedText(story.title);
          const excerpt = getLocalizedText(story.excerpt);
          const isEvent = story.category === 'event';
          const linkUrl = `/news/${story.slug}`;
          const dateStr = story.publishedAt || story.date || 'Recent';

          return (
            <article
              key={story.id || story.slug}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 group"
            >
              {/* Card Image Header */}
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
                <NewsImage
                  src={story.featuredImage || (story as any).imageUrl}
                  alt={title}
                  aspect="card"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Category Pill Tag (top-left) */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#65A30D] text-white shadow-xs">
                    {story.category || 'News'}
                  </span>
                </div>

                {/* Date Pill Tag with Calendar Icon (top-right) */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs shadow-xs">
                    <Calendar className="w-3 h-3 text-white/90" />
                    <span>{dateStr}</span>
                  </span>
                </div>
              </div>

              {/* Card Body Content */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug group-hover:text-[#15803d] dark:group-hover:text-emerald-400 transition-colors">
                    <Link to={linkUrl}>
                      {title}
                    </Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {excerpt}
                  </p>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-2">
                  <Link
                    to={linkUrl}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#15803d] dark:text-emerald-400 hover:text-[#0f5b2b] dark:hover:text-emerald-300 group-hover:gap-2 transition-all"
                  >
                    <span>{isEvent ? (language === 'om' ? 'Dabalata Barbaadi' : language === 'am' ? 'ተጨማሪ ይወቁ' : 'Learn More') : (language === 'om' ? 'Dabalata Dubbisi' : language === 'am' ? 'ሙሉውን ያንብቡ' : 'Read More')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
