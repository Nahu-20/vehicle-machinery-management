import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  History,
  Target,
  Network,
  Users,
  Building2,
  Route,
  BarChart3,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { CountUpStat } from '../common/scroll/CountUpStat';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { buttonHoverTap } from '../../animation/motionVariants';
import {
  getAboutLandingAsync,
  listDiscoverCards,
  listHeroStatistics,
  getLeadershipMessage,
  type AboutLandingContent,
} from '../../services/aboutService';
import type { AboutStatistic, AboutLeadershipMessage } from '../../types/about';
import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

const ICON_MAP: Record<string, LucideIcon> = {
  History,
  Target,
  Network,
  Users,
  Building2,
  Route,
  BarChart3,
  FileText,
};

export const AboutLandingHero: React.FC = () => {
  const { getLocalizedText, t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [content, setContent] = useState<AboutLandingContent | null>(null);
  const [stats, setStats] = useState<AboutStatistic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAboutLandingAsync(), listHeroStatistics()])
      .then(([c, s]) => {
        if (!cancelled) {
          setContent(c);
          setStats(s);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-sm text-[#56635B]">Loading…</div>;
  }

  if (!content) {
    return (
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]">{t('nav_about')}</h1>
        <p className="mt-4 text-[#4E6155] dark:text-[#a5aba6] max-w-xl mx-auto">{t('about_placeholder_banner')}</p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[min(78vh,720px)]">
        <motion.div
          initial={isReducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col justify-center bg-[#063D2A] dark:bg-[#041a12] text-white px-6 sm:px-10 lg:px-14 py-14 sm:py-16"
        >
          <div className="relative max-w-xl space-y-6">
            <AgriPillBadge variant="lime">{getLocalizedText(content.eyebrow)}</AgriPillBadge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
              {getLocalizedText(content.headline)}
            </h1>
            <p className="text-base sm:text-lg text-emerald-50/85 leading-relaxed">
              {getLocalizedText(content.summary)}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <motion.div {...buttonHoverTap}>
                <Link
                  to="/about/how-we-serve"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#A3E635] hover:bg-[#b6f04a] text-[#0A1912] font-bold text-sm px-6 py-3.5 transition-colors"
                >
                  {getLocalizedText(content.exploreCta)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div {...buttonHoverTap}>
                <Link
                  to="/about/history"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 hover:bg-white/10 font-semibold text-sm px-6 py-3.5 transition-colors"
                >
                  {getLocalizedText(content.historyCta)}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="relative min-h-[280px] lg:min-h-full">
          <img
            src={heroFarmlandImg}
            alt={getLocalizedText(content.heroImageAlt)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>

      {stats.length > 0 && (
        <div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-[#E2E8E3] dark:border-white/[0.1] bg-[#E2E8E3] dark:bg-white/[0.08] shadow-lg">
            {stats.map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-[#0d110f] px-4 sm:px-5 py-5 sm:py-6">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-[#74d62c] tracking-tight">
                  {stat.isPlaceholder || stat.value === '—' ? (
                    <span>—</span>
                  ) : (
                    <CountUpStat value={stat.displayValue || stat.value} />
                  )}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm font-semibold text-[#4E6155] dark:text-[#a5aba6] leading-snug">
                  {getLocalizedText(stat.label)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export const AboutDiscoverSection: React.FC = () => {
  const { getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const cards = listDiscoverCards();
  const [landing, setLanding] = useState<AboutLandingContent | null>(null);

  useEffect(() => {
    getAboutLandingAsync().then(setLanding);
  }, []);

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0D1C13] dark:text-[#f5f6f3]">
          {landing
            ? getLocalizedText(landing.discoverTitle)
            : getLocalizedText({ en: 'Discover OAB', om: "Biiroo Qonnaa Daawwadhaa", am: 'ስለ ቢሮው ይወቁ' })}
        </h2>
        <p className="mt-3 text-[#4E6155] dark:text-[#a5aba6]">
          {landing
            ? getLocalizedText(landing.discoverSubtitle)
            : getLocalizedText({
                en: 'Get to know our institution, structure, leadership and impact.',
                om: 'Dhaabbata, caaseffama, hooggansa fi dhiibbaa keenya beekaa.',
                am: 'ተቋማችንን፣ መዋቅራችንን፣ አመራራችንን እና ተፅዕኖአችንን ይወቁ።',
              })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card, index) => {
          const Icon = ICON_MAP[card.iconName] || FileText;
          return (
            <motion.div
              key={card.id}
              initial={isReducedMotion ? undefined : { opacity: 0, y: 12 }}
              whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: isReducedMotion ? 0 : index * 0.04 }}
            >
              <Link
                to={card.href}
                className="group flex h-full flex-col rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-5 hover:border-[#087A4B]/40 dark:hover:border-[#74d62c]/35 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5EC] dark:bg-[#14241a] text-[#087A4B] dark:text-[#74d62c] mb-4">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3] mb-1.5">
                  {getLocalizedText(card.title)}
                </h3>
                <p className="text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed flex-1">
                  {getLocalizedText(card.description)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#087A4B] dark:text-[#74d62c]">
                  {getLocalizedText({ en: 'Learn More', om: 'Dabalata Baradhu', am: 'ተጨማሪ ይወቁ' })}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export const AboutLeadershipQuote: React.FC = () => {
  const { getLocalizedText, t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [message, setMessage] = useState<AboutLeadershipMessage | null>(null);
  const [landing, setLanding] = useState<AboutLandingContent | null>(null);

  useEffect(() => {
    getLeadershipMessage().then(setMessage);
    getAboutLandingAsync().then(setLanding);
  }, []);

  if (!message) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
      <motion.div
        initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
        whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45 }}
        className="grid lg:grid-cols-12 gap-0 overflow-hidden rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] shadow-sm"
      >
        <div className="lg:col-span-5 relative min-h-[260px] bg-[#0B1912]">
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(145deg,#063D2A,#0B1912)]">
            <Users className="h-20 w-20 text-white/20" aria-hidden="true" />
          </div>
          <p className="absolute bottom-4 left-4 right-4 text-xs text-white/70">{t('about_photo_placeholder')}</p>
        </div>
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#087A4B] dark:text-[#74d62c] mb-4">
            {landing
              ? getLocalizedText(landing.messageSectionTitle)
              : getLocalizedText({ en: 'Message from Leadership', om: 'Ergaa Hooggansaa', am: 'ከአመራር መልእክት' })}
          </p>
          <blockquote className="text-xl sm:text-2xl font-medium italic text-[#0D1C13] dark:text-[#f5f6f3] leading-snug">
            {getLocalizedText(message.excerpt)}
          </blockquote>
          <div className="mt-6">
            <p className="font-bold text-[#0D1C13] dark:text-[#f5f6f3]">{getLocalizedText(message.leaderName)}</p>
            <p className="text-sm text-[#56635B] dark:text-[#a5aba6]">{getLocalizedText(message.leaderTitle)}</p>
          </div>
          <Link
            to="/about/leadership/message"
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#075B36] hover:bg-[#064a2c] text-white font-semibold text-sm px-5 py-3 transition-colors"
          >
            {t('about_read_full_message')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
};
