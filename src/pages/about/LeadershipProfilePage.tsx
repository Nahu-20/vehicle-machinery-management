import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { getLeaderBySlug } from '../../services/aboutService';
import type { AboutLeader } from '../../types/about';

export const LeadershipProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [leader, setLeader] = useState<AboutLeader | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setLeader(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getLeaderBySlug(slug)
      .then((result) => {
        if (!cancelled) setLeader(result ?? null);
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
          { label: t('about_nav_leadership'), href: '/about/leadership' },
          { label: '…' },
        ]}
      >
        <p className="max-w-[900px] mx-auto px-4 py-10 text-sm text-[#56635B]">Loading…</p>
      </AboutPageShell>
    );
  }

  if (!leader) {
    return <Navigate to="/about/leadership" replace />;
  }

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_leadership'), href: '/about/leadership' },
        { label: getLocalizedText(leader.name) },
      ]}
    >
      <article className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          to="/about/leadership"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#087A4B] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('about_nav_leadership')}
        </Link>

        <motion.div
          initial={isReducedMotion ? undefined : { opacity: 0, y: 14 }}
          animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid sm:grid-cols-12 gap-8"
        >
          <div className="sm:col-span-4">
            <div
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[linear-gradient(145deg,#063D2A,#0B1912)] flex items-center justify-center border border-[#E2E8E3] dark:border-white/[0.1]"
              role="img"
              aria-label={t('about_photo_placeholder')}
            >
              {leader.photoUrl ? (
                <img
                  src={leader.photoUrl}
                  alt={
                    leader.photoAlt
                      ? getLocalizedText(leader.photoAlt)
                      : getLocalizedText(leader.name)
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <User className="h-20 w-20 text-white/25" aria-hidden="true" />
                  <p className="absolute bottom-3 left-3 right-3 text-xs text-white/70 text-center">
                    {t('about_photo_placeholder')}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="sm:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0D1C13] dark:text-[#f5f6f3]">
                {getLocalizedText(leader.name)}
              </h1>
              {leader.isPlaceholder && (
                <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                  TBD
                </span>
              )}
            </div>
            <p className="text-base font-semibold text-[#087A4B] dark:text-[#74d62c]">
              {getLocalizedText(leader.title)}
            </p>
            {leader.areaOfResponsibility && (
              <p className="text-sm text-[#56635B] dark:text-[#a5aba6]">
                {getLocalizedText(leader.areaOfResponsibility)}
              </p>
            )}
            {leader.biography && (
              <p className="text-base text-[#4E6155] dark:text-[#a5aba6] leading-relaxed whitespace-pre-line">
                {getLocalizedText(leader.biography)}
              </p>
            )}
          </div>
        </motion.div>
      </article>
    </AboutPageShell>
  );
};
