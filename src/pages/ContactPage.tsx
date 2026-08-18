import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { ContactHero } from '../components/contact/ContactHero';
import { EmergencyHotlineBar } from '../components/contact/EmergencyHotlineBar';
import { DirectChannelsGrid } from '../components/contact/DirectChannelsGrid';
import { InquiryFormSection } from '../components/contact/InquiryFormSection';
import { ZonalOfficesDirectory } from '../components/contact/ZonalOfficesDirectory';
import { BureauLocationMap } from '../components/contact/BureauLocationMap';
import { ContactFaqSection } from '../components/contact/ContactFaqSection';
import { MessageSquare, ChevronRight, Home, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleJumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#F8F7F2] dark:bg-[#0c120e] min-h-screen py-8 sm:py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400"
        >
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-[#075D3A] dark:hover:text-emerald-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{language === 'om' ? 'Fuula Duraa' : language === 'am' ? 'ዋና ገጽ' : 'Home'}</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-[#075D3A] dark:text-emerald-400 font-bold">
            {language === 'om' ? 'Qunnamtii & Sarara Deeggarsaa' : language === 'am' ? 'ግንኙነትና ድጋፍ' : 'Contact & Assistance'}
          </span>
        </nav>

        {/* Hero Section */}
        <ContactHero onJumpToSection={handleJumpToSection} />

        {/* Emergency Hotlines & Rapid Response Bar */}
        <EmergencyHotlineBar />

        {/* Direct Bureau Department Channels Grid */}
        <DirectChannelsGrid />

        {/* Multi-Category Dispatch & Grievance Submission Form */}
        <InquiryFormSection />

        {/* Searchable & Filterable Zonal Agricultural Directory (21 Zones) */}
        <ZonalOfficesDirectory />

        {/* Bureau Headquarters Map & Visiting Guide */}
        <BureauLocationMap />

        {/* Frequently Asked Questions */}
        <ContactFaqSection />

        {/* Quick Feedback Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#075D3A] to-[#043320] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-emerald-700/50">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-black">
              {language === 'om'
                ? 'Yaada, Komii ykn Qeeqa Qabduu?'
                : language === 'am'
                ? 'አስተያየት፣ ቅሬታ ወይም ጥቆማ አለዎት?'
                : 'Have Feedback, Suggestions, or General Inquiries?'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              {language === 'om'
                ? 'Tajaajila Biiroo Qonnaa Oromiyaa fooyyessuuf yaanni keessan murteessaadha.'
                : language === 'am'
                ? 'የኦሮሚያ ግብርና ቢሮ አገልግሎቶችን ለማሻሻል የእርስዎ አስተያየት ወሳኝ ነው።'
                : 'Help us improve service delivery across all farmer training centers and regional departments.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D5A62E] hover:bg-[#c49826] text-black font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('feedback_btn')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Farmer Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
};
