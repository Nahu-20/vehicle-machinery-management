import React from 'react';
import { AdminAboutEntityPage } from './AdminAboutEntityPage';
import { emptyLocalized } from '../../../types/about';

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}`;

export const AdminAboutHistoryPage: React.FC = () => (
  <AdminAboutEntityPage
    entity="history"
    title="History milestones"
    description="Institutional timeline entries. Keep drafts until OAB verifies dates and narrative."
    getLabel={(r) => String((r.title as { en?: string })?.en || r.yearLabel || r.id)}
    buildNew={() => ({
      id: newId(),
      yearLabel: '',
      title: emptyLocalized(),
      description: emptyLocalized(),
      group: 'Foundation',
      featured: false,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      { key: 'yearLabel', label: 'Year / date label', type: 'text' },
      { key: 'group', label: 'Group', type: 'text' },
      { key: 'title', label: 'Title', type: 'localized' },
      { key: 'description', label: 'Description', type: 'localizedLong' },
      { key: 'imageUrl', label: 'Image URL', type: 'url' },
      { key: 'featured', label: 'Featured', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutMandatePage: React.FC = () => (
  <AdminAboutEntityPage
    entity="mandate"
    title="Mandate, mission & vision"
    description="Manage mandate blocks, mission, vision, objectives, values, and legal notes."
    getLabel={(r) => `${r.kind}: ${(r.title as { en?: string })?.en || r.id}`}
    buildNew={() => ({
      id: newId(),
      kind: 'objective',
      title: emptyLocalized(),
      body: emptyLocalized(),
      active: true,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      {
        key: 'kind',
        label: 'Kind',
        type: 'select',
        options: ['mandate', 'mission', 'vision', 'objective', 'value', 'legal'],
      },
      { key: 'title', label: 'Title', type: 'localized' },
      { key: 'body', label: 'Body', type: 'localizedLong' },
      { key: 'active', label: 'Active', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutLeadershipPage: React.FC = () => (
  <AdminAboutEntityPage
    entity="leaders"
    title="Leadership"
    description="Current and former leaders. Only current + published appear on the public site."
    getLabel={(r) => String((r.name as { en?: string })?.en || r.slug || r.id)}
    buildNew={() => ({
      id: newId(),
      slug: `leader-${Date.now()}`,
      name: emptyLocalized('Name TBD'),
      title: emptyLocalized('Title TBD'),
      level: 'senior',
      tenure: 'current',
      featured: false,
      publicProfileEnabled: true,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'name', label: 'Full name', type: 'localized' },
      { key: 'title', label: 'Official position', type: 'localized' },
      { key: 'biography', label: 'Biography', type: 'localizedLong' },
      {
        key: 'level',
        label: 'Level',
        type: 'select',
        options: ['bureau-head', 'deputy', 'senior', 'directorate'],
      },
      { key: 'tenure', label: 'Tenure', type: 'select', options: ['current', 'former'] },
      { key: 'photoUrl', label: 'Photo URL', type: 'url' },
      { key: 'publicProfileEnabled', label: 'Public profile enabled', type: 'checkbox' },
      { key: 'featured', label: 'Featured', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutMessagesPage: React.FC = () => (
  <AdminAboutEntityPage
    entity="messages"
    title="Leadership messages"
    description="Official messages. Publishing a featured message clears other featured flags."
    getLabel={(r) => String((r.title as { en?: string })?.en || r.id)}
    buildNew={() => ({
      id: newId(),
      title: emptyLocalized(),
      leaderId: '',
      leaderName: emptyLocalized(),
      leaderTitle: emptyLocalized(),
      excerpt: emptyLocalized(),
      body: emptyLocalized(),
      language: 'all',
      featured: false,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      { key: 'leaderId', label: 'Leader ID', type: 'text' },
      { key: 'title', label: 'Title', type: 'localized' },
      { key: 'leaderName', label: 'Leader name', type: 'localized' },
      { key: 'leaderTitle', label: 'Leader title', type: 'localized' },
      { key: 'excerpt', label: 'Short quote', type: 'localizedLong' },
      { key: 'body', label: 'Full message', type: 'localizedLong' },
      { key: 'dateLabel', label: 'Date label', type: 'text' },
      { key: 'featured', label: 'Featured on About landing', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutDepartmentsPage: React.FC = () => (
  <AdminAboutEntityPage
    entity="departments"
    title="Departments & directorates"
    description="Public directory entries for /about/departments."
    getLabel={(r) => String((r.name as { en?: string })?.en || r.slug || r.id)}
    buildNew={() => ({
      id: newId(),
      slug: `dept-${Date.now()}`,
      name: emptyLocalized(),
      shortMandate: emptyLocalized(),
      description: emptyLocalized(),
      responsibilities: [],
      iconName: 'Building2',
      active: true,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'name', label: 'Name', type: 'localized' },
      { key: 'shortMandate', label: 'Short mandate', type: 'localized' },
      { key: 'description', label: 'Description', type: 'localizedLong' },
      { key: 'iconName', label: 'Icon key', type: 'text' },
      { key: 'contact', label: 'Contact', type: 'text' },
      { key: 'active', label: 'Active', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutStatisticsPage: React.FC = () => (
  <AdminAboutEntityPage
    entity="statistics"
    title="OAB at a Glance — statistics"
    description="Traceable indicators. Prefer empty over unverified numbers. Include year and source before publish."
    getLabel={(r) => String((r.label as { en?: string })?.en || r.id)}
    buildNew={() => ({
      id: newId(),
      label: emptyLocalized(),
      value: '—',
      category: 'geographic',
      featured: false,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      { key: 'label', label: 'Label', type: 'localized' },
      { key: 'value', label: 'Value (display string)', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'year', label: 'Reporting year', type: 'number' },
      { key: 'source', label: 'Source', type: 'localized' },
      { key: 'methodology', label: 'Methodology', type: 'localizedLong' },
      { key: 'featured', label: 'Featured on landing', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutPartnersPage: React.FC = () => (
  <AdminAboutEntityPage
    entity="partners"
    title="Partners"
    description="List only partners approved for public logo/name display."
    getLabel={(r) => String((r.name as { en?: string })?.en || r.id)}
    buildNew={() => ({
      id: newId(),
      name: emptyLocalized(),
      description: emptyLocalized(),
      category: 'other',
      active: true,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      { key: 'name', label: 'Name', type: 'localized' },
      { key: 'description', label: 'Description', type: 'localizedLong' },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          'federal',
          'regional',
          'university',
          'research',
          'development',
          'ngo',
          'private',
          'international',
          'other',
        ],
      },
      { key: 'websiteUrl', label: 'Website', type: 'url' },
      { key: 'logoUrl', label: 'Logo URL', type: 'url' },
      { key: 'active', label: 'Active', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutDocumentsPage: React.FC = () => (
  <AdminAboutEntityPage
    entity="documents"
    title="Strategic documents"
    description="Document library metadata. Attach a public download URL only when the file is approved."
    getLabel={(r) => String((r.title as { en?: string })?.en || r.id)}
    buildNew={() => ({
      id: newId(),
      title: emptyLocalized(),
      description: emptyLocalized(),
      category: 'strategy',
      language: '—',
      featured: false,
      isPlaceholder: true,
      status: 'draft',
      displayOrder: 0,
      version: 1,
    })}
    fields={[
      { key: 'title', label: 'Title', type: 'localized' },
      { key: 'description', label: 'Description', type: 'localizedLong' },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          'strategy',
          'policy',
          'annual-report',
          'guideline',
          'proclamation',
          'plan',
          'regulation',
          'manual',
          'publication',
          'other',
        ],
      },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'language', label: 'Language', type: 'text' },
      { key: 'downloadUrl', label: 'Download URL', type: 'url' },
      { key: 'fileSize', label: 'File size label', type: 'text' },
      { key: 'featured', label: 'Featured', type: 'checkbox' },
    ]}
  />
);

export const AdminAboutHowWeServePage: React.FC = () => (
  <div className="space-y-10">
    <AdminAboutEntityPage
      entity="serviceChain"
      title="Service delivery chain"
      description="Ordered stages from policy to farmer. Update only with verified institutional wording."
      getLabel={(r) => String((r.title as { en?: string })?.en || r.id)}
      buildNew={() => ({
        id: newId(),
        title: emptyLocalized(),
        description: emptyLocalized(),
        enabled: true,
        status: 'draft',
        displayOrder: 0,
        version: 1,
      })}
      fields={[
        { key: 'title', label: 'Title', type: 'localized' },
        { key: 'description', label: 'Description', type: 'localizedLong' },
        { key: 'iconName', label: 'Icon key', type: 'text' },
        { key: 'enabled', label: 'Enabled', type: 'checkbox' },
      ]}
    />
    <AdminAboutEntityPage
      entity="stakeholders"
      title="Stakeholders"
      description="Audience descriptions for How We Serve."
      getLabel={(r) => String((r.title as { en?: string })?.en || r.id)}
      buildNew={() => ({
        id: newId(),
        title: emptyLocalized(),
        description: emptyLocalized(),
        enabled: true,
        status: 'draft',
        displayOrder: 0,
        version: 1,
      })}
      fields={[
        { key: 'title', label: 'Title', type: 'localized' },
        { key: 'description', label: 'Description', type: 'localizedLong' },
        { key: 'enabled', label: 'Enabled', type: 'checkbox' },
      ]}
    />
  </div>
);
