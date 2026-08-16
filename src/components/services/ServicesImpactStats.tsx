import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { Users, PhoneCall, PackageCheck, Building2, CheckCircle2 } from 'lucide-react';

export const ServicesImpactStats: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    {
      id: 'stat-agents',
      value: '15,000+',
      label: 'Kebele Development Agents',
      subtext: 'Certified agricultural officers stationed at every local Kebele FTC',
      icon: Users,
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
    {
      id: 'stat-helpline',
      value: '8888',
      label: 'Toll-Free Extension Helpline',
      subtext: 'Direct voice IVR & agronomic consultation across all regional languages',
      icon: PhoneCall,
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
    {
      id: 'stat-vouchers',
      value: '4.2M+',
      label: 'Digital Input Vouchers',
      subtext: 'Subsidized fertilizer and certified seeds redeemed through cooperative unions',
      icon: PackageCheck,
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
    {
      id: 'stat-woredas',
      value: '330',
      label: 'Woreda Walk-In Service Desks',
      subtext: 'Frontline administrative offices providing soil tests, AI booking, & plant clinics',
      icon: Building2,
      iconColor: 'text-[#075B36] dark:text-[#A3E635]',
    },
  ];

  return (
    <section id="services-impact-banner" className="relative -mt-8 z-20 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
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
