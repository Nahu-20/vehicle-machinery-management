import React from 'react';
import { BookCheck, Globe2, ShieldCheck, Landmark } from 'lucide-react';

export const ResourcesStatsBanner: React.FC = () => {
  const stats = [
    {
      label: 'Verified Technical Guides',
      value: '18+',
      subtext: 'Agro-ecological & extension manuals',
      icon: BookCheck,
    },
    {
      label: 'Regional Working Languages',
      value: '3 Languages',
      subtext: 'Afaan Oromoo, Amharic & English',
      icon: Globe2,
    },
    {
      label: 'Kebele FTCs Supplied',
      value: '330 Woredas',
      subtext: 'Quarterly printed distribution kits',
      icon: Landmark,
    },
    {
      label: 'Public Access & Licensing',
      value: '100% Free',
      subtext: 'Open public domain farmer access',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0D1812] border-b border-[#E2E8E3] dark:border-white/10 py-6 transition-colors duration-200">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-3 sm:p-4 rounded-2xl bg-[#F6F7F3] dark:bg-white/5 border border-[#E2EFE0] dark:border-white/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] dark:bg-emerald-950/60 text-[#075B36] dark:text-[#A3E635]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-black text-[#0A1912] dark:text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-[#56635B] dark:text-white/70 truncate">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
