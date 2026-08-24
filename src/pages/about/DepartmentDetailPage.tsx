import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Wheat, Beef, Droplets, Sprout, type LucideIcon } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { getDepartmentBySlug } from '../../services/aboutService';
import type { AboutDepartment } from '../../types/about';

const ICON_MAP: Record<string, LucideIcon> = {
  Wheat,
  Beef,
  Droplets,
  Sprout,
  Building2,
};

export const DepartmentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [dept, setDept] = useState<AboutDepartment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setDept(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getDepartmentBySlug(slug)
      .then((result) => {
        if (!cancelled) setDept(result ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <AboutPageShell
        breadcrumbs={[
          { label: t('nav_about'), href: '/about' },
          { label: t('about_nav_departments'), href: '/about/departments' },
          { label: '…' },
        ]}
      >
        <p className="max-w-[900px] mx-auto px-4 py-10 text-sm text-[#56635B]">Loading…</p>
      </AboutPageShell>
    );
  }

  if (!dept) {
    return <Navigate to="/about/departments" replace />;
  }

  const Icon = ICON_MAP[dept.iconName] || Building2;

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_departments'), href: '/about/departments' },
        { label: getLocalizedText(dept.name) },
      ]}
    >
      <article className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          to="/about/departments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#087A4B] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('about_nav_departments')}
        </Link>

        <motion.div
          initial={isReducedMotion ? undefined : { opacity: 0, y: 14 }}
          animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F5EC] dark:bg-[#14241a] text-[#087A4B] dark:text-[#74d62c]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0D1C13] dark:text-[#f5f6f3]">
                  {getLocalizedText(dept.name)}
                </h1>
                {dept.isPlaceholder && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                    TBD
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-semibold text-[#087A4B] dark:text-[#74d62c]">
                {getLocalizedText(dept.shortMandate)}
              </p>
            </div>
          </div>

          <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
            {getLocalizedText(dept.description)}
          </p>

          {dept.responsibilities.length > 0 && (
            <section aria-labelledby="dept-responsibilities-heading">
              <h2
                id="dept-responsibilities-heading"
                className="text-lg font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] mb-3"
              >
                {getLocalizedText({
                  en: 'Responsibilities',
                  om: 'Ittigaafatamummaa',
                  am: 'ኃላፊነቶች',
                })}
              </h2>
              <ul className="space-y-2 list-disc list-inside text-[#56635B] dark:text-[#a5aba6]">
                {dept.responsibilities.map((item, i) => (
                  <li key={i}>{getLocalizedText(item)}</li>
                ))}
              </ul>
            </section>
          )}

          {dept.leaderName && (
            <p className="text-sm text-[#56635B] dark:text-[#a5aba6]">
              {getLocalizedText({
                en: 'Leadership',
                om: 'Hoogganummaa',
                am: 'አመራር',
              })}
              {': '}
              {getLocalizedText(dept.leaderName)}
            </p>
          )}
        </motion.div>
      </article>
    </AboutPageShell>
  );
};
