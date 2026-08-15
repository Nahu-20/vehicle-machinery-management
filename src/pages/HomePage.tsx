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
      {/* 1. Hero section */}
      <HeroSection />

      {/* 2. Featured Agricultural Products */}
      <AgriculturalProductsSection />

      {/* 3. Featured programs */}
      <FeaturedProgramsSection />

      {/* 4. Agricultural market snapshot */}
      <MarketSnapshotSection />

      {/* 5. Agricultural Investment Opportunities */}
      <AgriculturalInvestmentSection />

      {/* 6. Achievements and Impact section */}
      <AchievementsSection />

      {/* 7. Latest news and announcements */}
      <NewsAnnouncementsSection />

      {/* 8. Investors and Partners marquee */}
      <InvestorsPartnersSection />

      {/* 9. Farmer resources */}
      <FarmerResourcesSection />

      {/* 10. Contact and feedback call-to-action */}
      <ContactFeedbackCTA />
    </div>
  );
};
