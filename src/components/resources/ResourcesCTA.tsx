import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  PhoneCall,
  MapPin,
  FileCheck,
  Download,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface ResourcesCTAProps {
  onRequestOpen: () => void;
}

export const ResourcesCTA: React.FC<ResourcesCTAProps> = ({ onRequestOpen }) => {
  const { t } = useLanguage();

  return (
    <section className="bg-white dark:bg-[#0D1812] py-16 transition-colors duration-200">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#053B23] via-[#075B36] to-[#042817] text-white p-8 sm:p-12 lg:p-14 shadow-2xl relative overflow-hidden">
          {/* Subtle Graphic Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#A3E635]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#0B2E1C]/80 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-[#A3E635]/30 text-[#A3E635] text-xs font-black uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Agricultural Knowledge Support Hotline</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
                Need Specific Technical Advice or Physical Copies for Your Kebele?
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
                Our 12,000+ Development Agents (DAs) and 330 Woreda Subject Matter Specialists are equipped to deliver tailored agronomic consultations and on-farm demonstrations.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button
                onClick={onRequestOpen}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-[#053B23] font-black text-xs sm:text-sm shadow-lg transition-all"
              >
                <FileCheck className="h-4 w-4" />
                <span>Request Physical Copies</span>
              </button>

              <Link
                to="/about#offices"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all shadow-xs"
              >
                <MapPin className="h-4 w-4 text-[#A3E635]" />
                <span>Locate Nearest Woreda Office</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
