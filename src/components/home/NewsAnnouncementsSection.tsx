import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { mockAnnouncements } from '../../data/mockData';
import { AgriPillBadge } from '../common/AgriPillBadge';
import {
  Bell,
  Calendar,
  Download,
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
import {
  fadeUp,
  buttonHoverTap,
  cardHover,
} from '../../animation/motionVariants';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const NewsAnnouncementsSection: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
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

  const { featuredArticle, latestArticles, loading, isEmpty } = newsData;

  // Derive dominant featured story + up to 3 side stories
  const dominantFeatured = featuredArticle || (latestArticles.length > 0 ? latestArticles[0] : null);

  const sideNewsArticles = latestArticles
    .filter((art) => !dominantFeatured || art.slug !== dominantFeatured.slug)
    .slice(0, 3);

  const getCategoryBadgeVariant = (category: string): 'lime' | 'emerald' | 'amber' => {
    switch (category) {
      case 'training':
      case 'tender':
        return 'amber';
      case 'event':
      case 'news':
      default:
        return 'lime';
    }
  };

  return (
    <section id="news" className="bg-[#F6F7F3] dark:bg-[#0B1912] py-16 lg:py-24 border-b border-[#E2E8E3] dark:border-[#183327] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row */}
        <motion.div
          initial={isReducedMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-3 max-w-2xl">
            <AgriPillBadge variant="lime" icon={<Sparkles className="h-3.5 w-3.5 text-[#0A1912]" />}>
              Official Publications & Press
            </AgriPillBadge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111310] dark:text-white tracking-tight leading-tight">
              {t('news_title')}
            </h2>

            <p className="text-base text-[#56635B] dark:text-[#A7F3D0]/80 leading-relaxed font-normal">
              {t('news_subtitle')}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <motion.div {...(isReducedMotion ? {} : { whileHover: buttonHoverTap.whileHover, whileTap: buttonHoverTap.whileTap, transition: buttonHoverTap.transition })}>
              <Link
                to="/news"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#0A1912] dark:bg-emerald-800 text-white hover:bg-[#063D2A] px-6 py-3.5 text-sm font-extrabold transition-all duration-200 shadow-sm"
              >
                <span>View All News</span>
              </Link>
            </motion.div>
            <motion.div {...(isReducedMotion ? {} : { whileHover: buttonHoverTap.whileHover, whileTap: buttonHoverTap.whileTap, transition: buttonHoverTap.transition })}>
              <Link
                to="/news"
                className="inline-flex items-center justify-center rounded-full bg-[#A3E635] text-[#0A1912] hover:bg-[#92D022] h-12 w-12 transition-all duration-200"
                aria-label="View All News"
              >
                <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Developer Mock Mode Banner */}
        {isMockMode && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Developer Mode: VITE_PUBLIC_NEWS_SOURCE is set to 'mock'. Displaying static demonstration articles.</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center bg-white dark:bg-[#0E241B] rounded-3xl border border-[#E2E8E3] dark:border-[#183327] shadow-xs">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-emerald-300/70">
              Loading published news from Bureau...
            </p>
          </div>
        ) : isEmpty || !dominantFeatured ? (
          <div className="py-20 text-center bg-white dark:bg-[#0E241B] rounded-3xl border border-[#E2E8E3] dark:border-[#183327] space-y-3">
            <FileText className="w-10 h-10 text-slate-400 dark:text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-emerald-100">
              No Published Articles Available
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70 max-w-md mx-auto">
              Official news articles published by the Oromia Bureau of Agriculture will appear here automatically.
            </p>
          </div>
        ) : (
          /* Asymmetrical Two-Column Editorial Layout based on Reference */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT SIDE: Dominant Featured Story (approx 55–58% = col-span-7) */}
            <div className="lg:col-span-7">
              <Link to={`/news/${dominantFeatured.slug}`} className="group block">
                <div className="space-y-4">
                  {/* Large Landscape Image with Framer Motion reveal */}
                  <motion.div
                    initial={isReducedMotion ? undefined : { opacity: 0, scale: 1.04 }}
                    whileInView={isReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="relative rounded-[20px] overflow-hidden aspect-[16/10] w-full bg-slate-100 dark:bg-[#0E241B] border border-[#E2E8E3] dark:border-[#183327] shadow-sm"
                  >
                    <motion.div
                      whileHover={isReducedMotion ? undefined : { scale: 1.025 }}
                      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                      className="h-full w-full"
                    >
                      <NewsImage
                        src={dominantFeatured.featuredImage}
                        alt={getLocalizedText(dominantFeatured.title)}
                        aspect="featured"
                        objectPosition={dominantFeatured.imagePosition || 'center'}
                      />
                    </motion.div>
                    <div className="absolute top-4 left-4 z-10">
                      <AgriPillBadge variant={getCategoryBadgeVariant(dominantFeatured.category)}>
                        {t(`news_tab_${dominantFeatured.category}`) || dominantFeatured.category}
                      </AgriPillBadge>
                    </div>
                  </motion.div>

                  {/* Headline & Metadata below image */}
                  <div className="space-y-2 pt-1">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111310] dark:text-white leading-tight group-hover:text-[#087A4B] dark:group-hover:text-[#A3E635] transition-colors">
                      {getLocalizedText(dominantFeatured.title)}
                    </h3>

                    <div className="flex items-center gap-3 text-xs font-semibold text-[#56635B] dark:text-[#94A39A]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#A3E635]" />
                        {dominantFeatured.publishedAt
                          ? new Date(dominantFeatured.publishedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                      <span>•</span>
                      <span>
                        {getLocalizedText(dominantFeatured.authorName) ||
                          getLocalizedText(dominantFeatured.responsibleOffice) ||
                          'Oromia Bureau'}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-[#56635B] dark:text-[#94A39A] leading-relaxed line-clamp-2 pt-1 font-normal">
                      {getLocalizedText(dominantFeatured.excerpt)}
                    </p>

                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#063D2A] dark:text-[#A3E635] group-hover:underline">
                        <span>Read Story</span>
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                        </motion.span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* RIGHT SIDE: 3 Compact Stories Stacked Vertically (approx 42–45% = col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              <motion.div
                initial={isReducedMotion ? undefined : "hidden"}
                whileInView={isReducedMotion ? undefined : "visible"}
                viewport={{ once: true, amount: 0.15 }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 },
                  },
                }}
                className="space-y-6"
              >
                {sideNewsArticles.map((article) => {
                  const titleText = getLocalizedText(article.title);
                  const excerptText = getLocalizedText(article.excerpt);

                  return (
                    <motion.div
                      key={article.slug}
                      variants={fadeUp}
                      {...(isReducedMotion ? {} : { whileHover: cardHover.whileHover, transition: cardHover.transition })}
                    >
                      <Link
                        to={`/news/${article.slug}`}
                        className="group flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl border border-[#E2E8E3] dark:border-[#183327] bg-white dark:bg-[#0E241B] shadow-xs hover:border-[#087A4B] dark:hover:border-[#A3E635] transition-all duration-200"
                      >
                        {/* Compact Image */}
                        <div className="w-full sm:w-36 aspect-[4/3] sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-[#122E22]">
                          <NewsImage
                            src={article.featuredImage}
                            alt={titleText}
                            aspect="card"
                            objectPosition={article.imagePosition || 'center'}
                          />
                        </div>

                        {/* Article Text Content */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <AgriPillBadge variant={getCategoryBadgeVariant(article.category)}>
                              {t(`news_tab_${article.category}`) || article.category}
                            </AgriPillBadge>
                            <span className="text-[11px] text-[#56635B] dark:text-[#94A39A] font-semibold">
                              {article.publishedAt
                                ? new Date(article.publishedAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Recent'}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-[#111310] dark:text-white leading-snug line-clamp-2 group-hover:text-[#087A4B] dark:group-hover:text-[#A3E635] transition-colors">
                            {titleText}
                          </h4>

                          <p className="text-xs text-[#56635B] dark:text-[#94A39A] line-clamp-2 leading-relaxed">
                            {excerptText}
                          </p>

                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#063D2A] dark:text-[#A3E635]">
                              <span>Read Story</span>
                              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Quiet Integrated Public Announcements Bulletin */}
              <div className="mt-8 rounded-2xl border border-[#E2E8E3] dark:border-[#183327] bg-[#F6F7F3] dark:bg-[#0E241B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8E3] dark:border-[#183327] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A1912] dark:bg-emerald-800 text-[#A3E635]">
                      <Bell className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-[#111310] dark:text-white">
                      {t('announcements_header')}
                    </h4>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#A3E635] text-[#0A1912]">
                    Public
                  </span>
                </div>

                <div className="space-y-3">
                  {mockAnnouncements.slice(0, 2).map((anc) => (
                    <div
                      key={anc.id}
                      className="p-3 rounded-xl border border-[#E2E8E3] dark:border-[#183327] bg-white dark:bg-[#0A1912] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[#56635B] dark:text-[#94A39A]">
                        <span className="uppercase text-[#087A4B] dark:text-[#A3E635] font-bold">
                          {anc.category}
                        </span>
                        <span>{anc.date}</span>
                      </div>
                      <p className="text-xs font-bold text-[#111310] dark:text-white line-clamp-1">
                        {anc.titleKey}
                      </p>
                      <a
                        href={anc.downloadUrl}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#087A4B] dark:text-[#A3E635] hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Official Document</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
