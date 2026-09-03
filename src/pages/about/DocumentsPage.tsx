import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Search } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listStrategicDocuments } from '../../services/aboutService';
import type { AboutDocumentCategory, AboutStrategicDocument } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';
import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

const ALL_CATEGORIES: Array<AboutDocumentCategory | 'all'> = [
  'all',
  'strategy',
  'policy',
  'annual-report',
  'guideline',
  'proclamation',
  'plan',
  'publication',
];

const categoryLabelKey = (cat: AboutDocumentCategory | 'all') => {
  const map: Record<AboutDocumentCategory | 'all', { en: string; om: string; am: string }> = {
    all: { en: 'All', om: 'Hunda', am: 'ሁሉም' },
    strategy: { en: 'Strategy', om: 'Tarsiimoo', am: 'ስትራቴጂ' },
    policy: { en: 'Policy', om: 'Imaammata', am: 'ፖሊሲ' },
    'annual-report': { en: 'Annual report', om: 'Gabaasa waggaa', am: 'ዓመታዊ ሪፖርት' },
    guideline: { en: 'Guideline', om: 'Qajeelfama', am: 'መመሪያ' },
    proclamation: { en: 'Proclamation', om: 'Labsii', am: 'አዋጅ' },
    plan: { en: 'Plan', om: 'Karoora', am: 'እቅድ' },
    publication: { en: 'Publication', om: 'Maxxansa', am: 'ህትመት' },
    regulation: { en: 'Regulation', om: 'Dambii', am: 'ደንብ' },
    manual: { en: 'Manual', om: 'Manaawala', am: 'መመሪያ መጽሐፍ' },
    other: { en: 'Other', om: 'Kan biroo', am: 'ሌላ' },
  };
  return map[cat];
};

export const DocumentsPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: documents, loading } = useAboutQuery(
    listStrategicDocuments,
    [] as AboutStrategicDocument[],
  );
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AboutDocumentCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (category !== 'all' && doc.category !== category) return false;
      if (!q) return true;
      const title = getLocalizedText(doc.title).toLowerCase();
      const desc = getLocalizedText(doc.description).toLowerCase();
      return title.includes(q) || desc.includes(q) || doc.category.includes(q);
    });
  }, [documents, query, category, getLocalizedText]);

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_documents') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_documents')}
        title={t('about_page_documents_title')}
        subtitle={t('about_page_documents_subtitle')}
        imageSrc={heroFarmlandImg}
        imageAlt={getLocalizedText({
          en: 'Institutional publications backdrop',
          om: 'Duubbee maxxansa dhaabbataa',
          am: 'የተቋም ህትመቶች ዳራ',
        })}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
        ) : null}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <label className="relative flex-1 max-w-md">
            <span className="sr-only">{t('about_search_docs')}</span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#56635B] dark:text-[#a5aba6]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('about_search_docs')}
              className="w-full rounded-xl border border-[#E2E8E3] dark:border-white/[0.12] bg-white dark:bg-[#0d110f] pl-10 pr-4 py-2.5 text-sm text-[#0D1C13] dark:text-[#f5f6f3] placeholder:text-[#8a948d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B]"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">{t('about_filter_all')}</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AboutDocumentCategory | 'all')}
              className="rounded-xl border border-[#E2E8E3] dark:border-white/[0.12] bg-white dark:bg-[#0d110f] px-3 py-2.5 text-sm text-[#0D1C13] dark:text-[#f5f6f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B]"
              aria-label={t('about_filter_all')}
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? t('about_filter_all') : getLocalizedText(categoryLabelKey(cat))}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ul className="space-y-3" aria-live="polite">
          {filtered.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[#E2E8E3] dark:border-white/[0.12] px-5 py-8 text-center text-sm text-[#56635B] dark:text-[#a5aba6]">
              {getLocalizedText({
                en: 'No documents match your search.',
                om: 'Sananni barbaachisaa kee hin argamne.',
                am: 'ከፍለጋዎ ጋር የሚዛመድ ሰነድ የለም።',
              })}
            </li>
          ) : (
            filtered.map((doc, index) => {
              const canDownload = Boolean(doc.downloadUrl);
              return (
                <motion.li
                  key={doc.id}
                  initial={isReducedMotion ? undefined : { opacity: 0, y: 8 }}
                  whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.3, delay: isReducedMotion ? 0 : index * 0.03 }}
                >
                  <article className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-4 sm:p-5">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F5EC] dark:bg-[#14241a] text-[#087A4B] dark:text-[#74d62c]">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                          {getLocalizedText(doc.title)}
                        </h3>
                        {doc.isPlaceholder && (
                          <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                            TBD
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed">
                        {getLocalizedText(doc.description)}
                      </p>
                      <p className="mt-2 text-xs text-[#8a948d] dark:text-[#7a857e]">
                        {getLocalizedText(categoryLabelKey(doc.category))}
                        {doc.year != null && ` · ${doc.year}`}
                        {doc.language && ` · ${doc.language}`}
                        {doc.fileSize && ` · ${doc.fileSize}`}
                      </p>
                    </div>
                    {canDownload ? (
                      <a
                        href={doc.downloadUrl}
                        download
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#075B36] hover:bg-[#064a2c] text-white font-semibold text-sm px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] shrink-0"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        {getLocalizedText({
                          en: 'Download',
                          om: 'Buusi',
                          am: 'አውርድ',
                        })}
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title={t('about_download_unavailable')}
                        aria-disabled="true"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8E3] dark:border-white/[0.1] bg-[#F3F4F1] dark:bg-[#161d18] text-[#8a948d] dark:text-[#7a857e] font-semibold text-sm px-4 py-2.5 cursor-not-allowed shrink-0"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        {t('about_download_unavailable')}
                      </button>
                    )}
                  </article>
                </motion.li>
              );
            })
          )}
        </ul>
      </div>
    </AboutPageShell>
  );
};
