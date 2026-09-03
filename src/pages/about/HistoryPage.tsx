import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listHistoryMilestones } from '../../services/aboutService';
import type { AboutHistoryMilestone } from '../../types/about';
import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

export const HistoryPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [milestones, setMilestones] = useState<AboutHistoryMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listHistoryMilestones()
      .then(setMilestones)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_history') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_history')}
        title={t('about_page_history_title')}
        subtitle={t('about_page_history_subtitle')}
        imageSrc={heroFarmlandImg}
        imageAlt={getLocalizedText({
          en: 'Agricultural landscape in Oromia',
          om: 'Lafti qonnaa Oromiyaa',
          am: 'በኦሮሚያ የግብርና መሬት ገጽታ',
        })}
      />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : milestones.length === 0 ? (
          <p className="text-sm text-[#56635B] dark:text-[#a5aba6] max-w-xl">{t('about_placeholder_banner')}</p>
        ) : (
          <ol className="relative border-l border-[#087A4B]/30 dark:border-[#74d62c]/30 ml-3 space-y-8">
            {milestones.map((m, index) => (
              <motion.li
                key={m.id}
                initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
                whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="ml-6"
              >
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-[#087A4B] dark:bg-[#74d62c]" />
                <p className="text-xs font-extrabold text-[#087A4B] dark:text-[#74d62c]">{m.yearLabel}</p>
                <h3 className="text-lg font-bold mt-1">{getLocalizedText(m.title)}</h3>
                <p className="text-sm text-[#56635B] dark:text-[#a5aba6] mt-1">{getLocalizedText(m.description)}</p>
              </motion.li>
            ))}
          </ol>
        )}
      </section>
    </AboutPageShell>
  );
};
