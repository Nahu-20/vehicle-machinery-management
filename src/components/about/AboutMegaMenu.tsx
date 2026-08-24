import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Sprout } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { aboutNavGroups } from '../../data/aboutNavigation';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

interface AboutMegaMenuTriggerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIntentOpen: () => void;
  onIntentClose: () => void;
  triggerClassName?: string;
  isActive?: boolean;
}

/** About nav control only — panel is rendered by the header nav shell. */
export const AboutMegaMenuTrigger: React.FC<AboutMegaMenuTriggerProps> = ({
  isOpen,
  onOpenChange,
  onIntentOpen,
  onIntentClose,
  triggerClassName = '',
  isActive = false,
}) => {
  const { t } = useLanguage();
  const menuId = useId();

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      onOpenChange(true);
    }
  };

  return (
    <button
      type="button"
      id={`${menuId}-trigger`}
      className={`${triggerClassName} inline-flex items-center gap-1 relative`}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-controls="about-mega-menu-panel"
      onClick={() => onOpenChange(!isOpen)}
      onKeyDown={handleTriggerKeyDown}
      onMouseEnter={onIntentOpen}
      onFocus={onIntentOpen}
      onMouseLeave={onIntentClose}
    >
      <span>{t('nav_about')}</span>
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
      {isActive && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 sm:w-9 h-1 rounded-full bg-[#347622] dark:bg-[#74d62c]"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

interface AboutMegaMenuPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIntentOpen: () => void;
  onIntentClose: () => void;
}

/**
 * Positioned by the parent nav shell (full header width), not the About button.
 * Parent should be `relative`; this uses inset-x-0 + centered max-width.
 */
export const AboutMegaMenuPanel: React.FC<AboutMegaMenuPanelProps> = ({
  isOpen,
  onOpenChange,
  onIntentOpen,
  onIntentClose,
}) => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const panelRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const flatLinks = aboutNavGroups.flatMap((g) => g.links);

  useEffect(() => {
    if (!isOpen) {
      setFocusIndex(0);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const clickedTrigger = path.some(
        (n) =>
          n instanceof HTMLElement &&
          n.getAttribute('aria-controls') === 'about-mega-menu-panel',
      );
      if (panelRef.current && !panelRef.current.contains(target) && !clickedTrigger) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [isOpen, onOpenChange]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const last = flatLinks.length; // include featured CTA as last focusable conceptually via links only
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, flatLinks.length - 1));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusIndex(Math.max(0, last - 1));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="about-mega-menu-panel"
          role="menu"
          aria-label={t('nav_about')}
          ref={panelRef}
          initial={isReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          exit={isReducedMotion ? undefined : { opacity: 0, y: 6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute left-0 right-0 top-full z-50 pt-2 px-3 sm:px-4 lg:px-6"
          onKeyDown={handleMenuKeyDown}
          onMouseEnter={onIntentOpen}
          onMouseLeave={onIntentClose}
        >
          {/* Full-bleed within header shell; panel centered with viewport-safe max width */}
          <div className="mx-auto w-full max-w-[min(100%,calc(100vw-2rem),1280px)] rounded-xl border border-[#E2E8E3] dark:border-white/[0.1] bg-white dark:bg-[#0d110f] shadow-[0_12px_40px_-12px_rgba(6,61,42,0.28)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] p-5 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5 xl:gap-6">
              {aboutNavGroups.map((group) => (
                <div key={group.id} className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#087A4B] dark:text-[#74d62c] mb-2.5">
                    {t(group.headingKey)}
                  </p>
                  <ul className="space-y-0.5">
                    {group.links.map((link) => {
                      const flatIdx = flatLinks.findIndex((l) => l.id === link.id);
                      return (
                        <li key={link.id} role="none">
                          <Link
                            role="menuitem"
                            to={link.href}
                            tabIndex={focusIndex === flatIdx ? 0 : -1}
                            ref={(el) => {
                              if (isOpen && focusIndex === flatIdx && el) {
                                el.focus();
                              }
                            }}
                            onClick={() => onOpenChange(false)}
                            className="block rounded-md px-2 py-1.5 text-sm font-semibold text-[#111310] dark:text-[#e8ebe7] hover:bg-[#F3F5F0] dark:hover:bg-[#161d18] hover:text-[#063D2A] dark:hover:text-[#74d62c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] focus-visible:ring-offset-1"
                          >
                            {t(link.labelKey)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {/* Featured intro — large desktops only */}
              <div className="hidden xl:flex flex-col justify-between rounded-lg bg-[#F3F7F1] dark:bg-[#14241a] border border-[#D7E5DA] dark:border-white/[0.08] p-4 min-w-0">
                <div>
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#063D2A] dark:bg-[#74d62c] text-[#A3E635] dark:text-[#070908] mb-3">
                    <Sprout className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#087A4B] dark:text-[#74d62c] mb-1.5">
                    {t('about_mega_featured_title')}
                  </p>
                  <p className="text-sm text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
                    {t('about_mega_featured_body')}
                  </p>
                </div>
                <Link
                  to="/about"
                  role="menuitem"
                  onClick={() => onOpenChange(false)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#063D2A] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
                >
                  {t('about_mega_featured_cta')}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** @deprecated Use AboutMegaMenuTrigger + AboutMegaMenuPanel from the header shell. */
export const AboutMegaMenu = AboutMegaMenuTrigger;
