import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  MapPin,
  Navigation,
  Compass,
  Bus,
  Car,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Building,
  Info,
} from 'lucide-react';

export const BureauLocationMap: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [copiedCoords, setCopiedCoords] = useState(false);

  const coords = '9.0014° N, 38.7523° E';
  const gmapsUrl = 'https://maps.google.com/?q=Oromia+Bureau+of+Agriculture+Addis+Ababa';

  const handleCopyCoords = () => {
    navigator.clipboard.writeText('9.0014, 38.7523');
    setCopiedCoords(true);
    showToast('GPS Coordinates copied to clipboard!', 'success');
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  return (
    <section id="bureau-location" className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#15803d] dark:text-emerald-400">
          <span className="w-5 h-0.5 bg-[#15803d] rounded-full" />
          <span>
            {language === 'om'
              ? 'TEESSOO & KAARTAA WAAJJIRA MUUMMEE'
              : language === 'am'
              ? 'የዋናው መስሪያ ቤት ካርታና አቅጣጫዎች'
              : 'HQ LOCATION, ACCESS & MAP'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
          {language === 'om'
            ? 'Teessoo Biiroo Qonnaa Oromiyaa (Finfinnee)'
            : language === 'am'
            ? 'የኦሮሚያ ግብርና ቢሮ ዋና መስሪያ ቤት አድራሻ (አዲስ አበባ)'
            : 'Oromia Bureau of Agriculture Headquarters (Finfinnee)'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
          {language === 'om'
            ? 'Sarbet, Gamoo Biiroo Qonnaa Oromiyaa, Finfinnee, Itoophiyaa.'
            : language === 'am'
            ? 'ሳርቤት፣ የኦሮሚያ ግብርና ቢሮ ህንጻ፣ አዲስ አበባ፣ ኢትዮጵያ።'
            : 'Sarbet Administrative Corridor, Oromia Bureau Complex, Finfinnee, Ethiopia.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map Visual Mockup */}
        <div className="lg:col-span-7 rounded-3xl overflow-hidden bg-emerald-950 border border-emerald-900/50 shadow-md relative min-h-[360px] flex flex-col justify-between p-6 text-white">
          {/* Simulated Cartographic Background Grid */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>OAB Central Bureau Headquarters</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCoords}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{coords}</span>
              </button>
            </div>
          </div>

          {/* Center Map Pin Spotlight */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-3 py-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#075D3A] text-[#D5A62E] flex items-center justify-center shadow-2xl border-2 border-white/30 animate-bounce">
                <Building className="w-8 h-8 text-[#D5A62E]" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/50 rounded-full blur-xs" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Biiroo Qonnaa Oromiyaa</h3>
              <p className="text-xs text-emerald-200 font-medium">Sarbet Boulevard, Next to Regional Admin Hub</p>
            </div>
          </div>

          {/* Bottom Bar Details */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-emerald-200">
              <Compass className="w-4 h-4 text-[#D5A62E]" />
              <span>Sector: Central Finfinnee Administrative Zone</span>
            </div>

            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D5A62E] hover:bg-[#c49826] text-black font-bold text-xs shadow-md transition-colors"
            >
              <span>{language === 'om' ? 'Google Maps irratti Bani' : language === 'am' ? 'በGoogle Maps ክፈት' : 'Open in Google Maps'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Directions & Visitor Guide Cards */}
        <div className="lg:col-span-5 space-y-4">
          {/* Public Transit Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#075D3A] dark:text-emerald-400">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950">
                <Bus className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {language === 'om' ? 'Geejjiba Uummataa' : language === 'am' ? 'የህዝብ ትራንስፖርት አማራጮች' : 'Public Transit Directions'}
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              • <strong>Light Rail (LRT):</strong> Mexico or Torhailoch Station (5 min minibus connection).<br />
              • <strong>Anbessa City Bus:</strong> Routes 18, 34, 49 to Sarbet Oromia Complex Stop.<br />
              • <strong>Ride/Taxi:</strong> Destination &quot;Oromia Agriculture Bureau Sarbet&quot;.
            </p>
          </div>

          {/* Visitor Regulations & Parking */}
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {language === 'om' ? 'Dhaabbii Konkolaataa & Eegumsa' : language === 'am' ? 'የመኪና ማቆሚያና የደህንነት መመሪያ' : 'Visitor Parking & Security Protocol'}
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              • <strong>Visitor Parking:</strong> North Gate entrance dedicated public parking bay.<br />
              • <strong>Security Check:</strong> Valid National ID / Fayda ID / Farmer Kebele ID required at reception gate.<br />
              • <strong>Accessibility:</strong> Ramp access and elevator support available on Ground Floor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
