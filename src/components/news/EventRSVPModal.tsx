import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { EventItem } from '../../data/newsEventsData';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';

interface EventRSVPModalProps {
  event: EventItem | null;
  onClose: () => void;
}

export const EventRSVPModal: React.FC<EventRSVPModalProps> = ({ event, onClose }) => {
  const { getLocalizedText } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    organization: '',
    attendeeType: 'farmer', // farmer, agribusiness, researcher, media, government
    zone: '',
  });

  const [submitted, setSubmitted] = useState(false);

  if (!event) return null;

  const title = getLocalizedText(event.title);
  const venue = getLocalizedText(event.venue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast(
      `RSVP confirmed for ${formData.fullName}! Confirmation reference sent.`,
      'success',
      'Registration Complete'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-[#075D3A] to-[#043E26] text-white flex items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#D5A62E] text-gray-900 uppercase tracking-wider">
              Event Registration
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1 leading-snug">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {event.startDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {venue}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">
                Registration Confirmed!
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{formData.fullName}</strong>. Your attendance badge has been reserved for {title}. Please present your ID or phone confirmation upon arrival at the venue registration desk.
              </p>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs text-left space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-gray-500">Attendee ID:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">OAB-EVT-2026-884</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Admission:</span>
                  <span className="font-semibold capitalize">{event.admissionType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Desk:</span>
                  <span>{event.contactPhone}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#075D3A] text-white text-xs font-bold hover:bg-[#05482d] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Tolera Gemechu"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0911 234567"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. name@domain.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Participant Role / Category
                  </label>
                  <select
                    value={formData.attendeeType}
                    onChange={(e) => setFormData({ ...formData, attendeeType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="farmer">Smallholder / Cluster Farmer</option>
                    <option value="cooperative">Cooperative Union Leader</option>
                    <option value="agribusiness">Agribusiness & Machinery Dealer</option>
                    <option value="researcher">Researcher / Extension Agent</option>
                    <option value="media">Media & Press Correspondent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Organization / Farm Woreda
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Sinana Farmers Primary Cooperative, Bale"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="px-6 py-2.5 rounded-xl bg-[#075D3A] hover:bg-[#05482d] text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Submit RSVP Registration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
