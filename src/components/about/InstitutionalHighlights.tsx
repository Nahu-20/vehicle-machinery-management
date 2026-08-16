import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  LogoMoA,
  LogoIQQO,
  LogoATI,
  LogoFAO,
  LogoWorldBank,
  LogoCoopBank,
  LogoCIMMYT,
  LogoILRI,
  LogoCBE,
  LogoAGRA,
} from '../home/PartnerLogos';

export const INSTITUTIONAL_PARTNERS = [
  { id: 'moa', name: 'Ministry of Agriculture Ethiopia', LogoComponent: LogoMoA },
  { id: 'iqqo', name: 'Oromia Agricultural Research Institute', LogoComponent: LogoIQQO },
  { id: 'ati', name: 'Agricultural Transformation Institute', LogoComponent: LogoATI },
  { id: 'fao', name: 'Food and Agriculture Organization', LogoComponent: LogoFAO },
  { id: 'worldbank', name: 'World Bank Agricultural Growth Program', LogoComponent: LogoWorldBank },
  { id: 'coopbank', name: 'Cooperative Bank of Oromia', LogoComponent: LogoCoopBank },
  { id: 'cimmyt', name: 'CIMMYT Maize & Wheat Improvement', LogoComponent: LogoCIMMYT },
  { id: 'ilri', name: 'International Livestock Research Institute', LogoComponent: LogoILRI },
  { id: 'cbe', name: 'Commercial Bank of Ethiopia', LogoComponent: LogoCBE },
  { id: 'agra', name: 'Alliance for a Green Revolution in Africa', LogoComponent: LogoAGRA },
];

export const InstitutionalHighlights: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="bg-[#F3F4EE] dark:bg-[#0B100D] py-10 lg:py-12 border-b border-[#E2E8E3] dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <p className="text-xs font-bold tracking-widest text-[#5B6B60] dark:text-[#a5aba6] uppercase">
            {t('about_partner_title')}
          </p>
        </div>

        {/* Clean Logo Grid with Accessible Titles & Balanced Spacing */}
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-14">
          {INSTITUTIONAL_PARTNERS.slice(0, 6).map((partner) => {
            const Logo = partner.LogoComponent;
            return (
              <div
                key={partner.id}
                className="opacity-70 hover:opacity-100 transition-opacity duration-200 text-[#1D3C2D] dark:text-[#E2E8E3]"
                title={partner.name}
                aria-label={partner.name}
              >
                <Logo className="h-8 sm:h-9 w-auto object-contain" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
