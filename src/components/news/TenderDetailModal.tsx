import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { TenderItem } from '../../data/newsEventsData';
import {
  X,
  FileText,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  Download,
  AlertCircle,
  ShieldCheck,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface TenderDetailModalProps {
  tender: TenderItem | null;
  onClose: () => void;
}

export const TenderDetailModal: React.FC<TenderDetailModalProps> = ({
  tender,
  onClose,
}) => {
  const { getLocalizedText } = useLanguage();
  const { showToast } = useToast();

  if (!tender) return null;

  const title = getLocalizedText(tender.title);
  const entity = getLocalizedText(tender.procuringEntity);
  const eligibility = getLocalizedText(tender.eligibility);
  const location = getLocalizedText(tender.submissionLocation);

  const handleDownload = () => {
    showToast(`Downloading ${tender.referenceNumber} packet...`, 'info');
    setTimeout(() => {
      showToast('Tender documentation packet downloaded.', 'success');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-purple-950 via-purple-900 to-[#075D3A] text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-white/20 text-purple-200">
                {tender.referenceNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                {tender.daysRemaining} Days Left
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-2 leading-snug">
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Procuring Entity</span>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{entity}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Bid Security Requirement</span>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{tender.bidSecurityETB}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Published Date</span>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{tender.publishedDate}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Closing Deadline</span>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">{tender.closingDate} at {tender.closingTime}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Bidder Eligibility & Compliance Requirements:
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
              {eligibility}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Physical Bid Box & Submission Desk:
            </h4>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{location}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
            <span className="font-bold text-purple-900 dark:text-purple-200">Document Purchase & Evaluation Notice:</span>
            <p className="text-purple-800 dark:text-purple-300">
              Complete bidding documents in English and Afaan Oromoo may be downloaded online or purchased for a non-refundable fee of <strong>{tender.documentFeeETB}</strong> at the Bureau Cashier Desk.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Dossier Size: {tender.dossierSize}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#075D3A] hover:bg-[#05482d] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Bidding Pack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
