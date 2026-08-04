import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { QuickServicesSection } from '../components/home/QuickServicesSection';
import { FeaturedProgramsSection } from '../components/home/FeaturedProgramsSection';
import { MarketSnapshotSection } from '../components/home/MarketSnapshotSection';
import { WeatherAdvisorySection } from '../components/home/WeatherAdvisorySection';
import { NewsAnnouncementsSection } from '../components/home/NewsAnnouncementsSection';
import { FarmerResourcesSection } from '../components/home/FarmerResourcesSection';
import { ContactFeedbackCTA } from '../components/home/ContactFeedbackCTA';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      {/* 1. Hero section */}
      <HeroSection />

      {/* 2. Quick services */}
      <QuickServicesSection />

      {/* 3. Featured programs */}
      <FeaturedProgramsSection />

      {/* 4. Agricultural market snapshot */}
      <MarketSnapshotSection />

      {/* 5. Weather and advisory section */}
      <WeatherAdvisorySection />

      {/* 6. Latest news and announcements */}
      <NewsAnnouncementsSection />

      {/* 7. Farmer resources */}
      <FarmerResourcesSection />

      {/* 8. Contact and feedback call-to-action */}
      <ContactFeedbackCTA />
    </div>
  );
};
