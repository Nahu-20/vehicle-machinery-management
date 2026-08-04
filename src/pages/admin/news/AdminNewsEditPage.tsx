import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNewsArticleBySlug } from '../../../services/newsService';
import { NewsArticle } from '../../../types/news';
import { NewsEditorForm } from '../../../components/admin/news/NewsEditorForm';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const AdminNewsEditPage: React.FC = () => {
  const { newsSlug } = useParams<{ newsSlug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticle() {
      if (!newsSlug) {
        setError('Missing article slug parameter.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetched = await getNewsArticleBySlug(newsSlug);
        if (fetched) {
          setArticle(fetched);
          setError(null);
        } else {
          setError(`News article with slug "${newsSlug}" was not found in Firestore.`);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch article from Firestore.');
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [newsSlug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading article editor...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Article Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => navigate('/admin/news')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to News List</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <NewsEditorForm initialArticle={article} isEditMode={true} />
    </div>
  );
};
