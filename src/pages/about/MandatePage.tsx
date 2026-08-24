import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Shield, ListChecks, Heart, Scale } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listMandateBlocks } from '../../services/aboutService';
import type { AboutMandateBlock } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';
import irrigationImg from '../../assets/images/oromia_irrigation_program_1785782711113.jpg';

const KIND_ICON = {
  mandate: Shield,
  mission: Target,
  vision: Eye,
  objective: ListChecks,
  value: Heart,
  legal: Scale,
} as const;

export const MandatePage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: blocks, loading } = useAboutQuery(listMandateBlocks, [] as AboutMandateBlock[]);

  const primary = blocks.filter((b) =>
    b.kind === 'mandate' || b.kind === 'mission' || b.kind === 'vision',
  );
  const objectives = blocks.filter((b) => b.kind === 'objective');
  const values = blocks.filter((b) => b.kind === 'value');
  const legal = blocks.filter((b) => b.kind === 'legal');

  const renderBlock = (block: AboutMandateBlock, featured = false) => {
    const Icon = KIND_ICON[block.kind];
    return (
      <motion.article
        key={block.id}
        initial={isReducedMotion ? undefined : { opacity: 0, y: 14 }}
        whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        className={
          featured
            ? 'rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-6 sm:p-8'
            : 'rounded-xl border border-[#E2E8E3] dark:border-white/[0.08] bg-white/80 dark:bg-[#0d110f]/80 p-5'
        }
      >
        <div className="flex items-start gap-3 mb-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5EC] dark:bg-[#14241a] text-[#087A4B] dark:text-[#74d62c]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={
                  featured
                    ? 'text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]'
                    : 'text-base font-bold text-[#0D1C13] dark:text-[#f5f6f3]'
                }
              >
                {getLocalizedText(block.title)}
              </h3>
              {block.isPlaceholder && (
                <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                  TBD
                </span>
              )}
            </div>
          </div>
        </div>
        <p
          className={
            featured
              ? 'text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6] leading-relaxed'
              : 'text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed'
          }
        >
          {getLocalizedText(block.body)}
        </p>
      </motion.article>
    );
  };

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_mandate') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_mandate')}
        title={t('about_page_mandate_title')}
        subtitle={t('about_page_mandate_subtitle')}
        imageSrc={irrigationImg}
        imageAlt={getLocalizedText({
          en: 'Irrigation program in Oromia',
          om: 'Sagantaa jallisii Oromiyaa',
          am: 'በኦሮሚያ የመስኖ ፕሮግራም',
        })}
      />

      {loading ? (
        <p className="max-w-[1400px] mx-auto px-4 py-10 text-sm text-[#56635B]">Loading…</p>
      ) : blocks.length === 0 ? (
        <p className="max-w-[1400px] mx-auto px-4 py-10 text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
      ) : null}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        <section aria-labelledby="mandate-primary-heading" className="space-y-6">
          <h2
            id="mandate-primary-heading"
            className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#087A4B] dark:text-[#74d62c]"
          >
            {getLocalizedText({
              en: 'Mandate, Mission & Vision',
              om: "Aangoo, Ergama & Mul'ata",
              am: 'ተልዕኮ፣ ራዕይና ስልጣን',
            })}
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {primary.map((b) => renderBlock(b, true))}
          </div>
        </section>

        {objectives.length > 0 && (
          <section aria-labelledby="mandate-objectives-heading" className="space-y-5">
            <h2
              id="mandate-objectives-heading"
              className="text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
            >
              {getLocalizedText({
                en: 'Strategic Objectives',
                om: 'Kaayyoo Tarsiimoo',
                am: 'ስትራቴጂክ ዓላማዎች',
              })}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">{objectives.map((b) => renderBlock(b))}</div>
          </section>
        )}

        {values.length > 0 && (
          <section aria-labelledby="mandate-values-heading" className="space-y-5">
            <h2
              id="mandate-values-heading"
              className="text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
            >
              {getLocalizedText({
                en: 'Core Values',
                om: 'Gatiiwwan Bu\'uraa',
                am: 'መሠረታዊ እሴቶች',
              })}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">{values.map((b) => renderBlock(b))}</div>
          </section>
        )}

        {legal.length > 0 && (
          <section aria-labelledby="mandate-legal-heading" className="space-y-5">
            <h2
              id="mandate-legal-heading"
              className="text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
            >
              {getLocalizedText({
                en: 'Legal & Policy Foundation',
                om: 'Hundee Seeraa & Imaammataa',
                am: 'የሕግና ፖሊሲ መሠረት',
              })}
            </h2>
            <div className="space-y-4">{legal.map((b) => renderBlock(b))}</div>
          </section>
        )}
      </div>
    </AboutPageShell>
  );
};
