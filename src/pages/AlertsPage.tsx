import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockAlerts } from '../data/mockData';
import { AgriculturalAlert, AlertSeverity, AlertCategory, AlertStatus } from '../types';
import { AlertsHero } from '../components/alerts/AlertsHero';
import { AlertsEmergencyTicker } from '../components/alerts/AlertsEmergencyTicker';
import { AlertsRiskRadar } from '../components/alerts/AlertsRiskRadar';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import { FarmerHazardReportModal } from '../components/alerts/FarmerHazardReportModal';
import { AlertsSMSHub } from '../components/alerts/AlertsSMSHub';
import { AlertsPreventionGuides } from '../components/alerts/AlertsPreventionGuides';
import { AlertsCTA } from '../components/alerts/AlertsCTA';
import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  Bell,
  MapPin,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { t } = useLanguage();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  // Modals state
  const [activeAlertModal, setActiveAlertModal] = useState<AgriculturalAlert | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Extract unique zones for filter dropdown
  const allZones = useMemo(() => {
    const zoneSet = new Set<string>();
    (mockAlerts || []).forEach((a) => {
      (a?.affectedZones || []).forEach((z) => {
        if (z) zoneSet.add(z);
      });
    });
    return Array.from(zoneSet).sort();
  }, []);

  // Filter logic
  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter((alert) => {
      // 1. Search term match
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const titleText = (t(alert.titleKey) || alert.slug).toLowerCase();
        const summaryText = (t(alert.summaryKey) || '').toLowerCase();
        const areaText = alert.affectedArea.toLowerCase();
        const woredasText = alert.affectedWoredas?.join(' ').toLowerCase() || '';
        const actionsText = alert.recommendedActions?.join(' ').toLowerCase() || '';

        const matchesQuery =
          titleText.includes(query) ||
          summaryText.includes(query) ||
          areaText.includes(query) ||
          woredasText.includes(query) ||
          actionsText.includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Severity filter
      if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && alert.category !== selectedCategory) {
        return false;
      }

      // 4. Zone filter
      if (
        selectedZone !== 'all' &&
        !alert.affectedZones?.some((z) => z.toLowerCase().includes(selectedZone.toLowerCase()))
      ) {
        return false;
      }

      // 5. Status filter
      if (selectedStatus !== 'all' && alert.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedSeverity, selectedCategory, selectedZone, selectedStatus, t]);

  const activeAlertsCount = mockAlerts.filter((a) => a.status === 'active').length;
  const criticalCount = mockAlerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;
  const warningCount = mockAlerts.filter((a) => a.status === 'active' && a.severity === 'warning').length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSeverity('all');
    setSelectedCategory('all');
    setSelectedZone('all');
    setSelectedStatus('all');
  };

  const handleFilterByZone = (zoneName: string) => {
    setSelectedZone(zoneName);
    const gridSection = document.getElementById('alerts-catalog-grid');
    if (gridSection) {
      gridSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F6F7F3] dark:bg-[#0A110D] min-h-screen text-[#111310] dark:text-white transition-colors duration-200 overflow-x-hidden">
      
      {/* 1. Real-Time Emergency Broadcast Ticker */}
      <AlertsEmergencyTicker
        alerts={mockAlerts}
        onOpenAlertModal={setActiveAlertModal}
      />

      {/* 2. Hero Section with Live Stats, Search & Responsive Category Wraps */}
      <AlertsHero
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
        activeCount={activeAlertsCount}
        criticalCount={criticalCount}
        warningCount={warningCount}
        totalFiltered={filteredAlerts.length}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* 3. Agro-Ecological Risk Radar & Corridor Stress Indices */}
      <AlertsRiskRadar onFilterByZone={handleFilterByZone} />

      {/* 4. Main Alerts & Advisories Catalog */}
      <section id="alerts-catalog-grid" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Catalog Subheader & Filter Bar */}
        <div className="bg-white dark:bg-[#111613] p-6 sm:p-8 rounded-3xl border border-[#E2EFE0] dark:border-white/10 shadow-sm space-y-6 mb-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDF4EC] dark:border-white/10 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635] text-xs font-black uppercase tracking-wider">
                <Bell className="h-3.5 w-3.5" />
                <span>Regional Advisory Bulletins</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0A1912] dark:text-white tracking-tight">
                Active Notices & Historical Advisories
              </h2>
              <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70">
                Displaying <strong>{filteredAlerts.length}</strong> of <strong>{mockAlerts.length}</strong> broadcasts across Oromia
              </p>
            </div>

            {(searchTerm || selectedSeverity !== 'all' || selectedCategory !== 'all' || selectedZone !== 'all' || selectedStatus !== 'active') && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 text-xs font-bold text-[#075B36] dark:text-[#A3E635] border border-[#D5E8D0] dark:border-white/10 hover:bg-[#F0F7EE] transition-all shrink-0 self-start sm:self-auto shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          {/* Detailed Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Severity Filter */}
            <div className="space-y-1">
              <label className="font-extrabold text-[#56635B] dark:text-white/70 uppercase tracking-wider text-[11px]">
                Severity Level
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/10 bg-[#FAFAF7] dark:bg-[#181F1B] text-[#0A1912] dark:text-white font-bold focus:outline-none focus:border-[#075B36] min-h-[44px]"
              >
                <option value="all">Severity: All Levels</option>
                <option value="critical">🚨 Critical Alert (Red)</option>
                <option value="warning">⚠️ Warning Advisory (Amber)</option>
                <option value="advisory">🌿 Technical Advisory (Green)</option>
                <option value="info">ℹ️ General Notice (Blue)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="font-extrabold text-[#56635B] dark:text-white/70 uppercase tracking-wider text-[11px]">
                Advisory Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/10 bg-[#FAFAF7] dark:bg-[#181F1B] text-[#0A1912] dark:text-white font-bold focus:outline-none focus:border-[#075B36] min-h-[44px]"
              >
                <option value="all">Category: All Portfolios</option>
                <option value="weather">Weather & Climate Anomalies</option>
                <option value="pest">Pests & Invasive Species</option>
                <option value="crop">Crop Diseases & Rusts</option>
                <option value="livestock">Livestock & Animal Health</option>
                <option value="irrigation">Irrigation & River Watersheds</option>
                <option value="general">Input Logistics & General</option>
              </select>
            </div>

            {/* Zone Filter */}
            <div className="space-y-1">
              <label className="font-extrabold text-[#56635B] dark:text-white/70 uppercase tracking-wider text-[11px]">
                Administrative Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/10 bg-[#FAFAF7] dark:bg-[#181F1B] text-[#0A1912] dark:text-white font-bold focus:outline-none focus:border-[#075B36] min-h-[44px]"
              >
                <option value="all">Zone: All 22 Oromia Zones</option>
                {allZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="font-extrabold text-[#56635B] dark:text-white/70 uppercase tracking-wider text-[11px]">
                Advisory Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5E8D0] dark:border-white/10 bg-[#FAFAF7] dark:bg-[#181F1B] text-[#0A1912] dark:text-white font-bold focus:outline-none focus:border-[#075B36] min-h-[44px]"
              >
                <option value="all">Status: All (Active & Resolved)</option>
                <option value="active">🟢 Active Bulletins Only</option>
                <option value="expired">⚪ Historical / Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts Grid */}
        {filteredAlerts.length === 0 ? (
          <div className="rounded-3xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#111613] p-12 sm:p-16 text-center space-y-4 shadow-sm">
            <div className="inline-flex p-4 rounded-2xl bg-[#F0F7EE] dark:bg-white/10 text-[#075B36] dark:text-[#A3E635]">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-[#0A1912] dark:text-white">
              No agricultural alerts match your filters
            </h3>
            <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/60 max-w-md mx-auto">
              Try modifying search keywords, selecting a different zone, or clear filters to view all regional bulletins.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#075B36] hover:bg-[#054629] px-5 py-2.5 text-xs font-black text-white shadow-md transition-all"
            >
              <RotateCcw className="h-4 w-4 text-[#A3E635]" />
              <span>Reset Search Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredAlerts.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onOpenModal={setActiveAlertModal}
                index={index}
              />
            ))}
          </div>
        )}

      </section>

      {/* 5. Standard Operating Procedures & First 48-Hour Guides */}
      <AlertsPreventionGuides />

      {/* 6. Farmer Mobile SMS / Voice Alert Subscription Hub */}
      <AlertsSMSHub />

      {/* 7. Closing Emergency 8888 Banner & Hotline */}
      <AlertsCTA onOpenReportModal={() => setIsReportModalOpen(true)} />

      {/* 8. Full Alert Dossier Detail Modal */}
      <AlertDetailModal
        alert={activeAlertModal}
        onClose={() => setActiveAlertModal(null)}
      />

      {/* 9. Farmer Incident Sighting Report Modal */}
      <FarmerHazardReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

    </div>
  );
};
