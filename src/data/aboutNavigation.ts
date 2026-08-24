/**
 * About mega-menu / mobile accordion structure.
 * Labels resolve via translation keys (om / am / en).
 */

export interface AboutNavLink {
  id: string;
  labelKey: string;
  href: string;
}

export interface AboutNavGroup {
  id: string;
  headingKey: string;
  links: AboutNavLink[];
}

export const aboutNavGroups: AboutNavGroup[] = [
  {
    id: 'about-oab',
    headingKey: 'about_nav_group_about',
    links: [
      { id: 'about-landing', labelKey: 'about_nav_landing', href: '/about' },
      { id: 'about-history', labelKey: 'about_nav_history', href: '/about/history' },
    ],
  },
  {
    id: 'institution',
    headingKey: 'about_nav_group_institution',
    links: [
      { id: 'about-mandate', labelKey: 'about_nav_mandate', href: '/about/mandate' },
      { id: 'about-structure', labelKey: 'about_nav_structure', href: '/about/structure' },
    ],
  },
  {
    id: 'leadership',
    headingKey: 'about_nav_group_leadership',
    links: [
      { id: 'about-leadership', labelKey: 'about_nav_leadership', href: '/about/leadership' },
      { id: 'about-message', labelKey: 'about_nav_message', href: '/about/leadership/message' },
    ],
  },
  {
    id: 'our-work',
    headingKey: 'about_nav_group_work',
    links: [
      { id: 'about-departments', labelKey: 'about_nav_departments', href: '/about/departments' },
      { id: 'about-serve', labelKey: 'about_nav_how_we_serve', href: '/about/how-we-serve' },
    ],
  },
  {
    id: 'institutional-info',
    headingKey: 'about_nav_group_info',
    links: [
      { id: 'about-stats', labelKey: 'about_nav_statistics', href: '/about/statistics' },
      { id: 'about-partners', labelKey: 'about_nav_partners', href: '/about/partners' },
      { id: 'about-docs', labelKey: 'about_nav_documents', href: '/about/documents' },
    ],
  },
];

/** Flat list for mobile accordion (preserves group order). */
export const aboutNavFlatLinks: AboutNavLink[] = aboutNavGroups.flatMap((g) => g.links);

export function isAboutPath(pathname: string): boolean {
  return pathname === '/about' || pathname.startsWith('/about/');
}
