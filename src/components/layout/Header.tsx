import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';
import { SearchModal } from '../common/SearchModal';
import { NotificationBell } from '../common/NotificationBell';
import { ScrollProgress } from '../common/scroll/ScrollProgress';
import { navigationItems } from '../../data/mockData';
import { FARMER_HOTLINE } from '../../constants';
import {
  Menu,
  X,
  Search,
  ArrowUpRight,
  ChevronRight,
  PhoneCall,
  Sprout,
} from 'lucide-react';
import officialLogoUrl from '../../assets/images/oromia_official_logo.svg';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

// Social Media Vector Icons
const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TelegramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm5.221 8.292c-.16.685-1.2 5.568-1.761 8.243-.238 1.135-.636 1.515-1.025 1.551-.847.078-1.492-.56-2.312-1.098-1.282-.843-2.008-1.365-3.253-2.186-1.439-.949-.506-1.472.314-2.324.214-.223 3.934-3.606 4.006-3.914.009-.038.017-.183-.069-.26-.086-.076-.213-.05-.305-.029-.13.03-.2.083-2.736 1.762-1.391.956-2.715 1.83-3.792 1.598-.703-.152-1.365-.395-1.958-.59-.728-.239-1.306-.366-1.256-.773.026-.212.319-.43.879-.652 3.453-1.503 5.757-2.494 6.911-2.974 3.292-1.371 3.978-1.61 4.425-1.618.098-.002.318.023.46.139.12.098.153.232.167.327a1.08 1.08 0 0 1 .012.222z" />
  </svg>
);

