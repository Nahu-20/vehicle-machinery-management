import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { DetailedService } from '../../data/servicesData';
import {
  X,
  CheckCircle2,
  PhoneCall,
  FileText,
  ShieldCheck,
  Building2,
  Clock,
  Send,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Download,
} from 'lucide-react';

interface ServiceDetailModalProps {
  service: DetailedService | null;
  onClose: () => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose }) => {
  const { t } = useLanguage();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [selectedZone, setSelectedZone] = useState('Arsi');
  const [inquiryNotes, setInquiryNotes] = useState('');

  if (!service) return null;

  const title = t(service.titleKey) || service.defaultTitle;
  const description = t(service.descriptionKey) || service.defaultDesc;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-md bg-black/60">
        {/* Backdrop Click Dismiss */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="p-6 sm:p-7 bg-[#075B36] text-white flex items-start justify-between gap-4 shrink-0">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#A3E635] text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                <span>{service.categoryLabel}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {title}
              </h2>
              <p className="text-xs text-emerald-200/90 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{service.directorate}</span>
              </p>
            </div>

            <button
              id="close-service-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-[#2A3830] dark:text-white/90">
            {/* Overview Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635]">
                Service Overview & Mandate
              </h4>
              <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Key Delivery Channels & SLA Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F0F7EE] dark:bg-white/5 border border-[#E2EFE0] dark:border-white/10 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-[#075B36] dark:text-[#A3E635] flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Turnaround
                </span>
                <p className="text-[#3E4D43] dark:text-white/70 font-semibold">{service.turnaround}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-[#075B36] dark:text-[#A3E635] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Service Fee
                </span>
                <p className="text-[#3E4D43] dark:text-white/70 font-semibold">{service.fee}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-[#075B36] dark:text-[#A3E635] flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5" /> Access Channel
                </span>
                <p className="text-[#3E4D43] dark:text-white/70 font-semibold">{service.channel}</p>
              </div>
            </div>

            {/* Step-by-Step Procedure */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635]">
                Step-by-Step Request Procedure
              </h4>
              <div className="space-y-2">
                {service.serviceSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#075B36] text-white text-[11px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-[#3E4D43] dark:text-white/80 leading-snug pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents & Eligibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#0A1912] dark:text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  Required Documentation
                </h5>
                <ul className="space-y-1 text-xs text-[#56635B] dark:text-white/70">
                  {service.documentsRequired.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#0A1912] dark:text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  Eligibility Criteria
                </h5>
                <p className="text-xs text-[#56635B] dark:text-white/70 leading-relaxed">
                  {service.eligibility}
                </p>
              </div>
            </div>

            {/* Interactive Quick Request / Dispatch Form */}
            <div className="p-5 rounded-2xl bg-[#F0F7EE] dark:bg-[#18241D] border border-[#D5E8D0] dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635]">
                    Initiate Online Service Request
                  </h4>
                  <p className="text-[11px] text-[#56635B] dark:text-white/60">
                    Submit your details for rapid dispatch by your Kebele Development Agent.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#075B36] text-white">
                  Fast-Track
                </span>
              </div>

              {formSubmitted ? (
                <div className="p-4 rounded-xl bg-white dark:bg-[#111613] border border-[#A3E635] text-center space-y-2">
                  <div className="inline-flex p-2 rounded-full bg-[#EBF5E8] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635]">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h5 className="text-sm font-black text-[#0A1912] dark:text-white">
                    Request Logged Successfully!
                  </h5>
                  <p className="text-xs text-[#56635B] dark:text-white/70 max-w-sm mx-auto">
                    Your request ticket <strong className="text-[#075B36] dark:text-[#A3E635]">#OAB-{Math.floor(10000 + Math.random() * 90000)}</strong> has been routed to the {selectedZone} Zonal Agricultural Desk. An extension agent will follow up within 24 hours.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="mt-2 text-xs font-bold text-[#075B36] dark:text-[#A3E635] hover:underline"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#0A1912] dark:text-white mb-1">
                        Full Name / Farmer Group Name
                      </label>
                      <input
                        type="text"
                        required
                        value={farmerName}
                        onChange={(e) => setFarmerName(e.target.value)}
                        placeholder="e.g., Gemechu Tolera"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111613] border border-[#D5E8D0] dark:border-white/10 text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#0A1912] dark:text-white mb-1">
                        Phone Number (for SMS confirmation)
                      </label>
                      <input
                        type="tel"
                        required
                        value={farmerPhone}
                        onChange={(e) => setFarmerPhone(e.target.value)}
                        placeholder="e.g., 0911234567"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111613] border border-[#D5E8D0] dark:border-white/10 text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#0A1912] dark:text-white mb-1">
                        Zone
                      </label>
                      <select
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111613] border border-[#D5E8D0] dark:border-white/10 text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                      >
                        <option value="Arsi">Arsi Zone</option>
                        <option value="West Arsi">West Arsi Zone</option>
                        <option value="Bale">Bale Zone</option>
                        <option value="East Bale">East Bale Zone</option>
                        <option value="East Shewa">East Shewa Zone</option>
                        <option value="West Shewa">West Shewa Zone</option>
                        <option value="North Shewa">North Shewa Zone</option>
                        <option value="South West Shewa">South West Shewa Zone</option>
                        <option value="Jimma">Jimma Zone</option>
                        <option value="Illu Abba Boora">Illu Abba Boora Zone</option>
                        <option value="Buno Bedele">Buno Bedele Zone</option>
                        <option value="East Hararghe">East Hararghe Zone</option>
                        <option value="West Hararghe">West Hararghe Zone</option>
                        <option value="Guji">Guji Zone</option>
                        <option value="West Guji">West Guji Zone</option>
                        <option value="Borena">Borena Zone</option>
                        <option value="East Wollega">East Wollega Zone</option>
                        <option value="West Wollega">West Wollega Zone</option>
                        <option value="Horo Guduru Wollega">Horo Guduru Wollega Zone</option>
                        <option value="Kelem Wollega">Kelem Wollega Zone</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#0A1912] dark:text-white mb-1">
                        Specific Crop / Acreage (Optional)
                      </label>
                      <input
                        type="text"
                        value={inquiryNotes}
                        onChange={(e) => setInquiryNotes(e.target.value)}
                        placeholder="e.g., 2 hectares Wheat cluster"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#111613] border border-[#D5E8D0] dark:border-white/10 text-[#0A1912] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#075B36]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#075B36] hover:bg-[#054629] text-white font-black flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Send className="h-3.5 w-3.5 text-[#A3E635]" />
                    <span>Submit Service Request</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-6 bg-[#F9FCF8] dark:bg-[#0D120F] border-t border-[#E2EFE0] dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-[#075B36] dark:text-[#A3E635] font-bold">
              <PhoneCall className="h-4 w-4" />
              <span>Direct Hotline: <strong>8888 (Toll-Free)</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white text-xs font-bold hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
