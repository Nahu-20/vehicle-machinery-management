import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { PhoneCall, Building, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProgramsCTA: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="programs-closing-cta" className="py-16 sm:py-20 bg-[#F4F8F3] dark:bg-[#080D0A] transition-colors duration-200">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#075B36] via-[#06472A] to-[#0A2618] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-white/10">
          {/* Subtle Background Pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#A3E635 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#A3E635] text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Oromia Bureau of Agriculture Direct Support</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Partner With Us to Modernize Oromia's Agricultural Frontier
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
              Whether you represent a farming cooperative, development agency, agricultural research institute, or agribusiness investor, our program secretariats are ready to collaborate.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/services"
                className="px-6 py-3.5 rounded-xl bg-[#A3E635] hover:bg-[#8CD823] text-[#0A1912] font-black text-sm transition-all duration-200 flex items-center gap-2 shadow-lg group"
              >
                <span>Explore Extension & e-Services</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/contact"
                className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 transition-colors flex items-center gap-2"
              >
                <Building className="h-4 w-4 text-[#A3E635]" />
                <span>Contact Program Directors</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
