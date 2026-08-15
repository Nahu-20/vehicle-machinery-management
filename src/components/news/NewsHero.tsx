import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  ArrowRight,
  Sprout,
  Users,
  GraduationCap,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from 'lucide-react';

interface NewsHeroProps {
  articlesCount: number;
  eventsCount: number;
  tendersCount: number;
  activeTab: 'articles' | 'events' | 'tenders' | 'media';
  onTabChange: (tab: 'articles' | 'events' | 'tenders' | 'media') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAccreditation?: () => void;
}

const BREAKING_DISPATCHES = [
  {
    id: 1,
    tag: 'Distribution',
    text: '2026 Meher Season Input Distribution reaches 94% across 21 Oromia Agricultural Zones.',
    date: 'Today, 09:30 AM',
    tab: 'articles',
  },
  {
    id: 2,
    tag: 'Expo',
    text: '7th Oromia Specialty Coffee Cupping Summit registrations open for Jimma & Guji cooperatives.',
    date: 'Aug 18, 2026',
    tab: 'events',
  },
  {
    id: 3,
    tag: 'Procurement',
    text: 'NCB/OAB/2026/08 Tender for Combine Harvesters & Mobile Solar Pumps closes in 6 days.',
    date: 'Closing Soon',
    tab: 'tenders',
  },
  {
    id: 4,
    tag: 'Broadcast',
    text: 'Episode 42 of Oromia Agricultural Radio now live with trilingual audio analysis on soil health.',
    date: 'Weekly Edition',
    tab: 'media',
  },
];

