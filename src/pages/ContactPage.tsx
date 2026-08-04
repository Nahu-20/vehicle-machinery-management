import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockOffices } from '../data/mockData';
import { FeedbackModal } from '../components/common/FeedbackModal';
import { PhoneCall, Mail, MapPin, Clock, MessageSquare, Send, Building2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <div className="bg-[#F8F7F2] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="rounded-2xl bg-[#075D3A] text-white p-8 md:p-12 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D5A62E]">Oromia Government Contact</span>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">{t('nav_contact')}</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-2xl">{t('contact_subtitle')}</p>
        </div>

        {/* Central Bureau Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-white p-6 shadow-xs border space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#075D3A]">
              <PhoneCall className="h-6 w-6 text-[#D5A62E]" />
            </div>
            <h3 className="text-base font-bold text-[#17211B]">{t('hotline_label')}</h3>
            <p className="text-2xl font-black text-[#075D3A]">{t('hotline_number')}</p>
            <p className="text-xs text-[#5E6B63]">Free advice line for farmers across Oromia</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-xs border space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#075D3A]">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#17211B]">Central Email & HQ</h3>
            <p className="text-sm font-bold text-[#075D3A]">info@oab.gov.et</p>
            <p className="text-xs text-[#5E6B63]">{t('footer_address')}</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-xs border space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#075D3A]">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#17211B]">{t('hours_label')}</h3>
            <p className="text-sm font-bold text-[#075D3A]">{t('hours_text')}</p>
            <p className="text-xs text-[#5E6B63]">Closed on weekends and public holidays</p>
          </div>
        </div>

        {/* Action Button & Zonal Directory */}
        <div className="rounded-2xl bg-white p-8 shadow-xs border space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#075D3A]">Regional Zonal Bureau Directory</h2>
              <p className="text-xs text-[#5E6B63]">Contact details for Oromia Agricultural Bureau zonal headquarters</p>
            </div>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#075D3A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#14804A]"
            >
              <MessageSquare className="h-4 w-4 text-[#D5A62E]" />
              <span>{t('feedback_btn')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockOffices.map((office) => (
              <div key={office.id} className="rounded-xl border p-5 space-y-3 bg-[#F8F7F2]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#075D3A] text-sm">{office.zoneKey}</span>
                  <Building2 className="h-4 w-4 text-[#14804A]" />
                </div>
                <h3 className="text-base font-bold text-[#17211B]">{office.nameKey}</h3>
                <p className="text-xs text-[#5E6B63]">Zonal Director: <strong>{office.headName}</strong></p>

                <div className="pt-2 border-t text-xs space-y-1 text-[#5E6B63]">
                  <p>📍 {office.address}</p>
                  <p>📞 {office.phone}</p>
                  <p>✉️ {office.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
};
