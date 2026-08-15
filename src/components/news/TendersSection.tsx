import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { TenderItem } from '../../data/newsEventsData';
import {
  FileText,
  Download,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface TendersSectionProps {
  tenders: TenderItem[];
  onOpenTenderModal: (tender: TenderItem) => void;
}

export const TendersSection: React.FC<TendersSectionProps> = ({
  tenders,
  onOpenTenderModal,
}) => {
  const { t, getLocalizedText } = useLanguage();
  const { showToast } = useToast();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPacket = (tender: TenderItem) => {
    setDownloadingId(tender.id);
    showToast(
      `Downloading official procurement packet: ${tender.referenceNumber}...`,
      'info',
      tender.referenceNumber
    );

    setTimeout(() => {
      setDownloadingId(null);
      showToast(
        `Tender packet for ${tender.referenceNumber} downloaded successfully.`,
        'success',
        'Download Complete'
      );
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-[#075D3A] text-white p-6 sm:p-8 shadow-xl border border-purple-800/40 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-400/20 border border-purple-300/30 text-purple-200 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#A3E635]" />
          Official Procurement & Open Tenders
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">
          Public Bidding & Procurement Bulletins
        </h2>
        <p className="text-xs sm:text-sm text-purple-100/90 max-w-3xl leading-relaxed">
          The Oromia Agricultural Bureau issues national and international competitive bids for machinery, certified seeds, post-harvest grain silos, and solar irrigation systems under transparent public procurement laws.
        </p>
      </div>

      {/* Tenders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tenders.map((tnd) => {
          const title = getLocalizedText(tnd.title);
          const entity = getLocalizedText(tnd.procuringEntity);
          const eligibility = getLocalizedText(tnd.eligibility);
          const location = getLocalizedText(tnd.submissionLocation);

          return (
            <div
              key={tnd.id}
              className="rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Top Reference & Countdown Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-purple-700 dark:text-purple-300 border border-gray-200 dark:border-gray-600">
                    {tnd.referenceNumber}
                  </span>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{tnd.daysRemaining} Days Left</span>
                  </span>
                </div>

                {/* Tender Title */}
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug hover:text-[#075D3A] transition-colors">
                  {title}
                </h3>

                {/* Meta details list */}
                <div className="space-y-2 pt-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Procuring Entity: </span>
                      <span>{entity}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Bid Security: </span>
                      <span>{tnd.bidSecurityETB}</span>
                      <span className="text-gray-400"> (Doc Fee: {tnd.documentFeeETB})</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Closing Deadline: </span>
                      <span className="font-bold text-red-600 dark:text-red-400">{tnd.closingDate} at {tnd.closingTime}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Eligibility: </span>
                      <span>{eligibility}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadPacket(tnd)}
                  disabled={downloadingId === tnd.id}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingId === tnd.id ? 'Downloading...' : `Download Packet (${tnd.dossierSize})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenTenderModal(tnd)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
