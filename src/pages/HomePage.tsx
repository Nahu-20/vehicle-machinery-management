import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { AgriculturalProductsSection } from '../components/home/AgriculturalProductsSection';
import { FeaturedProgramsSection } from '../components/home/FeaturedProgramsSection';
import { MarketSnapshotSection } from '../components/home/MarketSnapshotSection';
import { AgriculturalInvestmentSection } from '../components/home/AgriculturalInvestmentSection';
import { AchievementsSection } from '../components/achievements/AchievementsSection';
import { NewsAnnouncementsSection } from '../components/home/NewsAnnouncementsSection';
import { InvestorsPartnersSection } from '../components/home/InvestorsPartnersSection';
import { FarmerResourcesSection } from '../components/home/FarmerResourcesSection';
import { ContactFeedbackCTA } from '../components/home/ContactFeedbackCTA';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      <HeroSection />
      <AgriculturalProductsSection />
      <FeaturedProgramsSection />
      <MarketSnapshotSection />
      <AgriculturalInvestmentSection />
      <AchievementsSection />
      <NewsAnnouncementsSection />
      <InvestorsPartnersSection />
      <FarmerResourcesSection />

      {/* 9. Contact and feedback call-to-action */}
      <ContactFeedbackCTA />
    </div>
  );
};
