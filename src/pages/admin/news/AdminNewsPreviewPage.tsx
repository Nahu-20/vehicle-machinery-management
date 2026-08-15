import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getNewsArticleBySlug } from '../../../services/newsService';
import { NewsArticle, validateNewsArticle } from '../../../types/news';
import { useLanguage } from '../../../context/LanguageContext';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { getDraftRecovery } from '../../../services/newsDraftRecoveryService';
import { NewsStatusBadge } from '../../../components/admin/news/NewsStatusBadge';
import { NewsImage } from '../../../components/news/NewsImage';
import {
  ArrowLeft,
  Edit,
  Eye,
  Building2,
  Loader2,
  AlertCircle,
  Quote,
} from 'lucide-react';

export const AdminNewsPreviewPage: React.FC = () => {
  const { newsSlug } = useParams<{ newsSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, getLocalizedText } = useLanguage();
  const { staffUser } = useStaffAuthorization();

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolvePreviewArticle() {
      if (!newsSlug) {
        setError('Article slug is required for preview.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetched = await getNewsArticleBySlug(newsSlug);
        if (fetched) {
          setArticle(fetched);
        } else {
          setError(`Draft preview document "${newsSlug}" was not found in Firestore database.`);
          setArticle(null);
        }
      } catch (err: any) {
        console.warn('[AdminNewsPreviewPage] Error fetching Firestore article:', err);
        setError(err?.message || 'Failed to load article from Firestore database.');
        setArticle(null);
      } finally {
        setLoading(false);
      }
    }

    resolvePreviewArticle();
  }, [newsSlug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading draft preview...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Preview Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => navigate('/admin/news')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to News Directory
        </button>
      </div>
    );
  }

  const titleStr = getLocalizedText(article.title);
  const excerptStr = getLocalizedText(article.excerpt);
  const officeStr = getLocalizedText(article.responsibleOffice);

  return (
    <div className="space-y-6 pb-16">
      {/* Internal Staff Preview Banner */}
      <div className="sticky top-0 z-30 bg-amber-500 text-slate-950 px-6 py-3.5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 font-bold text-xs border border-amber-400">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4 shrink-0" />
          <span>Internal Staff Preview Mode — Draft Content (Not Publicly Visible)</span>
          <NewsStatusBadge status={article.status} />
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher for Preview Testing */}
          <div className="flex items-center gap-1 bg-amber-600/30 p-1 rounded-xl">
            <button
              onClick={() => setLanguage('om')}
              className={`px-2 py-0.5 rounded-lg text-[11px] ${
                language === 'om' ? 'bg-slate-950 text-white' : 'text-slate-950 opacity-80'
              }`}
            >
              OM
            </button>
            <button
              onClick={() => setLanguage('am')}
              className={`px-2 py-0.5 rounded-lg text-[11px] ${
                language === 'am' ? 'bg-slate-950 text-white' : 'text-slate-950 opacity-80'
              }`}
            >
              AM
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-lg text-[11px] ${
                language === 'en' ? 'bg-slate-950 text-white' : 'text-slate-950 opacity-80'
              }`}
            >
              EN
            </button>
          </div>

          <Link
            to={`/admin/news/${article.slug}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl transition-colors font-bold text-xs shadow-xs"
          >
            <Edit className="w-3.5 h-3.5 text-amber-400" /> Back to Edit
          </Link>
        </div>
      </div>

      {/* Article Detail Body */}
      <article className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-sm space-y-8 max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
              {article.category}
            </span>
            {officeStr && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                {officeStr}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {titleStr || 'Untitled Draft'}
          </h1>

          {excerptStr && (
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed border-l-4 border-emerald-500 pl-4 py-1">
              {excerptStr}
            </p>
          )}
        </div>

        <NewsImage
          src={article.featuredImage}
          alt={getLocalizedText(article.imageAlt) || titleStr || 'Article hero image'}
          aspect="preview"
          objectPosition={article.imagePosition || 'center'}
          caption={getLocalizedText(article.imageAlt)}
        />

        {/* Content Blocks Rendering */}
        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
          {article.content && article.content.length > 0 ? (
            article.content.map((block) => {
              const text = 'content' in block ? getLocalizedText(block.content) : '';
              if (block.type === 'heading') {
                return (
                  <h2 key={block.id} className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2">
                    {text}
                  </h2>
                );
              }
              if (block.type === 'quote') {
                const srcText = block.source ? getLocalizedText(block.source) : undefined;
                return (
                  <blockquote key={block.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-l-4 border-emerald-600 italic space-y-1 my-4">
                    <div className="flex gap-2">
                      <Quote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p>{text}</p>
                    </div>
                    {srcText && <cite className="block text-xs font-bold text-slate-500 not-italic pl-6">— {srcText}</cite>}
                  </blockquote>
                );
              }
              if (block.type === 'list') {
                return (
                  <ul key={block.id} className="list-disc list-inside space-y-1.5 pl-2 my-4">
                    {block.items.map((item, idx) => (
                      <li key={idx}>{getLocalizedText(item)}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === 'highlight') {
                return (
                  <div key={block.id} className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium my-4">
                    {text}
                  </div>
                );
              }
              return <p key={block.id}>{text}</p>;
            })
          ) : (
            <p className="text-xs italic text-slate-400">No content blocks added yet.</p>
          )}
        </div>
      </article>
    </div>
  );
};
