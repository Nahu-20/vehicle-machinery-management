import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    contact: '',
    zone: '',
    category: 'Extension Support',
    message: '',
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-emerald-900/20 dark:border-emerald-900/60 bg-white dark:bg-[#0B1912] p-6 shadow-2xl space-y-4 text-[#14251D] dark:text-emerald-100 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-emerald-900/60 pb-3">
          <div className="flex items-center gap-2 text-[#087A4B] dark:text-emerald-300">
            <MessageSquare className="h-5 w-5" />
            <h2 id="feedback-modal-title" className="text-lg font-bold text-[#14251D] dark:text-emerald-100">{t('modal_feedback_title')}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-xl p-2 text-gray-500 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-[#12281D] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="my-8 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-[#087A4B] dark:text-[#3FAE5A] animate-bounce" />
            <h3 className="text-base font-bold text-[#14251D] dark:text-emerald-100">{t('modal_feedback_success')}</h3>
            <p className="text-xs text-[#637069] dark:text-emerald-300/80">Official demonstration feedback submission log.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#14251D] dark:text-emerald-200">{t('modal_feedback_name')} *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Obbo / Adde / Dr..."
                className="mt-1 w-full rounded-xl border border-gray-300 dark:border-emerald-800/80 bg-white dark:bg-[#12281D] px-3.5 py-2.5 text-xs text-[#14251D] dark:text-emerald-100 focus:border-[#087A4B] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#14251D] dark:text-emerald-200">{t('modal_feedback_contact')} *</label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+251 911... or user@domain.et"
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-emerald-800/80 bg-white dark:bg-[#12281D] px-3.5 py-2.5 text-xs text-[#14251D] dark:text-emerald-100 focus:border-[#087A4B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14251D] dark:text-emerald-200">{t('modal_feedback_zone')} *</label>
                <input
                  type="text"
                  required
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="e.g. Arsii / Adaamaa"
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-emerald-800/80 bg-white dark:bg-[#12281D] px-3.5 py-2.5 text-xs text-[#14251D] dark:text-emerald-100 focus:border-[#087A4B] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14251D] dark:text-emerald-200">{t('modal_feedback_category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-300 dark:border-emerald-800/80 bg-white dark:bg-[#12281D] px-3.5 py-2.5 text-xs text-[#14251D] dark:text-emerald-100 focus:border-[#087A4B] focus:outline-none"
              >
                <option value="Extension Support">Deeggarsa Eksteenshinii (Extension)</option>
                <option value="Market Info">Gabaa Qonnaa (Market Info)</option>
                <option value="Agricultural Inputs">Galtee Qonnaa (Inputs)</option>
                <option value="Irrigation">Jallisii (Irrigation)</option>
                <option value="General Inquiry">Gaaffii Waloomaa (General Inquiry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14251D] dark:text-emerald-200">{t('modal_feedback_message')} *</label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your suggestions or inquiries here..."
                className="mt-1 w-full rounded-xl border border-gray-300 dark:border-emerald-800/80 bg-white dark:bg-[#12281D] px-3.5 py-2.5 text-xs text-[#14251D] dark:text-emerald-100 focus:border-[#087A4B] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 dark:border-emerald-800/80 px-4 py-2.5 text-xs font-semibold text-[#637069] dark:text-emerald-300 hover:bg-gray-50 dark:hover:bg-[#12281D] min-h-[44px]"
              >
                {t('close')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-[#087A4B] dark:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#063D2A] min-h-[44px]"
              >
                <Send className="h-3.5 w-3.5 text-[#D7A928]" />
                {t('modal_feedback_submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
