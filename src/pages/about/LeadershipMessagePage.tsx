import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { getLeadershipMessage } from '../../services/aboutService';
import type { AboutLeadershipMessage } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';

export const LeadershipMessagePage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: message, loading } = useAboutQuery(
    getLeadershipMessage,
    null as AboutLeadershipMessage | null,
  );

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_leadership'), href: '/about/leadership' },
        { label: t('about_nav_message') },
      ]}
    >
      <article className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Link
          to="/about/leadership"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#087A4B] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('about_nav_leadership')}
        </Link>

        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : !message ? (
          <p className="text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
        ) : (
          <>
            <motion.header
              initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 mb-10"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#087A4B] dark:text-[#74d62c]">
                  {t('about_nav_message')}
                </p>
                {message.isPlaceholder && (
                  <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                    TBD
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#0D1C13] dark:text-[#f5f6f3]">
                {getLocalizedText(message.title)}
              </h1>
              {message.dateLabel && (
                <p className="text-sm text-[#56635B] dark:text-[#a5aba6]">{message.dateLabel}</p>
              )}
            </motion.header>

            <motion.div
              initial={isReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: isReducedMotion ? 0 : 0.08 }}
              className="flex items-center gap-4 mb-10 pb-8 border-b border-[#E2E8E3] dark:border-white/[0.08]"
            >
              <div
                className="h-16 w-16 shrink-0 rounded-full bg-[linear-gradient(145deg,#063D2A,#0B1912)] flex items-center justify-center overflow-hidden"
                role="img"
                aria-label={t('about_photo_placeholder')}
              >
                {message.photoUrl ? (
                  <img
                    src={message.photoUrl}
                    alt={getLocalizedText(message.leaderName)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-7 w-7 text-white/40" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                  {getLocalizedText(message.leaderName)}
                </p>
                <p className="text-sm text-[#56635B] dark:text-[#a5aba6]">
                  {getLocalizedText(message.leaderTitle)}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={isReducedMotion ? undefined : { opacity: 0 }}
              animate={isReducedMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.45, delay: isReducedMotion ? 0 : 0.12 }}
              className="prose-about space-y-6"
            >
              <blockquote className="text-xl sm:text-2xl font-medium italic text-[#0D1C13] dark:text-[#f5f6f3] leading-snug border-l-4 border-[#087A4B] dark:border-[#74d62c] pl-5">
                {getLocalizedText(message.excerpt)}
              </blockquote>
              <div className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed whitespace-pre-line">
                {getLocalizedText(message.body)}
              </div>
              {message.source && (
                <p className="text-xs text-[#8a7a3a] dark:text-[#c4b56a] pt-4">
                  {getLocalizedText(message.source)}
                </p>
              )}
            </motion.div>
          </>
        )}
      </article>
    </AboutPageShell>
  );
};
