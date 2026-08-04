import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  FileText,
  Download,
  Share2,
  Printer,
  ChevronRight,
  Quote,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Tag,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { mockAchievements, mockReports } from '../data/mockData';
import { AchievementContentBlock } from '../types';

export const AchievementDetailPage: React.FC = () => {
  const { achievementSlug } = useParams<{ achievementSlug: string }>();
  const { language, t } = useLanguage();

  // Find achievement matching slug
  const achievement = mockAchievements.find((item) => item.slug === achievementSlug);

  if (!achievement) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-xl mx-auto text-center py-16 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
          <Award className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
            {t('achievement_not_found_title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
            {t('achievement_not_found_desc')}
          </p>
          <Link
            to="/achievements"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back_to_achievements')}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Related Achievements
  const relatedAchievements = mockAchievements.filter((a) =>
    achievement.relatedAchievementIds?.includes(a.id) || (a.id !== achievement.id && a.category === achievement.category)
  ).slice(0, 2);

  // Attached Reports
  const attachedReports = mockReports.filter((r) => achievement.reportIds?.includes(r.id));

  // Render content block helper
  const renderContentBlock = (block: AchievementContentBlock, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            {block.content[language]}
          </p>
        );
      case 'heading':
        const HeadingTag = block.level === 3 ? 'h3' : 'h2';
        return (
          <HeadingTag
            key={index}
            className={`${
              block.level === 3 ? 'text-xl' : 'text-2xl sm:text-3xl'
            } font-bold text-slate-900 dark:text-white tracking-tight mt-8 mb-4 border-l-4 border-emerald-500 pl-4`}
          >
            {block.content[language]}
          </HeadingTag>
        );
      case 'list':
        return (
          <ul key={index} className="space-y-3 mb-6 ml-2">
            {block.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{item[language]}</span>
              </li>
            ))}
          </ul>
        );
      case 'quote':
        return (
          <blockquote key={index} className="my-8 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-l-4 border-emerald-600 dark:border-emerald-500 shadow-sm">
            <Quote className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2 opacity-60" />
            <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 italic mb-3">
              "{block.content[language]}"
            </p>
            {block.source && (
              <footer className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                — {block.source[language]}
              </footer>
            )}
          </blockquote>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Article Header & Breadcrumb */}
      <div className="bg-slate-900 text-white py-12 border-b border-slate-800 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/achievements"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back_to_achievements')}</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Print Article"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              {achievement.program[language]}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{achievement.zone[language]}</span>
            </span>
            {achievement.woreda && (
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                Woreda: {achievement.woreda[language]}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            {achievement.title[language]}
          </h1>

          {/* Metadata Meta Bar */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>{achievement.responsibleOffice[language]}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Period: {achievement.implementationPeriod}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Published: {achievement.publishedAt}</span>
            </span>
          </div>

        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Hero Featured Image */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900">
          <div className="relative h-72 sm:h-[420px]">
            <img
              src={achievement.featuredImage}
              alt={achievement.imageAlt[language]}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 bg-slate-900 text-slate-300 text-xs italic text-center border-t border-slate-800">
            {achievement.imageAlt[language]}
          </div>
        </div>

        {/* Metrics Highlighting Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {achievement.metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm text-center"
            >
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
                {metric.value}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {metric.label[language]}
              </div>
            </div>
          ))}
        </div>

        {/* Article Full Body */}
        <article className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm">
          {achievement.fullContent.map((block, index) => renderContentBlock(block, index))}
        </article>

        {/* Before & After Section (If Available) */}
        {achievement.beforeAfter && (
          <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span>Before & After Impact Analysis</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                <div className="relative h-48 rounded-xl overflow-hidden mb-3">
                  <img
                    src={achievement.beforeAfter.beforeImage}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-red-950/90 text-red-300 text-xs font-bold">
                    BEFORE
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {achievement.beforeAfter.beforeDescription[language]}
                </p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 border border-emerald-500/40">
                <div className="relative h-48 rounded-xl overflow-hidden mb-3">
                  <img
                    src={achievement.beforeAfter.afterImage}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 text-xs font-bold">
                    AFTER
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {achievement.beforeAfter.afterDescription[language]}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Photo Gallery (If Available) */}
        {achievement.gallery && achievement.gallery.length > 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Field Documentation & Photo Gallery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {achievement.gallery.map((imgUrl, idx) => (
                <div key={idx} className="h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <img
                    src={imgUrl}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Associated Reports & Evidence Downloads */}
        {attachedReports.length > 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Official Evidence & Report Attachments</span>
            </h2>
            <div className="space-y-4">
              {attachedReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {report.title[language]}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {report.format} • {report.fileSize}
                      </div>
                    </div>
                  </div>

                  <a
                    href={report.downloadUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Demo Mode: Downloading report "${report.title[language]}"`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Achievements */}
        {relatedAchievements.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Related Achievements & Impact Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedAchievements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                      {item.zone[language]} • {item.year}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                      <Link to={`/achievements/${item.slug}`} className="hover:underline">
                        {item.title[language]}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                      {item.excerpt[language]}
                    </p>
                  </div>
                  <Link
                    to={`/achievements/${item.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                  >
                    <span>View Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back Link */}
        <div className="pt-8 text-center">
          <Link
            to="/achievements"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back_to_achievements')}</span>
          </Link>
        </div>

      </main>
    </div>
  );
};
