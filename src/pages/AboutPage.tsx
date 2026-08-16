import React from 'react';
import { AboutHero } from '../components/about/AboutHero';
import { InstitutionalHighlights } from '../components/about/InstitutionalHighlights';
import { WhoWeAre } from '../components/about/WhoWeAre';
import { MissionVisionMandate } from '../components/about/MissionVisionMandate';
import { StrategicPriorities } from '../components/about/StrategicPriorities';
import { RegionalRole } from '../components/about/RegionalRole';
import { ImpactStats } from '../components/about/ImpactStats';
import { LargeAgriculturalStatement } from '../components/about/LargeAgriculturalStatement';
import { LeadershipSection } from '../components/about/LeadershipSection';
import { PartnershipSection } from '../components/about/PartnershipSection';
import { InvestorBridgeSection } from '../components/about/InvestorBridgeSection';
import { AboutCTA } from '../components/about/AboutCTA';

export const AboutPage: React.FC = () => {
  return (
    <div className="bg-[#F8F7F2] dark:bg-[#070908] min-h-screen text-[#111310] dark:text-[#f5f6f3] transition-colors duration-300">
      {/* 1. Hero Section */}
      <AboutHero />

      {/* 2. Institutional Partners Strip */}
      <InstitutionalHighlights />

      {/* 3. Who We Are Editorial Story */}
      <WhoWeAre />

      {/* 4. Mission, Vision & Core Mandate */}
      <MissionVisionMandate />

      {/* 5. Strategic Priority Pillars */}
      <StrategicPriorities />

      {/* 6. How We Deliver Impact Across Oromia */}
      <RegionalRole />

      {/* 7. Verified Reach & Operations */}
      <ImpactStats />

      {/* 8. Large Editorial Statement */}
      <LargeAgriculturalStatement />

      {/* 9. Leadership & Technical Directorates */}
      <LeadershipSection />

      {/* 10. Collaborative Ecosystem */}
      <PartnershipSection />

      {/* 11. Agricultural Investment Bridge */}
      <InvestorBridgeSection />

      {/* 12. Final Closing CTA */}
      <AboutCTA />
    </div>
  );
};

