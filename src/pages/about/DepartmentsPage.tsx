import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Wheat,
  Beef,
  Droplets,
  Sprout,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listDepartments } from '../../services/aboutService';
import type { AboutDepartment } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';
import irrigationImg from '../../assets/images/oromia_irrigation_program_1785782711113.jpg';

const ICON_MAP: Record<string, LucideIcon> = {
  Wheat,
  Beef,
  Droplets,
  Sprout,
  Building2,
};

export const DepartmentsPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: departments, loading } = useAboutQuery(
    listDepartments,
    [] as AboutDepartment[],
  );

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_departments') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_departments')}
        title={t('about_page_departments_title')}
        subtitle={t('about_page_departments_subtitle')}
        imageSrc={irrigationImg}
        imageAlt={getLocalizedText({
          en: 'Irrigation and agricultural programs',
          om: 'Jallisii fi sagantaalee qonnaa',
          am: 'መስኖና የግብርና ፕሮግራሞች',
        })}
      />

      <section
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
        aria-labelledby="departments-grid-heading"
      >
        <h2 id="departments-grid-heading" className="sr-only">
          {t('about_page_departments_title')}
        </h2>
        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : departments.length === 0 ? (
          <p className="text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept, index) => {
            const Icon = ICON_MAP[dept.iconName] || Building2;
            return (
              <motion.div
                key={dept.id}
                initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
                whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: isReducedMotion ? 0 : index * 0.04 }}
              >
                <Link
                  to={`/about/departments/${dept.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-5 sm:p-6 hover:border-[#087A4B]/40 dark:hover:border-[#74d62c]/35 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5EC] dark:bg-[#14241a] text-[#087A4B] dark:text-[#74d62c] mb-4">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                      {getLocalizedText(dept.name)}
                    </h3>
                    {dept.isPlaceholder && (
                      <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                        TBD
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed flex-1">
                    {getLocalizedText(dept.shortMandate)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#087A4B] dark:text-[#74d62c]">
                    {getLocalizedText({
                      en: 'View directorate',
                      om: 'Daayreektoreetii ilaali',
                      am: 'ዳይሬክቶሬቱን ይመልከቱ',
                    })}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </AboutPageShell>
  );
};
