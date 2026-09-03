/**
 * Primary navigation for the public site.
 *
 * The Bureau sent two instructions that pull against each other: their
 * navigation document specifies eleven top-level sections, while note 13 of
 * the look-and-feel review asks for "six or seven primary doors" because the
 * eleven-item row felt crowded.
 *
 * Both are honoured here — seven doors, with all eleven of their sections
 * preserved inside the mega menus. Nothing from their IA was dropped; it was
 * regrouped. The comment on each door records which of their sections it
 * carries, so the mapping can be checked against the source document.
 *
 * Labels resolve through the om / am / en dictionaries in src/i18n.
 */

export interface SiteNavLink {
  id: string;
  labelKey: string;
  href: string;
}

export interface SiteNavGroup {
  id: string;
  headingKey: string;
  links: SiteNavLink[];
}

export interface SiteNavSection {
  id: string;
  labelKey: string;
  /** Where the door itself points. Also the landing page for the section. */
  href: string;
  /** Absent for plain links (Home); present for doors that open a panel. */
  groups?: SiteNavGroup[];
  /** Short blurb shown in the panel's featured card. */
  featuredTitleKey?: string;
  featuredBodyKey?: string;
}

export const siteNavSections: SiteNavSection[] = [
  // Their section 1
  {
    id: 'home',
    labelKey: 'nav_home',
    href: '/',
  },

  // Their sections 3 (Agricultural Sectors and Programs) + 4 (Agricultural Initiatives)
  {
    id: 'sectors',
    labelKey: 'nav_sectors',
    href: '/sectors',
    featuredTitleKey: 'nav_sectors_featured_title',
    featuredBodyKey: 'nav_sectors_featured_body',
    groups: [
      {
        id: 'sectors-production',
        headingKey: 'nav_group_production',
        links: [
          { id: 'sec-crop', labelKey: 'nav_sec_crop', href: '/sectors/crop-production' },
          { id: 'sec-coffee', labelKey: 'nav_sec_coffee', href: '/sectors/coffee-tea-spices-fruit' },
          { id: 'sec-plant', labelKey: 'nav_sec_plant_protection', href: '/sectors/plant-protection' },
        ],
      },
      {
        id: 'sectors-livestock',
        headingKey: 'nav_group_livestock',
        links: [
          { id: 'sec-livestock', labelKey: 'nav_sec_livestock', href: '/sectors/livestock' },
          { id: 'sec-animal-health', labelKey: 'nav_sec_animal_health', href: '/sectors/animal-health' },
        ],
      },
      {
        id: 'sectors-resource',
        headingKey: 'nav_group_resource_security',
        links: [
          { id: 'sec-nrfs', labelKey: 'nav_sec_natural_resource', href: '/sectors/natural-resource-food-security' },
          { id: 'sec-admin', labelKey: 'nav_sec_administration', href: '/sectors/administration-support' },
        ],
      },
      {
        id: 'initiatives-crops',
        headingKey: 'nav_group_initiatives_crops',
        links: [
          { id: 'ini-crop', labelKey: 'nav_ini_crop', href: '/initiatives/crop' },
          { id: 'ini-coffee', labelKey: 'nav_ini_coffee', href: '/initiatives/coffee' },
          { id: 'ini-spices', labelKey: 'nav_ini_spices', href: '/initiatives/spices' },
          { id: 'ini-tea', labelKey: 'nav_ini_tea', href: '/initiatives/tea' },
          { id: 'ini-fruits', labelKey: 'nav_ini_fruits', href: '/initiatives/fruits' },
        ],
      },
      {
        id: 'initiatives-land',
        headingKey: 'nav_group_initiatives_land',
        links: [
          { id: 'ini-livestock', labelKey: 'nav_ini_livestock', href: '/initiatives/livestock' },
          { id: 'ini-green-legacy', labelKey: 'nav_ini_green_legacy', href: '/initiatives/green-legacy' },
          { id: 'ini-natural-resource', labelKey: 'nav_ini_natural_resource', href: '/initiatives/natural-resource' },
        ],
      },
    ],
  },

  // Their section 7 (Farmer Services) — the farmer-first door note 10 asks for
  {
    id: 'farmer-services',
    labelKey: 'nav_farmer_services',
    href: '/services',
    featuredTitleKey: 'nav_services_featured_title',
    featuredBodyKey: 'nav_services_featured_body',
    groups: [
      {
        id: 'services-advice',
        headingKey: 'nav_group_advice',
        links: [
          { id: 'svc-extension', labelKey: 'nav_svc_extension', href: '/services/extension' },
          { id: 'svc-guides', labelKey: 'nav_svc_guides', href: '/services/guides' },
          { id: 'svc-calendar', labelKey: 'nav_svc_crop_calendar', href: '/services/crop-calendar' },
        ],
      },
      {
        id: 'services-protection',
        headingKey: 'nav_group_protection',
        links: [
          { id: 'svc-pest', labelKey: 'nav_svc_pest_disease', href: '/services/pest-disease' },
          { id: 'svc-weather', labelKey: 'nav_svc_weather', href: '/services/weather' },
        ],
      },
      {
        id: 'services-market',
        headingKey: 'nav_group_inputs_market',
        links: [
          { id: 'svc-inputs', labelKey: 'nav_svc_inputs', href: '/services/inputs' },
          { id: 'svc-market', labelKey: 'nav_svc_market_prices', href: '/services/market-prices' },
          { id: 'svc-faq', labelKey: 'nav_svc_faq', href: '/services/faq' },
        ],
      },
    ],
  },

  // Their section 5 (Plans, Programs & Projects)
  {
    id: 'plans',
    labelKey: 'nav_plans',
    href: '/plans',
    featuredTitleKey: 'nav_plans_featured_title',
    featuredBodyKey: 'nav_plans_featured_body',
    groups: [
      {
        id: 'plans-plans',
        headingKey: 'nav_group_plans',
        links: [
          { id: 'plan-strategic', labelKey: 'nav_plan_strategic', href: '/plans/strategic' },
          { id: 'plan-annual', labelKey: 'nav_plan_annual', href: '/plans/annual' },
        ],
      },
      {
        id: 'plans-delivery',
        headingKey: 'nav_group_delivery',
        links: [
          { id: 'plan-programs', labelKey: 'nav_plan_major_programs', href: '/programs' },
          { id: 'plan-projects', labelKey: 'nav_plan_projects', href: '/plans/projects' },
          { id: 'plan-budget', labelKey: 'nav_plan_budget', href: '/plans/budget-performance' },
        ],
      },
    ],
  },

  // Their section 8 (Digital Agriculture & Innovation)
  {
    id: 'digital',
    labelKey: 'nav_digital',
    href: '/digital',
    featuredTitleKey: 'nav_digital_featured_title',
    featuredBodyKey: 'nav_digital_featured_body',
    groups: [
      {
        id: 'digital-platforms',
        headingKey: 'nav_group_platforms',
        links: [
          { id: 'dig-platforms', labelKey: 'nav_dig_platforms', href: '/digital/platforms' },
          { id: 'dig-ai', labelKey: 'nav_dig_ai', href: '/digital/ai' },
        ],
      },
      {
        id: 'digital-maps',
        headingKey: 'nav_group_maps',
        links: [
          { id: 'dig-gis', labelKey: 'nav_dig_gis', href: '/digital/gis' },
          { id: 'dig-investment-map', labelKey: 'nav_dig_investment_map', href: '/investment/map' },
        ],
      },
    ],
  },

  // Their sections 9 (News & Media) + 10 (Opportunities & Engagement)
  {
    id: 'news-opportunities',
    labelKey: 'nav_news_opportunities',
    href: '/news',
    featuredTitleKey: 'nav_news_featured_title',
    featuredBodyKey: 'nav_news_featured_body',
    groups: [
      {
        id: 'news-media',
        headingKey: 'nav_group_news',
        links: [
          { id: 'news-latest', labelKey: 'nav_news_latest', href: '/news' },
          { id: 'news-events', labelKey: 'nav_news_events', href: '/news/events' },
          { id: 'news-stories', labelKey: 'nav_news_stories', href: '/news/success-stories' },
        ],
      },
      {
        id: 'news-gallery',
        headingKey: 'nav_group_gallery',
        links: [
          { id: 'news-photos', labelKey: 'nav_news_photos', href: '/news/photos' },
          { id: 'news-videos', labelKey: 'nav_news_videos', href: '/news/videos' },
          { id: 'news-publications', labelKey: 'nav_news_publications', href: '/news/publications' },
        ],
      },
      {
        id: 'opportunities-work',
        headingKey: 'nav_group_opportunities',
        links: [
          { id: 'opp-tenders', labelKey: 'nav_opp_tenders', href: '/opportunities/tenders' },
          { id: 'opp-jobs', labelKey: 'nav_opp_jobs', href: '/opportunities/jobs' },
          { id: 'opp-training', labelKey: 'nav_opp_training', href: '/opportunities/training' },
        ],
      },
      {
        id: 'opportunities-partners',
        headingKey: 'nav_group_partnership',
        links: [
          { id: 'opp-investment', labelKey: 'nav_opp_investment', href: '/opportunities/investment' },
          { id: 'opp-partnerships', labelKey: 'nav_opp_partnerships', href: '/opportunities/partnerships' },
          { id: 'opp-calls', labelKey: 'nav_opp_calls', href: '/opportunities/calls' },
        ],
      },
    ],
  },

  // Their sections 2 (About Us), 6 (Resource & Statistics) and 11 (Contact Us).
  // Note 13 named exactly these three as the ones to tuck under one door.
  {
    id: 'bureau',
    labelKey: 'nav_bureau',
    href: '/about',
    featuredTitleKey: 'nav_bureau_featured_title',
    featuredBodyKey: 'nav_bureau_featured_body',
    groups: [
      {
        id: 'bureau-about',
        headingKey: 'nav_group_about',
        links: [
          { id: 'br-about', labelKey: 'about_nav_landing', href: '/about' },
          { id: 'br-mandate', labelKey: 'about_nav_mandate', href: '/about/mandate' },
          { id: 'br-structure', labelKey: 'about_nav_structure', href: '/about/structure' },
          { id: 'br-leadership', labelKey: 'about_nav_leadership', href: '/about/leadership' },
        ],
      },
      {
        id: 'bureau-institution',
        headingKey: 'nav_group_institution',
        links: [
          { id: 'br-departments', labelKey: 'about_nav_departments', href: '/about/departments' },
          { id: 'br-partners', labelKey: 'about_nav_partners', href: '/about/partners' },
          { id: 'br-statistics', labelKey: 'about_nav_statistics', href: '/about/statistics' },
        ],
      },
      {
        id: 'bureau-policy',
        headingKey: 'nav_group_policy',
        links: [
          { id: 'res-policies', labelKey: 'nav_res_policies', href: '/resources/policies' },
          { id: 'res-guidelines', labelKey: 'nav_res_guidelines', href: '/resources/guidelines' },
          { id: 'res-research', labelKey: 'nav_res_research', href: '/resources/research' },
        ],
      },
      {
        id: 'bureau-data',
        headingKey: 'nav_group_data',
        links: [
          { id: 'res-production', labelKey: 'nav_res_production', href: '/resources/production' },
          { id: 'res-statistics', labelKey: 'nav_res_statistics', href: '/resources/statistics' },
          { id: 'res-dashboards', labelKey: 'nav_res_dashboards', href: '/resources/dashboards' },
        ],
      },
      {
        id: 'bureau-reports',
        headingKey: 'nav_group_reports',
        links: [
          { id: 'res-annual', labelKey: 'nav_res_annual_reports', href: '/resources/annual-reports' },
          { id: 'res-monitoring', labelKey: 'nav_res_monitoring', href: '/resources/monitoring' },
          { id: 'res-downloads', labelKey: 'nav_res_downloads', href: '/resources/downloads' },
        ],
      },
      {
        id: 'bureau-contact',
        headingKey: 'nav_group_contact',
        links: [
          { id: 'br-contact', labelKey: 'nav_contact', href: '/contact' },
          { id: 'br-offices', labelKey: 'nav_contact_offices', href: '/contact#offices' },
        ],
      },
    ],
  },
];

/** Every section that opens a panel. */
export const siteNavDoors = siteNavSections.filter((s) => s.groups && s.groups.length > 0);

/** Flat list of every destination the navigation offers. */
export const allNavLinks: SiteNavLink[] = siteNavSections.flatMap((s) =>
  (s.groups ?? []).flatMap((g) => g.links),
);

/** Look a section up by the path prefix it owns, for active-state and landing pages. */
export function findSectionByPath(pathname: string): SiteNavSection | undefined {
  return siteNavSections.find(
    (s) => s.href !== '/' && (pathname === s.href || pathname.startsWith(`${s.href}/`)),
  );
}
