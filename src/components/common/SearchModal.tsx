import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Search, X, ArrowRight, FileText, Sprout, Newspaper, Building2 } from 'lucide-react';
import { mockServices, mockNews, mockPublications, mockOffices } from '../../data/mockData';
import { Link } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredServices = query.trim()
    ? mockServices.filter((s) => t(s.titleKey).toLowerCase().includes(query.toLowerCase()))
    : mockServices.slice(0, 3);

  const filteredNews = query.trim()
    ? mockNews.filter((n) => t(n.titleKey).toLowerCase().includes(query.toLowerCase()))
    : mockNews.slice(0, 2);

  const filteredPubs = query.trim()
    ? mockPublications.filter((p) => t(p.titleKey).toLowerCase().includes(query.toLowerCase()))
    : mockPublications.slice(0, 2);

  const filteredOffices = query.trim()
    ? mockOffices.filter((o) => o.nameKey.toLowerCase().includes(query.toLowerCase()) || o.zoneKey.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-emerald-900/20 bg-white shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 bg-[#F8F7F2]">
          <Search className="h-5 w-5 text-[#075D3A]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-[#17211B] placeholder-[#5E6B63] focus:outline-none"
          />
          <button onClick={onClose} aria-label={t('close')} className="rounded-md p-1 text-[#5E6B63] hover:bg-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
          {/* Services */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#075D3A]">
              <Sprout className="h-4 w-4" /> {t('nav_services')}
            </h3>
            <div className="mt-2 space-y-1">
              {filteredServices.map((srv) => (
                <Link
                  key={srv.id}
                  to={srv.linkUrl}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg p-2 text-xs font-medium text-[#17211B] hover:bg-[#EAF5EE]"
                >
                  <span>{t(srv.titleKey)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#14804A]" />
                </Link>
              ))}
            </div>
          </div>

          {/* Publications */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#075D3A]">
              <FileText className="h-4 w-4" /> {t('nav_resources')}
            </h3>
            <div className="mt-2 space-y-1">
              {filteredPubs.map((pub) => (
                <Link
                  key={pub.id}
                  to="/resources"
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg p-2 text-xs font-medium text-[#17211B] hover:bg-[#EAF5EE]"
                >
                  <div>
                    <span className="font-semibold">{t(pub.titleKey)}</span>
                    <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] text-[#075D3A]">{pub.format}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#14804A]" />
                </Link>
              ))}
            </div>
          </div>

          {/* News */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#075D3A]">
              <Newspaper className="h-4 w-4" /> {t('nav_news')}
            </h3>
            <div className="mt-2 space-y-1">
              {filteredNews.map((news) => (
                <Link
                  key={news.id}
                  to="/news"
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg p-2 text-xs font-medium text-[#17211B] hover:bg-[#EAF5EE]"
                >
                  <span className="truncate max-w-md">{t(news.titleKey)}</span>
                  <span className="text-[10px] text-[#5E6B63]">{news.date}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Offices */}
          {filteredOffices.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#075D3A]">
                <Building2 className="h-4 w-4" /> Regional Offices
              </h3>
              <div className="mt-2 space-y-1">
                {filteredOffices.map((off) => (
                  <Link
                    key={off.id}
                    to="/contact"
                    onClick={onClose}
                    className="flex items-center justify-between rounded-lg p-2 text-xs font-medium text-[#17211B] hover:bg-[#EAF5EE]"
                  >
                    <span>{off.nameKey}</span>
                    <span className="text-[10px] text-[#5E6B63]">{off.phone}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
