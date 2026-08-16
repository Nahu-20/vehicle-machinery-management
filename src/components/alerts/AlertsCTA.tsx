import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { PhoneCall, Building2, ArrowRight, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';

interface AlertsCTAProps {
  onOpenReportModal: () => void;
}

export const AlertsCTA: React.FC<AlertsCTAProps> = ({ onOpenReportModal }) => {
  const { t } = useLanguage();

  return (
    <section id="alerts-closing-cta" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="relative rounded-3xl bg-gradient-to-br from-[#062417] via-[#073D26] to-[#0A110D] text-white p-8 sm:p-12 lg:p-14 overflow-hidden shadow-2xl border border-white/10">
        
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#A3E635]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#A3E635] backdrop-blur-md border border-white/15">
            <ShieldCheck className="h-4 w-4" />
            <span>24/7 Regional Agricultural Emergency Response</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Urgent Pest Outbreak or Unseasonal Weather Threat in Your Area?
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
            Call the regional toll-free emergency hotline <strong>8888</strong> directly from any mobile network in Ethiopia or submit an on-demand incident report to mobilize your Zonal Plant Health Defense Team.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href="tel:8888"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 text-sm font-black transition-all shadow-lg hover:scale-105"
            >
              <PhoneCall className="h-4 w-4 animate-bounce" />
              <span>Call Emergency 8888</span>
            </a>

            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#A3E635] text-[#0A1912] hover:bg-[#92D022] px-6 py-3.5 text-sm font-black transition-all shadow-lg hover:scale-105"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Report Incident Online</span>
            </button>

            <Link
              to="/about#offices"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 text-sm font-bold backdrop-blur-md border border-white/20 transition-all"
            >
              <Building2 className="h-4 w-4 text-[#A3E635]" />
              <span>Woreda Agriculture Desks</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
