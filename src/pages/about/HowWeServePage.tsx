import React from 'react';
import { motion } from 'framer-motion';
import { AboutPageShell } from '../../components/about/AboutPageShell';
import { AboutSectionHero } from '../../components/about/AboutSectionHero';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listServiceChain, listStakeholders } from '../../services/aboutService';
import type { AboutServiceChainStep, AboutStakeholder } from '../../types/about';
import { useAboutQuery } from '../../hooks/useAboutQuery';
import heroFarmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

export const HowWeServePage: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const { data: chain, loading: chainLoading } = useAboutQuery(
    listServiceChain,
    [] as AboutServiceChainStep[],
  );
  const { data: stakeholders, loading: stakeLoading } = useAboutQuery(
    listStakeholders,
    [] as AboutStakeholder[],
  );
  const loading = chainLoading || stakeLoading;

  return (
    <AboutPageShell
      breadcrumbs={[
        { label: t('nav_about'), href: '/about' },
        { label: t('about_nav_how_we_serve') },
      ]}
    >
      <AboutSectionHero
        eyebrow={t('about_nav_how_we_serve')}
        title={t('about_page_how_we_serve_title')}
        subtitle={t('about_page_how_we_serve_subtitle')}
        imageSrc={heroFarmlandImg}
        imageAlt={getLocalizedText({
          en: 'Farmland across Oromia',
          om: 'Lafti qonnaa Oromiyaa keessa',
          am: 'በመላው ኦሮሚያ የእርሻ መሬት',
        })}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {loading ? (
          <p className="text-sm text-[#56635B]">Loading…</p>
        ) : chain.length === 0 && stakeholders.length === 0 ? (
          <p className="text-sm text-[#56635B]">{t('about_placeholder_banner')}</p>
        ) : null}
        <section aria-labelledby="service-chain-heading" className="space-y-8">
          <div className="max-w-2xl">
            <h2
              id="service-chain-heading"
              className="text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
            >
              {getLocalizedText({
                en: 'From policy to the farm gate',
                om: 'Imaammataa irraa hanga balbala qonnaatti',
                am: 'ከፖሊሲ እስከ የእርሻ በር',
              })}
            </h2>
            <p className="mt-2 text-[#56635B] dark:text-[#a5aba6]">
              {getLocalizedText({
                en: 'A storytelling view of how public agricultural services move through the system.',
                om: 'Akkaataa tajaajilli qonnaa ummataa sirna keessa socho\'u.',
                am: 'የህዝብ የግብርና አገልግሎቶች በሥርዓቱ ውስጥ እንዴት እንደሚንቀሳቀሱ ትረካ።',
              })}
            </p>
          </div>

          <ol className="relative space-y-0">
            {chain.map((step, index) => {
              const isLast = index === chain.length - 1;
              return (
                <motion.li
                  key={step.id}
                  initial={isReducedMotion ? undefined : { opacity: 0, x: -8 }}
                  whileInView={isReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.35, delay: isReducedMotion ? 0 : index * 0.03 }}
                  className="relative grid grid-cols-[48px_1fr] gap-4 sm:gap-6"
                >
                  <div className="relative flex flex-col items-center">
                    <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#063D2A] dark:bg-[#087A4B] text-white text-sm font-extrabold">
                      {index + 1}
                    </span>
                    {!isLast && (
                      <span
                        className="absolute top-10 bottom-0 w-0.5 bg-[#087A4B]/30 dark:bg-[#74d62c]/25"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={`pb-10 ${isLast ? 'pb-0' : ''}`}>
                    <h3 className="text-lg font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                      {getLocalizedText(step.title)}
                    </h3>
                    <p className="mt-1.5 text-[#56635B] dark:text-[#a5aba6] leading-relaxed max-w-xl">
                      {getLocalizedText(step.description)}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="stakeholders-heading" className="space-y-6">
          <h2
            id="stakeholders-heading"
            className="text-xl sm:text-2xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3]"
          >
            {getLocalizedText({
              en: 'Who we serve',
              om: 'Eenyu tajaajilna',
              am: 'ማንን እናገለግላለን',
            })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stakeholders.map((s, index) => (
              <motion.article
                key={s.id}
                initial={isReducedMotion ? undefined : { opacity: 0, y: 10 }}
                whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: isReducedMotion ? 0 : index * 0.04 }}
                className="rounded-xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#0d110f] p-5"
              >
                <h3 className="font-bold text-[#0D1C13] dark:text-[#f5f6f3]">
                  {getLocalizedText(s.title)}
                </h3>
                <p className="mt-2 text-sm text-[#56635B] dark:text-[#a5aba6] leading-relaxed">
                  {getLocalizedText(s.description)}
                </p>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </AboutPageShell>
  );
};
