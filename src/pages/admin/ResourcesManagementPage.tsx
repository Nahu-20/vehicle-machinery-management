import React from 'react';
import { FolderDown, Plus, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../lib/permissions';

export const ResourcesManagementPage: React.FC = () => {
  const { staffUser } = useAuth();
  const canManageResources = hasPermission(staffUser, 'resources.manage');

  const mockResources = [
    { id: 'r1', title: 'Oromia Agricultural Extension Calendar 2026', type: 'calendar', format: 'PDF', size: '4.2 MB' },
    { id: 'r2', title: 'Wheat Rust Management Field Guide', type: 'manual', format: 'PDF', size: '8.1 MB' },
    { id: 'r3', title: 'Fertilizer Application Guidelines', type: 'guidance', format: 'DOCX', size: '2.4 MB' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderDown className="w-7 h-7 text-purple-500" />
            <span>Farmers Publications & Resource Repository</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload and maintain downloadable agricultural field guides, extension calendars, and forms.
          </p>
        </div>

        {canManageResources && (
          <button
            disabled
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-2 opacity-60 cursor-not-allowed shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
          Official Publications ({mockResources.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Format</th>
                <th className="px-6 py-3.5">File Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {mockResources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{res.title}</td>
                  <td className="px-6 py-4 uppercase text-slate-500 dark:text-slate-400">{res.type}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{res.format}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{res.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
