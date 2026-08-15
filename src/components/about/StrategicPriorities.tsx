import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import {
  Wheat,
  Beef,
  Droplets,
  Users,
  TrendingUp,
  Landmark,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const StrategicPriorities: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();

  const priorities = [
    {
      id: 'crop-cluster',
      category: 'Crop Production',
      title: 'Cluster Farming & High-Yield Seed Systems',
      description:
        'Mobilizing millions of smallholders into mechanized crop clusters in Arsi, Bale, and Shewa, doubling wheat and maize yields.',
      icon: Wheat,
      color: 'border-l-4 border-l-[#075B36] dark:border-l-[#74d62c]',
      link: '/programs#prog-cluster',
      featured: true,
    },
    {
      id: 'livestock',
      category: 'Livestock Development',
      title: 'Livestock Modernization & Yelemat Tirufat',
      description:
        'Upgrading cattle breeding, expanding dairy value chains, and providing free veterinary vaccinations across all zones.',
      icon: Beef,
      color: 'border-l-4 border-l-[#D5A62E] dark:border-l-[#e4ad37]',
      link: '/programs#prog-yelemat',
      featured: false,
    },
    {
      id: 'irrigation',
      category: 'Water & Irrigation',
      title: 'Year-Round Irrigation & Water Harvesting',
      description:
        'Expanding irrigated lowlands and river basins to guarantee triple-harvest wheat cycles and dry-season resilience.',
      icon: Droplets,
      color: 'border-l-4 border-l-[#0284C7] dark:border-l-[#38BDF8]',
      link: '/programs#prog-irrigation',
      featured: false,
    },
    {
      id: 'extension',
      category: 'Extension Support',
      title: '15,000+ Farmer Training Centers (FTCs)',
      description:
        'Connecting frontline agronomists and development agents directly with local farming households in every kebele.',
      icon: Users,
      color: 'border-l-4 border-l-[#059669] dark:border-l-[#10B981]',
      link: '/services#extension',
      featured: false,
    },
    {
      id: 'market',
      category: 'Market Intelligence',
      title: 'Transparent Pricing & Cooperative Linkages',
      description:
        'Delivering real-time commodity pricing data to eliminate exploitative broker margins and empower local unions.',
      icon: TrendingUp,
      color: 'border-l-4 border-l-[#EA580C] dark:border-l-[#FB923C]',
      link: '/services#market',
      featured: false,
    },
    {
      id: 'investment',
      category: 'Agro-Investment',
      title: 'High-Value Crops & Agro-Processing',
      description:
        'Attracting strategic domestic and foreign investments in coffee, avocado, edible oils, and modern processing parks.',
      icon: Landmark,
      color: 'border-l-4 border-l-[#8B5CF6] dark:border-l-[#A78BFA]',
      link: '/investment',
      featured: false,
    },
  ];

  return (
    <section className="bg-[#FFFFFF] dark:bg-[#0D110F] py-16 sm:py-20 lg:py-28 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div className="space-y-3 max-w-2xl">
            <AgriPillBadge variant="lime" icon={<Wheat className="h-3.5 w-3.5 text-[#0A1912]" />}>
              {t('about_priorities_eyebrow')}
            </AgriPillBadge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D1C13] dark:text-[#f5f6f3] tracking-tight">
              {t('about_priorities_title')}
            </h2>
            <p className="text-base sm:text-lg text-[#4E6155] dark:text-[#a5aba6]">
              {t('about_priorities_sub')}
            </p>
          </div>

          <Link
            to="/programs"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-[#075B36] dark:text-[#74d62c] hover:underline underline-offset-4 shrink-0"
          >
            <span>View All Programs</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Priority Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {priorities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
                whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className={`group flex flex-col justify-between rounded-2xl p-6 bg-[#F8F7F2] dark:bg-[#161d18] border border-[#E2E8E3] dark:border-white/[0.08] hover:border-[#075B36]/30 dark:hover:border-white/[0.18] transition-all duration-300 ${item.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#111613] text-[#0D1C13] dark:text-[#f5f6f3] border border-[#E2E8E3] dark:border-white/[0.08] shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <Icon className="h-5 w-5 text-[#075B36] dark:text-[#74d62c]" />
                    </div>
                    <span className="text-[11px] font-bold text-[#5B6B60] dark:text-[#a5aba6] tracking-wider uppercase bg-white/70 dark:bg-black/40 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#0D1C13] dark:text-[#f5f6f3] mb-2 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#4E6155] dark:text-[#a5aba6] leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E8EFE9] dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#075B36] dark:text-[#74d62c] group-hover:underline">
                    Explore initiative
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#075B36] dark:text-[#74d62c] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
