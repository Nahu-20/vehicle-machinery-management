/**
 * Resources & Manuals prototype seed — REAL, SOURCE-ATTRIBUTED catalog.
 *
 * Mix of:
 * 1) Open public reference PDFs (FAO MAFAP, FAO Oromia wheat IAIP, IFPRI/FAO maize VC, etc.)
 *    with correct organization attribution and original publication titles.
 * 2) OBoA Investment / extension manuals compiled for the portal prototype
 *    (download URL is a stable placeholder PDF until official Storage upload).
 *
 * quality / honesty: every doc carries sourceOrganization + sourceNotes naming
 * the cited body, reference period, and whether the file is an original open PDF
 * or a bureau prototype placeholder.
 */

import { slugifyResourceTitle, resourceToPublication } from '../services/resourceService';
import { BureauResource, ResourceCategoryId, ResourceDocType, ResourceFormat } from '../types/resource';
import { Publication } from '../types';

export const PROTOTYPE_RESOURCES_SEED_VERSION = '2025.2-resources-sourced';

/** Stable placeholder when no open public PDF is attached yet. */
const PLACEHOLDER_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export const PROTOTYPE_RESOURCE_SOURCE_IDS = {
  faoMafapCoffee: 'src_fao_mafap_coffee_ethiopia_2014',
  faoMafapWheat: 'src_fao_mafap_wheat_ethiopia_2012',
  faoOromiaWheatIaip: 'src_fao_oromia_wheat_iaip_2019',
  ifpriMaizeVc: 'src_ifpri_fao_maize_vc_ethiopia_2010',
  faoP4pMaize: 'src_fao_p4p_ethiopia_maize_2014',
  csaAgss: 'src_csa_agss_meher_2024',
  oboaInvestment: 'src_oboa_investment_manuals_2025',
  oboaExtension: 'src_oboa_extension_manuals_2025',
  eiarKulumsa: 'src_eiar_kulumsa_wheat_notes_2024',
  moaAti: 'src_moa_ati_extension_pack_2024',
} as const;

export const PROTOTYPE_RESOURCE_SOURCES = [
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapCoffee,
    organization: 'Food and Agriculture Organization of the United Nations (FAO) — MAFAP',
    documentTitle: 'Analysis of price incentives for coffee in Ethiopia',
    publicationDate: '2014',
    url: 'https://www.fao.org/fileadmin/templates/mafap/documents/technical_notes/Ethiopia/2005-2013/Ethiopia-Coffee_web.pdf',
    notes: 'Official FAO MAFAP technical note. Cite FAO; not an OBoA publication.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapWheat,
    organization: 'Food and Agriculture Organization of the United Nations (FAO) — MAFAP',
    documentTitle: 'Analysis of incentives and disincentives for wheat in Ethiopia',
    publicationDate: '2012',
    url: 'https://www.fao.org/4/aq433e/aq433e.pdf',
    notes: 'Official FAO MAFAP wheat technical note. Cite FAO.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.faoOromiaWheatIaip,
    organization: 'FAO / UNIDO — Integrated Agro-Industrial Park support (Central-Eastern Oromia)',
    documentTitle:
      'Strategic analysis and intervention plan for wheat and wheat products — ACPZ of the pilot IAIP in Central-Eastern Oromia',
    publicationDate: '2019',
    url: 'https://openknowledge.fao.org/server/api/core/bitstreams/66744742-2b40-4d9a-b885-2eb249161c76/content',
    notes: 'Open-knowledge FAO report focused on Oromia IAIP wheat value chain.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.ifpriMaizeVc,
    organization: 'IFPRI / FAO — Ethiopia maize value chain diagnostic',
    documentTitle: 'Maize value chain potential in Ethiopia: constraints and opportunities',
    publicationDate: '2010',
    url: 'https://openknowledge.fao.org/server/api/core/bitstreams/d5bf3434-599e-45ee-b757-b7a398f755ce/content',
    notes: 'IFPRI-led diagnostic hosted on FAO Open Knowledge. Historical reference for maize VC structure.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.faoP4pMaize,
    organization: 'FAO / WFP Purchase for Progress (P4P)',
    documentTitle: 'Institutional procurement of staples from smallholders — Ethiopia case study',
    publicationDate: '2014',
    url: 'https://www.fao.org/fileadmin/user_upload/ivc/Ethiopia_P4P_case_study.pdf',
    notes: 'FAO case study on institutional maize procurement and cooperative unions.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
    organization: 'Central Statistical Agency of Ethiopia (CSA)',
    documentTitle: 'Agricultural Sample Survey (Meher) — crop production patterns',
    publicationDate: '2024',
    url: 'https://www.statsethiopia.gov.et/',
    notes: 'National/regional AGSS patterns inform OBoA extension calendars and investment briefs.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment,
    organization: 'Oromia Bureau of Agriculture — Investment & Market Systems',
    documentTitle: 'OBoA Investment CMS manuals pack (prototype)',
    publicationDate: '2025',
    url: 'https://www.oromiya.gov.et/',
    notes:
      'Bureau-compiled investor and corridor manuals for portal prototype. PDF body may be placeholder until Storage upload of official release.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension,
    organization: 'Oromia Bureau of Agriculture — Extension & Agronomy Directorates',
    documentTitle: 'OBoA extension field manuals pack (prototype)',
    publicationDate: '2025',
    url: 'https://www.oromiya.gov.et/',
    notes: 'Aligned with CSA Meher geography and zonal DA practice notes. Placeholder PDF until official Storage files.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.eiarKulumsa,
    organization: 'Ethiopian Institute of Agricultural Research (EIAR) — Kulumsa / IQQO collaboration notes',
    documentTitle: 'Highland wheat agronomy guidance notes (compiled for OBoA extension)',
    publicationDate: '2024',
    notes: 'Compiled for prototype attribution; replace with signed EIAR/IQQO PDF when available.',
  },
  {
    sourceId: PROTOTYPE_RESOURCE_SOURCE_IDS.moaAti,
    organization: 'Ministry of Agriculture / Agricultural Transformation Institute (ATI)',
    documentTitle: 'National extension & cluster farming practice notes (adapted for Oromia)',
    publicationDate: '2024',
    notes: 'National practice notes adapted into OBoA portal manuals for prototype demonstration.',
  },
] as const;

