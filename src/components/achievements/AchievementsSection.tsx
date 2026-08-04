import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Award,
  Users,
  MapPin,
  ArrowRight,
  Sprout,
  Droplets,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { mockAchievements, mockTimeline } from '../../data/mockData';

export const AchievementsSection: React.FC = () => {
  const { language, t } = useLanguage();

  // Pick the featured achievement and top secondary achievements
  const featured = mockAchievements.find((a) => a.featured) || mockAchievements[0];
  const secondaryAchievements = mockAchievements.filter((a) => a.id !== featured.id).slice(0, 3);

  // Overall Impact Stats
  const impactMetrics = [
    {
      id: 'stat-farmers',
      label: t('farmers_supported'),
      value: '2.4M+',
      icon: Users,
      color: 'from-emerald-500 to-green-600',
    },
    {
      id: 'stat-hectares',
      label: t('hectares_improved'),
      value: '450,000+',
      icon: Sprout,
      color: 'from-amber-500 to-yellow-600',
    },
    {
      id: 'stat-training',
      label: t('training_delivered'),
      value: '320+',
      icon: Award,
      color: 'from-sky-500 to-blue-600',
    },
    {
      id: 'stat-projects',
      label: t('projects_completed'),
      value: '180+',
      icon: CheckCircle2,
      color: 'from-teal-500 to-emerald-600',
    },
  ];

  return (
    <section id="achievements-impact" className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-3">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('achievements_label')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('achievements_title')}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              {t('achievements_subtitle')}
            </p>
          </div>

          <div>
            <Link
              to="/achievements"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <span>{t('view_all_achievements')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Global Key Impact Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {impactMetrics.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('achievements_label')}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content Layout: Featured Story + Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Featured Achievement Card (8 cols on lg) */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 text-white shadow-xl h-full flex flex-col justify-end min-h-[460px] border border-slate-800"
            >
              {/* Background Photography with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={featured.featuredImage}
                  alt={featured.imageAlt[language]}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/30" />
              </div>

              {/* Card Badge */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs uppercase tracking-wider backdrop-blur-md shadow-md">
                  <Award className="w-3.5 h-3.5" />
                  <span>{t('featured_achievement')}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-medium text-xs backdrop-blur-md">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{featured.zone[language]}</span>
                </span>
              </div>

              {/* Card Body */}
              <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end mt-auto">
                <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  {featured.program[language]} • {featured.year}
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 group-hover:text-emerald-300 transition-colors leading-tight">
                  <Link to={`/achievements/${featured.slug}`}>
                    {featured.title[language]}
                  </Link>
                </h3>

                <p className="text-slate-300 text-sm sm:text-base line-clamp-3 mb-6">
                  {featured.excerpt[language]}
                </p>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 mb-6">
                  {featured.metrics.map((metric, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {metric.value}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-300 truncate">
                        {metric.label[language]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Link */}
                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px] sm:max-w-xs">{featured.responsibleOffice[language]}</span>
                  </span>
                  <Link
                    to={`/achievements/${featured.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 hover:underline"
                  >
                    <span>{t('view_full_story')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Secondary Achievement List (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('achievements_in_action')}</span>
            </div>

            {secondaryAchievements.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-4"
              >
                <div className="sm:w-32 h-28 rounded-lg overflow-hidden shrink-0 relative bg-slate-100 dark:bg-slate-700">
                  <img
                    src={item.featuredImage}
                    alt={item.imageAlt[language]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-medium backdrop-blur-sm">
                    {item.year}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                      <span>{item.zone[language]}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <Link to={`/achievements/${item.slug}`}>
                        {item.title[language]}
                      </Link>
                    </h4>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {item.excerpt[language]}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.metrics[0]?.value} {item.metrics[0]?.label[language]}
                    </span>

                    <Link
                      to={`/achievements/${item.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>{t('view_full_story')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Milestone Timeline Teaser */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700/80 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('achievement_timeline')}</span>
              </h3>
            </div>
            <Link
              to="/achievements#timeline"
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>{t('view_all_milestones')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {mockTimeline.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-500/40 transition-colors"
              >
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-2">
                  {item.year}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                  {item.title[language]}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {item.description[language]}
                </p>
                <div className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {item.zone[language]}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
