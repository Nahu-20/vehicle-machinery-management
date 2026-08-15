import React from 'react';
import { resourceBundles } from '../../data/resourcesData';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  Package,
  Download,
  FolderArchive,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const FarmerToolkitDownloads: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const handleDownloadBundle = (bundleTitle: string, size: string) => {
    showToast(
      `Downloading comprehensive bundle pack (${size})...`,
      'success',
      bundleTitle
    );
  };

  return (
    <section className="bg-gradient-to-b from-[#F6F7F3] to-[#EAF5EE] dark:from-[#0A110D] dark:to-[#0D1812] py-16 border-y border-[#E2E8E3] dark:border-white/10 transition-colors duration-200">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EE] dark:bg-emerald-950/60 border border-[#D5E8D0] dark:border-emerald-800/40 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
              <FolderArchive className="h-3.5 w-3.5" />
              <span>One-Click Bundled Resource Toolkits</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A1912] dark:text-white tracking-tight">
              Curated Farmer & Extension Toolkits (ZIP Archives)
            </h2>

            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70">
              Download complete bundles containing all manuals, crop matrices, pest guides, and application forms in a single lightweight archive for offline field use.
            </p>
          </div>
        </div>

        {/* 4 Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resourceBundles.map((bundle) => {
            const title =
              language === 'om'
                ? bundle.titleOm
                : language === 'am'
                ? bundle.titleAm
                : bundle.title;
            const description =
              language === 'om' ? bundle.descriptionOm : bundle.description;

            return (
              <div
                key={bundle.id}
                className="rounded-3xl border border-[#D5E8D0] dark:border-white/10 bg-white dark:bg-[#111813] p-6 shadow-sm hover:shadow-xl hover:border-[#075B36] dark:hover:border-[#A3E635] transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  {/* Top Cover & Badge */}
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <img
                      src={bundle.featuredImage}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#075B36] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      {bundle.badge}
                    </div>
                  </div>

                  {/* Title and Specs */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#075B36] dark:text-[#A3E635]">
                      <Package className="h-3.5 w-3.5" />
                      <span>{bundle.fileCount} Documents • {bundle.totalSize}</span>
                    </div>
                    <h3 className="text-base font-black text-[#0A1912] dark:text-white leading-snug group-hover:text-[#075B36] dark:group-hover:text-[#A3E635] transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-[#56635B] dark:text-white/70 leading-relaxed">
                      {description}
                    </p>
                  </div>

                  {/* Included Docs List */}
                  <div className="p-3.5 rounded-2xl bg-[#F6F7F3] dark:bg-white/5 border border-[#E2EFE0] dark:border-white/5 space-y-1.5 text-xs text-[#56635B] dark:text-white/80">
                    <div className="text-[10px] font-extrabold text-[#0A1912] dark:text-white uppercase tracking-wider mb-1">
                      Included in this pack:
                    </div>
                    {bundle.includedDocs.slice(0, 3).map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 truncate text-[11px]">
                        <CheckCircle2 className="h-3 w-3 text-[#075B36] dark:text-[#A3E635] shrink-0" />
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownloadBundle(title, bundle.totalSize)}
                  className="w-full py-3 px-4 rounded-xl bg-[#075B36] hover:bg-[#054829] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all group/btn"
                >
                  <Download className="h-3.5 w-3.5 text-[#A3E635] group-hover/btn:-translate-y-0.5 transition-transform" />
                  <span>Download ZIP ({bundle.totalSize})</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