type ResourceSpec = {
  resourceId: string;
  title: string;
  summary: string;
  description?: string;
  type: ResourceDocType;
  category: ResourceCategoryId;
  format: ResourceFormat;
  language: string;
  fileSize: string;
  /** Open public PDF URL, or omit to use placeholder. */
  openPdfUrl?: string;
  authorOrOffice: string;
  versionLabel: string;
  pagesOrDuration: string;
  publishedDateLabel: string;
  tags: string[];
  targetAudience: string[];
  tableOfContents: string[];
  featured: boolean;
  downloadsCount: number;
  sourceIds: string[];
  sourceOrganization: string;
  sourceNotes: string;
  coverImage?: string;
  videoEmbedUrl?: string;
  videoDuration?: string;
};

/**
 * Curated prototype catalog — investment corridor manuals + extension + open FAO/IFPRI refs.
 */
export const PROTOTYPE_RESOURCE_CATALOG: ResourceSpec[] = [
  // —— Open public references (real PDFs) ——
  {
    resourceId: 'res_src_fao_mafap_coffee_2014',
    title: 'FAO MAFAP — Analysis of price incentives for coffee in Ethiopia',
    summary:
      'Technical analysis of market incentives and disincentives along Ethiopia’s coffee value chain (MAFAP). Essential reference for Jimma belt investment screening.',
    description:
      'Official FAO MAFAP technical note covering farm-gate to export price transmission, ECX-era marketing structure, and policy implications for coffee producers and traders.',
    type: 'research',
    category: 'crop',
    format: 'PDF',
    language: 'English',
    fileSize: '1.8 MB',
    openPdfUrl:
      'https://www.fao.org/fileadmin/templates/mafap/documents/technical_notes/Ethiopia/2005-2013/Ethiopia-Coffee_web.pdf',
    authorOrOffice: 'FAO MAFAP / Ethiopian Development Research Institute',
    versionLabel: '2014 technical note',
    pagesOrDuration: 'Technical note (FAO)',
    publishedDateLabel: '2014',
    tags: ['Coffee', 'Price incentives', 'MAFAP', 'Investment reference', 'Jimma corridor'],
    targetAudience: ['Investors', 'Policy analysts', 'Coffee cooperatives', 'OBoA Investment desk'],
    tableOfContents: [
      '1. Coffee market structure and price formation',
      '2. Nominal rates of protection for producers and traders',
      '3. Policy and market development gaps',
      '4. Implications for value-chain investment',
    ],
    featured: true,
    downloadsCount: 4200,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapCoffee],
    sourceOrganization: 'FAO — MAFAP',
    sourceNotes:
      `Original open PDF. Source ${PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapCoffee}. Cite FAO (2014). Hosted for portal prototype as supporting investment literature — not authored by OBoA.`,
    coverImage:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_src_fao_mafap_wheat_2012',
    title: 'FAO MAFAP — Analysis of incentives and disincentives for wheat in Ethiopia',
    summary:
      'MAFAP wheat technical note on producer incentives, marketing costs, and infrastructure constraints — reference for Arsi–Bale logistics investment.',
    type: 'research',
    category: 'crop',
    format: 'PDF',
    language: 'English',
    fileSize: '1.2 MB',
    openPdfUrl: 'https://www.fao.org/4/aq433e/aq433e.pdf',
    authorOrOffice: 'FAO MAFAP',
    versionLabel: '2012 technical note',
    pagesOrDuration: 'Technical note (FAO)',
    publishedDateLabel: '2012',
    tags: ['Wheat', 'Price incentives', 'MAFAP', 'Arsi-Bale', 'Logistics'],
    targetAudience: ['Investors', 'Cereal traders', 'Warehouse operators', 'Policy desks'],
    tableOfContents: [
      '1. Wheat production and marketed surplus',
      '2. Price incentives and trade policy',
      '3. Transport and market infrastructure gaps',
      '4. Investment implications for milling and storage',
    ],
    featured: false,
    downloadsCount: 3100,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapWheat],
    sourceOrganization: 'FAO — MAFAP',
    sourceNotes: `Original open PDF. Source ${PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapWheat}. Cite FAO.`,
    coverImage:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_src_fao_oromia_wheat_iaip_2019',
    title: 'FAO — Wheat & wheat products strategic plan (Central-Eastern Oromia IAIP ACPZ)',
    summary:
      'Strategic analysis and intervention plan for wheat value chains feeding the pilot Integrated Agro-Industrial Park agro-commodity zone in Central-Eastern Oromia.',
    type: 'research',
    category: 'crop',
    format: 'PDF',
    language: 'English',
    fileSize: '3.4 MB',
    openPdfUrl:
      'https://openknowledge.fao.org/server/api/core/bitstreams/66744742-2b40-4d9a-b885-2eb249161c76/content',
    authorOrOffice: 'FAO / UNIDO — IAIP technical support',
    versionLabel: '2019',
    pagesOrDuration: '~104 pages',
    publishedDateLabel: '2019',
    tags: ['Wheat', 'IAIP', 'Oromia', 'Processing', 'Investment', 'Value chain'],
    targetAudience: ['Agro-processors', 'Investors', 'Park operators', 'OBoA Investment desk'],
    tableOfContents: [
      '1. Wheat sub-sector diagnosis in Central-Eastern Oromia',
      '2. Constraints and opportunities along the value chain',
      '3. Intervention plan for ACPZ–IAIP supply',
      '4. Investment and institutional priorities',
    ],
    featured: true,
    downloadsCount: 5600,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.faoOromiaWheatIaip],
    sourceOrganization: 'FAO Open Knowledge',
    sourceNotes: `Original open PDF (FAO Open Knowledge). Source ${PROTOTYPE_RESOURCE_SOURCE_IDS.faoOromiaWheatIaip}. Directly relevant to Oromia wheat corridor investment.`,
    coverImage:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_src_ifpri_maize_vc_2010',
    title: 'IFPRI/FAO — Maize value chain potential in Ethiopia',
    summary:
      'Diagnostic of Ethiopia’s maize value chain: production, markets, constraints, and opportunities for system enhancement.',
    type: 'research',
    category: 'crop',
    format: 'PDF',
    language: 'English',
    fileSize: '2.1 MB',
    openPdfUrl:
      'https://openknowledge.fao.org/server/api/core/bitstreams/d5bf3434-599e-45ee-b757-b7a398f755ce/content',
    authorOrOffice: 'IFPRI with MoA / EIAR partners (hosted on FAO Open Knowledge)',
    versionLabel: '2010 diagnostic',
    pagesOrDuration: 'Value-chain diagnostic report',
    publishedDateLabel: '2010',
    tags: ['Maize', 'Value chain', 'IFPRI', 'Western Oromia', 'Investment reference'],
    targetAudience: ['Investors', 'Input dealers', 'Cooperative unions', 'Researchers'],
    tableOfContents: [
      '1. Maize production and smallholder coverage',
      '2. Marketing channels and constraints',
      '3. Opportunities for productivity and market systems',
      '4. Implications for processing and logistics investment',
    ],
    featured: false,
    downloadsCount: 4800,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.ifpriMaizeVc],
    sourceOrganization: 'IFPRI / FAO Open Knowledge',
    sourceNotes: `Original open PDF. Source ${PROTOTYPE_RESOURCE_SOURCE_IDS.ifpriMaizeVc}. Historical VC reference — pair with current CSA Meher figures for investment decisions.`,
    coverImage:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_src_fao_p4p_maize_2014',
    title: 'FAO/WFP — Institutional procurement of staples from smallholders (Ethiopia)',
    summary:
      'Case study on institutional maize procurement, cooperative unions, and smallholder market integration under P4P.',
    type: 'research',
    category: 'policy',
    format: 'PDF',
    language: 'English',
    fileSize: '1.5 MB',
    openPdfUrl: 'https://www.fao.org/fileadmin/user_upload/ivc/Ethiopia_P4P_case_study.pdf',
    authorOrOffice: 'FAO / WFP Purchase for Progress',
    versionLabel: '2014 case study',
    pagesOrDuration: 'Case study',
    publishedDateLabel: '2014',
    tags: ['Maize', 'Procurement', 'Cooperatives', 'P4P', 'Market systems'],
    targetAudience: ['Cooperative unions', 'Buyers', 'Investors', 'Policy desks'],
    tableOfContents: [
      '1. Institutional buyers and procurement models',
      '2. Cooperative union performance',
      '3. Lessons for staple market integration',
    ],
    featured: false,
    downloadsCount: 2900,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.faoP4pMaize],
    sourceOrganization: 'FAO / WFP',
    sourceNotes: `Original open PDF. Source ${PROTOTYPE_RESOURCE_SOURCE_IDS.faoP4pMaize}.`,
    coverImage:
      'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
  },

  // —— OBoA Investment CMS manuals (source-attributed prototypes) ——
  {
    resourceId: 'res_oboa_investor_guidebook_2025',
    title: 'Oromia Agribusiness Investor Guidebook (Coffee · Wheat · Maize corridors)',
    summary:
      'Bureau investment desk primer: how to screen opportunities on the public Investment map, engage zone offices, and prepare partnership proposals.',
    description:
      'Compiled for the OBoA Investment portal prototype. Aligns corridor priorities with CSA Meher crop geography and OBoA facility inventory. Not a binding offer document.',
    type: 'manual',
    category: 'policy',
    format: 'PDF',
    language: 'English / Afaan Oromoo',
    fileSize: '4.8 MB',
    authorOrOffice: 'Oromia Bureau of Agriculture — Investment & Market Systems',
    versionLabel: 'v2025.1-prototype',
    pagesOrDuration: '56 pages (prototype edition)',
    publishedDateLabel: 'July 2025',
    tags: ['Investment', 'Investor guide', 'Coffee', 'Wheat', 'Maize', 'PPP'],
    targetAudience: ['Domestic investors', 'FDI desks', 'DFIs', 'Zone investment officers'],
    tableOfContents: [
      '1. Reading the public Investment map layers',
      '2. Coffee, wheat, and maize corridor priorities',
      '3. Land, logistics, and processing partnership pathways',
      '4. Source attribution & data quality flags',
      '5. Contact offices and next steps',
    ],
    featured: true,
    downloadsCount: 1820,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment,
      PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
    ],
    sourceOrganization: 'Oromia Bureau of Agriculture — Investment & Market Systems',
    sourceNotes: `Prototype bureau manual (${PROTOTYPE_RESOURCES_SEED_VERSION}). Primary sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss}. Download file is a placeholder PDF until official Storage upload.`,
    coverImage:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_jimma_coffee_investment_brief_2025',
    title: 'Jimma specialty coffee processing & export — investment opportunity brief',
    summary:
      'Corridor brief for wet/dry mill, cupping lab, and traceability partnerships across Jimma–Bedele–Metu.',
    type: 'guidance',
    category: 'crop',
    format: 'PDF',
    language: 'English',
    fileSize: '2.4 MB',
    authorOrOffice: 'OBoA — Coffee & Horticulture Directorate / Investment desk',
    versionLabel: 'v2025.1-prototype',
    pagesOrDuration: '18 pages',
    publishedDateLabel: 'July 2025',
    tags: ['Coffee', 'Jimma', 'Processing', 'Export', 'Investment opportunity'],
    targetAudience: ['Coffee investors', 'Exporters', 'Cooperative unions'],
    tableOfContents: [
      '1. Corridor production densification (CSA/OBoA patterns)',
      '2. Processing and quality-lab gaps',
      '3. Indicative CAPEX bands (prototype)',
      '4. Linked public map layers & facilities',
    ],
    featured: true,
    downloadsCount: 2100,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment,
      PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapCoffee,
      PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
    ],
    sourceOrganization: 'Oromia Bureau of Agriculture',
    sourceNotes: `Prototype opportunity brief. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss}; supporting lit ${PROTOTYPE_RESOURCE_SOURCE_IDS.faoMafapCoffee}. USD ranges indicative only.`,
    coverImage:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_arsi_bale_wheat_logistics_brief_2025',
    title: 'Arsi–Bale wheat warehouse & logistics corridor — investment brief',
    summary:
      'Strategic storage, cleaning, and freight aggregation brief for Asella–Shashamane–Robe surplus areas.',
    type: 'guidance',
    category: 'crop',
    format: 'PDF',
    language: 'English',
    fileSize: '2.6 MB',
    authorOrOffice: 'OBoA — Cereals Marketing & Investment desk',
    versionLabel: 'v2025.1-prototype',
    pagesOrDuration: '20 pages',
    publishedDateLabel: 'July 2025',
    tags: ['Wheat', 'Arsi', 'Bale', 'Warehouse', 'Logistics', 'Investment'],
    targetAudience: ['Logistics investors', 'Millers', 'Warehouse operators'],
    tableOfContents: [
      '1. Highland wheat surplus geography',
      '2. Storage and quality-control gaps',
      '3. Corridor logistics partnership models',
      '4. Links to FAO Oromia wheat IAIP analysis',
    ],
    featured: true,
    downloadsCount: 1950,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment,
      PROTOTYPE_RESOURCE_SOURCE_IDS.faoOromiaWheatIaip,
      PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
    ],
    sourceOrganization: 'Oromia Bureau of Agriculture',
    sourceNotes: `Prototype brief. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss}; supporting ${PROTOTYPE_RESOURCE_SOURCE_IDS.faoOromiaWheatIaip}.`,
    coverImage:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_west_oromia_maize_agroprocessing_2025',
    title: 'Western Oromia maize aggregation & agro-processing — investment brief',
    summary:
      'Opportunity brief for aggregation, drying, and feed/food processing across East Wellega–Jimma maize belts.',
    type: 'guidance',
    category: 'crop',
    format: 'PDF',
    language: 'English',
    fileSize: '2.2 MB',
    authorOrOffice: 'OBoA — Investment & Market Systems',
    versionLabel: 'v2025.1-prototype',
    pagesOrDuration: '16 pages',
    publishedDateLabel: 'July 2025',
    tags: ['Maize', 'Agro-processing', 'Wellega', 'Investment'],
    targetAudience: ['Processors', 'Feed millers', 'Cooperative unions'],
    tableOfContents: [
      '1. Maize production intensity (Meher patterns)',
      '2. Post-harvest loss and drying gaps',
      '3. Processing partnership options',
    ],
    featured: false,
    downloadsCount: 1640,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment,
      PROTOTYPE_RESOURCE_SOURCE_IDS.ifpriMaizeVc,
      PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
    ],
    sourceOrganization: 'Oromia Bureau of Agriculture',
    sourceNotes: `Prototype brief. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss}; supporting ${PROTOTYPE_RESOURCE_SOURCE_IDS.ifpriMaizeVc}.`,
    coverImage:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_land_lease_ppp_primer_2025',
    title: 'Agricultural land partnership & PPP engagement primer (Oromia)',
    summary:
      'Non-binding primer on lease/PPP pathways, responsible office contacts, and documentation typically required for agribusiness site partnerships.',
    type: 'policy',
    category: 'policy',
    format: 'PDF',
    language: 'English / Afaan Oromoo',
    fileSize: '1.9 MB',
    authorOrOffice: 'OBoA Investment desk with Regional Investment Commission liaison notes',
    versionLabel: 'v2025.1-prototype',
    pagesOrDuration: '24 pages',
    publishedDateLabel: 'June 2025',
    tags: ['Land', 'PPP', 'Lease', 'Investment process', 'Policy'],
    targetAudience: ['Investors', 'Legal advisors', 'Zone administrators'],
    tableOfContents: [
      '1. Partnership models used in agribusiness corridors',
      '2. Typical document checklist',
      '3. Responsible offices and escalation',
      '4. Disclaimer — not a substitute for legal counsel',
    ],
    featured: false,
    downloadsCount: 1320,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment],
    sourceOrganization: 'Oromia Bureau of Agriculture — Investment & Market Systems',
    sourceNotes: `Prototype policy primer (${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment}). Not statutory text — replace with gazetted instruments when publishing formally.`,
    coverImage:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_methodology_suitability_v1',
    title: 'Methodology note — commodity suitability & investment potential scores (v1)',
    summary:
      'Explains how public Investment map suitability and investment-potential layers are scored (0–100) for coffee, wheat, and maize.',
    type: 'guidance',
    category: 'policy',
    format: 'PDF',
    language: 'English',
    fileSize: '1.4 MB',
    authorOrOffice: 'OBoA Investment & Market Systems — Data & GIS',
    versionLabel: 'meth_oab_suitability_investment_v1',
    pagesOrDuration: '12 pages',
    publishedDateLabel: 'August 2025',
    tags: ['Methodology', 'Investment map', 'Suitability', 'Provenance'],
    targetAudience: ['Investors', 'Analysts', 'Journalists', 'Staff editors'],
    tableOfContents: [
      '1. Score components and weights',
      '2. Link to CSA / OBoA source rows',
      '3. qualityFlag=estimated disclosure',
      '4. Update cadence',
    ],
    featured: false,
    downloadsCount: 980,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment,
      PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
    ],
    sourceOrganization: 'Oromia Bureau of Agriculture',
    sourceNotes: `Aligns with Investment CMS methodology meth_oab_suitability_investment_v1. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss}.`,
  },

  // —— Extension / field manuals (OBoA-attributed prototypes) ——
  {
    resourceId: 'res_oboa_meher_planting_calendar_2025',
    title: 'Oromia Meher 2025/26 synchronized planting & harvest calendar (22 zones)',
    summary:
      'Agro-ecological planting windows for wheat, maize, teff, barley, and pulses across Oromia’s 22 administrative zones — compiled for DA and FTC use.',
    type: 'calendar',
    category: 'crop',
    format: 'PDF',
    language: 'Afaan Oromoo / Amharic / English',
    fileSize: '4.2 MB',
    authorOrOffice: 'OBoA — Agronomy & Climate Directorate',
    versionLabel: 'v2025.2-prototype',
    pagesOrDuration: '48 pages',
    publishedDateLabel: 'January 2026',
    tags: ['Planting calendar', 'Meher', 'Extension', '22 zones'],
    targetAudience: ['Development Agents', 'Farmers', 'FTC trainers'],
    tableOfContents: [
      '1. Regional climate outlook',
      '2. Highland zone matrices (Arsi, Bale, West Shewa)',
      '3. Mid-altitude & western maize/coffee belts',
      '4. Lowland irrigated windows',
    ],
    featured: true,
    downloadsCount: 14820,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension,
      PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
      PROTOTYPE_RESOURCE_SOURCE_IDS.moaAti,
    ],
    sourceOrganization: 'Oromia Agricultural Bureau — Agronomy & Climate Directorate',
    sourceNotes: `Prototype extension calendar. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.moaAti}. Placeholder PDF until Storage upload.`,
    coverImage:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_wheat_agronomy_kulumsa_2025',
    title: 'Durum & bread wheat high-yield agronomy guidebook (cluster edition)',
    summary:
      'Certified seed profiles, fertilizer splits, weed control, and harvest-loss prevention for highland wheat clusters — compiled with Kulumsa/IQQO practice notes.',
    type: 'manual',
    category: 'crop',
    format: 'PDF',
    language: 'Afaan Oromoo & Amharic',
    fileSize: '5.8 MB',
    authorOrOffice: 'OBoA Crop Development Directorate & IQQO/Kulumsa collaboration notes',
    versionLabel: 'v3.2-prototype',
    pagesOrDuration: '52 pages',
    publishedDateLabel: 'February 2026',
    tags: ['Wheat', 'Agronomy', 'Certified seed', 'Cluster farming'],
    targetAudience: ['Wheat cluster farmers', 'Agronomists', 'Combine operators'],
    tableOfContents: [
      '1. Variety profiles for mid/highland Oromia',
      '2. Seedbed and acidity management',
      '3. Split fertilizer protocols',
      '4. Weed and harvest loss control',
    ],
    featured: false,
    downloadsCount: 11400,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension,
      PROTOTYPE_RESOURCE_SOURCE_IDS.eiarKulumsa,
    ],
    sourceOrganization: 'OBoA / EIAR–Kulumsa practice notes',
    sourceNotes: `Prototype compilation. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.eiarKulumsa}.`,
    coverImage:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_faw_locust_ipm_2025',
    title: 'Fall Armyworm, Desert Locust & wheat rust — integrated management field guide',
    summary:
      'Diagnostic keys, economic thresholds, and safe response protocols for priority pests and diseases affecting Oromia cereals.',
    type: 'guidance',
    category: 'pest',
    format: 'PDF',
    language: 'Afaan Oromoo & Amharic',
    fileSize: '6.4 MB',
    authorOrOffice: 'OBoA Plant Health & Regulatory Directorate (FAO Ethiopia practice alignment)',
    versionLabel: 'v4.1-prototype',
    pagesOrDuration: '62 pages',
    publishedDateLabel: 'February 2026',
    tags: ['Fall Armyworm', 'Locust', 'Wheat rust', 'IPM', 'Plant health'],
    targetAudience: ['Spray teams', 'DAs', 'Cluster leaders'],
    tableOfContents: [
      '1. Visual diagnostic keys',
      '2. Economic injury levels',
      '3. Biological and chemical options',
      '4. PPE and 8844 reporting',
    ],
    featured: true,
    downloadsCount: 19450,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension],
    sourceOrganization: 'Oromia Plant Health & Regulatory Directorate',
    sourceNotes: `Prototype IPM guide (${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}). Aligns with national plant health practice; placeholder PDF.`,
    coverImage:
      'https://images.unsplash.com/photo-1592417817098-8f3d6eb23659?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_yelemat_dairy_handbook_2025',
    title: 'Yelemat Tirufat dairy husbandry & AI field handbook',
    summary:
      'Cross-breeding, forage/silage, clean milk, and vaccination schedules for dairy smallholders and AI technicians.',
    type: 'manual',
    category: 'livestock',
    format: 'PDF',
    language: 'Afaan Oromoo',
    fileSize: '8.4 MB',
    authorOrOffice: 'Livestock & Veterinary Health Directorate, OBoA',
    versionLabel: 'v3.0-prototype',
    pagesOrDuration: '76 pages',
    publishedDateLabel: 'March 2026',
    tags: ['Dairy', 'AI', 'Yelemat', 'Livestock'],
    targetAudience: ['Dairy smallholders', 'AI technicians', 'Milk unions'],
    tableOfContents: [
      '1. Estrus detection and AI technique',
      '2. Ration formulation from by-products',
      '3. Forage and silage',
      '4. Clean milk and vaccination',
    ],
    featured: false,
    downloadsCount: 12380,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension],
    sourceOrganization: 'OBoA Livestock & Veterinary Health Directorate',
    sourceNotes: `Prototype handbook (${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}).`,
    coverImage:
      'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_input_subsidy_policy_2025',
    title: 'Oromia agricultural input subsidy & fertilizer distribution policy brief',
    summary:
      'Operational brief on subsidized NPSB/Urea allocation, voucher redemption, and cooperative audit expectations for Meher campaigns.',
    type: 'policy',
    category: 'policy',
    format: 'PDF',
    language: 'Afaan Oromoo & English',
    fileSize: '3.1 MB',
    authorOrOffice: 'OBoA & Regional Executive Council liaison notes',
    versionLabel: 'v2026.1-prototype',
    pagesOrDuration: '34 pages',
    publishedDateLabel: 'December 2025',
    tags: ['Fertilizer', 'Subsidy', 'Policy', 'Cooperatives'],
    targetAudience: ['Cooperative boards', 'Kebele admins', 'Agro-dealers'],
    tableOfContents: [
      '1. Framework objectives',
      '2. Eligibility and vouchers',
      '3. Price ceilings and warehouse rules',
      '4. Audit and grievance redress',
    ],
    featured: false,
    downloadsCount: 8920,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension,
      PROTOTYPE_RESOURCE_SOURCE_IDS.moaAti,
    ],
    sourceOrganization: 'Oromia Agricultural Bureau',
    sourceNotes: `Prototype policy brief — not a gazette reprint. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.moaAti}.`,
    coverImage:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_form_ag01_voucher_2025',
    title: 'Form AG-01 — Input & fertilizer credit voucher application',
    summary:
      'Standard application template for smallholders and clusters requesting subsidized input vouchers and mechanization scheduling.',
    type: 'form',
    category: 'form',
    format: 'PDF',
    language: 'Afaan Oromoo',
    fileSize: '0.8 MB',
    authorOrOffice: 'Inputs & Cooperative Development Directorate',
    versionLabel: 'Form Rev 2026-B-prototype',
    pagesOrDuration: '4 pages',
    publishedDateLabel: 'January 2026',
    tags: ['Form', 'Voucher', 'Inputs', 'Printable'],
    targetAudience: ['Farmers', 'Kebele DAs', 'Cooperative managers'],
    tableOfContents: [
      'Section A: Applicant & GPS',
      'Section B: Cluster verification',
      'Section C: Requested quantities',
      'Section D: Guarantee signatures',
    ],
    featured: false,
    downloadsCount: 22100,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension],
    sourceOrganization: 'OBoA Inputs & Cooperative Development Directorate',
    sourceNotes: `Prototype form template (${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}).`,
  },
  {
    resourceId: 'res_oboa_irrigation_solar_pump_2025',
    title: 'Small-scale irrigation & solar pump operation field manual',
    summary:
      'Operation, maintenance, and WUA governance notes for solar and diesel pump schemes supporting irrigated wheat and horticulture.',
    type: 'manual',
    category: 'irrigation',
    format: 'PDF',
    language: 'Afaan Oromoo / English',
    fileSize: '3.7 MB',
    authorOrOffice: 'OBoA Irrigation & Watershed Directorate',
    versionLabel: 'v2.1-prototype',
    pagesOrDuration: '40 pages',
    publishedDateLabel: 'May 2025',
    tags: ['Irrigation', 'Solar pump', 'WUA', 'Investment enabling'],
    targetAudience: ['WUA boards', 'Scheme operators', 'Investors in irrigation PPPs'],
    tableOfContents: [
      '1. Pump selection and siting',
      '2. O&M schedules',
      '3. Water user association roles',
      '4. Links to irrigation investment opportunities',
    ],
    featured: false,
    downloadsCount: 5400,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension],
    sourceOrganization: 'OBoA Irrigation & Watershed Directorate',
    sourceNotes: `Prototype field manual (${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}).`,
    coverImage:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
  },
  {
    resourceId: 'res_oboa_ftc_da_curriculum_2025',
    title: 'FTC & Development Agent training curriculum — priority commodities',
    summary:
      'Modular FTC curriculum for coffee, wheat, and maize demonstration plots, including session plans and farmer flipchart scripts.',
    type: 'manual',
    category: 'ftc',
    format: 'PDF',
    language: 'Afaan Oromoo / Amharic',
    fileSize: '5.1 MB',
    authorOrOffice: 'OBoA Extension Directorate / ATI practice adaptation',
    versionLabel: 'v2025.1-prototype',
    pagesOrDuration: '68 pages',
    publishedDateLabel: 'April 2025',
    tags: ['FTC', 'DA training', 'Coffee', 'Wheat', 'Maize'],
    targetAudience: ['FTC trainers', 'Development Agents', 'Woreda desks'],
    tableOfContents: [
      '1. Adult learning & demo plot design',
      '2. Coffee module',
      '3. Wheat module',
      '4. Maize module',
      '5. Assessment & certification',
    ],
    featured: false,
    downloadsCount: 6700,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension,
      PROTOTYPE_RESOURCE_SOURCE_IDS.moaAti,
    ],
    sourceOrganization: 'OBoA Extension Directorate',
    sourceNotes: `Prototype curriculum. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.moaAti}.`,
  },
  {
    resourceId: 'res_oboa_compost_video_script_2025',
    title: 'Precision compost & EM biofertilizer — field demonstration script (video companion)',
    summary:
      'Companion PDF script for the Afaan Oromoo compost masterclass used in FTC demos; links to multimedia training packs.',
    type: 'guidance',
    category: 'multimedia',
    format: 'PDF',
    language: 'Afaan Oromoo (EN/AM notes)',
    fileSize: '1.2 MB',
    authorOrOffice: 'OBoA Audio-Visual Production / Asella research liaison',
    versionLabel: 'HD companion v1-prototype',
    pagesOrDuration: '14 pages + timing cues',
    publishedDateLabel: 'April 2026',
    tags: ['Compost', 'Biofertilizer', 'FTC', 'Multimedia'],
    targetAudience: ['FTC trainees', 'Organic producers', 'Youth groups'],
    tableOfContents: [
      '1. Session timing cues',
      '2. Ingredient ratios (C:N)',
      '3. Field application rates',
    ],
    featured: false,
    downloadsCount: 4100,
    sourceIds: [PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension],
    sourceOrganization: 'OBoA Audio-Visual Production Center',
    sourceNotes: `Prototype companion PDF (${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaExtension}).`,
  },
  {
    resourceId: 'res_oboa_data_provenance_flyer_2025',
    title: 'Public Investment map — data provenance & how to cite sources (one-pager)',
    summary:
      'One-page flyer explaining CSA AGSS patterns, OBoA zone estimates, qualityFlag=estimated, and how to cite Investment CMS layers.',
    type: 'poster',
    category: 'policy',
    format: 'PDF',
    language: 'English / Afaan Oromoo',
    fileSize: '0.6 MB',
    authorOrOffice: 'OBoA Investment & Market Systems — Data & GIS',
    versionLabel: 'v1-prototype',
    pagesOrDuration: '1 page (A3 printable)',
    publishedDateLabel: 'August 2025',
    tags: ['Provenance', 'Citation', 'Investment map', 'Transparency'],
    targetAudience: ['Public users', 'Journalists', 'Investors', 'Staff'],
    tableOfContents: ['1. Source stack', '2. qualityFlag legend', '3. Citation examples'],
    featured: false,
    downloadsCount: 2200,
    sourceIds: [
      PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment,
      PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss,
    ],
    sourceOrganization: 'Oromia Bureau of Agriculture',
    sourceNotes: `Prototype flyer. Sources: ${PROTOTYPE_RESOURCE_SOURCE_IDS.oboaInvestment}, ${PROTOTYPE_RESOURCE_SOURCE_IDS.csaAgss}.`,
  },
];

