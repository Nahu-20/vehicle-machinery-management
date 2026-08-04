import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Edit, Eye, CheckCircle2, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../lib/permissions';

export const ContentManagementPage: React.FC = () => {
  const { staffUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'news' | 'achievements'>('news');
  const [searchQuery, setSearchQuery] = useState('');

  const canCreate = hasPermission(staffUser, 'content.create');
  const canPublish = hasPermission(staffUser, 'content.publish');

  // Placeholder content items
  const newsItems = [
    {
      id: 'n1',
      title: 'Oromia Bureau Launches Direct Fertilizer Distribution System',
      category: 'news',
      status: 'published',
      publishedAt: '2026-08-01',
      author: 'Bureau Press Office',
    },
    {
      id: 'n2',
      title: 'Bale Zone Irrigation Modernization Project Reaches Phase 2',
      category: 'training',
      status: 'published',
      publishedAt: '2026-07-28',
      author: 'Irrigation Directorate',
    },
    {
      id: 'n3',
      title: 'Wheat Rust Advisory Notice for Arsi and West Arsi Farmers',
      category: 'tender',
      status: 'draft',
      publishedAt: '2026-08-03',
      author: 'Crop Protection Division',
    },
  ];

  const achievementItems = [
    {
      id: 'a1',
      title: 'Bale Zone Irrigation Modernization',
      program: 'Irrigation Expansion',
      zone: 'Bale Zone',
      status: 'published',
      publishedAt: '2026-07-15',
    },
    {
      id: 'a2',
      title: 'Jimma Coffee Quality & Yield Enhancement',
      program: 'Export Enhancement',
      zone: 'Jimma Zone',
      status: 'published',
      publishedAt: '2026-06-20',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Content Management (CMS Shell)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage news articles, announcements, and regional achievement portfolios.
          </p>
        </div>

        {canCreate && (
          <button
            disabled
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 opacity-60 cursor-not-allowed shadow"
            title="Full CMS editing will be enabled in Milestone 2.2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Article (Milestone 2.2)</span>
          </button>
        )}
      </div>

      {/* Milestone Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold mb-0.5">Milestone 2.1 Scope Notice</div>
          <div>
            Full Firestore CMS CRUD operations (create, edit, publish, delete) will be built in Milestone 2.2. This view verifies staff permission controls (<code className="bg-slate-950/20 px-1 py-0.5 rounded text-amber-900 dark:text-amber-100">content.view</code>, <code className="bg-slate-950/20 px-1 py-0.5 rounded text-amber-900 dark:text-amber-100">content.create</code>, <code className="bg-slate-950/20 px-1 py-0.5 rounded text-amber-900 dark:text-amber-100">content.publish</code>).
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'news'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          News & Announcements ({newsItems.length})
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'achievements'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Achievement Cases ({achievementItems.length})
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search content by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Category / Program</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {activeTab === 'news'
                ? newsItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white max-w-md truncate">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 uppercase text-slate-500 dark:text-slate-400">
                        {item.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {item.publishedAt}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-semibold text-slate-400 italic">
                          Read-only (Milestone 2.1)
                        </span>
                      </td>
                    </tr>
                  ))
                : achievementItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white max-w-md truncate">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {item.program} ({item.zone})
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {item.publishedAt}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-semibold text-slate-400 italic">
                          Read-only (Milestone 2.1)
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
