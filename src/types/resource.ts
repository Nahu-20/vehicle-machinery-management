/**
 * Firestore CMS model for Resources & Manuals (`resources/{resourceId}`).
 * Maps to public `Publication` view model for the existing Resources UI.
 */

export type ResourceDocType =
  | 'calendar'
  | 'guidance'
  | 'manual'
  | 'policy'
  | 'video'
  | 'form'
  | 'research'
  | 'poster';

export type ResourceFormat = 'PDF' | 'MP4' | 'DOCX' | 'XLSX' | 'ZIP';

export type ResourceCategoryId =
  | 'crop'
  | 'pest'
  | 'livestock'
  | 'irrigation'
  | 'policy'
  | 'form'
  | 'multimedia'
  | 'ftc';

export type ResourceLifecycleStatus = 'draft' | 'published' | 'archived';

export interface BureauResource {
  resourceId: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  type: ResourceDocType;
  category: ResourceCategoryId;
  format: ResourceFormat;
  language: string;
  fileSize?: string;
  /** Public download / open URL (Storage or external). */
  downloadUrl: string;
  /** Firebase Storage object path when uploaded via admin (resources/files/...). */
  storagePath?: string;
  coverImage?: string;
  videoEmbedUrl?: string;
  videoDuration?: string;
  authorOrOffice?: string;
  versionLabel?: string;
  pagesOrDuration?: string;
  publishedDateLabel?: string;
  tags?: string[];
  targetAudience?: string[];
  tableOfContents?: string[];
  previewSummary?: string;
  featured: boolean;
  downloadsCount: number;
  status: ResourceLifecycleStatus;
  sourceOrganization?: string;
  sourceNotes?: string;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
}
