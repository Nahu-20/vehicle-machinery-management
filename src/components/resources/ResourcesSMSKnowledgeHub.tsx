import React, { useState } from 'react';
import { smsKnowledgeCodes } from '../../data/resourcesData';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  Smartphone,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Send,
  Zap,
} from 'lucide-react';

export const ResourcesSMSKnowledgeHub: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const handleCopyCode = (keyword: string) => {
    navigator.clipboard?.writeText(`Text ${keyword} to 8844`);
    setCopiedKeyword(keyword);
    showToast(`Copied "Text ${keyword} to 8844" to clipboard!`, 'info');
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  return (
    <section className="bg-white dark:bg-[#0D1812] py-16 border-b border-[#E2E8E3] dark:border-white/10 transition-colors duration-200">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-br from-[#075B36] via-[#054829] to-[#04331C] text-white shadow-xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#A3E635]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Left Info */}
          <div className="space-y-4 max-w-2xl relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#A3E635] text-xs font-black uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" />
              <span>Offline & 2G Mobile Extension Access</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              8844 Toll-Free SMS & USSD Knowledge Dispatch
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              No internet or smartphones needed in the field. Farmers and Development Agents can text any of these official keywords to <strong>8844</strong> to receive instant, localized agronomy summaries and emergency alerts.
            </p>
          </div>

          {/* Right Phone Mockup Card */}
          <div className="lg:w-80 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
              <span className="flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-[#A3E635]" />
                <span>Ethio Telecom & Safaricom</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#A3E635]/20 text-[#A3E635] text-[10px] font-black">
                FREE SMS
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/10 text-xs font-mono text-white border border-white/10">
              <span className="text-[#A3E635]">TO:</span> 8844
              <br />
              <span className="text-[#A3E635]">MSG:</span> KALENDAR ARSI
            </div>

            <div className="text-[11px] text-emerald-200/80 leading-snug">
              Instant automated response arrives within 5 seconds with sowing dates and fertilizer doses.
            </div>
          </div>
        </div>

        {/* 4 Interactive SMS Keywords Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {smsKnowledgeCodes.map((item, idx) => {
            const isCopied = copiedKeyword === item.keyword;
            const title = language === 'om' ? item.titleOm : item.title;
            const preview = language === 'om' ? item.responsePreviewOm : item.responsePreview;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#E2EFE0] dark:border-white/10 bg-[#F6F7F3] dark:bg-white/5 p-5 flex flex-col justify-between space-y-4 hover:border-[#075B36] dark:hover:border-[#A3E635] transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-[#075B36] text-[#A3E635] text-xs font-mono font-black">
                      {item.keyword}
                    </span>
                    <span className="text-[11px] font-extrabold text-[#56635B] dark:text-white/60">
                      Send to 8844
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0A1912] dark:text-white">
                    {title}
                  </h3>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#152019] border border-gray-200 dark:border-white/5 text-[11px] text-[#56635B] dark:text-white/70 italic font-mono leading-relaxed line-clamp-3">
                    "{preview}"
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCode(item.keyword)}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-white/10 hover:bg-[#EAF5EE] dark:hover:bg-white/20 text-[#075B36] dark:text-[#A3E635] text-xs font-black border border-[#D5E8D0] dark:border-white/10 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy SMS Code</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