export const NewsHero: React.FC<NewsHeroProps> = ({
  articlesCount,
  eventsCount,
  tendersCount,
  activeTab,
  onTabChange,
  searchQuery = '',
  onSearchChange,
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [activeDispatchIdx, setActiveDispatchIdx] = useState(0);

  const getEyebrow = () => {
    switch (language) {
      case 'om':
        return 'ODUU FI QOPHIIWWAN';
      case 'am':
        return 'ዜና እና ዝግጅቶች';
      default:
        return 'NEWS & EVENTS';
    }
  };

  const getHeroTitlePart1 = () => {
    switch (language) {
      case 'om':
        return 'Oduu fi Odeeffannoo Haaraa ';
      case 'am':
        return 'ወቅታዊ መረጃዎችና ዜናዎች ';
      default:
        return 'Latest Updates from ';
    }
  };

  const getHeroTitleHighlight = () => {
    switch (language) {
      case 'om':
        return 'Qonna Oromiyaa';
      case 'am':
        return 'ከኦሮሚያ ግብርና';
      default:
        return 'Oromia Agriculture';
    }
  };

  const getHeroSubtitle = () => {
    switch (language) {
      case 'om':
        return 'Madda seeraa oduu haaraa, waltajjiiwwan qonnaa, caalbaasii bitta teeknooloojii, fi carraawwan sektera qonna Oromiyaa.';
      case 'am':
        return 'ስለ ቁልፍ የግብርና ልማቶች፣ መጪ ሁነቶች እና የቴክኖሎጂ እድሎች በኦሮሚያ ክልል ወቅታዊ መረጃ ያግኙ።';
      default:
        return 'Stay informed about key developments, upcoming events and agricultural opportunities across Oromia.';
    }
  };

  const getViewAllText = () => {
    switch (language) {
      case 'om':
        return 'Oduu Hundaa Ilaali';
      case 'am':
        return 'ሁሉንም ዜና ይመልከቱ';
      default:
        return 'View All News';
    }
  };

  const getUpcomingEventsText = () => {
    switch (language) {
      case 'om':
        return 'Qophiiwwan Dhufan';
      case 'am':
        return 'መጪ ዝግጅቶች';
      default:
        return 'Upcoming Events';
    }
  };

  const currentDispatch = BREAKING_DISPATCHES[activeDispatchIdx];

  return (
    <div className="space-y-3">
      {/* Optional Subtle Flash Wire Ticker */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-emerald-950 text-white text-xs shadow-xs border border-emerald-800/80">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shrink-0">
            <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Flash</span>
          </span>

          <div
            className="flex items-center gap-2 truncate cursor-pointer hover:text-emerald-300 transition-colors"
            onClick={() => onTabChange(currentDispatch.tab as any)}
          >
            <span className="font-semibold text-emerald-300 hidden sm:inline-block">
              [{currentDispatch.tag}]
            </span>
            <span className="truncate font-medium text-emerald-100">
              {currentDispatch.text}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() =>
              setActiveDispatchIdx((prev) =>
                prev === 0 ? BREAKING_DISPATCHES.length - 1 : prev - 1
              )
            }
            aria-label="Previous headline"
            className="p-1 rounded-md hover:bg-white/10 text-emerald-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-emerald-300 font-bold px-0.5">
            {activeDispatchIdx + 1}/{BREAKING_DISPATCHES.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setActiveDispatchIdx((prev) => (prev + 1) % BREAKING_DISPATCHES.length)
            }
            aria-label="Next headline"
            className="p-1 rounded-md hover:bg-white/10 text-emerald-300 hover:text-white transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Hero Container Matching Reference Design */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px] sm:min-h-[440px] lg:min-h-[480px]">
          {/* Left Content Column */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6 z-10">
            {/* Eyebrow with green horizontal dash */}
            <div className="inline-flex items-center gap-2">
              <span className="w-6 h-0.5 bg-[#15803d] rounded-full" />
              <span className="text-xs font-black tracking-widest text-[#15803d] dark:text-emerald-400 uppercase">
                {getEyebrow()}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-[1.15] tracking-tight">
              {getHeroTitlePart1()}
              <span className="text-[#15803d] dark:text-emerald-500 font-black block sm:inline lg:block">
                {getHeroTitleHighlight()}
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-md font-medium">
              {getHeroSubtitle()}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onTabChange('articles')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#064E3B] hover:bg-[#043D2E] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 min-h-[44px]"
              >
                <span>{getViewAllText()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onTabChange('events')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 min-h-[44px]"
              >
                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span>{getUpcomingEventsText()}</span>
              </button>
            </div>
          </div>

          {/* Right Image & Floating Events Overlay Column */}
          <div className="lg:col-span-6 relative min-h-[300px] sm:min-h-[380px] lg:min-h-full overflow-hidden bg-emerald-950">
            {/* Background Farmer in Field Image */}
            <img
              src="https://images.unsplash.com/photo-1592417817098-8f3d69106a49?auto=format&fit=crop&q=80&w=1200"
              alt="Smiling Ethiopian farmer working in green crop field"
              className="w-full h-full object-cover object-center scale-105"
            />

            {/* Soft subtle radial / horizontal fade overlay to blend with left side */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white via-transparent to-transparent lg:from-white dark:lg:from-gray-800 dark:from-gray-800 pointer-events-none opacity-90 lg:opacity-100 lg:w-32" />

            {/* Floating Top-Right Events Card */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 max-w-[240px] sm:max-w-[270px] w-full bg-[#EDF7ED]/95 dark:bg-emerald-950/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xl z-20">
              {/* Header: Calendar Icon + Number 12 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-[#15803d] dark:text-emerald-400 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-none">
                    12
                  </div>
                  <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300 mt-0.5">
                    {getUpcomingEventsText()}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-emerald-200/80 dark:border-emerald-800/80 my-3" />

              {/* Event Type Highlights */}
              <div className="space-y-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                <button
                  type="button"
                  onClick={() => onTabChange('events')}
                  className="w-full flex items-center gap-2 text-left hover:text-[#15803d] dark:hover:text-emerald-400 transition-colors"
                >
                  <Sprout className="w-3.5 h-3.5 text-[#15803d] dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Farmers' Field Days</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('events')}
                  className="w-full flex items-center gap-2 text-left hover:text-[#15803d] dark:hover:text-emerald-400 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-[#15803d] dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Agricultural Expos</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('events')}
                  className="w-full flex items-center gap-2 text-left hover:text-[#15803d] dark:hover:text-emerald-400 transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#15803d] dark:text-emerald-400 shrink-0" />
                  <span className="truncate">Extension Trainings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
