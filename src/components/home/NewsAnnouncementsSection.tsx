import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockAnnouncements } from '../../data/mockData';
import {
  Bell,
  Calendar,
  Clock,
  Download,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Loader2,
  Info,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewsImage } from '../news/NewsImage';
import {
  subscribeToHomepageNews,
  getPublicNewsSourceMode,
  HomepageNewsData,
} from '../../services/newsService';

export const NewsAnnouncementsSection: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const [newsData, setNewsData] = useState<HomepageNewsData>({
    featuredArticle: null,
    latestArticles: [],
    loading: true,
    isEmpty: false,
    error: null,
  });

  const isMockMode = getPublicNewsSourceMode() === 'mock';

  useEffect(() => {
    const unsub = subscribeToHomepageNews((data) => {
      setNewsData(data);
    });
    return () => unsub();
  }, []);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'training':
        return 'bg-blue-100 dark:bg-gradient-to-r dark:from-blue-900 dark:to-cyan-900 text-blue-900 dark:text-cyan-200 border-blue-200 dark:border-cyan-500/50';
      case 'tender':
        return 'bg-amber-100 dark:bg-gradient-to-r dark:from-amber-900 dark:to-yellow-900 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-500/50';
      case 'event':
        return 'bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900 dark:to-fuchsia-900 text-purple-900 dark:text-fuchsia-200 border-purple-200 dark:border-fuchsia-500/50';
      case 'news':
      default:
        return 'bg-emerald-100 dark:bg-gradient-to-r dark:from-emerald-800 dark:to-teal-800 text-[#087A4B] dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/50';
    }
  };

  const { featuredArticle, latestArticles, loading, isEmpty } = newsData;

  return (
    <section id="news" className="bg-[#FAFAF7] dark:bg-[#0B1912] py-16 lg:py-24 border-b border-[#DDE8E1] dark:border-emerald-900/60 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/10 via-emerald-50 to-[#087A4B]/10 dark:from-emerald-900/40 dark:via-[#12281D] dark:to-emerald-900/40 border border-[#087A4B]/20 dark:border-emerald-700/50 text-[#087A4B] dark:text-emerald-300 text-xs font-black mb-3 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
              <span>Official Bureau Publications & Tenders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] dark:text-emerald-100 tracking-tight">
              {t('news_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] dark:text-emerald-300/80 mt-2 max-w-2xl font-medium">
              {t('news_subtitle')}
            </p>
          </div>

          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#063D2A] hover:bg-[#087A4B] text-white text-xs font-black transition-all shadow-sm"
          >
            <span>View All News</span>
            <ChevronRight className="w-4 h-4 text-[#D7A928]" />
          </Link>
        </div>

        {/* Developer Mock Mode Notice */}
        {isMockMode && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Developer Mode: VITE_PUBLIC_NEWS_SOURCE is set to 'mock'. Displaying static demonstration articles.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Editorial Grid (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="py-20 text-center bg-white dark:bg-[#12281D] rounded-3xl border border-[#DDE8E1] dark:border-emerald-900/60 shadow-xs">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500 dark:text-emerald-300/70">Loading published news from Bureau...</p>
              </div>
            ) : isEmpty ? (
              <div className="py-20 text-center bg-white dark:bg-[#12281D] rounded-3xl border border-[#DDE8E1] dark:border-emerald-900/60 space-y-3">
                <FileText className="w-10 h-10 text-slate-400 dark:text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-emerald-100">No Published Articles Available</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70 max-w-md mx-auto">
                  Official news articles published by the Oromia Bureau of Agriculture will appear here automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Featured Hero Article */}
                {featuredArticle && (
                  <div className="group rounded-3xl border border-[#DDE8E1] dark:border-emerald-800/60 bg-white dark:bg-gradient-to-br dark:from-[#0E2C1E] dark:via-[#143828] dark:to-[#0A2016] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#087A4B] dark:hover:border-emerald-400 transition-all duration-300 grid grid-cols-1 md:grid-cols-12">
                    <div className="md:col-span-6 relative overflow-hidden">
                      <NewsImage
                        src={featuredArticle.featuredImage}
                        alt={getLocalizedText(featuredArticle.title)}
                        aspect="featured"
                        objectPosition={featuredArticle.imagePosition || 'center'}
                      />
                      <div className="absolute top-4 left-4 z-10">
                        <span className={`rounded-xl border px-3 py-1 text-xs font-black uppercase shadow-md ${getCategoryBadge(featuredArticle.category)}`}>
                          Featured • {t(`news_tab_${featuredArticle.category}`)}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-6 p-6 sm:p-7 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-xs font-bold text-[#637069] dark:text-emerald-200/80">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
                            {featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black text-[#14251D] dark:text-emerald-50 group-hover:text-[#087A4B] dark:group-hover:text-emerald-300 transition-colors leading-snug">
                          {getLocalizedText(featuredArticle.title)}
                        </h3>

                        <p className="mt-2.5 text-xs sm:text-sm text-[#637069] dark:text-emerald-200/80 line-clamp-3 leading-relaxed font-normal">
                          {getLocalizedText(featuredArticle.excerpt)}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#DDE8E1] dark:border-emerald-800/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#063D2A] dark:text-emerald-300">
                          {getLocalizedText(featuredArticle.authorName) || getLocalizedText(featuredArticle.responsibleOffice) || 'Oromia Bureau'}
                        </span>
                        <Link to={`/news/${featuredArticle.slug}`} className="inline-flex items-center gap-1 text-xs font-black text-[#063D2A] dark:text-emerald-300 group-hover:text-[#087A4B] dark:group-hover:text-emerald-200">
                          <span>Read Story</span>
                          <ArrowUpRight className="h-4 w-4 text-[#D7A928]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secondary News Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latestArticles.map((item) => {
                    const titleText = getLocalizedText(item.title);
                    const excerptText = getLocalizedText(item.excerpt);
                    const authorText = getLocalizedText(item.authorName) || getLocalizedText(item.responsibleOffice) || 'Oromia Bureau';

                    return (
                      <article
                        key={item.slug}
                        className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#DDE8E1] dark:border-emerald-900/60 bg-white dark:bg-[#12281D] p-5 shadow-xs hover:shadow-xl hover:border-[#087A4B] transition-all duration-300"
                      >
                        <div>
                          <div className="relative overflow-hidden mb-4">
                            <NewsImage
                              src={item.featuredImage}
                              alt={titleText}
                              aspect="card"
                              objectPosition={item.imagePosition || 'center'}
                            />
                            <div className="absolute top-3 left-3 z-10">
                              <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase ${getCategoryBadge(item.category)}`}>
                                {t(`news_tab_${item.category}`)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#637069] dark:text-emerald-300/80 mb-2">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
                              {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-[#14251D] dark:text-emerald-100 group-hover:text-[#087A4B] dark:group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                            {titleText}
                          </h3>

                          <p className="mt-2 text-xs text-[#637069] dark:text-emerald-300/80 line-clamp-2 leading-relaxed font-normal">
                            {excerptText}
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-[#DDE8E1] dark:border-emerald-900/60 flex items-center justify-between">
                          <span className="text-xs text-[#637069] dark:text-emerald-400/80 font-medium">
                            {authorText}
                          </span>
                          <Link to={`/news/${item.slug}`} className="flex items-center gap-1 text-xs font-black text-[#063D2A] dark:text-emerald-200 group-hover:text-[#087A4B] dark:group-hover:text-emerald-300">
                            <span>Read Story</span>
                            <ChevronRight className="h-4 w-4 text-[#D7A928]" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Public Bulletins & Tenders (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-[#DDE8E1] dark:border-emerald-900/60 bg-gradient-to-b from-[#EFF8F2] to-white dark:from-[#12281D] dark:to-[#0E2218] p-6 lg:p-7 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DDE8E1] dark:border-emerald-900/60 pb-4">
                <div className="flex items-center gap-2.5 text-[#063D2A] dark:text-emerald-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#063D2A] dark:bg-emerald-800 text-[#D7A928] shadow-md">
                    <Bell className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#14251D] dark:text-emerald-100">{t('announcements_header')}</h3>
                </div>
                <span className="rounded-full bg-[#087A4B] px-3 py-1 text-[11px] font-black text-white shadow-2xs">Public</span>
              </div>

              <div className="space-y-4">
                {mockAnnouncements.map((anc) => (
                  <div
                    key={anc.id}
                    className="rounded-2xl border border-[#DDE8E1] dark:border-emerald-900/60 bg-white dark:bg-[#12281D] p-4 transition-all hover:border-[#087A4B] shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase ${getCategoryBadge(anc.category)}`}>
                        {anc.category}
                      </span>
                      <span className="text-xs text-[#637069] dark:text-emerald-300/80 font-semibold">{anc.date}</span>
                    </div>

                    <h4 className="mt-2.5 text-xs sm:text-sm font-bold text-[#14251D] dark:text-emerald-100 leading-snug">
                      {anc.titleKey}
                    </h4>

                    <div className="mt-4 flex items-center justify-between border-t border-[#DDE8E1] dark:border-emerald-900/60 pt-3 text-xs">
                      <span className="text-xs text-[#637069] dark:text-emerald-400/80">Oromia Bureau Bulletin</span>
                      <a
                        href={anc.downloadUrl}
                        className="flex items-center gap-1.5 font-bold text-[#087A4B] dark:text-emerald-300 hover:text-[#063D2A]"
                      >
                        <Download className="h-3.5 w-3.5 text-[#D7A928]" />
                        <span>Document</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/resources"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-[#183627] border border-[#DDE8E1] dark:border-emerald-800/60 px-5 py-3 text-xs font-black text-[#063D2A] dark:text-emerald-200 hover:bg-[#063D2A] hover:text-white transition-all shadow-xs w-full justify-center transform hover:-translate-y-0.5"
                >
                  <span>View All Public Downloads</span>
                  <ChevronRight className="h-4 w-4 text-[#D7A928]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
