import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ExternalLink, CalendarDays } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { siteNavSections, allNavLinks, type SiteNavSection } from '../data/siteNavigation';
import { FARMER_HOTLINE } from '../constants';
import { topicOfPath } from '../data/contentTopics';
import { listContentPublished } from '../services/contentCmsService';
import type { ContentEntry } from '../types/content';

/**
 * One data-driven landing page serving every door in the Bureau's new
 * information architecture, plus every sub-topic that does not yet have a
 * page of its own. It reads the same `siteNavigation` tree the header does,
 * so a section can never appear in the menu without having somewhere to land.
 *
 * Notes 10 and 20 ask that each page open from a field task rather than from
 * institutional chrome, so the hero leads with what the visitor can do here
 * and the hotline sits beside it.
 *
 * As the CMS-backed sections come online they take over their own routes;
 * this stays the fallback for the rest.
 */
export const SectionLandingPage: React.FC = () => {
  const { t, currentLang } = useLanguage();
  const { pathname } = useLocation();

  const subLink = allNavLinks.find((l) => l.href.split('#')[0] === pathname);

  // Resolve the owning door by which section actually lists this link, not by
  // path prefix: several doors carry links rooted elsewhere (Opportunities
  // lives under the /news door, Major Programs under /plans).
  const section: SiteNavSection | undefined =
    (subLink &&
      siteNavSections.find((s) =>
        (s.groups ?? []).some((g) => g.links.some((l) => l.id === subLink.id)),
      )) ??
    siteNavSections.find((s) => s.href === pathname) ??
    siteNavSections.find((s) => s.href !== '/' && pathname.startsWith(`${s.href}/`));

  // A sub-topic page shows its own title; a door shows its whole tree.
  const titleKey = subLink?.labelKey ?? section?.labelKey ?? 'nav_bureau';
  const groups = subLink ? [] : (section?.groups ?? []);

  // Topics in the four CMS-backed sections show whatever the Bureau has
  // published for them; the topic list is the fallback until they do.
  const cmsTopic = topicOfPath(pathname);
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(Boolean(cmsTopic));

  useEffect(() => {
    let cancelled = false;
    if (!cmsTopic) {
      setEntries([]);
      setLoadingEntries(false);
      return;
    }
    setLoadingEntries(true);
    listContentPublished(cmsTopic.sectionId, cmsTopic.topic.id)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingEntries(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cmsTopic?.sectionId, cmsTopic?.topic.id]);

  return (
    <div className="min-h-[60vh]">
      {/* Note 10/20: the page opens from the task, not the institution. */}
      <section className="band-cream motif-contour border-b border-[#E2E8E3] dark:border-[#183327] py-14 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-[#56635B] dark:text-[#a5aba6]">
              <li>
                <Link to="/" className="hv-underline font-semibold hover:text-[#063D2A] dark:hover:text-[#74d62c]">
                  {t('nav_home')}
                </Link>
              </li>
              {section && subLink && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link
                      to={section.href}
                      className="hv-underline font-semibold hover:text-[#063D2A] dark:hover:text-[#74d62c]"
                    >
                      {t(section.labelKey)}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0A1912] dark:text-white">
            {t(titleKey)}
          </h1>

          {section?.featuredBodyKey && !subLink && (
            <p className="hero-lede mt-4 text-[#56635B] dark:text-[#a5aba6]">
              {t(section.featuredBodyKey)}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/services" className="btn-primary hv-lift">
              {t('nav_farmer_services')}
            </Link>
            <a href={`tel:${FARMER_HOTLINE}`} className="btn-outline">
              {FARMER_HOTLINE} · {t('hotline_free')}
            </a>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {groups.length > 0 ? (
            <>
              <h2 className="text-eyebrow font-bold text-[#087A4B] dark:text-[#74d62c]">
                {t('section_explore')}
              </h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="hv-lift rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#111613] p-6"
                  >
                    <p className="text-eyebrow font-extrabold text-[#087A4B] dark:text-[#74d62c] mb-3">
                      {t(group.headingKey)}
                    </p>
                    <ul className="space-y-1.5">
                      {group.links.map((link) => (
                        <li key={link.id}>
                          <Link
                            to={link.href}
                            className="group inline-flex items-center gap-1.5 text-reading font-semibold text-[#111310] dark:text-[#e8ebe7] hover:text-[#063D2A] dark:hover:text-[#74d62c]"
                          >
                            {t(link.labelKey)}
                            <ArrowRight
                              className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                              aria-hidden="true"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          ) : entries.length > 0 ? (
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {entries.map((entry) => {
                const title = entry.title[currentLang] || entry.title.en;
                const summary = entry.summary[currentLang] || entry.summary.en;
                return (
                  <li
                    key={entry.id}
                    className="hv-lift rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09] bg-white dark:bg-[#111613] p-6"
                  >
                    <h3 className="text-xl font-extrabold text-[#0A1912] dark:text-white">
                      {title}
                    </h3>
                    {summary && (
                      <p className="mt-2 text-reading text-[#56635B] dark:text-[#a5aba6]">
                        {summary}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {entry.effectiveDate && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#56635B] dark:text-[#a5aba6]">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          {entry.effectiveDate}
                          {entry.expiresAt && ` – ${entry.expiresAt}`}
                        </span>
                      )}
                      {entry.externalUrl && (
                        <a
                          href={entry.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hv-underline inline-flex items-center gap-1.5 text-sm font-bold text-[#087A4B] dark:text-[#74d62c]"
                        >
                          {t('nav_view_all')}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-reading text-[#56635B] dark:text-[#a5aba6] max-w-2xl">
              {loadingEntries ? '…' : t('section_coming')}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
