import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Sprout } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { SiteNavSection } from '../../data/siteNavigation';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

/**
 * Generalised from the About-only mega menu once the Bureau's navigation
 * document arrived: the same grouped-links pattern now serves all seven
 * doors, so About is one consumer rather than a special case.
 */

const panelId = (sectionId: string) => `mega-menu-panel-${sectionId}`;

interface MegaMenuTriggerProps {
  section: SiteNavSection;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIntentOpen: () => void;
  onIntentClose: () => void;
  triggerClassName?: string;
  isActive?: boolean;
}

export const MegaMenuTrigger: React.FC<MegaMenuTriggerProps> = ({
  section,
  isOpen,
  onOpenChange,
  onIntentOpen,
  onIntentClose,
  triggerClassName = '',
  isActive = false,
}) => {
  const { t } = useLanguage();

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      onOpenChange(true);
    }
  };

  return (
    <button
      type="button"
      className={`${triggerClassName} inline-flex items-center gap-1 relative`}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-controls={panelId(section.id)}
      onClick={() => onOpenChange(!isOpen)}
      onKeyDown={handleTriggerKeyDown}
      onMouseEnter={onIntentOpen}
      onFocus={onIntentOpen}
      onMouseLeave={onIntentClose}
    >
      <span>{t(section.labelKey)}</span>
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

interface MegaMenuPanelProps {
  section: SiteNavSection;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIntentOpen: () => void;
  onIntentClose: () => void;
}

/**
 * Positioned by the parent nav shell (full header width), not by the trigger.
 * Parent must be `relative`; this uses inset-x-0 with a centred max width.
 */
export const MegaMenuPanel: React.FC<MegaMenuPanelProps> = ({
  section,
  isOpen,
  onOpenChange,
  onIntentOpen,
  onIntentClose,
}) => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const panelRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  const groups = section.groups ?? [];
  const flatLinks = groups.flatMap((g) => g.links);

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
          n.getAttribute('aria-controls') === panelId(section.id),
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
  }, [isOpen, onOpenChange, section.id]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
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
      setFocusIndex(Math.max(0, flatLinks.length - 1));
    }
  };

  // Six groups is the widest door (Bureau); narrower doors keep their columns
  // from stretching across the whole header.
  const columnClass =
    groups.length >= 5
      ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6'
      : groups.length === 4
        ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5'
        : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={panelId(section.id)}
          role="menu"
          aria-label={t(section.labelKey)}
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
          <div className="mx-auto w-full max-w-[min(100%,calc(100vw-2rem),1280px)] rounded-xl border border-[#E2E8E3] dark:border-white/[0.1] bg-white dark:bg-[#0d110f] shadow-[0_12px_40px_-12px_rgba(6,61,42,0.28)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] p-5 sm:p-6">
            <div className={`grid ${columnClass} gap-5 xl:gap-6`}>
              {groups.map((group) => (
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

              {section.featuredTitleKey && (
                <div className="hidden xl:flex flex-col justify-between rounded-lg bg-[#F3F7F1] dark:bg-[#14241a] border border-[#D7E5DA] dark:border-white/[0.08] p-4 min-w-0">
                  <div>
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#063D2A] dark:bg-[#74d62c] text-[#A3E635] dark:text-[#070908] mb-3">
                      <Sprout className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#087A4B] dark:text-[#74d62c] mb-1.5">
                      {t(section.featuredTitleKey)}
                    </p>
                    {section.featuredBodyKey && (
                      <p className="text-sm text-[#4E6155] dark:text-[#a5aba6] leading-relaxed">
                        {t(section.featuredBodyKey)}
                      </p>
                    )}
                  </div>
                  <Link
                    to={section.href}
                    role="menuitem"
                    onClick={() => onOpenChange(false)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#063D2A] dark:text-[#74d62c] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
                  >
                    {t('nav_view_all')}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
