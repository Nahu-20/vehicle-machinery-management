import React, { useState } from 'react';
import { LocalizedText } from '../../../types/achievement';
import { LocalizedTextFields } from '../news/LocalizedTextFields';
import { NewsFeaturedImageUploader } from '../media/NewsFeaturedImageUploader';
import { NewsStagedImageReference } from '../../../types/media';
import { NewsManagedFeaturedImage } from '../../../types/news';
import { Image, Link, Upload } from 'lucide-react';

interface AchievementFeaturedImageUploaderProps {
  authenticatedUid: string;
  source: 'external' | 'managed' | 'none';
  externalUrl: string;
  stagedImage?: NewsStagedImageReference | null;
  imageAlt: LocalizedText;
  imagePosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
  onSourceChange: (source: 'external' | 'managed' | 'none') => void;
  onExternalUrlChange: (url: string) => void;
  onStagedImageChange: (staged: NewsStagedImageReference | null) => void;
  onManagedReady: (mediaId: string, managed: NewsManagedFeaturedImage) => void;
  onAltChange: (alt: LocalizedText) => void;
  onPositionChange: (pos: 'center' | 'top' | 'bottom' | 'left' | 'right') => void;
}

export const AchievementFeaturedImageUploader: React.FC<AchievementFeaturedImageUploaderProps> = ({
  authenticatedUid,
  source,
  externalUrl,
  stagedImage,
  imageAlt,
  imagePosition,
  onSourceChange,
  onExternalUrlChange,
  onStagedImageChange,
  onManagedReady,
  onAltChange,
  onPositionChange,
}) => {
  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Achievement Featured Image</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select an image source to feature on public achievement cards and banners.
          </p>
        </div>

        {/* Source selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onSourceChange('managed')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              source === 'managed'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Managed Upload</span>
          </button>
          <button
            type="button"
            onClick={() => onSourceChange('external')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              source === 'external'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>External URL</span>
          </button>
          <button
            type="button"
            onClick={() => onSourceChange('none')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              source === 'none'
                ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            None
          </button>
        </div>
      </div>

      {source === 'managed' && (
        <NewsFeaturedImageUploader
          authenticatedUid={authenticatedUid}
          currentLanguage="om"
          existingExternalImageUrl={externalUrl}
          stagedImage={stagedImage}
          onStagedImageChange={onStagedImageChange}
          onExternalImageChange={onExternalUrlChange}
          onManagedReady={onManagedReady}
        />
      )}

      {source === 'external' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              External Image URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => onExternalUrlChange(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>
          {externalUrl && (
            <div className="relative aspect-video max-w-md overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
              <img
                src={externalUrl}
                alt={imageAlt.en || imageAlt.om || 'Featured Image Preview'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}

      {source !== 'none' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2">
            <LocalizedTextFields
              label="Image Alternative Text (Alt)"
              value={imageAlt}
              onChange={onAltChange}
              requiredOm={true}
              placeholderOm="Gulaala faayidaa fi ibsa fakkii..."
              placeholderAm="የምስል ገለፃ..."
              placeholderEn="Describe the image for accessibility..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Image Focal Position
            </label>
            <select
              value={imagePosition}
              onChange={(e) => onPositionChange(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
