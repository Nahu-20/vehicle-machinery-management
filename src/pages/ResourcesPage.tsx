import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { mockPublications } from '../data/mockData';
import { Search, Download, FileText, Calendar, BookOpen, Shield, Video, FileCheck } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const filtered = mockPublications.filter((pub) => {
    const matchesQuery = t(pub.titleKey).toLowerCase().includes(query.toLowerCase()) || t(pub.descriptionKey).toLowerCase().includes(query.toLowerCase());
    const matchesFormat = selectedFormat === 'all' || pub.format.toLowerCase() === selectedFormat.toLowerCase();
    return matchesQuery && matchesFormat;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'calendar': return <Calendar className="h-6 w-6 text-[#075D3A]" />;
      case 'guidance': return <BookOpen className="h-6 w-6 text-[#075D3A]" />;
      case 'manual': return <FileText className="h-6 w-6 text-[#075D3A]" />;
      case 'policy': return <Shield className="h-6 w-6 text-[#075D3A]" />;
      case 'video': return <Video className="h-6 w-6 text-[#075D3A]" />;
      case 'form': default: return <FileCheck className="h-6 w-6 text-[#075D3A]" />;
    }
  };

  return (
    <div className="bg-[#F8F7F2] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="rounded-2xl bg-[#075D3A] text-white p-8 md:p-12 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D5A62E]">Open Access Knowledge</span>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">{t('nav_resources')}</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-2xl">{t('resources_subtitle')}</p>
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl bg-white p-4 shadow-xs border flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter publications or documents..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-xs text-[#17211B] focus:border-[#075D3A] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5E6B63]">Format:</span>
            {['all', 'pdf', 'mp4', 'docx'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`rounded-lg px-3 py-1 text-xs font-bold uppercase transition-all min-h-[44px] sm:min-h-[auto] ${
                  selectedFormat === fmt
                    ? 'bg-[#075D3A] text-white'
                    : 'bg-gray-100 text-[#5E6B63] hover:bg-gray-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pub) => (
            <div key={pub.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5EE]">
                    {getResourceIcon(pub.type)}
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#075D3A] border border-emerald-100">
                    {pub.format} • {pub.fileSize || 'PDF'}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#17211B]">{t(pub.titleKey)}</h3>
                <p className="mt-2 text-xs text-[#5E6B63] leading-relaxed">{t(pub.descriptionKey)}</p>
              </div>

              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <span className="text-[10px] text-[#5E6B63]">{pub.language}</span>
                <a
                  href={pub.downloadUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    showToast(t('demo_download_notice'), 'info', t(pub.titleKey));
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-[#075D3A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#14804A] min-h-[44px]"
                >
                  <Download className="h-3.5 w-3.5 text-[#D5A62E]" />
                  <span>{t('res_download')}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
