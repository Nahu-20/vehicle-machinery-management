import React from 'react';
import { AboutPageShell } from '../components/about/AboutPageShell';
import {
  AboutLandingHero,
  AboutDiscoverSection,
  AboutLeadershipQuote,
} from '../components/about/AboutLandingSections';
import { InvestorBridgeSection } from '../components/about/InvestorBridgeSection';
import { AboutCTA } from '../components/about/AboutCTA';
import { useLanguage } from '../context/LanguageContext';

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <AboutPageShell showPlaceholderBanner breadcrumbs={[{ label: t('nav_about') }]}>
      <AboutLandingHero />
      <AboutDiscoverSection />
      <AboutLeadershipQuote />
      <InvestorBridgeSection />
      <AboutCTA />
    </AboutPageShell>
  );
};
