import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { AccessibilityModal } from '../common/AccessibilityModal';
import { SearchModal } from '../common/SearchModal';
import { NotificationBell } from '../common/NotificationBell';
import { navigationItems } from '../../data/mockData';
import { FARMER_HOTLINE } from '../../constants';
import {
  Menu,
  X,
  Search,
  Eye,
  ExternalLink,
  Sprout,
  ChevronRight,
  Sparkles,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currentLang, setLanguage, languages, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-[#D7A928] focus:px-4 focus:py-2.5 focus:text-xs focus:font-bold focus:text-[#063D2A] focus:shadow-xl"
      >
        {t('skip_to_content')}
      </a>

      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#DDE8E1] shadow-xs">
        {/* 1. Compact Government Utility Bar (optimized for 320px+ viewports) */}
        <div className="bg-[#063D2A] text-white text-xs py-1.5 px-2.5 sm:px-6 lg:px-8 border-b border-emerald-900/60 relative z-30 flex items-center min-h-[36px]">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-1.5 sm:gap-2 w-full">
            {/* Gov Identity */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-[50%] sm:max-w-none">
              <span className="inline-block h-2 w-2 rounded-full bg-[#D7A928] shrink-0 animate-pulse" aria-hidden="true" />
              <span className="font-semibold tracking-wide text-emerald-100 text-[10px] sm:text-xs truncate">
                {t('gov_name')}
              </span>
              <span className="hidden sm:inline text-emerald-600">•</span>
              <span className="hidden sm:inline text-emerald-200 font-medium text-xs">
                {t('bureau_title')}
              </span>
            </div>

            {/* Utility Items Right */}
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              {/* Shortened Hotline Badge */}
              <a
                href={`tel:${FARMER_HOTLINE}`}
                title={`Call Toll-Free Agricultural Hotline: ${FARMER_HOTLINE}`}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-100 bg-emerald-900/50 hover:bg-emerald-800 px-2 py-0.5 rounded-full border border-emerald-700/60 transition-colors"
              >
                <PhoneCall className="h-3 w-3 text-[#D7A928] shrink-0" />
                <span className="hidden sm:inline text-[11px]">{t('hotline_label')}</span>
                <strong className="text-white font-black text-[10px] sm:text-xs">{FARMER_HOTLINE}</strong>
              </a>

              {/* Prototype Badge (Desktop) */}
              <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-[#D7A928]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#D7A928] border border-[#D7A928]/40">
                <Sparkles className="h-3 w-3" />
                <span>PROTOTYPE / DEMO</span>
              </div>

              {/* Language Selector */}
              <div className="shrink-0">
                <LanguageSelector compact />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Navigation Header Row */}
        <div className="bg-white/95 backdrop-blur-md px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-2 sm:gap-6">
            {/* Logo & Bureau Title */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group focus:outline-none min-w-0">
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-[#063D2A] text-white shadow-md ring-2 ring-[#D7A928]/40 transition-transform group-hover:scale-105">
                <Sprout className="h-5 w-5 sm:h-6 sm:w-6 text-[#D7A928]" />
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D7A928] text-[8px] font-black text-[#063D2A]">
                  OAB
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-base lg:text-lg font-black tracking-tight text-[#063D2A] leading-tight truncate">
                  {t('bureau_title')}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#637069] truncate">
                  {t('bureau_sub_title')}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (≥1180px) */}
            <nav className="hidden min-[1180px]:flex items-center gap-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm font-bold transition-all rounded-xl ${
                      isActive
                        ? 'text-[#087A4B] bg-[#EFF8F2]'
                        : 'text-[#14251D] hover:text-[#087A4B] hover:bg-gray-50'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>

            {/* Right Action Controls (Desktop ≥1180px) */}
            <div className="hidden min-[1180px]:flex items-center gap-2.5 shrink-0">
              {/* Notification Bell Dropdown */}
              <NotificationBell />

              {/* Search Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] px-3.5 py-2 text-xs font-semibold text-[#637069] hover:border-[#087A4B] hover:bg-white transition-all h-11"
                aria-label={t('search_title')}
                title={t('search_title')}
              >
                <Search className="h-4 w-4 text-[#087A4B]" />
                <span className="hidden xl:inline pr-2">{t('search_placeholder').slice(0, 18)}...</span>
                <kbd className="hidden xl:inline rounded-md bg-white px-1.5 py-0.5 text-[10px] text-[#637069] border border-gray-200">⌘K</kbd>
              </button>

              {/* Accessibility Button */}
              <button
                type="button"
                onClick={() => setIsAccessModalOpen(true)}
                className="flex items-center justify-center rounded-xl border border-[#DDE8E1] bg-white p-2.5 text-[#063D2A] hover:bg-[#EFF8F2] hover:border-[#087A4B] transition-colors h-11 w-11"
                title={t('access_title')}
                aria-label={t('access_title')}
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Prominent e-Services Button */}
              <a
                href="#services"
                className="flex items-center gap-2 rounded-xl bg-[#087A4B] hover:bg-[#063D2A] text-white font-bold h-11 px-5 shadow-sm hover:shadow-md transition-all text-xs sm:text-sm"
              >
                <ExternalLink className="h-4 w-4 text-[#D7A928]" />
                <span>{t('eservices_btn')}</span>
              </a>
            </div>

            {/* Mobile/Tablet Actions Header Row (<1180px) */}
            <div className="flex min-[1180px]:hidden items-center gap-2 shrink-0">
              <NotificationBell />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
                aria-label="Open navigation menu"
                className="flex items-center justify-center rounded-xl bg-[#063D2A] p-2.5 text-white hover:bg-[#087A4B] transition-colors h-11 w-11 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-[#087A4B]"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Accessible Mobile/Tablet Navigation Slide-Out Drawer (<1180px) */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="fixed inset-y-0 right-0 z-50 w-[88%] max-w-md bg-white p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#DDE8E1]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#063D2A] text-[#D7A928]">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm text-[#063D2A] block leading-tight truncate">
                        {t('bureau_title')}
                      </span>
                      <span className="text-[10px] text-[#637069] font-medium truncate block">
                        {t('bureau_sub_title')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Language Selection inside Drawer */}
                <div className="rounded-xl bg-[#FAFAF7] p-3 border border-[#DDE8E1]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#637069] block mb-2">
                    Filannoo Afaanii / Language
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-all border min-h-[44px] ${
                          currentLang === lang.code
                            ? 'bg-[#087A4B] text-white font-black border-[#087A4B] shadow-xs ring-1 ring-emerald-700'
                            : 'bg-white text-[#14251D] font-bold border-gray-200 hover:bg-emerald-50'
                        }`}
                      >
                        <span className="text-base mb-0.5">{lang.flagEmoji}</span>
                        <span className="text-[11px] truncate w-full text-center">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar Trigger inside Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSearchModalOpen(true);
                  }}
                  className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] px-4 py-3 text-xs font-semibold text-[#637069] hover:bg-white hover:border-[#087A4B] transition-all min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#087A4B]" />
                    <span>{t('search_title')}...</span>
                  </div>
                  <kbd className="rounded-md bg-white px-2 py-0.5 text-[10px] text-[#637069] border border-gray-200">Search</kbd>
                </button>

                {/* Navigation Links */}
                <nav className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#637069] px-2 block mb-1">
                    Navigation
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
                                ? 'bg-[#087A4B] text-white shadow-sm'
                                : 'text-[#14251D] hover:bg-[#EFF8F2] hover:text-[#087A4B]'
                            }`
                          }
                        >
                          <span>{t(item.labelKey)}</span>
                          <ChevronRight className="h-4 w-4 opacity-70" />
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-[#DDE8E1] space-y-2.5 mt-5">
                {/* e-Services CTA */}
                <a
                  href="#services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087A4B] px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-[#063D2A] min-h-[44px]"
                >
                  <ExternalLink className="h-4 w-4 text-[#D7A928]" />
                  <span>{t('eservices_btn')}</span>
                </a>

                {/* Accessibility Action */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAccessModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] px-4 py-2.5 text-xs font-bold text-[#063D2A] hover:bg-[#EFF8F2] min-h-[44px]"
                >
                  <Eye className="h-4 w-4 text-[#087A4B]" />
                  <span>{t('accessibility_btn')}</span>
                </button>

                {/* Hotline Banner */}
                <div className="rounded-xl bg-[#EFF8F2] p-2.5 border border-[#DDE8E1] text-center space-y-0.5">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#063D2A]">
                    <PhoneCall className="h-3.5 w-3.5 text-[#087A4B]" />
                    <span>Oromia Agri Hotline: <strong className="text-[#087A4B]">{FARMER_HOTLINE}</strong></span>
                  </div>
                  <p className="text-[10px] text-[#637069] font-medium">Toll-Free Agricultural Assistance</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Render Modals */}
      <AccessibilityModal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
};
