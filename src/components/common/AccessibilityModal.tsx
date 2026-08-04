import React, { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Eye, Type, RotateCcw } from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const { t, textSize, setTextSize, isHighContrast, setIsHighContrast, resetAccessibility } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-emerald-900/20 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-[#075D3A]">
            <Eye className="h-5 w-5" aria-hidden="true" />
            <h2 id="access-modal-title" className="text-lg font-bold text-[#17211B]">
              {t('access_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Text Size options */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#17211B]">
              <Type className="h-4 w-4 text-[#14804A]" />
              {t('access_text_size')}
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                onClick={() => setTextSize('normal')}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all min-h-[44px] ${
                  textSize === 'normal'
                    ? 'border-[#075D3A] bg-[#075D3A] text-white shadow-xs'
                    : 'border-gray-200 bg-white text-[#17211B] hover:bg-gray-50'
                }`}
              >
                {t('access_normal')}
              </button>
              <button
                onClick={() => setTextSize('large')}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all min-h-[44px] ${
                  textSize === 'large'
                    ? 'border-[#075D3A] bg-[#075D3A] text-white shadow-xs'
                    : 'border-gray-200 bg-white text-[#17211B] hover:bg-gray-50'
                }`}
              >
                {t('access_large')}
              </button>
              <button
                onClick={() => setTextSize('xlarge')}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all min-h-[44px] ${
                  textSize === 'xlarge'
                    ? 'border-[#075D3A] bg-[#075D3A] text-white shadow-xs'
                    : 'border-gray-200 bg-white text-[#17211B] hover:bg-gray-50'
                }`}
              >
                {t('access_xlarge')}
              </button>
            </div>
          </div>

          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-[#F8F7F2] p-3">
            <div>
              <p className="text-xs font-bold text-[#17211B]">{t('access_contrast')}</p>
              <p className="text-[11px] text-[#5E6B63]">Monochrome & high contrast colors</p>
            </div>
            <button
              onClick={() => setIsHighContrast(!isHighContrast)}
              aria-pressed={isHighContrast}
              aria-label={t('access_contrast')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors min-h-[44px] min-w-[44px] justify-center ${
                isHighContrast ? 'bg-[#075D3A]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isHighContrast ? 'translate-x-3' : '-translate-x-3'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            onClick={resetAccessibility}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5E6B63] hover:text-[#075D3A] min-h-[44px] px-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('access_reset')}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#075D3A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#14804A] min-h-[44px]"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
