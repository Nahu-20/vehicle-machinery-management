import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listLeaders } from '../../services/aboutService';
import type { AboutLeader } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';
import coffeeImg from '../../assets/images/oromia_coffee_harvest_1785782724559.jpg';

type LeadershipTab = 'bureau' | 'senior';

const BUREAU_LEVELS = new Set(['bureau-head', 'deputy']);
const SENIOR_LEVELS = new Set(['senior', 'directorate']);

export const LeadershipPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: leaders, loading } = useAboutQuery(listLeaders, [] as AboutLeader[]);
  const [tab, setTab] = useState<LeadershipTab>('bureau');

  const filtered = useMemo(() => {
    const levels = tab === 'bureau' ? BUREAU_LEVELS : SENIOR_LEVELS;
    return leaders.filter((l) => levels.has(l.level));
  }, [leaders, tab]);

  const renderCard = (leader: AboutLeader, index: number) => (
    <motion.article
      key={leader.id}
      initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: isReducedMotion ? 0 : index * 0.04 }}
      className="flex flex-col rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] overflow-hidden"
    >
      <div
        className="relative aspect-[4/3] bg-[linear-gradient(145deg,#063D2A,#0B1912)] flex items-center justify-center"
        role="img"
        aria-label={t('about_photo_placeholder')}
      >
        {leader.photoUrl ? (
          <img
            src={leader.photoUrl}
            alt={leader.photoAlt ? getLocalizedText(leader.photoAlt) : getLocalizedText(leader.name)}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <User className="h-16 w-16 text-white/25" aria-hidden="true" />
            <p className="absolute bottom-3 left-3 right-3 text-xs text-white/70">
              {t('about_photo_placeholder')}
            </p>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
            {getLocalizedText(leader.name)}
          </h3>
          {leader.isPlaceholder && (
            <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
              TBD
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-[#087A4B] dark:text-[#74d62c]">
          {getLocalizedText(leader.title)}
        </p>
        {leader.areaOfResponsibility && (
          <p className="mt-2 text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed flex-1">
            {getLocalizedText(leader.areaOfResponsibility)}
          </p>
        )}
        <Link
          to={`/about/leadership/${leader.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#063D2A] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
        >
          {t('about_view_profile')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  );

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_leadership') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_leadership')}
        title={t('about_page_leadership_title')}
        subtitle={t('about_page_leadership_subtitle')}
        imageSrc={coffeeImg}
        imageAlt={getLocalizedText({
          en: 'Agricultural work in Oromia',
          om: 'Hojii qonnaa Oromiyaa',
          am: 'በኦሮሚያ የግብርና ሥራ',
        })}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        <div
          role="tablist"
          aria-label={t('about_nav_leadership')}
          className="inline-flex flex-wrap gap-1 rounded-xl border border-[#E2E8E3] dark:border-white/[0.1] bg-white dark:bg-[#0d110f] p-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-bureau"
            aria-selected={tab === 'bureau'}
            aria-controls="panel-bureau"
            onClick={() => setTab('bureau')}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] ${
              tab === 'bureau'
                ? 'bg-[#063D2A] text-white dark:bg-[#087A4B]'
                : 'text-[#56635B] dark:text-[#a5aba6] hover:text-[#0D1C13] dark:hover:text-[#f5f6f3]'
            }`}
          >
            {t('about_tab_bureau')}
          </button>
          <button
            type="button"
            role="tab"
            id="tab-senior"
            aria-selected={tab === 'senior'}
            aria-controls="panel-senior"
            onClick={() => setTab('senior')}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] ${
              tab === 'senior'
                ? 'bg-[#063D2A] text-white dark:bg-[#087A4B]'
                : 'text-[#56635B] dark:text-[#a5aba6] hover:text-[#0D1C13] dark:hover:text-[#f5f6f3]'
            }`}
          >
            {t('about_tab_senior')}
          </button>
        </div>

        <div
          role="tabpanel"
          id={tab === 'bureau' ? 'panel-bureau' : 'panel-senior'}
          aria-labelledby={tab === 'bureau' ? 'tab-bureau' : 'tab-senior'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {loading ? (
            <p className="col-span-full text-[#56635B]">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full text-[#56635B] dark:text-[#a5aba6]">{t('about_placeholder_banner')}</p>
          ) : (
            filtered.map((leader, i) => renderCard(leader, i))
          )}
        </div>
      </div>
    </AboutPageShell>
  );
};
