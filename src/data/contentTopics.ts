import { siteNavSections } from './siteNavigation';
import type { ContentSectionId } from '../types/content';

/**
 * Which navigation links are filled in from the section CMS, and which
 * section each belongs to.
 *
 * Derived from the live navigation tree rather than hand-listed, so the admin
 * can never file an entry under a topic the menu does not offer, and a public
 * page can never look for content under a topic the admin cannot reach.
 */

function linksOfGroups(sectionId: string, predicate: (groupId: string) => boolean) {
  const section = siteNavSections.find((s) => s.id === sectionId);
  return (section?.groups ?? [])
    .filter((g) => predicate(g.id))
    .flatMap((g) => g.links)
    .map((l) => ({ id: l.id, labelKey: l.labelKey, href: l.href }));
}

export interface ContentTopic {
  id: string;
  labelKey: string;
  href: string;
}

export const TOPICS_BY_SECTION: Record<ContentSectionId, ContentTopic[]> = {
  initiatives: linksOfGroups('sectors', (id) => id.startsWith('initiatives-')),
  plans: linksOfGroups('plans', () => true),
  opportunities: linksOfGroups('news-opportunities', (id) => id.startsWith('opportunities-')),
  resources: linksOfGroups('bureau', (id) =>
    ['bureau-policy', 'bureau-data', 'bureau-reports'].includes(id),
  ),
};

/** Section a topic belongs to, or undefined if the topic is not CMS-backed. */
export function sectionOfTopic(topicId: string): ContentSectionId | undefined {
  return (Object.keys(TOPICS_BY_SECTION) as ContentSectionId[]).find((sectionId) =>
    TOPICS_BY_SECTION[sectionId].some((topic) => topic.id === topicId),
  );
}

/** Resolve a pathname to its CMS topic, if that path is CMS-backed. */
export function topicOfPath(
  pathname: string,
): { topic: ContentTopic; sectionId: ContentSectionId } | undefined {
  for (const sectionId of Object.keys(TOPICS_BY_SECTION) as ContentSectionId[]) {
    const topic = TOPICS_BY_SECTION[sectionId].find(
      (candidate) => candidate.href.split('#')[0] === pathname,
    );
    if (topic) return { topic, sectionId };
  }
  return undefined;
}
