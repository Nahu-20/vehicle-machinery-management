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
} from 'lucide-react';

export const WeatherAdvisorySection: React.FC = () => {
  const { t } = useLanguage();
  const [selectedZone, setSelectedZone] = useState<string>('Shewa & Arsi');

  const zones = ['Shewa & Arsi', 'Bale & Guji', 'Jimma & Illubabor', 'Hararghe & West Shewa'];

  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain': return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'CloudSun': return <CloudSun className="h-5 w-5 text-amber-500" />;
      case 'Sun': default: return <Sun className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-[#EFF8F2] via-white to-[#EFF8F2] py-16 lg:py-24 border-b border-[#DDE8E1]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/15 to-emerald-100 border border-[#087A4B]/25 text-[#087A4B] text-xs font-black mb-3 shadow-2xs">
              <CloudSun className="h-4 w-4 text-[#087A4B]" />
              <span>Agro-Meteorology & Extension Bulletin</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] tracking-tight">
              {t('weather_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] mt-2 max-w-2xl font-medium">
              {t('weather_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#637069] bg-white px-4 py-2.5 rounded-2xl border border-[#DDE8E1] shadow-xs shrink-0">
            <Sparkles className="h-4 w-4 text-[#D7A928]" />
            <span>{t('weather_disclaimer')}</span>
          </div>
        </div>

        {/* Zone Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <span className="text-xs font-black text-[#063D2A] shrink-0 flex items-center gap-1.5 pr-2 uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-[#087A4B]" />
            Select Zone:
          </span>
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 duration-200 ${
                selectedZone === z
                  ? 'bg-gradient-to-r from-[#063D2A] to-[#087A4B] text-white shadow-md'
                  : 'bg-white text-[#14251D] hover:bg-emerald-50 border border-[#DDE8E1]'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Weather & Advisory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Current Weather */}
          <div className="rounded-3xl border border-[#DDE8E1] bg-white p-6 shadow-xs hover:shadow-xl hover:border-[#087A4B] card-hover flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between text-xs font-black text-[#087A4B]">
                <span>{t('weather_current')}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF8F2] text-[#D7A928]">
                  <Thermometer className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs font-bold text-[#637069] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#087A4B]" />
                  {selectedZone}
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-[#14251D] tracking-tight">{mockWeather.temperatureC}°C</span>
                  <span className="text-xs font-black text-[#087A4B] bg-[#EFF8F2] px-2.5 py-1 rounded-lg border border-[#DDE8E1]">
                    {t(mockWeather.conditionKey)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDE8E1] grid grid-cols-2 gap-3 text-xs text-[#637069] font-bold">
              <div className="flex items-center gap-2 bg-[#FAFAF7] p-2.5 rounded-xl border border-[#DDE8E1]">
                <Droplets className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{t('weather_humidity')}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#FAFAF7] p-2.5 rounded-xl border border-[#DDE8E1]">
                <Wind className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{t('weather_wind')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: 3-Day Forecast */}
          <div className="rounded-3xl border border-[#DDE8E1] bg-white p-6 shadow-xs hover:shadow-xl hover:border-[#087A4B] card-hover flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between text-xs font-black text-[#087A4B]">
                <span>{t('weather_forecast')}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF8F2] text-[#087A4B]">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 space-y-3.5">
                {mockWeather.forecast.map((fc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-[#DDE8E1] pb-2.5 last:border-0 last:pb-0">
                    <span className="font-bold text-[#14251D]">{fc.dayKey}</span>
                    <div className="flex items-center gap-2.5">
                      {getWeatherIcon(fc.iconName)}
                      <span className="font-black text-[#14251D]">{fc.tempHigh}° / {fc.tempLow}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDE8E1] text-[11px] font-bold text-[#637069] text-center">
              Reliable 72-hr Agro-Forecast
            </div>
          </div>

          {/* Card 3: Planting Recommendation */}
          <div className="rounded-3xl border-2 border-emerald-400/60 bg-gradient-to-br from-white via-emerald-50/40 to-white p-6 shadow-xs hover:shadow-xl card-hover flex flex-col justify-between relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#3FAE5A]/15 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black text-[#087A4B]">
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-[#3FAE5A]" />
                  <span>{t('weather_planting_rec')}</span>
                </div>
                <span className="bg-emerald-100 text-[#087A4B] text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-300">HIGH PRIORITY</span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-[#14251D] leading-relaxed font-semibold">
                {t('weather_planting_text')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-200/80 flex items-center gap-2 text-xs font-black text-[#087A4B]">
              <CheckCircle2 className="h-4 w-4 text-[#3FAE5A]" />
              <span>Optimal sowing window for {selectedZone}</span>
            </div>
          </div>

          {/* Card 4: Rainfall Advisory */}
          <div className="rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-white via-amber-50/40 to-white p-6 shadow-xs hover:shadow-xl card-hover flex flex-col justify-between relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black text-amber-950">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>{t('weather_rainfall_adv')}</span>
                </div>
                <span className="bg-amber-100 text-amber-950 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-300">ACTION REQUIRED</span>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-[#14251D] leading-relaxed font-semibold">
                {t('weather_rainfall_text')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-200/80 flex items-center gap-2 text-xs font-black text-amber-950">
              <ShieldCheck className="h-4 w-4 text-[#D7A928]" />
              <span>Drainage & fertilizer application guide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
import { ShieldCheck } from 'lucide-react';
