import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockWeather } from '../../data/mockData';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Calendar,
  AlertTriangle,
  Sparkles,
  Thermometer,
  Sprout,
  MapPin,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const WeatherAdvisorySection: React.FC = () => {
  const { t } = useLanguage();
  const [selectedZone, setSelectedZone] = useState<string>('Shewa & Arsi');

  const zones = ['Shewa & Arsi', 'Bale & Guji', 'Jimma & Illubabor', 'Hararghe & West Shewa'];

  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain': return <CloudRain className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case 'CloudSun': return <CloudSun className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      case 'Sun': default: return <Sun className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-[#EFF8F2] via-white to-[#EFF8F2] dark:from-[#0B1912] dark:via-[#0E2218] dark:to-[#0B1912] py-16 lg:py-24 border-b border-[#DDE8E1] dark:border-emerald-900/60 transition-colors duration-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/15 to-emerald-100 dark:from-[#087A4B]/30 dark:to-emerald-900/50 border border-[#087A4B]/25 text-[#087A4B] dark:text-emerald-300 text-xs font-black mb-3 shadow-2xs">
              <CloudSun className="h-4 w-4 text-[#087A4B] dark:text-[#D7A928]" />
              <span>Agro-Meteorology & Extension Bulletin</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] dark:text-emerald-100 tracking-tight">
              {t('weather_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] dark:text-emerald-300/80 mt-2 max-w-2xl font-medium">
              {t('weather_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#637069] dark:text-emerald-300/80 bg-white dark:bg-[#12281D] px-4 py-2.5 rounded-2xl border border-[#DDE8E1] dark:border-emerald-800/60 shadow-xs shrink-0">
            <Sparkles className="h-4 w-4 text-[#D7A928]" />
            <span>{t('weather_disclaimer')}</span>
          </div>
        </div>

        {/* Zone Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <span className="text-xs font-black text-[#063D2A] dark:text-emerald-200 shrink-0 flex items-center gap-1.5 pr-2 uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-[#087A4B] dark:text-[#D7A928]" />
            Select Zone:
          </span>
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 duration-200 ${
                selectedZone === z
                  ? 'bg-gradient-to-r from-[#063D2A] to-[#087A4B] dark:from-emerald-800 dark:to-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#12281D] text-[#14251D] dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-[#183627] border border-[#DDE8E1] dark:border-emerald-800/60'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Weather & Advisory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Current Weather */}
          <div className="rounded-3xl border border-[#DDE8E1] dark:border-emerald-800/60 bg-white dark:bg-gradient-to-br dark:from-[#0B251A] dark:via-[#113123] dark:to-[#081B12] p-6 shadow-xs hover:shadow-xl dark:hover:border-emerald-400 dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] card-hover flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between text-xs font-black text-[#087A4B] dark:text-emerald-300">
                <span>{t('weather_current')}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF8F2] dark:bg-emerald-900/60 text-[#D7A928] dark:shadow-[0_0_15px_rgba(215,169,40,0.3)]">
                  <Thermometer className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs font-bold text-[#637069] dark:text-emerald-200/80 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#D7A928]" />
                  {selectedZone}
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-[#14251D] dark:text-white tracking-tight">{mockWeather.temperatureC}°C</span>
                  <span className="text-xs font-black text-[#087A4B] dark:text-emerald-200 bg-[#EFF8F2] dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-[#DDE8E1] dark:border-emerald-700/60">
                    {t(mockWeather.conditionKey)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDE8E1] dark:border-emerald-800/50 grid grid-cols-2 gap-3 text-xs text-[#637069] dark:text-emerald-200/90 font-bold">
              <div className="flex items-center gap-2 bg-[#FAFAF7] dark:bg-[#153828] p-2.5 rounded-xl border border-[#DDE8E1] dark:border-emerald-700/60">
                <Droplets className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>{t('weather_humidity')}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#FAFAF7] dark:bg-[#153828] p-2.5 rounded-xl border border-[#DDE8E1] dark:border-emerald-700/60">
                <Wind className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('weather_wind')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: 3-Day Forecast */}
          <div className="rounded-3xl border border-[#DDE8E1] dark:border-emerald-800/60 bg-white dark:bg-gradient-to-br dark:from-[#0D291C] dark:via-[#133626] dark:to-[#0A2016] p-6 shadow-xs hover:shadow-xl dark:hover:border-emerald-400 dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] card-hover flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between text-xs font-black text-[#087A4B] dark:text-emerald-300">
                <span>{t('weather_forecast')}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF8F2] dark:bg-emerald-900/60 text-[#087A4B] dark:text-emerald-300">
                  <Calendar className="h-4 w-4 text-[#D7A928]" />
                </div>
              </div>

              <div className="mt-5 space-y-3.5">
                {mockWeather.forecast.map((fc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-[#DDE8E1] dark:border-emerald-800/50 pb-2.5 last:border-0 last:pb-0">
                    <span className="font-bold text-[#14251D] dark:text-emerald-100">{fc.dayKey}</span>
                    <div className="flex items-center gap-2.5">
                      {getWeatherIcon(fc.iconName)}
                      <span className="font-black text-[#14251D] dark:text-white">{fc.tempHigh}° / {fc.tempLow}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDE8E1] dark:border-emerald-800/50 text-[11px] font-bold text-[#637069] dark:text-emerald-300/80 text-center">
              Reliable 72-hr Agro-Forecast
            </div>
          </div>

          {/* Card 3: Planting Recommendation */}
          <div className="rounded-3xl border-2 border-emerald-400/60 dark:border-emerald-400/80 bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-[#0F3624] dark:via-[#184A33] dark:to-[#0C2A1C] p-6 shadow-xs hover:shadow-xl dark:shadow-[0_0_30px_rgba(16,185,129,0.25)] card-hover flex flex-col justify-between relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#3FAE5A]/15 dark:bg-emerald-400/20 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black text-[#087A4B] dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-[#3FAE5A] dark:text-emerald-300" />
                  <span>{t('weather_planting_rec')}</span>
                </div>
                <span className="bg-emerald-100 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-800 text-[#087A4B] dark:text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-400 shadow-xs">HIGH PRIORITY</span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-[#14251D] dark:text-emerald-50 leading-relaxed font-semibold">
                {t('weather_planting_text')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-200/80 dark:border-emerald-700/60 flex items-center gap-2 text-xs font-black text-[#087A4B] dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-[#3FAE5A] dark:text-emerald-400" />
              <span>Optimal sowing window for {selectedZone}</span>
            </div>
          </div>

          {/* Card 4: Rainfall Advisory */}
          <div className="rounded-3xl border-2 border-amber-400/60 dark:border-amber-400/80 bg-gradient-to-br from-white via-amber-50/40 to-white dark:from-[#2A1E08] dark:via-[#3B2B0C] dark:to-[#1F1605] p-6 shadow-xs hover:shadow-xl dark:shadow-[0_0_30px_rgba(245,158,11,0.25)] card-hover flex flex-col justify-between relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 dark:bg-amber-400/20 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black text-amber-950 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>{t('weather_rainfall_adv')}</span>
                </div>
                <span className="bg-amber-100 dark:bg-gradient-to-r dark:from-amber-500 dark:to-yellow-500 text-amber-950 dark:text-[#061810] text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-300 shadow-xs">ACTION REQUIRED</span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-[#14251D] dark:text-amber-100 leading-relaxed font-semibold">
                {t('weather_rainfall_text')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2 text-xs font-black text-amber-950 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4 text-[#D7A928]" />
              <span>Drainage & fertilizer application guide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
