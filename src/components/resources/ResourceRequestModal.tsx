import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Send,
  Building,
  CheckCircle2,
  FileCheck,
  Phone,
  Mail,
  User,
  MapPin,
  HelpCircle,
} from 'lucide-react';

interface ResourceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceRequestModal: React.FC<ResourceRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    userType: 'farmer',
    zone: 'East Shewa',
    woreda: '',
    requestedResource: '',
    requestType: 'print', // 'print' | 'translation' | 'digital' | 'custom'
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.requestedResource) {
      showToast('Please fill in required fields (*)', 'error');
      return;
    }

    setSubmitted(true);
    showToast(
      'Your resource request has been recorded. The Woreda Extension desk will coordinate fulfillment.',
      'success',
      'Request Dispatched'
    );

    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  const zones = [
    'Arsi',
    'West Arsi',
    'Bale',
    'East Bale',
    'East Shewa',
    'West Shewa',
    'North Shewa',
    'South West Shewa',
    'Jimma',
    'Illubabor',
    'Bunno Bedele',
    'East Hararghe',
    'West Hararghe',
    'Borena',
    'Guji',
    'West Guji',
    'Horo Guduru Wallagga',
    'East Wallagga',
    'West Wallagga',
    'Kelem Wallagga',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#111813] border border-[#D5E8D0] dark:border-white/10 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col text-[#111310] dark:text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#053B23] to-[#075B36] text-white p-6 sm:p-7 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#A3E635] uppercase tracking-wider">
              Extension Support Service
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Request Manuals, Printed Guides or Translations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF5EE] text-[#075B36] dark:bg-emerald-950/60 dark:text-[#A3E635]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-[#0A1912] dark:text-white">
              Request Received Successfully!
            </h3>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 max-w-md mx-auto">
              Your request for <strong>{formData.requestedResource}</strong> has been logged. Our Woreda Agricultural Extension officer will reach out to schedule delivery or provide access.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1 text-xs">
            <p className="text-xs text-[#56635B] dark:text-white/70">
              Need physical printed copies for your cooperative, FTC training center, or requesting a specific local language translation? Fill out this quick dispatch form:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#0A1912] dark:text-white">
                  Full Name / Organization *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Obbo Tolaa Dibaba"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#0A1912] dark:text-white">
                  Phone Number (SMS Notifications) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +251 91 234 5678"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User Type */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#0A1912] dark:text-white">
                  Applicant Profile
                </label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#152019] text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                >
                  <option value="farmer">Smallholder Farmer / Cluster Group</option>
                  <option value="da">Development Agent (DA) / FTC Staff</option>
                  <option value="cooperative">Cooperative Union Leader</option>
                  <option value="student">Student / Agricultural Researcher</option>
                  <option value="ngo">NGO / Development Partner</option>
                </select>
              </div>

              {/* Request Type */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#0A1912] dark:text-white">
                  Requested Service
                </label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#152019] text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                >
                  <option value="print">Printed Hard Copies for Kebele / FTC</option>
                  <option value="translation">Request Specific Language Translation</option>
                  <option value="custom">Request Customized Training Curriculum</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Zone */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#0A1912] dark:text-white">
                  Administrative Zone *
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#152019] text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                >
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z} Zone
                    </option>
                  ))}
                </select>
              </div>

              {/* Woreda / Kebele */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#0A1912] dark:text-white">
                  Woreda & Kebele Name
                </label>
                <input
                  type="text"
                  value={formData.woreda}
                  onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                  placeholder="e.g. Adama Rural / Kebele 04"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                />
              </div>
            </div>

            {/* Requested Publication Title */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-[#0A1912] dark:text-white">
                Requested Document / Topic Title *
              </label>
              <input
                type="text"
                required
                value={formData.requestedResource}
                onChange={(e) => setFormData({ ...formData, requestedResource: e.target.value })}
                placeholder="e.g. 50x Printed copies of 2026/27 Crop Calendar for FTC"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-[#0A1912] dark:text-white">
                Additional Notes / Quantity / Details
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Specify number of trainees, target crop, or delivery preferences..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-[#111310] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-white/70 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#075B36] hover:bg-[#054829] text-white text-xs font-black shadow-md transition-all"
              >
                <Send className="h-3.5 w-3.5 text-[#A3E635]" />
                <span>Submit Official Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
