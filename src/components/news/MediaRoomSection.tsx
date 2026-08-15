import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { MediaAsset, comprehensiveMediaAssets } from '../../data/newsEventsData';
import {
  Download,
  FileCheck,
  Image as ImageIcon,
  Building2,
  Phone,
  Mail,
  Award,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface MediaRoomSectionProps {
  onOpenAccreditation: () => void;
}

export const MediaRoomSection: React.FC<MediaRoomSectionProps> = ({
  onOpenAccreditation,
}) => {
  const { t, getLocalizedText } = useLanguage();
  const { showToast } = useToast();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadAsset = (asset: MediaAsset) => {
    const title = getLocalizedText(asset.title);
    setDownloadingId(asset.id);
    showToast(`Downloading press asset: ${title}...`, 'info', asset.fileSize);

    setTimeout(() => {
      setDownloadingId(null);
      showToast(`${title} downloaded successfully!`, 'success', 'Download Complete');
    }, 1200);
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-900 via-blue-900 to-[#075D3A] text-white p-6 sm:p-8 shadow-xl border border-sky-800/40 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-400/20 border border-sky-300/30 text-sky-200 uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5 text-[#A3E635]" />
          Bureau Press Directorate & Media Relations
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black">
              Official Media Room & Press Asset Kits
            </h2>
            <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
              Official resources for journalists, broadcaster correspondents, and publication editors covering Oromia agricultural transformations, policies, and farmer field milestones.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAccreditation}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#A3E635] text-gray-900 hover:bg-[#b5f347] font-black text-xs transition-all shadow-lg active:scale-95 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Apply for Press Pass & Accreditation</span>
          </button>
        </div>
      </div>

      {/* Media Assets Download Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>Downloadable Press Kits & Branding Assets</span>
          </h3>
          <span className="text-xs text-gray-500">Updated for Fiscal Year 2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comprehensiveMediaAssets.map((asset) => {
            const title = getLocalizedText(asset.title);
            const desc = getLocalizedText(asset.description);

            return (
              <div
                key={asset.id}
                className="rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-900 shrink-0 relative">
                    <img
                      src={asset.thumbnailUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {asset.fileFormat}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {asset.fileSize}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-gray-900 dark:text-white leading-snug">
                      {title}
                    </h4>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                      {desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Updated: {asset.updatedDate}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownloadAsset(asset)}
                    disabled={downloadingId === asset.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === asset.id ? 'Downloading...' : 'Download Asset'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Spokespersons & Media Contacts */}
      <div className="rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>Bureau Press Spokespersons & Communications Desk</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Direct contacts for official statements, interview bookings, and high-level briefing requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 space-y-2">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Chief Press Secretary
            </span>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">
              Obbo Tolera Duresso
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Media Briefings & Executive Statements
            </p>
            <div className="pt-2 text-xs space-y-1 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>press.secretary@oab.gov.et</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>+251 11 551 7020</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 space-y-2">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Agronomy & Policy Communications
            </span>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">
              Dr. Hawi Bekele
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Crop Forecasts & Climate Extension
            </p>
            <div className="pt-2 text-xs space-y-1 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>agronomy.media@oab.gov.et</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>+251 11 551 7044</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 space-y-2">
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Public Hotline & Media Desk
            </span>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">
              Toll-Free 8844 Media Center
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              24/7 Farmer Dispatch & Emergency Wire
            </p>
            <div className="pt-2 text-xs space-y-1 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>info@oab.gov.et</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Short Code: 8844 (Toll-Free)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
