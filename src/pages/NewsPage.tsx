import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { mockNews, mockAnnouncements } from '../data/mockData';
import { Calendar, Clock, Download, Bell, Newspaper, Tag } from 'lucide-react';

export const NewsPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'news' | 'training' | 'tender' | 'event'>('all');

  const filteredNews = filter === 'all' ? mockNews : mockNews.filter((n) => n.category === filter);

  return (
    <div className="bg-[#F8F7F2] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="rounded-2xl bg-[#075D3A] text-white p-8 md:p-12 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D5A62E]">Official Bulletins</span>
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
                  ? 'bg-[#075D3A] text-white shadow-sm'
                  : 'bg-white text-[#5E6B63] hover:bg-emerald-50 border'
              }`}
            >
              {t(`news_tab_${cat}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* News articles */}
          <div className="lg:col-span-8 space-y-6">
            {filteredNews.map((article) => (
              <article key={article.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col md:flex-row gap-6">
                <img src={article.imageUrl} alt={t(article.titleKey)} className="h-48 md:w-56 object-cover rounded-xl shrink-0" />
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 text-xs text-[#5E6B63]">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {article.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.readTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#17211B]">{t(article.titleKey)}</h2>
                  <p className="text-xs text-[#5E6B63] leading-relaxed">{t(article.summaryKey)}</p>
                  <div className="pt-2 text-xs font-semibold text-[#075D3A]">{article.author}</div>
                </div>
              </article>
            ))}
          </div>

          {/* Side Bulletins & Tenders */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#075D3A] border-b pb-3">
                <Bell className="h-5 w-5 text-[#D5A62E]" />
                <h3 className="text-base font-bold">{t('announcements_header')}</h3>
              </div>
              <div className="space-y-3">
                {mockAnnouncements.map((anc) => (
                  <div key={anc.id} className="rounded-xl border p-3.5 space-y-2 bg-[#F8F7F2]">
                    <div className="flex items-center justify-between text-[10px] text-[#5E6B63]">
                      <span className="font-bold uppercase text-[#075D3A]">{anc.category}</span>
                      <span>{anc.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#17211B]">{anc.titleKey}</h4>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        showToast(t('demo_download_notice'), 'info', anc.titleKey);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#075D3A] hover:underline min-h-[44px]"
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
