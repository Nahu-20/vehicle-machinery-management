import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { subscribeToAdminNews, publishNewsArticle, unpublishNewsArticle, archiveNewsArticle } from '../../../services/newsService';
import { seedMockNewsToFirestore } from '../../../services/newsSeedService';
import { NewsArticle, NewsStatus, NewsCategory } from '../../../types/news';
import { NewsStatusBadge } from '../../../components/admin/news/NewsStatusBadge';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle2,
  EyeOff,
  Archive,
  RefreshCw,
  Calendar,
  Tag,
  Building2,
  Database,
  Loader2,
  FileText,
} from 'lucide-react';

export const AdminNewsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { staffUser, hasPermission } = useStaffAuthorization();
  const { getLocalizedText } = useLanguage();
  const { showToast } = useToast();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<NewsStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NewsCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const canCreate = hasPermission('content.create');
  const canEdit = hasPermission('content.edit');
  const canPublish = hasPermission('content.publish');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAdminNews(
      {
        status: statusFilter,
        category: categoryFilter,
        searchQuery,
      },
      (fetchedArticles) => {
        setArticles(fetchedArticles);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Error fetching admin news:', err);
        setError('Failed to load news articles from Firestore.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [statusFilter, categoryFilter, searchQuery]);

  const handlePublish = async (slug: string) => {
    if (!staffUser) return;
    const res = await publishNewsArticle(slug, staffUser);
    if (res.success) {
      showToast('Article published live.', 'success');
    } else {
      showToast(res.error || 'Failed to publish article.', 'error');
    }
  };

  const handleUnpublish = async (slug: string) => {
    if (!staffUser) return;
    const res = await unpublishNewsArticle(slug, staffUser);
    if (res.success) {
      showToast('Article unpublished.', 'info');
    } else {
      showToast(res.error || 'Failed to unpublish article.', 'error');
    }
  };

  const handleArchive = async (slug: string) => {
    if (!staffUser) return;
    const res = await archiveNewsArticle(slug, staffUser);
    if (res.success) {
      showToast('Article archived.', 'info');
    } else {
      showToast(res.error || 'Failed to archive article.', 'error');
    }
  };

  const handleSeedDemoData = async () => {
    if (!staffUser) return;
    setIsSeeding(true);
    try {
      const res = await seedMockNewsToFirestore(staffUser, false);
      showToast(
        `Seeded ${res.seeded} articles to Firestore (${res.skipped} already existed).`,
        'success'
      );
    } catch (err: any) {
      showToast('Failed to seed demo articles.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>News & Press Releases Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, preview, and publish official agricultural bulletins across Afaan Oromo, Amharic, and English.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seed Demo Button */}
          <button
            type="button"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Seed initial demonstration news into Firestore"
          >
            {isSeeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Database className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Seed Demo Data</span>
          </button>

          {/* Create Button */}
          {canCreate && (
            <Link
              to="/admin/news/new"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#075D3A] hover:bg-emerald-800 text-white transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Article</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or slug..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Status & Category Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="news">Oduu (News)</option>
              <option value="training">Leenjii (Training)</option>
              <option value="event">Qophii (Event)</option>
              <option value="tender">Caalbaasii (Tender)</option>
              <option value="announcement">Beeksisa (Announcement)</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
            Total: {articles.length}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading articles from Firestore...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-center space-y-2">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">No News Articles Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No news articles match your filter criteria or Firestore is empty.
            </p>
          </div>
          {canCreate && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSeedDemoData}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Seed Demonstration Data
              </button>
              <Link
                to="/admin/news/new"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                Create First Article
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Article</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Office</th>
                    <th className="p-4">Version</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {articles.map((item) => {
                    const titleStr = getLocalizedText(item.title);
                    const officeStr = getLocalizedText(item.responsibleOffice);

                    return (
                      <tr
                        key={item.slug}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3 max-w-md">
                            {item.featuredImage ? (
                              <img
                                src={item.featuredImage}
                                alt={titleStr}
                                className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-200 dark:border-slate-800"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="space-y-0.5 overflow-hidden">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {titleStr || item.slug}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                /{item.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="capitalize px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-4">
                          <NewsStatusBadge status={item.status} />
                        </td>

                        <td className="p-4 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                          {officeStr || 'Oromia Bureau'}
                        </td>

                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          v{item.version || 1}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/admin/news/${item.slug}/preview`}
                              className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Preview Draft"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {canEdit && (
                              <Link
                                to={`/admin/news/${item.slug}/edit`}
                                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Article"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}

                            {canPublish && (
                              <>
                                {item.status !== 'published' ? (
                                  <button
                                    onClick={() => handlePublish(item.slug)}
                                    className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                                    title="Publish Article"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUnpublish(item.slug)}
                                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                    title="Unpublish Article"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                  </button>
                                )}

                                {item.status !== 'archived' && (
                                  <button
                                    onClick={() => handleArchive(item.slug)}
                                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Archive Article"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {articles.map((item) => {
              const titleStr = getLocalizedText(item.title);
              const officeStr = getLocalizedText(item.responsibleOffice);

              return (
                <div
                  key={item.slug}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <NewsStatusBadge status={item.status} />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {titleStr || item.slug}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">/{item.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="capitalize font-bold">{item.category}</span>
                    <span>{officeStr}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to={`/admin/news/${item.slug}/preview`}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </Link>

                    {canEdit && (
                      <Link
                        to={`/admin/news/${item.slug}/edit`}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                    )}

                    {canPublish && (
                      item.status !== 'published' ? (
                        <button
                          onClick={() => handlePublish(item.slug)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnpublish(item.slug)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white flex items-center gap-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" /> Unpublish
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
