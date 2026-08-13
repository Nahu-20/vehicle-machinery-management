import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockMarketPrices } from '../../data/mockData';
import { MarketPrice } from '../../types';
import { SectionHeaderReveal } from '../common/scroll/SectionHeaderReveal';
import { ScrollReveal } from '../common/scroll/ScrollReveal';
import { StaggerContainer, StaggerItem } from '../common/scroll/StaggerContainer';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Filter, Sparkles } from 'lucide-react';

export const MarketPriceCardList: React.FC<{ items: MarketPrice[] }> = ({ items }) => {
  const { t, getLocalizedText } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#637069] dark:text-emerald-300/70 bg-[#FAFAF7] dark:bg-[#12281D] rounded-2xl border border-[#DDE8E1] dark:border-emerald-900/60">
        {t('alert_bell_empty')}
      </div>
    );
  }

  return (
    <div className="space-y-3.5 w-full max-w-full min-w-0">
      {items.map((item) => {
        const commodityName = item.commodity ? getLocalizedText(item.commodity) : (item.commodityKey ? t(item.commodityKey) : '');
        const marketName = getLocalizedText(item.market);
        const zoneName = getLocalizedText(item.zone);
        const unitName = getLocalizedText(item.unit);

        return (
          <div
            key={item.id}
            className="w-full max-w-full min-w-0 rounded-2xl border border-[#DDE8E1] dark:border-emerald-900/60 bg-white dark:bg-[#12281D] p-4 shadow-xs flex flex-col gap-3"
          >
            {/* Top row: Commodity & Change Badge */}
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#087A4B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/60 inline-block mb-1">
                  {t('market_th_commodity')}
                </span>
                <h3 className="text-base font-black text-[#063D2A] dark:text-emerald-100 leading-tight overflow-wrap-anywhere break-words">
                  {commodityName}
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold shrink-0 ${
                  item.changePercent > 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/80 text-[#087A4B] dark:text-emerald-300'
                    : item.changePercent < 0
                    ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {item.changePercent > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : item.changePercent < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : null}
                {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
              </span>
            </div>

            {/* Price & Unit Display */}
            <div className="rounded-xl bg-[#EFF8F2] dark:bg-[#183627] p-3 border border-[#DDE8E1] dark:border-emerald-800/60 flex items-baseline justify-between">
              <span className="text-xs font-extrabold text-[#637069] dark:text-emerald-300/80">{t('market_th_price')}:</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#063D2A] dark:text-white">{item.priceETB.toLocaleString()}</span>
                <span className="text-xs font-bold text-[#087A4B] dark:text-[#D7A928] ml-1">ETB</span>
              </div>
            </div>

            {/* Grid of Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#DDE8E1]/60 dark:border-emerald-900/40">
              <div>
                <span className="text-[11px] font-bold text-[#637069] dark:text-emerald-400/80 block">{t('market_th_market')}</span>
                <span className="font-extrabold text-[#14251D] dark:text-emerald-100 overflow-wrap-anywhere break-words">{marketName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#637069] dark:text-emerald-400/80 block">{t('market_th_zone')}</span>
                <span className="font-extrabold text-[#14251D] dark:text-emerald-100 overflow-wrap-anywhere break-words">{zoneName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#637069] dark:text-emerald-400/80 block">{t('market_th_unit')}</span>
                <span className="font-medium text-[#14251D] dark:text-emerald-100 overflow-wrap-anywhere break-words">{unitName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#637069] dark:text-emerald-400/80 block">{t('market_th_date')}</span>
                <span className="font-semibold text-[#637069] dark:text-emerald-300/80">{item.updatedDate}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const MarketPriceTable: React.FC<{ items: MarketPrice[] }> = ({ items }) => {
  const { t, getLocalizedText } = useLanguage();

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#DDE8E1] dark:border-emerald-900/60 bg-white dark:bg-[#12281D] shadow-xs">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-[#063D2A] dark:bg-gradient-to-r dark:from-[#05261A] dark:via-[#0D3826] dark:to-[#05261A] text-white uppercase text-xs tracking-wider font-extrabold border-b dark:border-emerald-700/60">
          <tr>
            <th scope="col" className="px-5 py-4">{t('market_th_commodity')}</th>
            <th scope="col" className="px-5 py-4">{t('market_th_market')}</th>
            <th scope="col" className="px-5 py-4">{t('market_th_zone')}</th>
            <th scope="col" className="px-5 py-4">{t('market_th_unit')}</th>
            <th scope="col" className="px-5 py-4 text-right">{t('market_th_price')}</th>
            <th scope="col" className="px-5 py-4 text-center">{t('market_th_change')}</th>
            <th scope="col" className="px-5 py-4 text-right">{t('market_th_date')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DDE8E1] dark:divide-emerald-800/50 bg-white dark:bg-[#0D261B] font-medium text-[#14251D] dark:text-emerald-100">
          {items.map((item) => {
            const commodityName = item.commodity ? getLocalizedText(item.commodity) : (item.commodityKey ? t(item.commodityKey) : '');
            const marketName = getLocalizedText(item.market);
            const zoneName = getLocalizedText(item.zone);
            const unitName = getLocalizedText(item.unit);

            return (
              <tr key={item.id} className="hover:bg-[#EFF8F2]/60 dark:hover:bg-[#143B29] transition-colors">
                <td className="px-5 py-4 font-extrabold text-[#063D2A] dark:text-emerald-200">
                  {commodityName}
                </td>
                <td className="px-5 py-4 font-semibold">{marketName}</td>
                <td className="px-5 py-4 text-[#637069] dark:text-emerald-300/80">{zoneName}</td>
                <td className="px-5 py-4 text-[#637069] dark:text-emerald-300/80">{unitName}</td>
                <td className="px-5 py-4 text-right font-black text-base text-[#14251D] dark:text-white">
                  {item.priceETB.toLocaleString()} <span className="text-xs font-bold text-[#637069] dark:text-[#D7A928]">ETB</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold shadow-2xs ${
                      item.changePercent > 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/90 text-[#087A4B] dark:text-emerald-300 dark:border dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : item.changePercent < 0
                        ? 'bg-red-100 dark:bg-red-950/90 text-red-700 dark:text-red-300 dark:border dark:border-red-500/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.changePercent > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : item.changePercent < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : null}
                    {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-xs text-[#637069] dark:text-emerald-300/80">
                  {item.updatedDate}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const MarketSnapshotSection: React.FC = () => {
  const { t, getLocalizedText } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filterOptions = [
    { id: 'all', key: 'alert_category_all' },
    { id: 'teff', key: 'comm_teff' },
    { id: 'wheat', key: 'comm_wheat' },
    { id: 'maize', key: 'comm_maize' },
    { id: 'coffee', key: 'comm_coffee' },
  ];

  const filteredPrices = selectedFilter === 'all' 
    ? mockMarketPrices 
    : mockMarketPrices.filter(p => p.id.toLowerCase().includes(selectedFilter));

  return (
    <section className="bg-white dark:bg-[#0B1912] py-12 lg:py-20 border-b border-[#DDE8E1] dark:border-emerald-900/60 w-full max-w-full overflow-hidden transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 min-w-0">
          <SectionHeaderReveal
            eyebrow={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D7A928]/20 dark:bg-[#D7A928]/30 text-[#063D2A] dark:text-[#FDE68A] text-xs font-extrabold border border-[#D7A928]/30">
                <Sparkles className="h-3.5 w-3.5 text-[#D7A928]" />
                <span>Oromia Regional Market Intelligence</span>
              </div>
            }
            title={
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#14251D] dark:text-emerald-100 tracking-tight overflow-wrap-anywhere">
                {t('market_title')}
              </h2>
            }
            description={
              <p className="text-sm sm:text-base text-[#637069] dark:text-emerald-300/80">
                {t('market_subtitle')}
              </p>
            }
          />

          <div className="flex items-center gap-2 text-xs font-bold text-[#063D2A] dark:text-emerald-200 bg-[#EFF8F2] dark:bg-[#12281D] px-4 py-2 rounded-xl border border-[#DDE8E1] dark:border-emerald-800/60 shrink-0 self-start md:self-auto">
            <RefreshCw className="h-4 w-4 text-[#087A4B] dark:text-[#D7A928]" />
            <span>Updated: August 02, 2026</span>
          </div>
        </div>

        {/* Commodity Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#637069] dark:text-emerald-300/80 pr-2">
            <Filter className="h-4 w-4 text-[#087A4B] dark:text-[#D7A928]" />
            <span>Filter:</span>
          </div>
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedFilter(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === opt.id
                  ? 'bg-[#063D2A] dark:bg-emerald-700 text-white shadow-xs'
                  : 'bg-[#FAFAF7] dark:bg-[#12281D] text-[#14251D] dark:text-emerald-200 hover:bg-[#EFF8F2] dark:hover:bg-[#183627] border border-[#DDE8E1] dark:border-emerald-800/60'
              }`}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>

        {/* Prominent Disclaimer Notice */}
        <ScrollReveal variant="fade-up" duration={0.5}>
          <div className="mb-8 rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 shadow-2xs min-w-0">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="overflow-wrap-anywhere">{t('market_disclaimer')}</span>
          </div>
        </ScrollReveal>

        {/* Featured Price Cards Grid */}
        <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 min-w-0">
          {mockMarketPrices.slice(0, 4).map((item) => {
            const commName = item.commodity ? getLocalizedText(item.commodity) : (item.commodityKey ? t(item.commodityKey) : '');
            const mktName = getLocalizedText(item.market);
            const zName = getLocalizedText(item.zone);

            return (
              <StaggerItem key={item.id}>
                <div className="rounded-2xl border border-[#DDE8E1] dark:border-emerald-900/60 bg-[#FAFAF7] dark:bg-[#12281D] p-5 card-hover min-w-0 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#637069] dark:text-emerald-400/80 gap-2">
                      <span className="truncate">{zName} ({mktName})</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-[#087A4B] dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">Active</span>
                    </div>
                    <h3 className="text-base font-black text-[#063D2A] dark:text-emerald-100 mt-2 overflow-wrap-anywhere leading-snug">{commName}</h3>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between pt-2 border-t border-[#DDE8E1]/60 dark:border-emerald-900/40">
                    <div>
                      <span className="text-2xl font-black text-[#14251D] dark:text-white">{item.priceETB.toLocaleString()}</span>
                      <span className="text-xs font-bold text-[#637069] dark:text-emerald-400/80 ml-1">ETB</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold shrink-0 ${
                        item.changePercent > 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/80 text-[#087A4B] dark:text-emerald-300'
                          : 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {item.changePercent > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                    </span>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Responsive Market Section: Card list on mobile (<768px), Table on tablet/desktop (>=768px) */}
        <ScrollReveal variant="fade-up" duration={0.6}>
          <div className="block md:hidden w-full max-w-full">
            <MarketPriceCardList items={filteredPrices} />
          </div>

          <div className="hidden md:block w-full">
            <MarketPriceTable items={filteredPrices} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
