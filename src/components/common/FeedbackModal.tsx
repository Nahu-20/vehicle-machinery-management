import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border border-emerald-900/20 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-[#075D3A]">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-bold text-[#17211B]">{t('modal_feedback_title')}</h2>
          </div>
          <button onClick={onClose} aria-label={t('close')} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-12 w-12 text-[#14804A] animate-bounce" />
            <h3 className="mt-3 text-base font-bold text-[#17211B]">{t('modal_feedback_success')}</h3>
            <p className="mt-1 text-xs text-[#5E6B63]">Official demonstration feedback submission log.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#17211B]">{t('modal_feedback_name')} *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Obbo / Adde / Dr..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-[#17211B] focus:border-[#075D3A] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#17211B]">{t('modal_feedback_contact')} *</label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+251 911... or user@domain.et"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-[#17211B] focus:border-[#075D3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211B]">{t('modal_feedback_zone')} *</label>
                <input
                  type="text"
                  required
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="e.g. Arsii / Adaamaa"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-[#17211B] focus:border-[#075D3A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B]">{t('modal_feedback_category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-[#17211B] focus:border-[#075D3A] focus:outline-none"
              >
                <option value="Extension Support">Deeggarsa Eksteenshinii (Extension)</option>
                <option value="Market Info">Gabaa Qonnaa (Market Info)</option>
                <option value="Agricultural Inputs">Galtee Qonnaa (Inputs)</option>
                <option value="Irrigation">Jallisii (Irrigation)</option>
                <option value="General Inquiry">Gaaffii Waloomaa (General Inquiry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B]">{t('modal_feedback_message')} *</label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your suggestions or inquiries here..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-[#17211B] focus:border-[#075D3A] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-[#5E6B63] hover:bg-gray-50"
              >
                {t('close')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-[#075D3A] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#14804A]"
              >
                <Send className="h-3.5 w-3.5" />
                {t('modal_feedback_submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
