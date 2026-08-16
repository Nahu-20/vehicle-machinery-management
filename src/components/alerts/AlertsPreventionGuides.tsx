import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldAlert,
  Bug,
  Flame,
  CloudRain,
  Droplets,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AlertsPreventionGuides: React.FC = () => {
  const { t } = useLanguage();
  const [openGuide, setOpenGuide] = useState<number | null>(0);

  const guides = [
    {
      title: 'Wheat Yellow Stripe & Stem Rust (Puccinia spp.) Emergency Action',
      category: 'Fungal Crop Disease',
      icon: Flame,
      summary:
        'Rapid response steps for highland grain farmers in Arsi, Bale, and West Shewa when powdery yellow or red-brown pustules appear on wheat leaves.',
      steps: [
        'Scout wheat fields twice weekly during overcast, humid morning hours, especially on susceptible varieties (Ogolcho, Kingbird, Danda’a).',
        'Apply systemic fungicides (e.g., Tilt 250 EC, Rex Duo, or Opera) at 0.5 L/ha immediately upon observing initial pustules before 5% field threshold.',
        'Calibrate motorized knapsack sprayers to 200–250 L water per hectare with fine droplet nozzles for complete canopy penetration.',
        'Notify your Kebele DA to report GPS coordinates for cluster spraying coordination by Woreda mechanized units.',
      ],
    },
    {
      title: 'Desert Locust & Fall Armyworm (FAW) Field Management Protocol',
      category: 'Invasive Pests',
      icon: Bug,
      summary:
        'Community surveillance and barrier treatment guidelines for smallholder maize and sorghum fields.',
      steps: [
        'Inspect the whorl of 20 consecutive maize plants in 5 random field locations; calculate percentage of plants with window-pane leaf damage.',
        'At 5–10% seedling infestation or 20% mid-whorl stage, apply biological Neem formulations or recommended insecticides (e.g., Chlorantraniliprole, Emamectin benzoate).',
        'For Desert Locust hopper bands, report sightings immediately to toll-free 8888 or your local FTC before bands take flight.',
        'Participate in community ground-marking to allow regional aircraft and vehicle-mounted sprayers to target resting roosts at dawn.',
      ],
    },
    {
      title: 'Flash Flood & Farmland Soil Erosion Emergency Runoff Defense',
      category: 'Hydrological & Weather',
      icon: CloudRain,
      summary:
        'Protecting sloping Vertisols and river basin farmlands during heavy Kiremt precipitation peaks.',
      steps: [
        'Excavate cutoff drains and graded diversion ditches along upper field boundaries to redirect excessive hill runoff away from crops.',
        'Open drainage furrows (broad bed and furrow - BBF) every 80 cm in clay Vertisol soils to prevent waterlogging and root rot.',
        'Reinforce riverbank vegetative buffers with Vetiver grass and indigenous shrubs to stop gullies from encroaching into fertile topsoil.',
        'Move stored grains and bagged fertilizers to elevated platforms at least 1 meter above potential floor waterlines.',
      ],
    },
    {
      title: 'Pastoral Livestock Epidemic & Quarantine Containment Procedure',
      category: 'Animal Health',
      icon: ShieldAlert,
      summary:
        'Standard isolation and vaccination protocol for Foot-and-Mouth Disease (FMD), Anthrax, and Contagious Bovine Pleuropneumonia (CBPP).',
      steps: [
        'Isolate symptomatic animals with high fever, mouth blisters, or lameness in a quarantined enclosure at least 200 meters from healthy herds.',
        'Do not slaughter or open the carcasses of animals suspected of sudden Anthrax death; cover with lime and bury at minimum 2-meter depth.',
        'Bring all eligible cattle, goats, and camels to the Kebele crush pen during scheduled Bureau mobile veterinary vaccination campaigns.',
        'Maintain strict movement restrictions; do not transport unverified livestock across Woreda check-posts during active quarantine notices.',
      ],
    },
  ];

  return (
    <section id="alerts-prevention-guides" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Header */}
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Standard Operating Procedures</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight leading-tight">
            Hazard Prevention & First 48-Hour Protocols
          </h2>
          <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 leading-relaxed font-normal">
            Authoritative technical step-by-step guidance developed by the Oromia Agricultural Research Institute (IQQO) and Extension Directorate.
          </p>
        </div>

        {/* Guides Accordion */}
        <div className="space-y-4">
          {guides.map((guide, idx) => {
            const isOpen = openGuide === idx;
            const Icon = guide.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#F9FCF8] dark:bg-white/5 border-[#075B36] dark:border-[#A3E635]'
                    : 'bg-white dark:bg-[#181F1B] border-[#E2EFE0] dark:border-white/10 hover:border-[#075B36]/40'
                }`}
              >
                <button
                  onClick={() => setOpenGuide(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 font-extrabold text-[#0A1912] dark:text-white"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635] block">
                        {guide.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-black leading-snug">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-[#56635B] dark:text-white/70 font-normal line-clamp-1">
                        {guide.summary}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-2 rounded-xl shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-[#075B36] text-[#A3E635] rotate-180'
                        : 'bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-white'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-2 space-y-4 border-t border-[#EDF4EC] dark:border-white/5">
                        <span className="text-xs font-black uppercase tracking-wider text-[#0A1912] dark:text-white block">
                          Mandated Field Action Sequence:
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {guide.steps.map((step, stepIdx) => (
                            <div
                              key={stepIdx}
                              className="flex items-start gap-2.5 bg-white dark:bg-[#181F1B] p-3.5 rounded-xl border border-[#E2EFE0] dark:border-white/10 text-[#3E4D43] dark:text-white/90"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#075B36] text-[#A3E635] font-black text-[11px]">
                                {stepIdx + 1}
                              </span>
                              <span className="leading-relaxed font-medium">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
