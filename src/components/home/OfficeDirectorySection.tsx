import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { mockOffices } from '../../data/mockData';
import { Office } from '../../types';
import { Building2, Phone, Mail, MapPin, Clock, ExternalLink, X, Sparkles, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OfficeDirectorySection: React.FC = () => {
  const { t } = useLanguage();
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = (officeId: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(officeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="relative bg-white py-16 lg:py-24 border-b border-[#DDE8E1]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#087A4B]/15 to-emerald-100 border border-[#087A4B]/25 text-[#087A4B] text-xs font-black mb-3 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#087A4B]" />
              <span>Zonal Office Directory & Extension Centers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14251D] tracking-tight">
              {t('offices_title')}
            </h2>
            <p className="text-sm sm:text-base text-[#637069] mt-2 max-w-2xl font-medium">
              {t('offices_subtitle')}
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-2xl bg-white border border-[#DDE8E1] px-6 py-3.5 text-xs sm:text-sm font-extrabold text-[#063D2A] hover:bg-[#063D2A] hover:text-white transition-all shadow-xs shrink-0 hover:shadow-md transform hover:-translate-y-0.5"
          >
            <span>All 21 Zonal Contacts</span>
            <ExternalLink className="h-4 w-4 text-[#D7A928]" />
          </Link>
        </div>

        {/* Office Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {mockOffices.map((office) => (
            <div
              key={office.id}
              className="group rounded-3xl border border-[#DDE8E1] bg-gradient-to-b from-white to-[#FAFAF7] p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-[#087A4B] transition-all duration-300 card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-[#EFF8F2] px-3.5 py-1.5 text-xs font-black text-[#087A4B] border border-emerald-200">
                    {office.zoneKey}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#063D2A] to-[#087A4B] text-[#D7A928] shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="mt-4 text-base sm:text-lg font-black text-[#14251D] group-hover:text-[#087A4B] transition-colors leading-snug">
                  {office.nameKey}
                </h3>

                <p className="mt-1.5 text-xs text-[#637069] font-medium">
                  Zonal Director: <strong className="text-[#14251D] font-bold">{office.headName}</strong>
                </p>

                <div className="mt-5 space-y-2.5 text-xs text-[#637069] border-t border-[#DDE8E1] pt-4">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#DDE8E1]">
                    <div className="flex items-center gap-2 text-[#14251D] font-bold">
                      <Phone className="h-4 w-4 text-[#087A4B] shrink-0" />
                      <span>{office.phone}</span>
                    </div>
                    <button
                      onClick={(e) => handleCopyPhone(office.id, office.phone, e)}
                      className="p-1 text-[#637069] hover:text-[#063D2A] rounded-md transition-colors"
                      title="Copy phone number"
                    >
                      {copiedId === office.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#DDE8E1]">
                    <Mail className="h-4 w-4 text-[#087A4B] shrink-0" />
                    <span className="truncate font-semibold text-[#14251D]">{office.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#DDE8E1] flex items-center justify-between">
                <span className="text-xs text-[#637069] font-semibold">Hours: 8:30 - 17:30</span>
                <button
                  onClick={() => setSelectedOffice(office)}
                  className="text-xs font-black text-[#063D2A] hover:text-[#087A4B] underline decoration-2 underline-offset-4"
                >
                  {t('office_action')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Office Modal */}
      {selectedOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-[#DDE8E1]">
            <div className="flex items-start justify-between border-b border-[#DDE8E1] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#063D2A] text-[#D7A928]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#14251D]">{selectedOffice.zoneKey}</h3>
                  <span className="text-xs text-[#637069]">Oromia Zonal Agricultural Office</span>
                </div>
              </div>
              <button onClick={() => setSelectedOffice(null)} className="p-1 text-gray-400 hover:text-black rounded-lg">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm">
              <h4 className="text-lg font-bold text-[#063D2A]">{selectedOffice.nameKey}</h4>
              <p className="text-[#637069]">Zonal Bureau Director: <strong className="text-[#14251D]">{selectedOffice.headName}</strong></p>

              <div className="rounded-xl bg-[#EFF8F2] p-4 space-y-3 border border-[#DDE8E1]">
                <div className="flex items-center gap-3 text-[#14251D] font-semibold">
                  <MapPin className="h-4 w-4 text-[#087A4B] shrink-0" />
                  <span>{selectedOffice.address}</span>
                </div>
                <div className="flex items-center gap-3 text-[#14251D] font-bold">
                  <Phone className="h-4 w-4 text-[#087A4B] shrink-0" />
                  <span>{selectedOffice.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-[#14251D] font-semibold">
                  <Mail className="h-4 w-4 text-[#087A4B] shrink-0" />
                  <span>{selectedOffice.email}</span>
                </div>
                <div className="flex items-center gap-3 text-[#14251D] font-medium">
                  <Clock className="h-4 w-4 text-[#087A4B] shrink-0" />
                  <span>{selectedOffice.operatingHours}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOffice(null)}
                className="rounded-xl bg-[#063D2A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#087A4B] transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
