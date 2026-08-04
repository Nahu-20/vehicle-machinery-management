import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { mockAlerts } from '../data/mockData';
import { AgriculturalAlert, AlertSeverity, AlertCategory, AlertStatus } from '../types';
import {
  Bell,
  Search,
  Filter,
  X,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { t } = useLanguage();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Extract unique zones for filter dropdown
  const allZones = useMemo(() => {
    const zoneSet = new Set<string>();
    mockAlerts.forEach((a) => {
      a.affectedZones?.forEach((z) => zoneSet.add(z));
    });
    return Array.from(zoneSet).sort();
  }, []);

  // Filter logic
  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter((alert) => {
      // 1. Search term match
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const titleText = t(alert.titleKey).toLowerCase();
        const summaryText = t(alert.summaryKey).toLowerCase();
        const areaText = alert.affectedArea.toLowerCase();
        const woredasText = alert.affectedWoredas?.join(' ').toLowerCase() || '';

        const matchesQuery =
          titleText.includes(query) ||
          summaryText.includes(query) ||
          areaText.includes(query) ||
          woredasText.includes(query);

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
        !alert.affectedZones?.some((z) => z.toLowerCase() === selectedZone.toLowerCase())
      ) {
        return false;
      }

      // 5. Status filter
      if (selectedStatus !== 'all' && alert.status !== selectedStatus) {
        return false;
      }

      // 6. Date filter (sample demo filter logic)
      if (selectedDateFilter === 'last7') {
        if (!alert.date.includes('August')) return false;
      } else if (selectedDateFilter === 'last30') {
        if (!alert.date.includes('August') && !alert.date.includes('July')) return false;
      }

      return true;
    });
  }, [searchTerm, selectedSeverity, selectedCategory, selectedZone, selectedStatus, selectedDateFilter, t]);

  const activeAlertsCount = mockAlerts.filter((a) => a.status === 'active').length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSeverity('all');
    setSelectedCategory('all');
    setSelectedZone('all');
    setSelectedStatus('active');
    setSelectedDateFilter('all');
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800 border border-red-200">
            <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
            <span>{t('alert_severity_critical')}</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{t('alert_severity_warning')}</span>
          </span>
        );
      case 'advisory':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-[#087A4B] border border-emerald-200">
            <Info className="h-4 w-4 text-[#087A4B] shrink-0" />
            <span>{t('alert_severity_advisory')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900 border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{t('alert_severity_info')}</span>
          </span>
        );
    }
  };

  const getCategoryLabel = (category: AlertCategory) => {
    switch (category) {
      case 'weather':
        return t('alert_category_weather');
      case 'crop':
        return t('alert_category_crop');
      case 'pest':
        return t('alert_category_pest');
      case 'livestock':
        return t('alert_category_livestock');
      case 'irrigation':
        return t('alert_category_irrigation');
      case 'general':
      default:
        return t('alert_category_general');
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#063D2A] via-[#087A4B] to-[#063D2A] p-6 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#D7A928]/20 px-3.5 py-1 text-xs font-black text-[#D7A928] border border-[#D7A928]/40">
              <Bell className="h-4 w-4" />
              <span>{t('alert_bell_title')}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {t('alerts_page_title')}
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              {t('alerts_page_subtitle')}
            </p>

            {/* Active Counter & Demo Tag */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-extrabold text-white border border-white/20">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                <span>
                  {activeAlertsCount} {t('alert_active_count')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/40 px-3.5 py-2 rounded-2xl border border-emerald-800">
                <Sparkles className="h-4 w-4 text-[#D7A928]" />
                <span>{t('alert_demo_notice')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters Controls Section */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-[#DDE8E1] space-y-5">
          {/* Top Row: Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#637069]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] pl-12 pr-4 py-3 text-sm font-semibold text-[#14251D] placeholder-[#637069] focus:bg-white focus:border-[#087A4B] focus:outline-none focus:ring-2 focus:ring-[#087A4B]/20 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Severity Filter */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#637069] mb-1">
                {t('alert_strip_title')}
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] px-3 py-2 text-xs font-bold text-[#14251D] focus:bg-white focus:border-[#087A4B] focus:outline-none"
              >
                <option value="all">Severity: All</option>
                <option value="critical">{t('alert_severity_critical')}</option>
                <option value="warning">{t('alert_severity_warning')}</option>
                <option value="advisory">{t('alert_severity_advisory')}</option>
                <option value="info">{t('alert_severity_info')}</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#637069] mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] px-3 py-2 text-xs font-bold text-[#14251D] focus:bg-white focus:border-[#087A4B] focus:outline-none"
              >
                <option value="all">{t('alert_category_all')}</option>
                <option value="weather">{t('alert_category_weather')}</option>
                <option value="crop">{t('alert_category_crop')}</option>
                <option value="pest">{t('alert_category_pest')}</option>
                <option value="livestock">{t('alert_category_livestock')}</option>
                <option value="irrigation">{t('alert_category_irrigation')}</option>
                <option value="general">{t('alert_category_general')}</option>
              </select>
            </div>

            {/* Zone Filter */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#637069] mb-1">
                Zonal Region
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] px-3 py-2 text-xs font-bold text-[#14251D] focus:bg-white focus:border-[#087A4B] focus:outline-none"
              >
                <option value="all">Zone: All Oromia</option>
                {allZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#637069] mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-[#DDE8E1] bg-[#FAFAF7] px-3 py-2 text-xs font-bold text-[#14251D] focus:bg-white focus:border-[#087A4B] focus:outline-none"
              >
                <option value="all">{t('alert_status_all')}</option>
                <option value="active">{t('alert_status_active')}</option>
                <option value="expired">{t('alert_status_expired')}</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#DDE8E1] bg-[#EFF8F2] px-3 py-2 text-xs font-bold text-[#087A4B] hover:bg-[#087A4B] hover:text-white transition-all h-[38px]"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>{t('alert_filter_clear')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Info & Demonstration Disclaimer */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#637069]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#063D2A] text-sm">
              Showing {filteredAlerts.length} alert(s)
            </span>
            {(searchTerm || selectedSeverity !== 'all' || selectedCategory !== 'all' || selectedZone !== 'all' || selectedStatus !== 'active') && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-[#087A4B]">
                Filtered
              </span>
            )}
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-1 text-amber-900 border border-amber-200">
            📌 Demonstration content for Oromia Agricultural Bureau Prototype
          </div>
        </div>

        {/* Alerts Cards Grid */}
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center border border-[#DDE8E1] shadow-xs space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Bell className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-[#14251D]">No alerts match your search filters</h3>
            <p className="text-xs text-[#637069]">Try clearing search inputs or adjusting zone & category filters.</p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-[#087A4B] px-4 py-2 text-xs font-bold text-white hover:bg-[#063D2A]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-xs border border-[#DDE8E1] transition-all hover:shadow-md hover:border-[#087A4B]"
              >
                <div className="space-y-4">
                  {/* Top Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE8E1] pb-3">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF8F2] px-2.5 py-0.5 text-[11px] font-extrabold text-[#087A4B] border border-[#DDE8E1]">
                        <Layers className="h-3 w-3" />
                        {getCategoryLabel(alert.category)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
                      {alert.status === 'expired' ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-bold text-gray-600 border border-gray-200">
                          {t('alert_status_expired')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-emerald-600" />
                          <span>Expires: {alert.expirationDate}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#14251D] group-hover:text-[#087A4B] transition-colors leading-snug">
                      {t(alert.titleKey)}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-[#637069] leading-relaxed line-clamp-3">
                      {t(alert.summaryKey)}
                    </p>
                  </div>

                  {/* Recommended Action Snippet if available */}
                  {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                    <div className="rounded-xl bg-[#EFF8F2] p-3 text-xs border border-[#DDE8E1] space-y-1">
                      <span className="font-extrabold text-[#063D2A] block flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#087A4B]" />
                        {t('alert_recommended_actions')}
                      </span>
                      <p className="text-[#637069] line-clamp-1 italic">
                        "{alert.recommendedActions[0]}"
                      </p>
                    </div>
                  )}

                  {/* Zones & Woredas Pills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#063D2A]">
                      <MapPin className="h-3.5 w-3.5 text-[#087A4B]" />
                      <span>{t('alert_affected_area')} {alert.affectedArea}</span>
                    </div>

                    {alert.affectedWoredas && alert.affectedWoredas.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {alert.affectedWoredas.map((woreda) => (
                          <span
                            key={woreda}
                            className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700"
                          >
                            Woreda: {woreda}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-[#DDE8E1] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#637069]">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>{t('alert_issued_date')} {alert.date}</span>
                  </div>

                  <Link
                    to={`/alerts/${alert.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#063D2A] px-4 py-2 font-bold text-white shadow-xs hover:bg-[#087A4B] transition-colors"
                  >
                    <span>{t('alert_view_details')}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#D7A928]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
