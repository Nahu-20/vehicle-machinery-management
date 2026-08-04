import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { mockNews, mockAnnouncements } from '../data/mockData';
import { Calendar, Clock, Download, Bell, ArrowRight, User } from 'lucide-react';

export const NewsPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'news' | 'training' | 'tender' | 'event'>('all');

  const filteredNews = filter === 'all' ? mockNews : mockNews.filter((n) => n.category === filter);

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
              onClick={() => setFilter(cat)}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* News articles */}
          <div className="lg:col-span-8 space-y-6">
            {filteredNews.map((article) => {
              const titleText = typeof article.title === 'string'
                ? article.title
                : article.title
                ? getLocalizedText(article.title)
                : article.titleKey
                ? t(article.titleKey)
                : '';

              const summaryText = typeof article.excerpt === 'string'
                ? article.excerpt
                : article.excerpt
                ? getLocalizedText(article.excerpt)
                : article.summaryKey
                ? t(article.summaryKey)
                : '';

              const authorText = typeof article.author === 'string'
                ? article.author
                : article.author
                ? getLocalizedText(article.author)
                : '';

              return (
                <article
                  key={article.id}
                  className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6"
                >
                  <img
                    src={article.featuredImage || article.imageUrl}
                    alt={titleText}
                    className="h-48 md:w-64 object-cover rounded-xl shrink-0 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeClass(article.category)}`}>
                          {t(`news_tab_${article.category}`)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          {article.publishedAt || article.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          {article.readingTime || article.readTime}
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
