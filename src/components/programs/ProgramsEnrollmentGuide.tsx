import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileText,
  Users2,
  Tractor,
  Droplet,
  Milk,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProgramsEnrollmentGuide: React.FC = () => {
  const { t } = useLanguage();
  const [activePathway, setActivePathway] = useState<'cluster' | 'dairy' | 'irrigation'>('cluster');

  const pathways = {
    cluster: {
      title: 'Joining Crop Cluster Farming (Qonna Kalasteraa)',
      badge: 'Crop & Grain Producers',
      icon: Tractor,
      description: 'Open to smallholders with adjacent farmlands looking to consolidate operations for mechanized tillage, combine harvesting, and bulk certified seed supply.',
      steps: [
        {
          num: '01',
          title: 'Consolidate Farmland Group',
          desc: 'Coordinate with neighboring farmers to form an adjacent cluster (minimum 30–50 contiguous hectares).'
        },
        {
          num: '02',
          title: 'Register with Kebele DA at Local FTC',
          desc: 'Submit land use registry to your Kebele Agricultural Development Agent (DA) to approve cluster zoning.'
        },
        {
          num: '03',
          title: 'Receive Certified Inputs & Machinery Schedule',
          desc: 'Access subsidized rust-resistant seeds, blended NPSB fertilizer, and scheduled tractor tillage services.'
        },
        {
          num: '04',
          title: 'Guaranteed Union Off-take at Harvest',
          desc: 'Sell harvested grain through Primary Cooperative Unions with digital weight certification and fair prices.'
        }
      ]
    },
    dairy: {
      title: 'Yelemat Tirufat Dairy & Livestock Heifers',
      badge: 'Livestock & Smallholders',
      icon: Milk,
      description: 'Designed for smallholder households and youth groups to improve livestock genetics, milk productivity, and poultry egg volume.',
      steps: [
        {
          num: '01',
          title: 'Submit Application at Woreda Livestock Desk',
          desc: 'Register interest for artificial insemination kits, crossbred dairy heifers, or poultry starter packages.'
        },
        {
          num: '02',
          title: 'Complete 3-Day Husbandry Training',
          desc: 'Participate in intensive practical training at the local Farmer Training Center (FTC) on silage and feed care.'
        },
        {
          num: '03',
          title: 'Animal Delivery & Veterinary Schedule',
          desc: 'Receive certified livestock starter stock with scheduled vaccination and mobile AI breeding support.'
        },
        {
          num: '04',
          title: 'Link to Dairy Collection Chilling Hubs',
          desc: 'Supply fresh milk daily to nearby cooperative chilling centers with transparent automated testing.'
        }
      ]
    },
    irrigation: {
      title: 'Dry-Season Solar Irrigation & Scheme Access',
      badge: 'Irrigation & Horticulture',
      icon: Droplet,
      description: 'Providing subsidized solar-powered water pumps and gravity canal tie-ins for farmers in river basins and lowland aquifers.',
      steps: [
        {
          num: '01',
          title: 'Join or Form Water User Association (WUA)',
          desc: 'Register with your local Kebele Water Users Association to establish water usage quotas and canal maintenance.'
        },
        {
          num: '02',
          title: 'Technical Scheme Site Verification',
          desc: 'Bureau irrigation engineers verify water head, soil permeability, and solar pump sizing for your plot.'
        },
        {
          num: '03',
          title: 'Equipment Installation & Seed Allocation',
          desc: 'Receive subsidized zero-fuel solar pumps or canal gates with early-maturing horticultural seed packages.'
        },
        {
          num: '04',
          title: 'Triple-Harvest Continuous Production',
          desc: 'Transition to 3 continuous annual harvesting seasons (Bona dry-season wheat, onions, and vegetables).'
        }
      ]
    }
  };

  const current = pathways[activePathway];
  const PathwayIcon = current.icon;

  return (
    <section id="programs-enrollment-guide" className="py-16 sm:py-24 bg-white dark:bg-[#0C120E] transition-colors duration-200">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF5E8] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Farmer & Cooperative Engagement</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A1912] dark:text-white tracking-tight">
            How to Participate in Oromia Flagship Programs
          </h2>

          <p className="text-sm sm:text-base text-[#56635B] dark:text-white/70">
            A transparent step-by-step pathway for individual smallholders, youth collectives, and cooperative unions to access program resources.
          </p>
        </div>

        {/* Pathway Tabs */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            id="tab-pathway-cluster"
            onClick={() => setActivePathway('cluster')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activePathway === 'cluster'
                ? 'bg-[#075B36] text-white shadow-lg scale-105'
                : 'bg-[#F4F8F3] dark:bg-white/5 text-[#3E4D43] dark:text-white/80 hover:bg-[#EBF5E8] border border-[#E2EFE0] dark:border-white/10'
            }`}
          >
            <Tractor className="h-4 w-4" />
            <span>1. Crop Cluster Farming</span>
          </button>

          <button
            id="tab-pathway-dairy"
            onClick={() => setActivePathway('dairy')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activePathway === 'dairy'
                ? 'bg-[#075B36] text-white shadow-lg scale-105'
                : 'bg-[#F4F8F3] dark:bg-white/5 text-[#3E4D43] dark:text-white/80 hover:bg-[#EBF5E8] border border-[#E2EFE0] dark:border-white/10'
            }`}
          >
            <Milk className="h-4 w-4" />
            <span>2. Yelemat Tirufat Dairy</span>
          </button>

          <button
            id="tab-pathway-irrigation"
            onClick={() => setActivePathway('irrigation')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activePathway === 'irrigation'
                ? 'bg-[#075B36] text-white shadow-lg scale-105'
                : 'bg-[#F4F8F3] dark:bg-white/5 text-[#3E4D43] dark:text-white/80 hover:bg-[#EBF5E8] border border-[#E2EFE0] dark:border-white/10'
            }`}
          >
            <Droplet className="h-4 w-4" />
            <span>3. Solar Irrigation Subsidies</span>
          </button>
        </div>

        {/* Selected Pathway Process Box */}
        <motion.div
          key={activePathway}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#F8FAF7] dark:bg-[#111613] rounded-3xl border border-[#E2EFE0] dark:border-white/10 p-6 sm:p-10 lg:p-12 shadow-xl space-y-8"
        >
          {/* Pathway Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E5EFE2] dark:border-white/10">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-[#E5EFE2] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase">
                {current.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0A1912] dark:text-white">
                {current.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 max-w-2xl">
                {current.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#075B36] text-white shrink-0 shadow-md">
              <PathwayIcon className="h-8 w-8 text-[#A3E635]" />
            </div>
          </div>

          {/* 4 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {current.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-[#E5EFE2] dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#74d62c]/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-xl bg-[#075B36] text-[#A3E635] font-black text-sm flex items-center justify-center shadow-sm">
                    {step.num}
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-[#075B36] dark:text-[#A3E635]" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-[#0A1912] dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-xs text-[#56635B] dark:text-white/70 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#075B36] to-[#0A2618] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="p-3 rounded-xl bg-white/10 shrink-0 hidden sm:block">
                <PhoneCall className="h-6 w-6 text-[#A3E635]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black">Need assistance registering your cluster or farm?</h4>
                <p className="text-xs text-emerald-200">Call our dedicated agricultural advisory helpline toll-free: <strong>8844</strong></p>
              </div>
            </div>

            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-[#A3E635] hover:bg-[#8CD823] text-[#0A1912] font-black text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 shadow-md"
            >
              <span>Locate Your Woreda Office</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
