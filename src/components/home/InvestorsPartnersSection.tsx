import React, { useRef, useLayoutEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AgriPillBadge } from '../common/AgriPillBadge';
import { Handshake } from 'lucide-react';
import { gsap } from '../../animation/gsap';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
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
} from './PartnerLogos';

export interface VerifiedPartner {
  id: string;
  name: string;
  LogoComponent: React.FC<{ className?: string }>;
}

export const VERIFIED_PARTNERS: VerifiedPartner[] = [
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

export const InvestorsPartnersSection: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const marqueeRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    if (isReducedMotion || !marqueeRef.current) return;

    const ctx = gsap.context(() => {
      tweenRef.current = gsap.to(marqueeRef.current, {
        xPercent: -50,
        repeat: -1,
        duration: 35,
        ease: 'none',
      });
    }, marqueeRef);

    return () => ctx.revert();
  }, [isReducedMotion]);

  return (
    <section className="bg-[#F6F7F3] dark:bg-[#0B1912] py-12 lg:py-16 border-b border-[#E2E8E3] dark:border-[#183327] overflow-hidden transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center space-y-2">
        <AgriPillBadge variant="lime" icon={<Handshake className="h-3.5 w-3.5 text-[#0A1912]" />}>
          Institutional & Development Partners
        </AgriPillBadge>

        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#111310] dark:text-white tracking-tight">
          {t('Our Partners') || 'Investors & Development Partners'}
        </h2>
      </div>

      {/* Pure Logo Strip - No Cards, No Descriptions */}
      {isReducedMotion ? (
        /* Reduced motion fallback: static wrapping list of pure logos */
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 py-4">
            {VERIFIED_PARTNERS.map((partner) => {
              const Logo = partner.LogoComponent;
              return (
                <div
                  key={partner.id}
                  className="opacity-70 hover:opacity-100 transition-opacity duration-200 text-[#1D3C2D] dark:text-[#E2E8E3]"
                  title={partner.name}
                  aria-label={partner.name}
                >
                  <Logo className="h-9 sm:h-11 w-auto object-contain" />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Animated GSAP Marquee - Clean Logo Stream */
        <div
          className="relative w-full overflow-hidden py-3"
          onMouseEnter={() => tweenRef.current?.pause()}
          onMouseLeave={() => tweenRef.current?.play()}
          onFocus={() => tweenRef.current?.pause()}
          onBlur={() => tweenRef.current?.play()}
          aria-label="Institutional Partner Logos Marquee"
        >
          {/* Edge gradient masks for seamless aesthetic fade */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#F6F7F3] dark:from-[#0B1912] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#F6F7F3] dark:from-[#0B1912] to-transparent z-10 pointer-events-none" />

          {/* Sliding track wrapper */}
          <div ref={marqueeRef} className="flex gap-12 sm:gap-16 w-max will-change-transform items-center">
            {/* Semantic Partner Logo List (First Copy) */}
            <div className="flex items-center gap-12 sm:gap-16 shrink-0">
              {VERIFIED_PARTNERS.map((partner) => {
                const Logo = partner.LogoComponent;
                return (
                  <div
                    key={`orig-${partner.id}`}
                    className="opacity-60 hover:opacity-100 focus:opacity-100 hover:scale-[1.035] transition-all duration-200 cursor-pointer text-[#1D3C2D] dark:text-[#E2E8E3] shrink-0"
                    title={partner.name}
                    tabIndex={0}
                  >
                    <Logo className="h-9 sm:h-12 w-auto object-contain" />
                  </div>
                );
              })}
            </div>

            {/* Duplicated Partner Logo List (Hidden from screen readers) */}
            <div className="flex items-center gap-12 sm:gap-16 shrink-0" aria-hidden="true">
              {VERIFIED_PARTNERS.map((partner) => {
                const Logo = partner.LogoComponent;
                return (
                  <div
                    key={`dup-${partner.id}`}
                    className="opacity-60 hover:opacity-100 focus:opacity-100 hover:scale-[1.035] transition-all duration-200 cursor-pointer text-[#1D3C2D] dark:text-[#E2E8E3] shrink-0"
                    title={partner.name}
                  >
                    <Logo className="h-9 sm:h-12 w-auto object-contain" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
