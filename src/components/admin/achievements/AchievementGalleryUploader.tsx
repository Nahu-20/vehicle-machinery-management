import React, { useState } from 'react';
import { AchievementGalleryItem, LocalizedText, createEmptyLocalizedText } from '../../../types/achievement';
import { LocalizedTextFields } from '../news/LocalizedTextFields';
import { NewsFeaturedImageUploader } from '../media/NewsFeaturedImageUploader';
import { Plus, Trash2, MoveUp, MoveDown, Image as ImageIcon, Link, Upload } from 'lucide-react';

interface AchievementGalleryUploaderProps {
  authenticatedUid: string;
  items: AchievementGalleryItem[];
  onChange: (items: AchievementGalleryItem[]) => void;
}

export const AchievementGalleryUploader: React.FC<AchievementGalleryUploaderProps> = ({
  authenticatedUid,
  items,
  onChange,
}) => {
  const [activeSourceModal, setActiveSourceModal] = useState<boolean>(false);
  const [newSourceType, setNewSourceType] = useState<'external' | 'managed'>('external');
  const [newExternalUrl, setNewExternalUrl] = useState<string>('');
  const [newStagedImage, setNewStagedImage] = useState<any>(null);
  const [newAlt, setNewAlt] = useState<LocalizedText>(createEmptyLocalizedText());
  const [newCaption, setNewCaption] = useState<LocalizedText>(createEmptyLocalizedText());

  const handleAddItem = () => {
    let imageUrl = '';
    let assetId: string | null = null;

    if (newSourceType === 'external') {
      imageUrl = newExternalUrl.trim();
      if (!imageUrl) return;
    } else if (newSourceType === 'managed') {
      if (!newStagedImage?.mediaId) return;
      assetId = newStagedImage.mediaId;
      imageUrl = `/api/media/achievement/${newStagedImage.mediaId}/card`;
    }

    const newItem: AchievementGalleryItem = {
      id: `gal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      imageSource: newSourceType,
      image: imageUrl,
      imageAssetId: assetId,
      alt: newAlt,
      caption: newCaption,
      position: 'center',
    };

    onChange([...items, newItem]);
    // Reset modal fields
    setNewExternalUrl('');
    setNewStagedImage(null);
    setNewAlt(createEmptyLocalizedText());
    setNewCaption(createEmptyLocalizedText());
    setActiveSourceModal(false);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    onChange(updated);
  };

  const handleUpdateItemAlt = (index: number, alt: LocalizedText) => {
    const updated = items.map((item, i) => (i === index ? { ...item, alt } : item));
    onChange(updated);
  };

  const handleUpdateItemCaption = (index: number, caption: LocalizedText) => {
    const updated = items.map((item, i) => (i === index ? { ...item, caption } : item));
    onChange(updated);
  };

  const handleUpdateItemPosition = (index: number, position: 'center' | 'top' | 'bottom' | 'left' | 'right') => {
    const updated = items.map((item, i) => (i === index ? { ...item, position } : item));
    onChange(updated);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Achievement Image Gallery ({items.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add high-resolution media items to showcase field progress and milestone images.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveSourceModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Gallery Image</span>
        </button>
      </div>

      {/* Gallery Items List */}
      {items.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            No gallery images added yet. Click &quot;Add Gallery Image&quot; above to add images.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.alt?.en || item.alt?.om || 'Gallery item'}
                      className="w-16 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.imageSource}
                    </span>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                      {item.alt?.om || item.alt?.en || item.image || 'Untitled Item'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveItem(index, 'up')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => handleMoveItem(index, 'down')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Localized Alt and Caption */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <LocalizedTextFields
                  label="Alternative Text (Alt)"
                  value={item.alt || createEmptyLocalizedText()}
                  onChange={(alt) => handleUpdateItemAlt(index, alt)}
                  requiredOm={true}
                  placeholderOm="Ibsa fakkii galmee..."
                  placeholderAm="የምስል ገለፃ..."
                  placeholderEn="Image alt text..."
                />

                <LocalizedTextFields
                  label="Caption (Optional)"
                  value={item.caption || createEmptyLocalizedText()}
                  onChange={(caption) => handleUpdateItemCaption(index, caption)}
                  placeholderOm="Ibsa dabalataa galmee..."
                  placeholderAm="ተጨማሪ ማብራሪያ..."
                  placeholderEn="Gallery image caption..."
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Gallery Item Modal / Panel */}
      {activeSourceModal && (
        <div className="p-5 bg-emerald-50/50 dark:bg-slate-950 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Add New Gallery Item
            </h4>
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setNewSourceType('external')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 ${
                  newSourceType === 'external'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Link className="w-3 h-3" /> External
              </button>
              <button
                type="button"
                onClick={() => setNewSourceType('managed')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 ${
                  newSourceType === 'managed'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-3 h-3" /> Managed
              </button>
            </div>
          </div>

          {newSourceType === 'external' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Image HTTP/HTTPS URL
              </label>
              <input
                type="url"
                value={newExternalUrl}
                onChange={(e) => setNewExternalUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl dark:text-white"
              />
            </div>
          ) : (
            <NewsFeaturedImageUploader
              authenticatedUid={authenticatedUid}
              currentLanguage="om"
              stagedImage={newStagedImage}
              onStagedImageChange={setNewStagedImage}
              onExternalImageChange={setNewExternalUrl}
            />
          )}

          <LocalizedTextFields
            label="Alt Text (Afaan Oromo required)"
            value={newAlt}
            onChange={setNewAlt}
            requiredOm={true}
            placeholderOm="Afaan Oromootiin barreessi..."
          />

          <LocalizedTextFields
            label="Caption (Optional)"
            value={newCaption}
            onChange={setNewCaption}
            placeholderOm="Ibsa dabalataa..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveSourceModal(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
            >
              Add to Gallery
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
