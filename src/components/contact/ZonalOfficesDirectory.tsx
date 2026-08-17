import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { mockOffices } from '../../data/mockData';
import { Office } from '../../types';
import {
  Building2,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Search,
  User,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const ZonalOfficesDirectory: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'central' | 'south' | 'west' | 'east'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const regionTabs = [
    { id: 'all', label: { om: 'Godinaalee Hunda (21)', am: 'ሁሉም ዞኖች (21)', en: 'All Zones (21)' } },
    { id: 'central', label: { om: 'Oromiyaa Giddugaleessaa', am: 'መካከለኛው ኦሮሚያ', en: 'Central Oromia' } },
    { id: 'south', label: { om: 'Oromiyaa Kibbaa', am: 'ደቡብ ኦሮሚያ', en: 'Southern Oromia' } },
    { id: 'west', label: { om: 'Oromiyaa Dhihaa', am: 'ምዕራብ ኦሮሚያ', en: 'Western Oromia' } },
    { id: 'east', label: { om: 'Oromiyaa Bahaa', am: 'ምስራቅ ኦሮሚያ', en: 'Eastern Oromia' } },
  ];

  const filteredOffices = useMemo(() => {
    return mockOffices.filter((office) => {
      const matchesRegion =
        selectedRegion === 'all' || office.region === selectedRegion;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesRegion;

      const matchesSearch =
        office.nameKey.toLowerCase().includes(q) ||
        office.zoneKey.toLowerCase().includes(q) ||
        (office.city && office.city.toLowerCase().includes(q)) ||
        office.headName.toLowerCase().includes(q) ||
        (office.extensionLead && office.extensionLead.toLowerCase().includes(q)) ||
        office.phone.includes(q) ||
        office.email.toLowerCase().includes(q) ||
        office.address.toLowerCase().includes(q);

      return matchesRegion && matchesSearch;
    });
  }, [searchQuery, selectedRegion]);

  const handleCopyDetails = (office: Office) => {
    const text = `${office.nameKey} (${office.zoneKey})
Director: ${office.headName}
Phone: ${office.phone}
Email: ${office.email}
Address: ${office.address}`;

    navigator.clipboard.writeText(text);
    setCopiedId(office.id);
    showToast(`Copied contact details for ${office.zoneKey}!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getRegionBadge = (region?: string) => {
    switch (region) {
      case 'central':
        return { label: 'Central', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'south':
        return { label: 'South', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'west':
        return { label: 'West', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'east':
        return { label: 'East', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      default:
        return { label: 'Zone', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  return (
    <section id="zonal-directory" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#15803d] dark:text-emerald-400">
            <span className="w-5 h-0.5 bg-[#15803d] rounded-full" />
            <span>
              {language === 'om'
                ? 'GALMEE WAAJJIRAALEE GODINAALEE'
                : language === 'am'
                ? 'የዞን ግብርና መምሪያዎች አድራሻ'
                : 'REGIONAL ZONAL DIRECTORY'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
            {language === 'om'
              ? 'Waajjiraalee Qonnaa Godinaalee 21n Oromiyaa'
              : language === 'am'
              ? 'የ21ዱ የኦሮሚያ ዞን ግብርና መምሪያዎች'
              : 'Directory of all 21 Oromia Zonal Agricultural Offices'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {language === 'om'
              ? 'Teessoo, hoogganaa waajjiraa, ogeessa eksteenshinii fi bilbila qajeeltoo argadhaa.'
              : language === 'am'
              ? 'የመምሪያ ኃላፊዎች፣ የኤክስቴንሽን አስተባባሪዎችና የቀጥታ ስልክ መስመሮች ዝርዝር።'
              : 'Direct telephone, leadership contacts, physical locations, and toll-free extensions.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'om'
                ? 'Godina, magaalaa, hoogganaa...'
                : language === 'am'
                ? 'ዞን፣ ከተማ ወይም ኃላፊ ፈልግ...'
                : 'Search zone, city, director...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] focus:ring-1 focus:ring-[#075D3A] outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Region Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {regionTabs.map((tab) => {
          const isSelected = selectedRegion === tab.id;
          const label = tab.label[language] || tab.label.en;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedRegion(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#075D3A] text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Results Count & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Showing <strong>{filteredOffices.length}</strong> of{' '}
            <strong>{mockOffices.length}</strong> Zonal Agricultural Directorates
          </span>
          {searchQuery && (
            <span>
              Filtered by &quot;<strong>{searchQuery}</strong>&quot;
            </span>
          )}
        </div>

        {filteredOffices.length === 0 ? (
          <div className="text-center py-12 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 space-y-3">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No zonal offices found
            </h3>
            <p className="text-xs text-gray-500">
              No bureau matches your search query. Try clearing filters or searching by zone capital.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#075D3A] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOffices.map((office) => {
              const badge = getRegionBadge(office.region);
              const isCopied = copiedId === office.id;

              return (
                <div
                  key={office.id}
                  className="flex flex-col justify-between rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all duration-200 p-5 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.color}`}
                        >
                          {badge.label} Corridor
                        </span>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1 leading-snug">
                          {office.zoneKey}
                        </h3>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#075D3A] dark:text-emerald-400 shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Official Bureau Name */}
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {office.nameKey}
                    </p>

                    {/* Leadership info */}
                    <div className="p-3 rounded-2xl bg-[#F8F7F2] dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/60 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                        <User className="w-3.5 h-3.5 text-[#075D3A] dark:text-emerald-400 shrink-0" />
                        <span>
                          <span className="font-semibold text-gray-500 dark:text-gray-400">Director: </span>
                          <strong>{office.headName}</strong>
                        </span>
                      </div>
                      {office.extensionLead && (
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>
                            <span className="text-gray-500">Extension Chief: </span>
                            {office.extensionLead}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contact particulars */}
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 pt-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="break-words leading-tight">
                          {office.address}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <a
                          href={`tel:${office.phone.replace(/\s+/g, '')}`}
                          className="font-bold text-gray-900 dark:text-white hover:text-[#075D3A] dark:hover:text-emerald-400"
                        >
                          {office.phone}
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <a
                          href={`mailto:${office.email}`}
                          className="text-[#075D3A] dark:text-emerald-400 hover:underline truncate"
                        >
                          {office.email}
                        </a>
                      </div>

                      {office.operatingHours && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{office.operatingHours}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyDetails(office)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Info</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`mailto:${office.email}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-[#075D3A] dark:text-emerald-400 text-xs font-bold transition-colors"
                      >
                        Email
                      </a>
                      <a
                        href={`tel:${office.phone.replace(/\s+/g, '')}`}
                        className="px-3.5 py-1.5 rounded-xl bg-[#075D3A] hover:bg-[#064E3B] text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
