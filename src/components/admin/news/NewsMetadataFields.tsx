import React from 'react';
import { NewsCategory, NewsArticleInput, LocalizedText, sanitizeSlug } from '../../../types/news';
import { LocalizedTextFields } from './LocalizedTextFields';
import { Tag, Building2, User, Image, Link2, Star, AlertCircle, Info } from 'lucide-react';

interface NewsMetadataFieldsProps {
  input: NewsArticleInput;
  onChange: (updated: NewsArticleInput) => void;
  isEditMode?: boolean;
}

export const NewsMetadataFields: React.FC<NewsMetadataFieldsProps> = ({
  input,
  onChange,
  isEditMode = false,
}) => {
  const handleSlugChange = (rawSlug: string) => {
    const clean = sanitizeSlug(rawSlug);
    onChange({ ...input, slug: clean });
  };

  const handleTagsChange = (raw: string) => {
    const tagsArr = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onChange({ ...input, tags: tagsArr });
  };

  return (
    <div className="space-y-6">
      {/* Article Slug */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Article URL Slug</span>
          <span className="text-red-500 font-bold">*</span>
        </label>
        <div className="flex rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center border-r border-slate-200 dark:border-slate-700 font-mono">
            /news/
          </span>
          <input
            type="text"
            value={input.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={isEditMode}
            placeholder="irrigation-program-launched-in-bale"
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {isEditMode
            ? 'Article URL slug is stable and cannot be changed after creation.'
            : 'Lowercase, hyphens between words. Automatically generated from title if left blank.'}
        </p>
      </div>

      {/* Category & Featured Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Category</span>
            <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={input.category}
            onChange={(e) => onChange({ ...input, category: e.target.value as NewsCategory })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 transition-all"
          >
            <option value="news">Oduu (News / Press Release)</option>
            <option value="training">Leenjii (Training & Extension)</option>
            <option value="event">Qophii (Event & Field Day)</option>
            <option value="tender">Ciraa / Caalbaasii (Tender & Notice)</option>
            <option value="announcement">Beeksisa (Public Announcement)</option>
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Featured Article</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pin to top banner on public news portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...input, featured: !input.featured })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              input.featured ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                input.featured ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Featured Image & Alt Text */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Featured Cover Image</h3>
          </div>
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Info className="w-3 h-3" /> External URL or Approved Asset
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Image URL <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="url"
            value={input.featuredImage}
            onChange={(e) => onChange({ ...input, featuredImage: e.target.value })}
            placeholder="https://images.unsplash.com/photo-..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Note: Direct binary upload will be supported in a future Storage milestone. Please use approved asset URLs or Unsplash links.
          </p>
        </div>

        {input.featuredImage && (
          <div className="relative rounded-xl overflow-hidden h-40 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <img
              src={input.featuredImage}
              alt={input.imageAlt.om || 'Preview'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <LocalizedTextFields
          label="Image Alternative Text (Accessibility)"
          value={input.imageAlt}
          onChange={(val) => onChange({ ...input, imageAlt: val })}
          requiredOm
          placeholderOm="Fakkiibaa ibsaa..."
          placeholderAm="የምስል መግለጫ..."
          placeholderEn="Image alt text..."
          helpText="Describe image content for screen readers."
        />
      </div>

      {/* Responsible Office & Author */}
      <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Publishing Office & Author Details</span>
        </h3>

        <LocalizedTextFields
          label="Responsible Office"
          value={input.responsibleOffice}
          onChange={(val) => onChange({ ...input, responsibleOffice: val })}
          requiredOm
          placeholderOm="Waajjira Qonnaa Godina Bulee..."
          placeholderAm="የኦሮሚያ ግብርና ቢሮ..."
          placeholderEn="Oromia Bureau of Agriculture..."
        />

        <LocalizedTextFields
          label="Author Name / Title (Optional)"
          value={input.authorName || { om: '', am: '', en: '' }}
          onChange={(val) => onChange({ ...input, authorName: val })}
          placeholderOm="Obbo Tafarraa Gabra..."
          placeholderAm="አቶ ተፈራ ገብረ..."
          placeholderEn="Mr. Tefera Gebre..."
        />
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Search Tags (Comma separated)</span>
        </label>
        <input
          type="text"
          value={input.tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="irrigation, wheat, bale, extension, advisory"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
        />
      </div>
    </div>
  );
};
