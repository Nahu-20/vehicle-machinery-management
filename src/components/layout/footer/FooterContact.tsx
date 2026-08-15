import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { MapPin, Phone, Mail, Headphones } from 'lucide-react';

export const FooterContact: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#063D29] dark:text-[#A3E635]">
        {t('footer_contact_info')}
      </h4>

      {/* Contact Details List */}
      <ul className="space-y-3.5 text-sm sm:text-base text-[#4C6054] dark:text-[#A7F3D0]/90">
        <li className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F7EE] dark:bg-[#1A382A] text-[#075B36] dark:text-[#A3E635] shrink-0 mt-0.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="font-medium leading-relaxed pt-0.5">{t('footer_address')}</span>
        </li>

        <li className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F7EE] dark:bg-[#1A382A] text-[#075B36] dark:text-[#A3E635] shrink-0">
            <Phone className="h-4 w-4" aria-hidden="true" />
          </div>
          <a
            href="tel:+251115517000"
            className="font-bold text-[#063D29] dark:text-white hover:text-[#075B36] dark:hover:text-[#A3E635] transition-colors"
          >
            {t('footer_phone')}
          </a>
        </li>

        <li className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F7EE] dark:bg-[#1A382A] text-[#075B36] dark:text-[#A3E635] shrink-0">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </div>
          <a
            href="mailto:info@oab.gov.et"
            className="font-medium hover:text-[#075B36] dark:hover:text-[#A3E635] underline underline-offset-2 transition-colors"
          >
            {t('footer_email')}
          </a>
        </li>
      </ul>

      {/* Highlighted Toll-Free Helpline Card */}
      <div className="rounded-2xl bg-[#F2F7EF] dark:bg-[#132E21] p-4 sm:p-5 border border-[#DCEBD9] dark:border-[#224E38] shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-[#1B3F2E] text-[#075B36] dark:text-[#A3E635] shrink-0 shadow-2xs border border-[#E0EBE0] dark:border-[#2A523D]">
            <Headphones className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#637A6E] dark:text-[#A7F3D0]/80 block">
              {t('footer_toll_free_card')}
            </span>
            <a
              href="tel:8844"
              className="text-xl sm:text-2xl font-black text-[#063D29] dark:text-white tracking-wide hover:text-[#075B36] dark:hover:text-[#A3E635] transition-colors block"
            >
              {t('hotline_number')}
            </a>
            <p className="text-[11px] sm:text-xs text-[#7A8E83] dark:text-[#A7F3D0]/70 font-medium">
              {t('hotline_subtext')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
