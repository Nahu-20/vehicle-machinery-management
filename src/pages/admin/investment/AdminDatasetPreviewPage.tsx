import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Database, AlertCircle, Map } from 'lucide-react';
import { getDataset, getZoneValues } from '../../../services/investment/investmentDatasetService';
import { getMethodology } from '../../../services/investment/investmentMethodologyService';
import { InvestmentDataset, InvestmentZoneValue, InvestmentMethodology } from '../../../types/investment';
import { AdminThematicMapContainer, MapViewMode } from '../../../components/admin/investment/AdminThematicMapContainer';
import { SelectedZoneReviewPanel } from '../../../components/admin/investment/SelectedZoneReviewPanel';

export function AdminDatasetPreviewPage() {
  const { datasetId } = useParams<{ datasetId: string }>();

  const [dataset, setDataset] = useState<InvestmentDataset | null>(null);
  const [zoneValues, setZoneValues] = useState<InvestmentZoneValue[]>([]);
  const [methodology, setMethodology] = useState<InvestmentMethodology | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('metric');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getDataset(datasetId),
      getZoneValues(datasetId),
    ])
      .then(async ([ds, zv]) => {
        if (!ds) {
          setError(`Dataset "${datasetId}" not found.`);
          return;
        }
        setDataset(ds);
        setZoneValues(zv);

        if (ds.methodologyId) {
          const meth = await getMethodology(ds.methodologyId);
          setMethodology(meth);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dataset for thematic map preview.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [datasetId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
        <Database className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
        <p>Loading OpenLayers admin thematic preview...</p>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Link
          to="/admin/investment/datasets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets</span>
        </Link>
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-rose-600 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <p className="font-bold">{error || 'Dataset not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/admin/investment/datasets/${dataset.datasetId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dataset Review Workspace</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500">
            {dataset.title} (v{dataset.version})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminThematicMapContainer
            dataset={dataset}
            zoneValues={zoneValues}
            selectedZoneId={selectedZoneId}
            onSelectZone={(zid) => setSelectedZoneId(zid)}
            viewMode={viewMode}
            onViewModeChange={(m) => setViewMode(m)}
            height="580px"
          />
        </div>

        <div>
          <SelectedZoneReviewPanel
            zoneId={selectedZoneId}
            dataset={dataset}
            zoneValues={zoneValues}
            onSelectZone={(zid) => setSelectedZoneId(zid)}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminDatasetPreviewPage;
