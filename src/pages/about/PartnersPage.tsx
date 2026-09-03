import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listPartners } from '../../services/aboutService';
import type { AboutPartner, AboutPartnerCategory } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';
import coffeeImg from '../../assets/images/oromia_coffee_harvest_1785782724559.jpg';

const CATEGORY_ORDER: AboutPartnerCategory[] = [
  'federal',
  'regional',
  'university',
  'research',
  'development',
  'ngo',
  'private',
  'international',
];

const categoryLabel = (category: AboutPartnerCategory) => {
  const labels: Record<AboutPartnerCategory, { en: string; om: string; am: string }> = {
    federal: { en: 'Federal', om: 'Federaala', am: 'ፌደራል' },
    regional: { en: 'Regional', om: 'Naannoo', am: 'ክልል' },
    university: { en: 'Universities', om: 'Yuunivarsiitiiwwan', am: 'ዩኒቨርሲቲዎች' },
    research: { en: 'Research', om: 'Qorannoo', am: 'ምርምር' },
    development: { en: 'Development', om: 'Misooma', am: 'ልማት' },
    ngo: { en: 'NGOs', om: 'Dhaabbilee miti-mootummaa', am: 'መንግሥታዊ ያልሆኑ' },
    private: { en: 'Private sector', om: 'Sektera dhuunfaa', am: 'የግል ዘርፍ' },
    international: { en: 'International', om: 'Idil-addunyaa', am: 'ዓለም አቀፍ' },
    other: { en: 'Other', om: 'Kan biroo', am: 'ሌላ' },
  };
  return labels[category];
};

export const PartnersPage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: partners, loading } = useAboutQuery(listPartners, [] as AboutPartner[]);

  const grouped = useMemo(() => {
    const map = new Map<AboutPartnerCategory, typeof partners>();
    partners.forEach((p) => {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    });
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [partners]);

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_partners') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_partners')}
        title={t('about_page_partners_title')}
        subtitle={t('about_page_partners_subtitle')}
        imageSrc={coffeeImg}
        imageAlt={getLocalizedText({
          en: 'Partnership and collaboration in agriculture',
          om: 'Michummaa fi walta\'iinsa qonnaa',
          am: 'በግብርና አጋርነትና ትብብር',
        })}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : partners.length === 0 ? (
          <p className="text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
        ) : null}
        {grouped.map((group) => (
          <section
            key={group.category}
            aria-labelledby={`partner-cat-${group.category}`}
            className="space-y-4"
          >
            <h2
              id={`partner-cat-${group.category}`}
              className="text-lg sm:text-xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
            >
              {getLocalizedText(categoryLabel(group.category))}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((partner, index) => (
                <motion.li
                  key={partner.id}
                  initial={isReducedMotion ? undefined : { opacity: 0, y: 10 }}
                  whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.3, delay: isReducedMotion ? 0 : index * 0.04 }}
                >
                  <article className="h-full rounded-xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                        {getLocalizedText(partner.name)}
                      </h3>
                      {partner.isPlaceholder && (
                        <span className="text-[10px] uppercase tracking-wide font-bold text-[#8a7a3a] dark:text-[#c4b56a] bg-[#FFF8E8] dark:bg-[#1a1810] px-2 py-0.5 rounded">
                          TBD
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed">
                      {getLocalizedText(partner.description)}
                    </p>
                    {partner.websiteUrl && (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#087A4B] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
                      >
                        {getLocalizedText({
                          en: 'Visit website',
                          om: 'Marsariitii daawwadhu',
                          am: 'ድረ-ገጽ ይጎብኙ',
                        })}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </article>
                </motion.li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AboutPageShell>
  );
};
