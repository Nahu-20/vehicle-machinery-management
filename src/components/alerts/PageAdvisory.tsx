import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  getPublishedAlerts,
  getFallbackMockAlerts,
} from '../../services/agriculturalAlertService';
import {
  toPublicAlert,
  type PublicAgriculturalAlert,
  type AlertSeverity,
} from '../../types/agriculturalAlert';
import { advisoryForPage, pageOfRoute } from '../../data/advisoryPlacement';

/**
 * Note 12: the seasonal advisories were reachable only behind a bell with a
 * red badge, which reads as a software notification rather than a public
 * warning a farmer can spot at once. This carries the relevant one into the
 * first screen of each page; the bell stays as a quiet extra.
 *
 * Notes 10 and 20 ask that a page open from a field task rather than from
 * institutional chrome — this is what sits above the chrome.
 */

const TONE: Record<AlertSeverity, { band: string; chip: string; ring: string }> = {
  critical: {
    band: 'bg-[#7F1D1D] text-white',
    chip: 'bg-white/15 text-white',
    ring: 'focus-visible:ring-white',
  },
  warning: {
    band: 'bg-[#B45309] text-white',
    chip: 'bg-white/15 text-white',
    ring: 'focus-visible:ring-white',
  },
  advisory: {
    band: 'bg-[#D7A928] text-[#241A02]',
    chip: 'bg-black/10 text-[#241A02]',
    ring: 'focus-visible:ring-[#241A02]',
  },
  info: {
    band: 'bg-[#063D2A] text-white',
    chip: 'bg-white/15 text-white',
    ring: 'focus-visible:ring-white',
  },
};

/** Dismissals last for the browsing session only — a warning should come back. */
const dismissedKey = (slug: string) => `oab-advisory-dismissed:${slug}`;

export const PageAdvisory: React.FC = () => {
  const { t, currentLang } = useLanguage();
  const { pathname } = useLocation();
  const [alerts, setAlerts] = useState<PublicAgriculturalAlert[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const demo = () => getFallbackMockAlerts().map(toPublicAlert);

    getPublishedAlerts({ limit: 40 })
      .then((rows) => {
        // Nothing published yet is not the same as nothing to say — show the
        // demo advisories, as the news and achievements sections do.
        if (!cancelled) setAlerts(rows.length > 0 ? rows : demo());
      })
      .catch(() => {
        // An advisory strip is a courtesy; it must never break the page.
        if (!cancelled) setAlerts(demo());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const page = pageOfRoute(pathname);
  const advisory = advisoryForPage(alerts, page);

  useEffect(() => {
    if (!advisory) return;
    try {
      setDismissed(sessionStorage.getItem(dismissedKey(advisory.slug)) === '1');
    } catch {
      setDismissed(false);
    }
  }, [advisory?.slug]);

  if (!advisory || dismissed) return null;

  const tone = TONE[advisory.severity];
  const title = advisory.title[currentLang] || advisory.title.en;
  const summary = advisory.summary?.[currentLang] || advisory.summary?.en;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissedKey(advisory.slug), '1');
    } catch {
      /* a browser refusing storage is not a reason to keep the strip up */
    }
  };

  return (
    <aside
      aria-label={t('advisory_region_label')}
      className={`${tone.band} w-full px-4 sm:px-6 lg:px-8 py-3`}
    >
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={`inline-flex items-center gap-2 rounded-full ${tone.chip} px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide shrink-0`}>
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {t(`alert_severity_${advisory.severity}`)}
        </span>

        <p className="min-w-0 flex-1 text-sm sm:text-base font-bold leading-snug">
          {title}
          {summary && (
            <span className="hidden md:inline font-normal opacity-90"> — {summary}</span>
          )}
        </p>

        <Link
          to={`/alerts/${advisory.slug}`}
          className={`hv-underline inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 focus:outline-none focus-visible:ring-2 ${tone.ring} rounded shrink-0`}
        >
          {t('advisory_read')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label={t('advisory_dismiss')}
          className={`rounded-full p-1.5 hover:bg-black/10 focus:outline-none focus-visible:ring-2 ${tone.ring} shrink-0`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
