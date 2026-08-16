import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { PhoneCall, Building2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ServicesCTA: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="services-closing-cta" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="relative rounded-3xl bg-gradient-to-br from-[#062A1B] via-[#075B36] to-[#0A3D25] text-white p-8 sm:p-12 lg:p-14 overflow-hidden shadow-2xl border border-emerald-900">
        {/* Glow orb accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#A3E635]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#A3E635] backdrop-blur-md border border-white/15">
            <Sparkles className="h-4 w-4" />
            <span>Dedicated Regional Support</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Need Immediate Field Advisory or Emergency Pest Squads?
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
            Dial toll-free hotline <strong>8888</strong> from anywhere in Oromia or visit your local Kebele Farmer Training Center (FTC) to meet your assigned Development Agent.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href="tel:8888"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#A3E635] text-[#0A1912] hover:bg-[#92D022] px-6 py-3.5 text-sm font-black transition-all shadow-lg hover:scale-105"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call Helpline 8888</span>
            </a>

            <Link
              to="/about#offices"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 text-sm font-bold backdrop-blur-md border border-white/20 transition-all"
            >
              <Building2 className="h-4 w-4 text-[#A3E635]" />
              <span>Locate Woreda Desk</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
