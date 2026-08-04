import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockPrograms } from '../data/mockData';
import { Layers, MapPin, Users, CheckCircle2 } from 'lucide-react';

export const ProgramsPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-[#F8F7F2] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="rounded-2xl bg-[#075D3A] text-white p-8 md:p-12 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D5A62E]">Strategic Initiatives</span>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">{t('nav_programs')}</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-2xl">{t('programs_subtitle')}</p>
        </div>

        <div className="space-y-8">
          {mockPrograms.map((prog) => (
            <div
              key={prog.id}
              id={prog.id}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col md:flex-row"
            >
              <div className="md:w-5/12 relative h-64 md:h-auto">
                <img src={prog.imageUrl} alt={t(prog.titleKey)} className="h-full w-full object-cover" />
                <span className="absolute top-4 left-4 rounded-full bg-[#075D3A] px-3 py-1 text-xs font-bold text-white shadow-md">
                  {prog.badgeKey}
                </span>
              </div>

              <div className="md:w-7/12 p-8 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#14804A] uppercase">
                    <Layers className="h-4 w-4" />
                    <span>{prog.categoryKey}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#17211B] mt-1">{t(prog.titleKey)}</h2>
                  <p className="text-xs text-[#5E6B63] leading-relaxed mt-2">{t(prog.descriptionKey)}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-[#5E6B63]">
                    <MapPin className="h-4 w-4 text-[#075D3A]" />
                    <span><strong>Area:</strong> {prog.targetArea}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5E6B63]">
                    <Users className="h-4 w-4 text-[#075D3A]" />
                    <span><strong>Beneficiaries:</strong> {prog.beneficiaries}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
