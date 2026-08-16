import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { DetailedService } from '../../data/servicesData';
import {
  Sprout,
  TrendingUp,
  PackageCheck,
  FlaskConical,
  Beef,
  Droplets,
  Tractor,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';

interface ServiceCardProps {
  service: DetailedService;
  onOpenModal: (service: DetailedService) => void;
  index: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onOpenModal, index }) => {
  const { t } = useLanguage();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout': return <Sprout className="h-6 w-6" />;
      case 'TrendingUp': return <TrendingUp className="h-6 w-6" />;
      case 'PackageCheck': return <PackageCheck className="h-6 w-6" />;
      case 'FlaskConical': return <FlaskConical className="h-6 w-6" />;
      case 'Beef': return <Beef className="h-6 w-6" />;
      case 'Droplets': return <Droplets className="h-6 w-6" />;
      case 'Tractor': return <Tractor className="h-6 w-6" />;
      case 'Sparkles': default: return <Sparkles className="h-6 w-6" />;
    }
  };

  const title = t(service.titleKey) || service.defaultTitle;
  const description = t(service.descriptionKey) || service.defaultDesc;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
      className="group relative bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 hover:border-[#075B36] dark:hover:border-[#A3E635] shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Header Row with Category & Badges */}
      <div className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] border border-[#E2EFE0] dark:border-white/10">
            {service.categoryLabel}
          </span>
          {service.isPopular && (
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#A3E635] text-[#0A1912] shadow-sm">
              Popular Service
            </span>
          )}
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-[#075B36] text-[#A3E635] group-hover:scale-105 transition-transform duration-300 shrink-0 shadow-md">
            {getIcon(service.iconName)}
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-[#0A1912] dark:text-white group-hover:text-[#075B36] dark:group-hover:text-[#A3E635] transition-colors leading-snug">
              {title}
            </h3>
            <p className="text-xs font-semibold text-[#075B36] dark:text-emerald-400/90 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{service.directorate}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#3E4D43] dark:text-white/70 leading-relaxed font-normal">
          {description}
        </p>

        {/* Key Features Checklist */}
        <div className="space-y-2 pt-2 border-t border-[#EDF4EC] dark:border-white/5">
          {service.keyFeatures.slice(0, 3).map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-[#2A3830] dark:text-white/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5" />
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer: Metadata & Action CTA Button */}
      <div className="p-5 sm:p-6 bg-[#F9FCF8] dark:bg-[#0D120F] border-t border-[#E2EFE0] dark:border-white/10 space-y-4">
        {/* Delivery Channel & Turnaround */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-[#56635B] dark:text-white/60">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0" />
            <span className="truncate">{service.turnaround}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635] shrink-0" />
            <span className="truncate">{service.fee}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          id={`service-action-btn-${service.id}`}
          onClick={() => onOpenModal(service)}
          className="w-full py-3 px-4 rounded-xl bg-[#075B36] hover:bg-[#054629] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 shadow-md group-hover:shadow-lg"
        >
          <span>Access Service & Guide</span>
          <ArrowRight className="h-4 w-4 text-[#A3E635] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
