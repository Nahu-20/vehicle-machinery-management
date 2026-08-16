import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Wheat, Droplets, MapPin, PhoneCall } from 'lucide-react';

export const ProgramsImpactStats: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    {
      id: 'stat-households',
      value: '12M+',
      label: t('programs_stats_farmers'),
      subtext: 'Direct smallholder farming families empowered across Oromia',
      icon: Users,
      color: 'from-emerald-500/20 to-emerald-600/5',
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
    {
      id: 'stat-clusters',
      value: '3.8M+',
      label: t('programs_stats_clusters'),
      subtext: 'Farmland consolidated into high-yield mechanized clusters',
      icon: Wheat,
      color: 'from-lime-500/20 to-lime-600/5',
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
    {
      id: 'stat-irrigation',
      value: '600K+ Ha',
      label: 'Basin & Solar Irrigation',
      subtext: 'Dry-season irrigated cropland enabling triple annual harvest cycles',
      icon: Droplets,
      color: 'from-teal-500/20 to-teal-600/5',
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
    {
      id: 'stat-zones',
      value: '22 Zones',
      label: t('programs_stats_zones'),
      subtext: 'Complete administrative footprint with 330 woreda extension desks',
      icon: MapPin,
      color: 'from-amber-500/20 to-amber-600/5',
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
  ];

  return (
    <section id="programs-impact-banner" className="relative -mt-8 z-20 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-white dark:bg-[#111613] p-5 sm:p-6 rounded-2xl border border-[#E5EFE2] dark:border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-3 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-[#F0F7EE] dark:bg-white/5 border border-[#E2EFE0] dark:border-white/10 ${stat.iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight">
                  {stat.value}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wide">
                  {stat.label}
                </h3>
                <p className="text-xs text-[#56635B] dark:text-white/60 mt-1 leading-relaxed">
                  {stat.subtext}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
