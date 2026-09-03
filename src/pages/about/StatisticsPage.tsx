import React from 'react';
import { motion } from 'framer-motion';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listGlanceStatistics } from '../../services/aboutService';
import type { AboutStatistic } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';
import irrigationImg from '../../assets/images/oromia_irrigation_program_1785782711113.jpg';

export const StatisticsPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: stats, loading } = useAboutQuery(
    listGlanceStatistics,
    [] as AboutStatistic[],
  );

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_statistics') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_statistics')}
        title={t('about_page_statistics_title')}
        subtitle={t('about_page_statistics_subtitle')}
        imageSrc={irrigationImg}
        imageAlt={getLocalizedText({
          en: 'Agricultural operations overview',
          om: 'Cuunfaa hojiiwwan qonnaa',
          am: 'የግብርና ሥራዎች አጠቃላይ እይታ',
        })}
      />

      <section
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8"
        aria-labelledby="stats-heading"
      >
        <div className="max-w-2xl">
          <h2
            id="stats-heading"
            className="text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
          >
            {getLocalizedText({
              en: 'Indicators at a glance',
              om: 'Agarsiiftuuwwan sacuu',
              am: 'አመላካቾች በአጭሩ',
            })}
          </h2>
          <p className="mt-2 text-sm text-[#8a7a3a] dark:text-[#c4b56a]">
            {getLocalizedText({
              en: 'Values marked TBD are placeholders until officially verified by the bureau.',
              om: 'Gatiiwwan TBD jedhaman hanga biiroon mirkaneessutti bakka bu\'uu dha.',
              am: 'TBD የተባሉ እሴቶች ቢሮው እስኪያረጋግጥ ድረስ ጊዜያዊ ናቸው።',
            })}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : stats.length === 0 ? (
          <p className="text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {stats.map((stat, index) => (
            <motion.article
              key={stat.id}
              initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
              whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: isReducedMotion ? 0 : index * 0.04 }}
              className={`rounded-2xl border p-5 sm:p-6 bg-white dark:bg-[#0d110f] ${
                stat.isPlaceholder
                  ? 'border-[#D7A928]/45 dark:border-[#e4ad37]/30'
                  : 'border-[#E2E8E3] dark:border-white/[0.09]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {stat.isPlaceholder && (
                  <span className="text-[10px] uppercase tracking-wide font-extrabold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                    TBD
                  </span>
                )}
                {stat.year != null && (
                  <span className="text-xs text-[#56635B] dark:text-[#a5aba6]">{stat.year}</span>
                )}
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#063D2A] dark:text-[#74d62c]">
                {stat.isPlaceholder || stat.value === '—' ? (
                  <span aria-label={getLocalizedText(stat.label)}>—</span>
                ) : (
                  stat.value
                )}
                {stat.unit && !stat.isPlaceholder && (
                  <span className="ml-1 text-lg font-bold text-[#56635B] dark:text-[#a5aba6]">
                    {getLocalizedText(stat.unit)}
                  </span>
                )}
              </p>
              <h3 className="mt-2 text-sm font-semibold text-[#0D1C13] dark:text-[#f5f6f3]">
                {getLocalizedText(stat.label)}
              </h3>
              {stat.source && (
                <p className="mt-3 text-xs text-[#8a7a3a] dark:text-[#c4b56a]">
                  <span className="font-semibold">
                    {getLocalizedText({
                      en: 'Source: ',
                      om: 'Madda: ',
                      am: 'ምንጭ፦ ',
                    })}
                  </span>
                  {getLocalizedText(stat.source)}
                </p>
              )}
              {stat.methodology && (
                <p className="mt-1.5 text-xs text-[#56635B] dark:text-[#a5aba6]">
                  <span className="font-semibold">
                    {getLocalizedText({
                      en: 'Methodology: ',
                      om: 'Tooftaa: ',
                      am: 'ዘዴ፦ ',
                    })}
                  </span>
                  {getLocalizedText(stat.methodology)}
                </p>
              )}
            </motion.article>
          ))}
        </div>
      </section>
    </AboutPageShell>
  );
};
