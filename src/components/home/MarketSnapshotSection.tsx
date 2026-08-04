import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockMarketPrices } from '../../data/mockData';
import { MarketPrice } from '../../types';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Filter, Sparkles } from 'lucide-react';

export const MarketPriceCardList: React.FC<{ items: MarketPrice[] }> = ({ items }) => {
  const { t, getLocalizedText } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#637069] bg-[#FAFAF7] rounded-2xl border border-[#DDE8E1]">
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
            className="w-full max-w-full min-w-0 rounded-2xl border border-[#DDE8E1] bg-white p-4 shadow-xs flex flex-col gap-3"
          >
            {/* Top row: Commodity & Change Badge */}
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#087A4B] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50 inline-block mb-1">
                  {t('market_th_commodity')}
                </span>
                <h3 className="text-base font-black text-[#063D2A] leading-tight overflow-wrap-anywhere break-words">
                  {commodityName}
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold shrink-0 ${
                  item.changePercent > 0
                    ? 'bg-emerald-100 text-[#087A4B]'
                    : item.changePercent < 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
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
            <div className="rounded-xl bg-[#EFF8F2] p-3 border border-[#DDE8E1] flex items-baseline justify-between">
              <span className="text-xs font-extrabold text-[#637069]">{t('market_th_price')}:</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#063D2A]">{item.priceETB.toLocaleString()}</span>
                <span className="text-xs font-bold text-[#087A4B] ml-1">ETB</span>
              </div>
            </div>

            {/* Grid of Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#DDE8E1]/60">
              <div>
                <span className="text-[11px] font-bold text-[#637069] block">{t('market_th_market')}</span>
                <span className="font-extrabold text-[#14251D] overflow-wrap-anywhere break-words">{marketName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#637069] block">{t('market_th_zone')}</span>
                <span className="font-extrabold text-[#14251D] overflow-wrap-anywhere break-words">{zoneName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#637069] block">{t('market_th_unit')}</span>
                <span className="font-medium text-[#14251D] overflow-wrap-anywhere break-words">{unitName}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#637069] block">{t('market_th_date')}</span>
                <span className="font-semibold text-[#637069]">{item.updatedDate}</span>
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
    <div className="overflow-x-auto rounded-2xl border border-[#DDE8E1] bg-white shadow-xs">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-[#063D2A] text-white uppercase text-xs tracking-wider font-extrabold">
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
        <tbody className="divide-y divide-[#DDE8E1] bg-white font-medium text-[#14251D]">
          {items.map((item) => {
            const commodityName = item.commodity ? getLocalizedText(item.commodity) : (item.commodityKey ? t(item.commodityKey) : '');
            const marketName = getLocalizedText(item.market);
            const zoneName = getLocalizedText(item.zone);
            const unitName = getLocalizedText(item.unit);

            return (
              <tr key={item.id} className="hover:bg-[#EFF8F2]/60 transition-colors">
                <td className="px-5 py-4 font-extrabold text-[#063D2A]">
                  {commodityName}
                </td>
                <td className="px-5 py-4 font-semibold">{marketName}</td>
                <td className="px-5 py-4 text-[#637069]">{zoneName}</td>
                <td className="px-5 py-4 text-[#637069]">{unitName}</td>
                <td className="px-5 py-4 text-right font-black text-base text-[#14251D]">
                  {item.priceETB.toLocaleString()} <span className="text-xs font-normal text-[#637069]">ETB</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                      item.changePercent > 0
                        ? 'bg-emerald-100 text-[#087A4B]'
                        : item.changePercent < 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
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
                <td className="px-5 py-4 text-right text-xs text-[#637069]">
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
    <section className="bg-white py-12 lg:py-20 border-b border-[#DDE8E1] w-full max-w-full overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 min-w-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D7A928]/20 text-[#063D2A] text-xs font-extrabold mb-3 border border-[#D7A928]/30">
              <Sparkles className="h-3.5 w-3.5 text-[#D7A928]" />
              <span>Oromia Regional Market Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#14251D] tracking-tight overflow-wrap-anywhere">
              {t('market_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] mt-2 max-w-2xl">
              {t('market_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#063D2A] bg-[#EFF8F2] px-4 py-2 rounded-xl border border-[#DDE8E1] shrink-0 self-start md:self-auto">
            <RefreshCw className="h-4 w-4 text-[#087A4B]" />
            <span>Updated: August 02, 2026</span>
          </div>
        </div>

        {/* Commodity Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#637069] pr-2">
            <Filter className="h-4 w-4 text-[#087A4B]" />
            <span>Filter:</span>
          </div>
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedFilter(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === opt.id
                  ? 'bg-[#063D2A] text-white shadow-xs'
                  : 'bg-[#FAFAF7] text-[#14251D] hover:bg-[#EFF8F2] border border-[#DDE8E1]'
              }`}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>

        {/* Prominent Disclaimer Notice */}
        <div className="mb-8 rounded-2xl bg-amber-50 p-4 border border-amber-200 flex items-center gap-3 text-xs sm:text-sm font-bold text-amber-900 shadow-2xs min-w-0">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="overflow-wrap-anywhere">{t('market_disclaimer')}</span>
        </div>

        {/* Featured Price Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 min-w-0">
          {mockMarketPrices.slice(0, 4).map((item) => {
            const commName = item.commodity ? getLocalizedText(item.commodity) : (item.commodityKey ? t(item.commodityKey) : '');
            const mktName = getLocalizedText(item.market);
            const zName = getLocalizedText(item.zone);
            const uName = getLocalizedText(item.unit);

            return (
              <div key={item.id} className="rounded-2xl border border-[#DDE8E1] bg-[#FAFAF7] p-5 card-hover min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#637069] gap-2">
                    <span className="truncate">{zName} ({mktName})</span>
                    <span className="text-[10px] bg-emerald-100 text-[#087A4B] px-2 py-0.5 rounded-full shrink-0">Active</span>
                  </div>
                  <h3 className="text-base font-black text-[#063D2A] mt-2 overflow-wrap-anywhere leading-snug">{commName}</h3>
                </div>
                <div className="mt-4 flex items-baseline justify-between pt-2 border-t border-[#DDE8E1]/60">
                  <div>
                    <span className="text-2xl font-black text-[#14251D]">{item.priceETB.toLocaleString()}</span>
                    <span className="text-xs font-bold text-[#637069] ml-1">ETB</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold shrink-0 ${
                      item.changePercent > 0
                        ? 'bg-emerald-100 text-[#087A4B]'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.changePercent > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsive Market Section: Card list on mobile (<768px), Table on tablet/desktop (>=768px) */}
        <div className="block md:hidden w-full max-w-full">
          <MarketPriceCardList items={filteredPrices} />
        </div>

        <div className="hidden md:block w-full">
          <MarketPriceTable items={filteredPrices} />
        </div>
      </div>
    </section>
  );
};
