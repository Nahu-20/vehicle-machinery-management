import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  PhoneCall,
  Mail,
  Building2,
  Clock,
  ShieldCheck,
  Headphones,
  Compass,
  FileQuestion,
  Sparkles,
} from 'lucide-react';

interface ContactHeroProps {
  onJumpToSection: (sectionId: string) => void;
}

export const ContactHero: React.FC<ContactHeroProps> = ({ onJumpToSection }) => {
  const { language } = useLanguage();

  const getEyebrow = () => {
    switch (language) {
      case 'om':
        return 'QUNNAMTII & TAJAAJILA UUMMATAA';
      case 'am':
        return 'የህዝብ ግንኙነትና የገበሬዎች ድጋፍ ማዕከል';
      default:
        return 'OFFICIAL PUBLIC ENGAGEMENT & FARMER DISPATCH';
    }
  };

  const getTitle = () => {
    switch (language) {
      case 'om':
        return 'Waajjiraalee fi Sarara Deeggarsaa Nu Qunnamaa';
      case 'am':
        return 'የኦሮሚያ ግብርና ቢሮ የህዝብ መረጃና የድጋፍ መስመሮች';
      default:
        return 'Contact Oromia Bureau of Agriculture & Farmer Dispatch';
    }
  };

  const getSubtitle = () => {
    switch (language) {
      case 'om':
        return 'Gorsa qonnaa ariifachiisaa, gabaasa rakkoo galtee, odeeffannoo caalbaasii fi qunnamtii waajjiraalee qonnaa godinaalee 21n Oromiyaa sarara bilisaatiin argadhaa.';
      case 'am':
        return 'ፈጣን የግብርና ድጋፍ፣ የማዳበሪያና ምርጥ ዘር ቅሬታ ማቅረቢያ፣ የጨረታ መረጃዎች እና የ21ዱ የኦሮሚያ ዞን ግብርና መምሪያዎችን በነፃ የስልክ መስመር ያግኙ።';
      default:
        return 'Connect directly with technical agronomists, regional zonal directorates, toll-free farmer helplines, and central procurement desks across all 21 zones of Oromia.';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#075D3A] via-[#064e31] to-[#043320] text-white border border-emerald-800/80 shadow-2xl p-6 sm:p-10 lg:p-14">
      {/* Background Decorative Mesh & Patterns */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-[#D5A62E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8 max-w-4xl">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-[#D5A62E]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{getEyebrow()}</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
            {getTitle()}
          </h1>
          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
            {getSubtitle()}
          </p>
        </div>

        {/* Operational Status Badges Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold">
                {language === 'om' ? 'Sarara Bilisaa' : language === 'am' ? 'ነፃ የስልክ መስመር' : 'Toll-Free Helpline'}
              </div>
              <div className="text-sm font-black text-white">8844 (Active 24/7)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-[#D5A62E] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold">
                {language === 'om' ? 'Sa\'aatii Hojii HQ' : language === 'am' ? 'የስራ ሰዓት' : 'Bureau Hours'}
              </div>
              <div className="text-sm font-black text-white">Mon-Fri | 08:30 - 17:30</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold">
                {language === 'om' ? 'Godinaalee Oromiyaa' : language === 'am' ? 'የዞን መምሪያዎች' : 'Zonal Coverage'}
              </div>
              <div className="text-sm font-black text-white">21 Zonal Directorates</div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Anchor Links */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs font-bold">
          <span className="text-emerald-300 mr-1 hidden sm:inline">
            {language === 'om' ? 'Kallattii Ariifachiisaa:' : language === 'am' ? 'ፈጣን ማውጫ:' : 'Jump to Section:'}
          </span>
          <button
            type="button"
            onClick={() => onJumpToSection('hotlines')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            📞 {language === 'om' ? 'Sarara Bilbilaa' : language === 'am' ? 'ስልክ መስመሮች' : 'Emergency Hotlines'}
          </button>
          <button
            type="button"
            onClick={() => onJumpToSection('inquiry-form')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            ✉️ {language === 'om' ? 'Ergaa Ergi' : language === 'am' ? 'መልዕክት ይላኩ' : 'Send Inquiry'}
          </button>
          <button
            type="button"
            onClick={() => onJumpToSection('zonal-directory')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            🏢 {language === 'om' ? 'Waajjiraalee Godinaa (21)' : language === 'am' ? 'የዞን ቢሮዎች (21)' : 'Zonal Directory (21)'}
          </button>
          <button
            type="button"
            onClick={() => onJumpToSection('bureau-location')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            📍 {language === 'om' ? 'Kaartaa Teessoo HQ' : language === 'am' ? 'የዋና መስሪያ ቤት ካርታ' : 'HQ Map & Directions'}
          </button>
          <button
            type="button"
            onClick={() => onJumpToSection('faq-section')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            ❓ FAQ
          </button>
        </div>
      </div>
    </div>
  );
};
