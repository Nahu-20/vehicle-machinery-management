import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  Printer,
  Quote,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PublicAchievement, AchievementContentBlock } from '../types/achievement';
import { getPublishedAchievementBySlug } from '../services/achievementService';

export const AchievementDetailPage: React.FC = () => {
  const { achievementSlug } = useParams<{ achievementSlug: string }>();
  const { language, t, getLocalizedText } = useLanguage();

  const [achievement, setAchievement] = useState<PublicAchievement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      if (!achievementSlug) {
        setAchievement(null);
        setLoading(false);
        return;
      }

      try {
        const data = await getPublishedAchievementBySlug(achievementSlug);
        if (isMounted) {
          setAchievement(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[AchievementDetailPage] Error loading achievement:', err);
          setError(err.message || 'Failed to load achievement');
          setAchievement(null);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [achievementSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
            Loading achievement details...
          </p>
        </div>
      </div>
    );
  }

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

  const title = getLocalizedText(achievement.title);
  const summary = getLocalizedText(achievement.summary);
  const responsibleOffice = getLocalizedText(achievement.responsibleOffice);
  const imageAlt = getLocalizedText(achievement.imageAlt) || title;
  const displayImage = achievement.featuredImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80';

  // Render content block helper
  const renderContentBlock = (block: AchievementContentBlock, index: number) => {
    const localizedContent = getLocalizedText(block.content);

    switch (block.type) {
      case 'paragraph':
        return (
          <p key={block.id || index} className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            {localizedContent}
          </p>
        );
      case 'heading': {
        const HeadingTag = block.level === 3 ? 'h3' : 'h2';
        return (
          <HeadingTag
            key={block.id || index}
            className={`${
              block.level === 3 ? 'text-xl' : 'text-2xl sm:text-3xl'
            } font-bold text-slate-900 dark:text-white tracking-tight mt-8 mb-4 border-l-4 border-emerald-500 pl-4`}
          >
            {localizedContent}
          </HeadingTag>
        );
      }
      case 'bullet-list':
      case 'numbered-list': {
        const ListTag = block.type === 'numbered-list' ? 'ol' : 'ul';
        const itemsList =
          block.items?.[language] ||
          block.items?.om ||
          block.items?.en ||
          block.items?.am ||
          [];
        return (
          <ListTag key={block.id || index} className={`space-y-3 mb-6 ml-2 ${block.type === 'numbered-list' ? 'list-decimal pl-5' : ''}`}>
            {itemsList.map((item: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-base text-slate-700 dark:text-slate-300">
                {block.type !== 'numbered-list' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ListTag>
        );
      }
      case 'quote':
        return (
          <blockquote key={block.id || index} className="my-8 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-l-4 border-emerald-600 dark:border-emerald-500 shadow-sm">
            <Quote className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2 opacity-60" />
            <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 italic mb-3">
              "{localizedContent}"
            </p>
            {block.source && (
              <footer className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                — {getLocalizedText(block.source)}
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
            <span className="px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider capitalize">
              {achievement.category}
            </span>
            {achievement.achievementDate && (
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Date: {achievement.achievementDate}</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            {title}
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mb-6">
            {summary}
          </p>

          {/* Metadata Meta Bar */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-4 border-t border-slate-800">
            {responsibleOffice && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>{responsibleOffice}</span>
              </span>
            )}
            {achievement.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Published: {new Date(achievement.publishedAt).toLocaleDateString()}</span>
              </span>
            )}
          </div>

        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Hero Featured Image */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900">
          <div className="relative h-72 sm:h-[420px]">
            <img
              src={displayImage}
              alt={imageAlt}
              className="w-full h-full object-cover"
            />
          </div>
          {imageAlt && (
            <div className="p-4 bg-slate-900 text-slate-300 text-xs italic text-center border-t border-slate-800">
              {imageAlt}
            </div>
          )}
        </div>

        {/* Metrics Highlighting Bar */}
        {achievement.metrics && achievement.metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {achievement.metrics.map((metric, idx) => (
              <div
                key={metric.id || idx}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm text-center"
              >
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
                  {metric.value}
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {getLocalizedText(metric.label)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Full Body */}
        {achievement.content && achievement.content.length > 0 && (
          <article className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm">
            {achievement.content.map((block, index) => renderContentBlock(block, index))}
          </article>
        )}

        {/* Before & After Section (If Available) */}
        {achievement.beforeAfter && (
          <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span>Before & After Impact Analysis</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                {achievement.beforeAfter.beforeImage && (
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
                )}
                <p className="text-xs text-slate-300">
                  {getLocalizedText(achievement.beforeAfter.before || achievement.beforeAfter.beforeDescription)}
                </p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 border border-emerald-500/40">
                {achievement.beforeAfter.afterImage && (
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
                )}
                <p className="text-xs text-slate-300">
                  {getLocalizedText(achievement.beforeAfter.after || achievement.beforeAfter.afterDescription)}
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
              {achievement.gallery.map((item, idx) => {
                const imageUrl = typeof item === 'string' ? item : (item.image || '');
                const imageAlt = typeof item === 'string' ? `Gallery ${idx + 1}` : (getLocalizedText(item.alt) || `Gallery ${idx + 1}`);
                const caption = typeof item === 'object' && item.caption ? getLocalizedText(item.caption) : null;
                const key = typeof item === 'object' && item.id ? item.id : `gallery-${idx}`;

                if (!imageUrl) return null;

                return (
                  <div key={key} className="space-y-2">
                    <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {caption && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 px-1">{caption}</p>
                    )}
                  </div>
                );
              })}
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

