import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, TrendingUp, MapPin, Layers, Calendar, BarChart3, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { ProductStatistics } from '../types/product';
import { VerifiedDataUnavailable } from './VerifiedDataUnavailable';
import { CANONICAL_ZONE_METADATA } from '../../investment-map/constants/canonicalZones';

interface ProductDataSummaryProps {
  statistics: ProductStatistics | null;
}

export const ProductDataSummary: React.FC<ProductDataSummaryProps> = ({ statistics }) => {
  const { t } = useLanguage();

  if (!statistics || statistics.verificationStatus !== 'verified') {
    return (
      <section className="space-y-3" aria-labelledby="product-data-heading">
        <h2
          id="product-data-heading"
          className="text-lg font-extrabold text-[#0A1912] dark:text-white"
        >
          {t('products_verified_statistics')}
        </h2>
        <VerifiedDataUnavailable />
      </section>
    );
  }

  const {
    annualProduction,
    cultivatedArea,
    averageYield,
    coverage,
    majorZones,
    referencePeriod,
    commodityKey,
  } = statistics;

  return (
    <section className="space-y-6" aria-labelledby="product-data-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#087A4B]/15 dark:border-emerald-800/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="product-data-heading"
              className="text-xl font-black tracking-tight text-[#0A1912] dark:text-white"
            >
              {t('products_verified_statistics')}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#087A4B]/10 dark:bg-emerald-500/20 text-[#087A4B] dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 border border-[#087A4B]/20 dark:border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {t('products_verified_badge')}
            </span>
          </div>
          <p className="text-xs text-[#56635B] dark:text-emerald-100/70 mt-1">
            {statistics.datasetTitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFF8F2] dark:bg-[#0E241B] px-3 py-1.5 text-xs font-semibold text-[#0A1912] dark:text-emerald-200 border border-[#087A4B]/20 dark:border-emerald-700/30">
          <Calendar className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
          <span>
            {t('products_reference_period')}: {referencePeriod.label}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Regional Production */}
        <div
          id="stat-card-production"
          className="rounded-2xl border border-[#087A4B]/20 dark:border-emerald-800/40 bg-white dark:bg-[#0A1912] p-5 shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#56635B] dark:text-emerald-300/80">
              {t('products_regional_production')}
            </span>
            <TrendingUp className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
          </div>
          <div className="mt-2">
            {annualProduction ? (
              <>
                <p className="text-2xl font-black text-[#0A1912] dark:text-white tracking-tight">
                  {annualProduction.formatted || `${annualProduction.value} ${annualProduction.unit}`}
                </p>
                <p className="text-xs text-[#56635B] dark:text-emerald-100/60 mt-1">
                  {annualProduction.period}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#738278] dark:text-emerald-100/50 italic py-1">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{t('products_field_not_available')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Harvested Area */}
        <div
          id="stat-card-area"
          className="rounded-2xl border border-[#087A4B]/20 dark:border-emerald-800/40 bg-white dark:bg-[#0A1912] p-5 shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#56635B] dark:text-emerald-300/80">
              {t('products_harvested_area')}
            </span>
            <Layers className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
          </div>
          <div className="mt-2">
            {cultivatedArea ? (
              <>
                <p className="text-2xl font-black text-[#0A1912] dark:text-white tracking-tight">
                  {cultivatedArea.formatted || `${cultivatedArea.value} ${cultivatedArea.unit}`}
                </p>
                <p className="text-xs text-[#56635B] dark:text-emerald-100/60 mt-1">
                  {cultivatedArea.period}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#738278] dark:text-emerald-100/50 italic py-1">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{t('products_field_not_available')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Average Yield */}
        <div
          id="stat-card-yield"
          className="rounded-2xl border border-[#087A4B]/20 dark:border-emerald-800/40 bg-white dark:bg-[#0A1912] p-5 shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#56635B] dark:text-emerald-300/80">
              {t('products_average_yield')}
            </span>
            <BarChart3 className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
          </div>
          <div className="mt-2">
            {averageYield ? (
              <>
                <p className="text-2xl font-black text-[#0A1912] dark:text-white tracking-tight">
                  {averageYield.formatted || `${averageYield.value} ${averageYield.unit}`}
                </p>
                <p className="text-[11px] text-[#087A4B] dark:text-emerald-300 font-medium mt-1">
                  {t('products_derived_yield_note')}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#738278] dark:text-emerald-100/50 italic py-1">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{t('products_field_not_available')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Data Coverage */}
        <div
          id="stat-card-coverage"
          className="rounded-2xl border border-[#087A4B]/20 dark:border-emerald-800/40 bg-white dark:bg-[#0A1912] p-5 shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#56635B] dark:text-emerald-300/80">
              {t('products_data_coverage')}
            </span>
            <MapPin className="h-4 w-4 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-[#0A1912] dark:text-white tracking-tight">
              {coverage.populatedZoneCount} / {coverage.totalCanonicalZones}{' '}
              <span className="text-sm font-semibold text-[#56635B] dark:text-emerald-200">
                {t('products_zones_count')}
              </span>
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  coverage.isFullCoverage ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                aria-hidden
              />
              <p className="text-xs font-semibold text-[#56635B] dark:text-emerald-100/70">
                {coverage.isFullCoverage
                  ? t('products_full_coverage')
                  : `${t('products_partial_coverage')} (${coverage.coveragePercent}%)`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Major Growing Zones Section */}
      {majorZones && majorZones.length > 0 && (
        <div className="rounded-2xl border border-[#087A4B]/20 dark:border-emerald-800/40 bg-[#F6FAF7] dark:bg-[#0A1912]/90 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-[#0A1912] dark:text-white">
              {t('products_major_zones')}
            </h3>
            <Link
              to={`/investment/map?commodity=${encodeURIComponent(commodityKey)}&metric=production`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087A4B] dark:text-[#A3E635] hover:underline"
            >
              <span>{t('products_view_on_map')}</span>
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {majorZones.map((zone, idx) => {
              const meta = CANONICAL_ZONE_METADATA[zone.zoneId];
              const zoneName = meta ? meta.displayName : zone.zoneId;

              return (
                <Link
                  key={zone.zoneId}
                  id={`major-zone-card-${zone.zoneId}`}
                  to={`/investment/map?commodity=${encodeURIComponent(
                    commodityKey
                  )}&metric=production&zone=${encodeURIComponent(zone.zoneId)}`}
                  className="group rounded-xl border border-[#087A4B]/15 dark:border-emerald-800/50 bg-white dark:bg-[#0E241B] p-3.5 shadow-xs hover:border-[#087A4B] dark:hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="inline-flex items-center justify-center rounded-md bg-[#EFF8F2] dark:bg-emerald-950/80 px-2 py-0.5 text-[11px] font-extrabold text-[#087A4B] dark:text-emerald-300">
                        #{zone.regionalRank ?? idx + 1}
                      </span>
                      {zone.regionalSharePercent !== null && zone.regionalSharePercent !== undefined && (
                        <span className="text-[11px] font-bold text-[#087A4B] dark:text-[#A3E635]">
                          {zone.regionalSharePercent}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-[#0A1912] dark:text-white group-hover:text-[#087A4B] dark:group-hover:text-emerald-300 transition-colors">
                      {zoneName}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#087A4B]/10 dark:border-emerald-800/30 text-xs text-[#56635B] dark:text-emerald-100/70">
                    <span className="font-bold text-[#0A1912] dark:text-emerald-100">
                      {zone.productionVolume.toLocaleString()}
                    </span>{' '}
                    {zone.productionUnit || statistics.unit}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
