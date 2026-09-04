import type {
  AlertCategory,
  AlertSeverity,
  PublicAgriculturalAlert,
} from '../types/agriculturalAlert';

/**
 * Note 12: "It would be a gift to show the right advisory in the first hero of
 * each page (for example, Meher rust on the home, flood watch on Alerts, input
 * distribution on Services)."
 *
 * Which advisory appears where is an editorial decision, so the Bureau sets it
 * per alert in the Alerts admin (`displayPages`). Two things still need a
 * default:
 *
 *   - alerts published before this field existed have no `displayPages`, and
 *   - an editor may simply not set it.
 *
 * Without a fallback those alerts would appear nowhere, which is worse than
 * today where the bell at least carries them. So `category` supplies a
 * sensible placement, and an explicit `displayPages` always overrides it.
 */

export type AdvisoryPage =
  | 'home'
  | 'alerts'
  | 'services'
  | 'sectors'
  | 'market'
  | 'news'
  | 'resources';

export const ADVISORY_PAGES: { id: AdvisoryPage; labelKey: string }[] = [
  { id: 'home', labelKey: 'nav_home' },
  { id: 'alerts', labelKey: 'nav_alerts' },
  { id: 'services', labelKey: 'nav_farmer_services' },
  { id: 'sectors', labelKey: 'nav_sectors' },
  { id: 'market', labelKey: 'nav_svc_market_prices' },
  { id: 'news', labelKey: 'nav_news_opportunities' },
  { id: 'resources', labelKey: 'nav_group_data' },
];

/** Fallback placement when an alert carries no explicit displayPages. */
const CATEGORY_DEFAULT: Record<AlertCategory, AdvisoryPage[]> = {
  weather: ['home', 'services', 'alerts'],
  pest: ['home', 'sectors', 'alerts'],
  'crop-disease': ['home', 'sectors', 'alerts'],
  'livestock-disease': ['sectors', 'alerts'],
  'input-supply': ['services', 'alerts'],
  irrigation: ['services', 'sectors', 'alerts'],
  market: ['market', 'alerts'],
  'food-safety': ['home', 'alerts'],
  emergency: ['home', 'alerts', 'services', 'sectors', 'market', 'news', 'resources'],
  general: ['alerts'],
};

/** Route prefix → the advisory page it counts as. Longest match wins. */
const ROUTE_TO_PAGE: { prefix: string; page: AdvisoryPage }[] = [
  { prefix: '/services/market-prices', page: 'market' },
  { prefix: '/alerts', page: 'alerts' },
  { prefix: '/services', page: 'services' },
  { prefix: '/sectors', page: 'sectors' },
  { prefix: '/initiatives', page: 'sectors' },
  { prefix: '/news', page: 'news' },
  { prefix: '/opportunities', page: 'news' },
  { prefix: '/resources', page: 'resources' },
];

export function pageOfRoute(pathname: string): AdvisoryPage | undefined {
  if (pathname === '/') return 'home';
  const match = [...ROUTE_TO_PAGE]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  return match?.page;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 4,
  warning: 3,
  advisory: 2,
  info: 1,
};

function showsOn(alert: PublicAgriculturalAlert, page: AdvisoryPage): boolean {
  if (alert.displayPages && alert.displayPages.length > 0) {
    return alert.displayPages.includes(page);
  }
  return (CATEGORY_DEFAULT[alert.category] ?? []).includes(page);
}

/**
 * The one advisory to show on a page: pinned beats unpinned, then highest
 * severity, then whichever came first. Returns undefined when nothing applies —
 * a page with no current advisory shows no strip rather than an empty one.
 */
export function advisoryForPage(
  alerts: PublicAgriculturalAlert[],
  page: AdvisoryPage | undefined,
): PublicAgriculturalAlert | undefined {
  if (!page) return undefined;
  const candidates = alerts.filter((a) => showsOn(a, page));
  if (candidates.length === 0) return undefined;

  return candidates.reduce((best, current) => {
    if (Boolean(current.pinned) !== Boolean(best.pinned)) {
      return current.pinned ? current : best;
    }
    return SEVERITY_RANK[current.severity] > SEVERITY_RANK[best.severity] ? current : best;
  });
}