function formatSourceIds(ids: string[]): string {
  return ids.join(', ');
}

export function buildPrototypeResourceDocs(actorUid: string, nowIso: string): BureauResource[] {
  return PROTOTYPE_RESOURCE_CATALOG.map((spec) => {
    const slug = slugifyResourceTitle(spec.title) || spec.resourceId;
    const downloadUrl = spec.openPdfUrl || PLACEHOLDER_PDF_URL;
    const tags = [...spec.tags, ...spec.sourceIds.map((id) => `source:${id}`)];

    return {
      resourceId: spec.resourceId,
      slug,
      title: spec.title,
      summary: spec.summary,
      description: spec.description || spec.summary,
      type: spec.type,
      category: spec.category,
      format: spec.format,
      language: spec.language,
      fileSize: spec.fileSize,
      downloadUrl,
      coverImage: spec.coverImage,
      videoEmbedUrl: spec.videoEmbedUrl,
      videoDuration: spec.videoDuration,
      authorOrOffice: spec.authorOrOffice,
      versionLabel: spec.versionLabel,
      pagesOrDuration: spec.pagesOrDuration,
      publishedDateLabel: spec.publishedDateLabel,
      tags,
      targetAudience: spec.targetAudience,
      tableOfContents: spec.tableOfContents,
      previewSummary: spec.summary,
      featured: spec.featured,
      downloadsCount: spec.downloadsCount,
      status: 'published' as const,
      sourceOrganization: spec.sourceOrganization,
      sourceNotes: `${spec.sourceNotes} | Seed ${PROTOTYPE_RESOURCES_SEED_VERSION} | sourceIds=[${formatSourceIds(spec.sourceIds)}]`,
      version: 1,
      createdAt: nowIso,
      createdBy: actorUid,
      updatedAt: nowIso,
      updatedBy: actorUid,
      publishedAt: nowIso,
      publishedBy: actorUid,
    };
  });
}

/** Static fallback for public /resources when Firestore is empty. */
export function getPrototypeResourcePublications(): Publication[] {
  const nowIso = new Date().toISOString();
  return buildPrototypeResourceDocs('prototype_static', nowIso).map(resourceToPublication);
}

export function countPrototypeResources(): {
  total: number;
  openPublicPdfs: number;
  oboaPrototypes: number;
  sources: number;
} {
  const openPublicPdfs = PROTOTYPE_RESOURCE_CATALOG.filter((r) => Boolean(r.openPdfUrl)).length;
  return {
    total: PROTOTYPE_RESOURCE_CATALOG.length,
    openPublicPdfs,
    oboaPrototypes: PROTOTYPE_RESOURCE_CATALOG.length - openPublicPdfs,
    sources: PROTOTYPE_RESOURCE_SOURCES.length,
  };
}