export const Header: React.FC = () => {
  const { currentLang, setLanguage, languages, t } = useLanguage();
  const location = useLocation();
  const isReducedMotion = useReducedMotionPreference();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeDesktopMenu, setActiveDesktopMenu] = useState<'language' | 'theme' | null>(null);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K triggers Search Modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Lock body scroll and handle Escape key for mobile menu drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <ScrollProgress />
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-[#A3E635] focus:px-4 focus:py-2.5 focus:text-xs focus:font-extrabold focus:text-[#0A1912] focus:shadow-xl"
      >
        {t('skip_to_content')}
      </a>

      {/* NON-STICKY HEADER WRAPPER CONTAINER */}
      <header className="relative z-40 w-full transition-all duration-300">
        
        {/* LAYER 1: FULL-WIDTH DARK-GREEN REGIONAL UTILITY BAR */}
        <div className="w-full bg-[linear-gradient(105deg,#063d28_0%,#0c5634_45%,#347622_100%)] text-white py-1.5 sm:py-2 px-4 sm:px-6 lg:px-8 border-b border-[#042d1e] relative z-30 shadow-xs">
          <div className="max-w-[1860px] mx-auto flex items-center justify-between gap-4 text-xs font-medium">
            
            {/* Left Side: Institutional Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-white/10 shrink-0">
                <Sprout className="h-3 w-3 text-[#A3E635]" aria-hidden="true" />
              </div>
              <span className="font-bold text-white text-xs tracking-tight truncate">
                {t('gov_name') || 'Oromia Regional Government'}
              </span>
              <span className="text-emerald-300/40 font-light hidden sm:inline" aria-hidden="true">|</span>
              <span className="hidden sm:inline text-emerald-100/90 text-xs font-normal truncate">
                Agriculture for Prosperity, Food for the Future
              </span>
            </div>

            {/* Right Side: Hotline & Social Links */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <a
                href={`tel:${FARMER_HOTLINE}`}
                title={`Hotline: ${FARMER_HOTLINE}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5 text-[#A3E635] shrink-0" />
                <span>
                  Hotline: <strong className="text-white font-extrabold text-xs tracking-wider">{FARMER_HOTLINE}</strong>
                </span>
              </a>

              <span className="text-emerald-300/40 font-light hidden sm:inline" aria-hidden="true">|</span>

              {/* Verified Social Media Circular Controls */}
              <div className="hidden sm:flex items-center gap-1.5">
                <a
                  href="https://facebook.com/oromiaagri"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Oromia Agricultural Bureau on Facebook"
                  className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-[#A3E635] transition-all duration-200 flex items-center justify-center hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://x.com/oromiaagri"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Oromia Agricultural Bureau on X"
                  className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-[#A3E635] transition-all duration-200 flex items-center justify-center hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com/oromiaagri"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Oromia Agricultural Bureau on YouTube"
                  className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-[#A3E635] transition-all duration-200 flex items-center justify-center hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                >
                  <YouTubeIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://t.me/oromiaagri"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Oromia Agricultural Bureau on Telegram"
                  className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-[#A3E635] transition-all duration-200 flex items-center justify-center hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                >
                  <TelegramIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* LAYER 2: ROUNDED MAIN BUREAU NAVIGATION PANEL */}
        <div className="px-2 sm:px-3.5 lg:px-5 py-2 sm:py-2.5 transition-all duration-300">
          <div className="w-[calc(100%-0.5rem)] sm:w-[calc(100%-1rem)] max-w-[1860px] mx-auto rounded-[24px] sm:rounded-[30px] lg:rounded-[36px] bg-[linear-gradient(110deg,#ffffff_0%,#ffffff_48%,#f1f8ec_100%)] dark:bg-[linear-gradient(110deg,#0E241B_0%,#0E241B_48%,#081C14_100%)] border border-[#14502D]/10 dark:border-[#183327] shadow-xs relative p-3.5 sm:p-4 lg:p-4.5 transition-all duration-300">
            
            {/* SUBTLE BOTANICAL DECORATION ARTWORK (RIGHT SIDE ONLY) */}
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 bottom-0 w-72 sm:w-80 lg:w-[420px] pointer-events-none opacity-[0.07] dark:opacity-[0.05] text-[#14502D] dark:text-[#A3E635] z-0 overflow-hidden select-none"
            >
              <svg
                viewBox="0 0 400 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-cover object-right-top"
              >
                <path
                  d="M380 10C300 40 240 120 220 200C200 280 260 340 340 380"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path d="M380 10C350 30 320 20 310 50C330 60 360 40 380 10Z" fill="currentColor" />
                <path d="M340 50C310 80 280 70 270 100C290 110 320 90 340 50Z" fill="currentColor" />
                <path d="M300 100C270 130 240 120 230 150C250 160 280 140 300 100Z" fill="currentColor" />
                <path d="M260 160C230 190 200 180 190 210C210 220 240 200 260 160Z" fill="currentColor" />
                <path d="M220 220C190 250 160 240 150 270C170 280 200 260 220 220Z" fill="currentColor" />
                <path
                  d="M320 80C260 100 220 160 200 230"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <path d="M280 110C260 125 240 120 230 140C245 145 265 130 280 110Z" fill="currentColor" />
                <path d="M240 160C220 175 200 170 190 190C205 195 225 180 240 160Z" fill="currentColor" />
              </svg>
            </div>

            {/* PANEL CONTENT RELATIVE Z-10 */}
            <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3">
              
              {/* ROW 1: BUREAU IDENTITY (LEFT) & CONTROLS/SEARCH/CTA (RIGHT) - HIGHER Z-INDEX FOR DROPDOWNS */}
              <div className="relative z-30 flex flex-col min-[1180px]:flex-row items-start min-[1180px]:items-center justify-between gap-3 pb-2.5 border-b border-[#14502D]/10 dark:border-[#183327]/80">
                
                {/* LEFT: BUREAU IDENTITY LOGO & TITLE */}
                <Link to="/" className="flex items-center gap-3 sm:gap-4 group focus:outline-none shrink-0 min-w-0">
                  <img
                    src={officialLogoUrl}
                    alt="Official Oromia Bureau of Agriculture Seal"
                    className="h-14 w-14 sm:h-18 sm:w-18 lg:h-20 lg:w-20 object-contain shrink-0 transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{ maxHeight: '84px' }}
                  />
                  <div className="flex flex-col min-w-0">
                    <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-extrabold text-[#0A1912] dark:text-white tracking-tight leading-tight min-[1180px]:whitespace-nowrap">
                      {t('bureau_title')}
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#56635B] dark:text-[#A7F3D0]/80 mt-0.5 truncate">
                      {t('bureau_sub_title') || 'Regional Government of Oromia'}
                    </p>
                  </div>
                </Link>

                {/* RIGHT CONTROLS (DESKTOP ≥1180px) */}
                <div className="hidden min-[1180px]:flex items-center gap-2 lg:gap-2.5 shrink-0">
                  
                  {/* THEME CONTROL */}
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="relative z-40">
                    <ThemeToggle
                      compact
                      isOpen={activeDesktopMenu === 'theme'}
                      onToggle={(open) => setActiveDesktopMenu(open ? 'theme' : null)}
                    />
                  </motion.div>

                  {/* LANGUAGE SELECTOR */}
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="relative z-40">
                    <LanguageSelector
                      compact
                      isOpen={activeDesktopMenu === 'language'}
                      onToggle={(open) => setActiveDesktopMenu(open ? 'language' : null)}
                    />
                  </motion.div>

                  {/* NOTIFICATION BELL */}
                  <NotificationBell />

                  {/* SEARCH FIELD TRIGGER */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDesktopMenu(null);
                      setIsSearchModalOpen(true);
                    }}
                    aria-label={t('search_title')}
                    className="flex items-center gap-2.5 rounded-full border border-gray-200 dark:border-[#183327] bg-white/90 dark:bg-[#0B1912]/90 px-3.5 py-1.5 text-xs font-semibold text-[#56635B] dark:text-[#94A39A] hover:border-[#087A4B] dark:hover:border-[#A3E635] hover:bg-white dark:hover:bg-[#122E22] transition-all h-10 w-44 lg:w-56 xl:w-72 shrink min-w-[150px] justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Search className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635] shrink-0" />
                      <span className="truncate">{t('search_placeholder')}</span>
                    </div>
                    <kbd className="rounded-md bg-gray-100 dark:bg-[#0E241B] px-1.5 py-0.5 text-[10px] text-[#56635B] dark:text-[#94A39A] border border-gray-200 dark:border-[#183327] shrink-0 font-mono">
                      ⌘K
                    </kbd>
                  </button>

                  {/* E-SERVICES PORTAL CTA */}
                  <motion.a
                    href="#services"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(110deg,#003d27,#006338)] hover:bg-[linear-gradient(110deg,#002c1c,#004f2d)] text-white px-3.5 xl:px-4.5 py-2 text-xs font-extrabold transition-all duration-200 shadow-xs group h-10 shrink-0"
                  >
                    <span>{t('eservices_btn') || 'e-Services Portal'}</span>
                    <ArrowUpRight className="h-4 w-4 text-[#A3E635] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 stroke-[2.5]" />
                  </motion.a>
                </div>

                {/* MOBILE CONTROLS (<1180px) */}
                <div className="flex min-[1180px]:hidden items-center gap-2 shrink-0 self-end sm:self-auto">
                  <NotificationBell />

                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    aria-label={t('search_title')}
                    className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-[#183327] bg-white dark:bg-[#0B1912] text-[#0A1912] dark:text-white p-2 hover:bg-[#F6F7F3] dark:hover:bg-[#122E22] transition-colors h-10 w-10 min-h-[44px] min-w-[44px] focus:outline-none"
                  >
                    <Search className="h-5 w-5 text-[#087A4B] dark:text-[#A3E635]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-navigation-drawer"
                    aria-label="Open navigation menu"
                    className="flex items-center justify-center rounded-xl bg-[#063d28] dark:bg-emerald-800 p-2 text-white hover:bg-[#0c5634] transition-colors h-10 w-10 min-h-[44px] min-w-[44px] focus:outline-none"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* ROW 2: PRIMARY NAVIGATION LINKS - HORIZONTALLY CENTERED (DESKTOP ≥1180px) - LOWER Z-INDEX */}
              <div className="hidden min-[1180px]:flex items-center justify-center w-full pt-1 pb-0.5 relative z-10">
                <nav className="w-full flex items-center justify-center">
                  <div className="flex items-center justify-center gap-6 xl:gap-9 flex-wrap max-w-full">
                    {navigationItems.map((item) => {
                      const isActive = location.pathname === item.href;

                      return (
                        <motion.div
                          key={item.id}
                          whileHover={isReducedMotion ? undefined : { y: -1 }}
                          transition={{ duration: 0.15 }}
                          className="relative"
                        >
                          <NavLink
                            to={item.href}
                            className={`px-2.5 py-1 text-sm xl:text-[15px] font-semibold transition-colors rounded-lg block relative ${
                              isActive
                                ? 'text-[#063D2A] dark:text-[#A3E635] font-extrabold'
                                : 'text-[#111310] dark:text-emerald-100/90 hover:text-[#063D2A] dark:hover:text-white'
                            }`}
                          >
                            <span>{t(item.labelKey)}</span>

                            {/* Active Link Bright Green Underline Pill (Centered) */}
                            {isActive && (
                              <motion.div
                                layoutId="activeNavIndicator"
                                initial={isReducedMotion ? undefined : { scaleX: 0 }}
                                animate={isReducedMotion ? undefined : { scaleX: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                style={{ transformOrigin: 'center' }}
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 sm:w-9 h-1 rounded-full bg-[#347622] dark:bg-[#A3E635]"
                              />
                            )}
                          </NavLink>
                        </motion.div>
                      );
                    })}
                  </div>
                </nav>
              </div>

            </div>
          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER (<1180px) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={isReducedMotion ? undefined : { opacity: 0, x: '100%' }}
                animate={isReducedMotion ? undefined : { opacity: 1, x: 0 }}
                exit={isReducedMotion ? undefined : { opacity: 0, x: '100%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-y-0 right-0 z-50 w-[88%] max-w-md bg-white dark:bg-[#0E241B] p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E2E8E3] dark:border-[#183327]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-5">
                  {/* Drawer Header with Official Logo */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E3] dark:border-[#183327]">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={officialLogoUrl}
                        alt="Official Oromia Bureau of Agriculture Seal"
                        className="h-12 w-12 object-contain shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-extrabold text-sm text-[#0A1912] dark:text-white block leading-tight truncate">
                          {t('bureau_title')}
                        </span>
                        <span className="text-[11px] text-[#56635B] dark:text-[#A7F3D0]/80 font-medium truncate block">
                          {t('bureau_sub_title') || 'Regional Government of Oromia'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close menu"
                      className="p-2 text-slate-500 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#122E22] min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Theme & Language Controls inside Drawer */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl bg-[#F6F7F3] dark:bg-[#0B1912] p-3 border border-[#E2E8E3] dark:border-[#183327] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111310] dark:text-white">
                        {t('theme_title')}
                      </span>
                      <ThemeToggle />
                    </div>

                    <div className="rounded-2xl bg-[#F6F7F3] dark:bg-[#0B1912] p-3 border border-[#E2E8E3] dark:border-[#183327]">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#56635B] dark:text-[#94A39A] block mb-2">
                        Filannoo Afaanii / Select Language
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => setLanguage(lang.code)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all border min-h-[44px] ${
                              currentLang === lang.code
                                ? 'bg-[#063d28] text-white font-extrabold border-[#063d28] shadow-xs'
                                : 'bg-white dark:bg-[#0E241B] text-[#111310] dark:text-white font-bold border-[#E2E8E3] dark:border-[#183327] hover:bg-emerald-50'
                            }`}
                          >
                            <span className="text-base mb-0.5">{lang.flagEmoji}</span>
                            <span className="text-[11px] truncate w-full text-center">{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Search Bar Trigger inside Drawer */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsSearchModalOpen(true);
                    }}
                    className="flex w-full items-center justify-between gap-2.5 rounded-2xl border border-[#E2E8E3] dark:border-[#183327] bg-[#F6F7F3] dark:bg-[#0B1912] px-4 py-3 text-xs font-semibold text-[#56635B] dark:text-[#94A39A] hover:bg-white dark:hover:bg-[#122E22] transition-all min-h-[44px]"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" />
                      <span>{t('search_title')}...</span>
                    </div>
                    <kbd className="rounded-md bg-white dark:bg-[#0E241B] px-2 py-0.5 text-[10px] text-[#56635B] dark:text-[#94A39A] border border-[#E2E8E3] dark:border-[#183327]">
                      ⌘K
                    </kbd>
                  </button>

                  {/* Mobile Navigation Links */}
                  <nav className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#56635B] dark:text-[#94A39A] px-2 block mb-1">
                      Main Navigation
                    </span>
                    <ul className="space-y-1">
                      {navigationItems.map((item) => (
                        <li key={item.id}>
                          <NavLink
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                                isActive
                                  ? 'bg-[#063d28] text-white shadow-xs'
                                  : 'text-[#111310] dark:text-white hover:bg-[#F6F7F3] dark:hover:bg-[#0B1912] hover:text-[#087A4B]'
                              }`
                            }
                          >
                            <span>{t(item.labelKey)}</span>
                            <ChevronRight className="h-4 w-4 opacity-60" />
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-[#E2E8E3] dark:border-[#183327] space-y-3 mt-6">
                  {/* e-Services CTA */}
                  <a
                    href="#services"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(110deg,#003d27,#006338)] px-4 py-3 text-xs font-extrabold text-white shadow-md hover:bg-[#063d28] min-h-[44px]"
                  >
                    <span>{t('eservices_btn') || 'e-Services Portal'}</span>
                    <ArrowUpRight className="h-4 w-4 text-[#A3E635] stroke-[2.5]" />
                  </a>

                  {/* Hotline Banner */}
                  <div className="rounded-2xl bg-[#F6F7F3] dark:bg-[#0B1912] p-3 border border-[#E2E8E3] dark:border-[#183327] text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-[#0A1912] dark:text-white">
                      <PhoneCall className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" />
                      <span>
                        Hotline: <strong className="text-[#087A4B] dark:text-[#A3E635]">{FARMER_HOTLINE}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </header>

      {/* Render Search Modal */}
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
};
