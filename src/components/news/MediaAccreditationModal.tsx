import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  ShieldCheck,
  Building2,
  FileCheck,
  CheckCircle2,
  Upload,
  User,
  Phone,
  Mail,
} from 'lucide-react';

interface MediaAccreditationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaAccreditationModal: React.FC<MediaAccreditationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    journalistName: '',
    mediaOutlet: '',
    outletType: 'broadcast', // broadcast, print, digital, wire
    pressCardNumber: '',
    email: '',
    phone: '',
    intendedCoverage: '',
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast(
      `Press accreditation request submitted for ${formData.journalistName} (${formData.mediaOutlet})!`,
      'success',
      'Accreditation Pending Review'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-sky-900 via-blue-900 to-[#075D3A] text-white flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#A3E635] text-gray-900 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Press Accreditation Pass
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              Media & Press Badge Application
            </h3>
            <p className="text-xs text-sky-100 mt-1">
              Apply for verified press clearance to cover Oromia Bureau ministerial briefings, field days, and agricultural expos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">
                Application Received!
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                Your credentials for <strong>{formData.mediaOutlet}</strong> have been submitted to the Bureau Press Directorate. Our communications officer will verify your press card and issue a digital clearance pass via email within 24-48 hours.
              </p>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-left space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking Code:</span>
                  <span className="font-mono font-bold text-sky-700 dark:text-sky-400">PRESS-2026-9812</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Correspondent:</span>
                  <span className="font-semibold">{formData.journalistName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Press Contact:</span>
                  <span>press.secretary@oab.gov.et</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#075D3A] text-white text-xs font-bold hover:bg-[#05482d] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Journalist / Correspondent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.journalistName}
                    onChange={(e) => setFormData({ ...formData, journalistName: e.target.value })}
                    placeholder="e.g. Ebise Tadesse"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Media Outlet / Broadcaster *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mediaOutlet}
                    onChange={(e) => setFormData({ ...formData, mediaOutlet: e.target.value })}
                    placeholder="e.g. OBN, EBC, Fana, Reuters"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Media Type
                  </label>
                  <select
                    value={formData.outletType}
                    onChange={(e) => setFormData({ ...formData, outletType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="broadcast">Television / Radio Broadcast</option>
                    <option value="print">Newspaper / Periodical Print</option>
                    <option value="digital">Online Digital News / Portal</option>
                    <option value="wire">News Wire Agency (Global / Regional)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Press Card / Accreditation ID # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pressCardNumber}
                    onChange={(e) => setFormData({ ...formData, pressCardNumber: e.target.value })}
                    placeholder="e.g. ETH-MEDIA-2026-5541"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Official Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="journalist@media.et"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Direct Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251 911 000 000"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Intended Coverage Focus / Story Topic
                </label>
                <textarea
                  rows={3}
                  value={formData.intendedCoverage}
                  onChange={(e) => setFormData({ ...formData, intendedCoverage: e.target.value })}
                  placeholder="Specify events, agricultural clusters, or interviews you intend to cover..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Submit Accreditation Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
