import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { PhoneCall, ShieldCheck, UserCheck, PackageCheck, ArrowRight, Sparkles } from 'lucide-react';

export const ServicesProcessWorkflow: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      step: '01',
      title: 'Select Service or Dial 8888',
      desc: 'Browse e-Services online, visit your nearest Kebele FTC, or call the 8888 toll-free hotline from any mobile phone.',
      icon: PhoneCall,
    },
    {
      step: '02',
      title: 'Farmland & Group Verification',
      desc: 'Verify kebele residency, farmland acreage, or cluster group registration with your local Kebele DA officer.',
      icon: ShieldCheck,
    },
    {
      step: '03',
      title: 'Digital Voucher / DA Dispatch',
      desc: 'Receive your verified SMS voucher code or get scheduled for an on-site field diagnostic visit by an agronomist.',
      icon: UserCheck,
    },
    {
      step: '04',
      title: 'Service Delivery & Monitoring',
      desc: 'Redeem subsidized inputs at Primary Union depots, receive veterinary care, or download verified soil fertility reports.',
      icon: PackageCheck,
    },
  ];

  return (
    <section id="services-process-section" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-[#075B36] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        {/* Subtle decorative background gradient circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#A3E635] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/15">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Standard Operating Procedure</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              How Oromia Farmers Access Agricultural Services
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed font-normal">
              A transparent, standardized 4-step workflow connecting rural smallholders to regional government resources with zero administrative friction.
            </p>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 hover:border-[#A3E635]/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-[#A3E635] tracking-tight">
                      {item.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-white/10 text-[#A3E635]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-emerald-100/80 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
