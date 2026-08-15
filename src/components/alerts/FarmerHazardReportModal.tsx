import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  AlertTriangle,
  Send,
  MapPin,
  Camera,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  ShieldAlert,
  Bug,
  Flame,
  CloudRain,
  Radio,
} from 'lucide-react';

interface FarmerHazardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerHazardReportModal: React.FC<FarmerHazardReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reporterName: '',
    phoneNumber: '',
    zone: 'Arsi',
    woreda: '',
    kebele: '',
    hazardType: 'Pest Outbreak (Locust / Armyworm)',
    cropAffected: 'Wheat',
    severity: 'Severe (Immediate Action Required)',
    description: '',
    hasPhoto: false,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `OAB-EW-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedTicket(ticketId);
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setFormData({
      reporterName: '',
      phoneNumber: '',
      zone: 'Arsi',
      woreda: '',
      kebele: '',
      hazardType: 'Pest Outbreak (Locust / Armyworm)',
      cropAffected: 'Wheat',
      severity: 'Severe (Immediate Action Required)',
      description: '',
      hasPhoto: false,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#111613] rounded-3xl shadow-2xl border border-[#E2EFE0] dark:border-white/15 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="relative bg-gradient-to-r from-[#062417] via-[#073D26] to-[#0A110D] text-white p-6 sm:p-7 border-b border-white/10 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider border border-red-500/30">
                <Radio className="h-3.5 w-3.5 animate-pulse text-red-400" />
                <span>Field Incident Dispatch Desk</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Report Pest Sighting or Agricultural Hazard
              </h2>
              <p className="text-xs text-emerald-100/80 font-normal">
                Directly notify the Oromia Plant Health & Early Warning Rapid Response Squad.
              </p>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-[#111310] dark:text-white">
            {submittedTicket ? (
              <div className="text-center py-6 space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-[#0A1912] dark:text-white">
                    Emergency Incident Registered!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 max-w-md mx-auto">
                    Your sighting has been assigned to the <strong>{formData.zone} Zonal Plant Health Defense Team</strong> and your local Kebele Extension Supervisor.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F0F7EE] dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 max-w-sm mx-auto space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#56635B] dark:text-white/60">
                    Incident Tracking Reference
                  </span>
                  <div className="text-lg font-black text-[#075B36] dark:text-[#A3E635] tracking-wider">
                    {submittedTicket}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#075B36] text-white text-xs font-black shadow-md hover:bg-[#054629] transition-all"
                  >
                    <span>Done / Close</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Reporter Name */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0A1912] dark:text-white">
                      Your Full Name / Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.reporterName}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      placeholder="e.g. Tolosa Gemeda (Farmer / DA)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0A1912] dark:text-white">
                      Phone Number (For verification) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="0911-XXXXXX or 07XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                    />
                  </div>
                </div>

                {/* Geography Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0A1912] dark:text-white">
                      Zone <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                    >
                      <option value="Arsi">Arsi</option>
                      <option value="West Arsi">West Arsi</option>
                      <option value="Bale">Bale</option>
                      <option value="East Shewa">East Shewa</option>
                      <option value="West Shewa">West Shewa</option>
                      <option value="North Shewa">North Shewa</option>
                      <option value="Jimma">Jimma</option>
                      <option value="Illubabor">Illubabor</option>
                      <option value="East Hararghe">East Hararghe</option>
                      <option value="West Hararghe">West Hararghe</option>
                      <option value="Borena">Borena</option>
                      <option value="Guji">Guji</option>
                      <option value="East Wollega">East Wollega</option>
                      <option value="West Wollega">West Wollega</option>
                      <option value="Horo Guduru">Horo Guduru</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0A1912] dark:text-white">
                      Woreda <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.woreda}
                      onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                      placeholder="e.g. Hetosa, Dedo, Lume"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0A1912] dark:text-white">
                      Kebele / Village
                    </label>
                    <input
                      type="text"
                      value={formData.kebele}
                      onChange={(e) => setFormData({ ...formData, kebele: e.target.value })}
                      placeholder="e.g. Boru Ganda"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                    />
                  </div>
                </div>

                {/* Hazard Classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0A1912] dark:text-white">
                      Hazard Classification <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.hazardType}
                      onChange={(e) => setFormData({ ...formData, hazardType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                    >
                      <option value="Pest Outbreak (Locust / Armyworm)">Pest Outbreak (Desert Locust / Armyworm)</option>
                      <option value="Fungal Crop Disease (Stripe Rust / Smut)">Fungal Crop Disease (Stripe Rust / Smut)</option>
                      <option value="Livestock Disease Epidemic">Livestock Disease / Sudden Mortality</option>
                      <option value="Flash Flood / Silt Damage">Flash Flood / Farmland Silt Inundation</option>
                      <option value="Severe Hail / Frost Damage">Severe Hail / Frost Shock</option>
                      <option value="Drought / Irrigation Canal Blockage">Drought / Irrigation Canal Blockage</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0A1912] dark:text-white">
                      Crops / Animals Impacted
                    </label>
                    <input
                      type="text"
                      value={formData.cropAffected}
                      onChange={(e) => setFormData({ ...formData, cropAffected: e.target.value })}
                      placeholder="e.g. Wheat, Maize, Dairy Cattle"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                    />
                  </div>
                </div>

                {/* Sighting Description */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0A1912] dark:text-white">
                    Observations & Approximate Area Affected <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe symptoms, hopper swarm density, estimated hectares affected, or urgent support needed..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 bg-[#FAFAF7] dark:bg-white/5 text-[#0A1912] dark:text-white font-medium focus:outline-none focus:border-[#075B36]"
                  />
                </div>

                {/* Photo Upload Stub & Emergency Hotline info */}
                <div className="p-3.5 rounded-2xl bg-[#F0F7EE] dark:bg-white/5 border border-[#D5E8D0] dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#075B36] dark:text-[#A3E635]">
                    <Camera className="h-4 w-4" />
                    <span>Attach Field Photo</span>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPhoto}
                      onChange={(e) => setFormData({ ...formData, hasPhoto: e.target.checked })}
                      className="rounded text-[#075B36] focus:ring-[#075B36]"
                    />
                    <span className="text-[11px] font-medium text-[#56635B] dark:text-white/70">
                      {formData.hasPhoto ? 'Photo Ready (1)' : 'Simulate Photo Attachment'}
                    </span>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-[#56635B] dark:text-white/60">
                    For life-threatening floods, call <strong>8888</strong> directly.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/15 text-xs font-bold text-[#56635B] dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md transition-all"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Transmit Dispatch Report</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
