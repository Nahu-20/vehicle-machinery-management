import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockNews, mockAnnouncements } from '../../data/mockData';
import {
  Bell,
  Calendar,
  Clock,
  Download,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../common/ImageWithFallback';

export const NewsAnnouncementsSection: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'training' | 'tender' | 'event'>('all');

  const filteredNews = activeTab === 'all'
    ? mockNews
    : mockNews.filter((n) => n.category === activeTab);

  const heroNews = filteredNews[0] || mockNews[0];
  const secondaryNews = filteredNews.slice(1);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'training':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'tender':
        return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'event':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'news':
      default:
        return 'bg-emerald-100 text-[#087A4B] border-emerald-200';
    }
  };

  return (
    <section id="news" className="bg-[#FAFAF7] py-16 lg:py-24 border-b border-[#DDE8E1]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/10 via-emerald-50 to-[#087A4B]/10 border border-[#087A4B]/20 text-[#087A4B] text-xs font-black mb-3 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Official Bureau Publications & Tenders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] tracking-tight">
              {t('news_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] mt-2 max-w-2xl font-medium">
              {t('news_subtitle')}
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-[#DDE8E1] shadow-xs">
            {(['all', 'news', 'training', 'tender', 'event'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[#063D2A] to-[#087A4B] text-white shadow-sm'
                    : 'text-[#637069] hover:text-[#14251D] hover:bg-[#EFF8F2]'
                }`}
              >
                {t(`news_tab_${tab}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Editorial Grid (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Featured Hero Article */}
            {heroNews && (
              <div className="group rounded-3xl border border-[#DDE8E1] bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-[#087A4B] card-hover grid grid-cols-1 md:grid-cols-12 transition-all duration-300">
                <div className="md:col-span-6 relative h-64 md:h-auto overflow-hidden">
                  <ImageWithFallback
                    src={heroNews.imageUrl}
                    alt={t(heroNews.titleKey)}
                    containerClassName="h-full w-full"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`rounded-xl border px-3 py-1 text-xs font-black uppercase shadow-md ${getCategoryBadge(heroNews.category)}`}>
                      Featured • {heroNews.category}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-6 p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs font-bold text-[#637069]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#087A4B]" />
                        {heroNews.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#087A4B]" />
                        {heroNews.readTime}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black text-[#14251D] group-hover:text-[#087A4B] transition-colors leading-snug">
                      {t(heroNews.titleKey)}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-[#637069] line-clamp-3 leading-relaxed font-normal">
                      {t(heroNews.summaryKey)}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#DDE8E1] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#063D2A]">{heroNews.author}</span>
                    <Link to="/news" className="inline-flex items-center gap-1 text-xs font-black text-[#063D2A] group-hover:text-[#087A4B]">
                      <span>Read Story</span>
                      <ArrowUpRight className="h-4 w-4 text-[#D7A928]" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary News Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {secondaryNews.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#DDE8E1] bg-white p-5 shadow-xs hover:shadow-xl hover:border-[#087A4B] card-hover transition-all duration-300"
                >
                  <div>
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-4">
                      <ImageWithFallback
                        src={item.imageUrl}
                        alt={t(item.titleKey)}
                        containerClassName="h-full w-full"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase ${getCategoryBadge(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#637069]">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-[#087A4B]" />
                        {item.date}
                      </span>
                      <span>•</span>
                      <span className="font-semibold">{item.readTime}</span>
                    </div>

                    <h3 className="mt-2 text-base font-extrabold text-[#14251D] group-hover:text-[#087A4B] transition-colors leading-snug line-clamp-2">
                      {t(item.titleKey)}
                    </h3>

                    <p className="mt-2 text-xs text-[#637069] line-clamp-2 leading-relaxed font-normal">
                      {t(item.summaryKey)}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#DDE8E1] flex items-center justify-between">
                    <span className="text-xs text-[#637069] font-medium">{item.author}</span>
                    <Link to="/news" className="flex items-center gap-1 text-xs font-black text-[#063D2A] group-hover:text-[#087A4B]">
                      <span>Read</span>
                      <ChevronRight className="h-4 w-4 text-[#D7A928]" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Column: Public Bulletins & Tenders (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-[#DDE8E1] bg-gradient-to-b from-[#EFF8F2] to-white p-6 lg:p-7 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DDE8E1] pb-4">
                <div className="flex items-center gap-2.5 text-[#063D2A]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#063D2A] text-[#D7A928] shadow-md">
                    <Bell className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#14251D]">{t('announcements_header')}</h3>
                </div>
                <span className="rounded-full bg-[#087A4B] px-3 py-1 text-[11px] font-black text-white shadow-2xs">Public</span>
              </div>

              <div className="space-y-4">
                {mockAnnouncements.map((anc) => (
                  <div
                    key={anc.id}
                    className="rounded-2xl border border-[#DDE8E1] bg-white p-4 transition-all hover:border-[#087A4B] shadow-2xs card-hover"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase ${getCategoryBadge(anc.category)}`}>
                        {anc.category}
                      </span>
                      <span className="text-xs text-[#637069] font-semibold">{anc.date}</span>
                    </div>

                    <h4 className="mt-2.5 text-xs sm:text-sm font-bold text-[#14251D] leading-snug">
                      {anc.titleKey}
                    </h4>

                    <div className="mt-4 flex items-center justify-between border-t border-[#DDE8E1] pt-3 text-xs">
                      <span className="text-xs text-[#637069]">Oromia Bureau Bulletin</span>
                      <a
                        href={anc.downloadUrl}
                        className="flex items-center gap-1.5 font-bold text-[#087A4B] hover:text-[#063D2A]"
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-[#DDE8E1] px-5 py-3 text-xs font-black text-[#063D2A] hover:bg-[#063D2A] hover:text-white transition-all shadow-xs w-full justify-center transform hover:-translate-y-0.5"
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
