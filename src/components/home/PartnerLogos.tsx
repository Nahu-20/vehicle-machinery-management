import React from 'react';

export interface PartnerLogoProps {
  className?: string;
}

export const LogoMoA: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ministry of Agriculture Ethiopia">
    <circle cx="25" cy="25" r="22" fill="#007A33" />
    <path d="M 25,8 L 28,18 L 38,18 L 30,24 L 33,34 L 25,28 L 17,34 L 20,24 L 12,18 L 22,18 Z" fill="#FCEE21" />
    <path d="M 16,36 Q 25,42 34,36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <text x="56" y="24" fontFamily="sans-serif" fontWeight="900" fontSize="13" fill="currentColor" letterSpacing="0.5">ETHIOPIA MoA</text>
    <text x="56" y="36" fontFamily="sans-serif" fontWeight="700" fontSize="9" fill="currentColor" opacity="0.7">MINISTRY OF AGRICULTURE</text>
  </svg>
);

export const LogoIQQO: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="IQQO Oromia Agricultural Research Institute">
    <polygon points="25,5 42,15 42,35 25,45 8,35 8,15" fill="#087A4B" />
    <path d="M 25,12 C 20,20 20,30 25,38 C 30,30 30,20 25,12 Z" fill="#A3E635" />
    <circle cx="25" cy="25" r="4" fill="#FFFFFF" />
    <text x="50" y="27" fontFamily="sans-serif" fontWeight="900" fontSize="18" fill="currentColor" letterSpacing="1">IQQO</text>
    <text x="50" y="38" fontFamily="sans-serif" fontWeight="700" fontSize="8" fill="currentColor" opacity="0.7">OROMIA AGRI RESEARCH</text>
  </svg>
);

export const LogoATI: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ATI Agricultural Transformation Institute">
    <rect x="8" y="24" width="8" height="18" rx="2" fill="#007A33" />
    <rect x="19" y="16" width="8" height="26" rx="2" fill="#2E9E44" />
    <rect x="30" y="8" width="8" height="34" rx="2" fill="#A3E635" />
    <path d="M 12,20 Q 25,6 38,12" stroke="#D7A928" strokeWidth="3" fill="none" strokeLinecap="round" />
    <text x="46" y="28" fontFamily="sans-serif" fontWeight="900" fontSize="20" fill="currentColor" letterSpacing="1">ATI</text>
    <text x="46" y="38" fontFamily="sans-serif" fontWeight="700" fontSize="8" fill="currentColor" opacity="0.7">TRANSFORMATION INST.</text>
  </svg>
);

export const LogoFAO: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FAO Food and Agriculture Organization">
    <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M 25,8 Q 30,25 25,42 M 25,8 Q 20,25 25,42 M 8,25 L 42,25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M 25,12 C 18,20 32,30 25,38" stroke="#A3E635" strokeWidth="3" fill="none" />
    <text x="52" y="29" fontFamily="sans-serif" fontWeight="900" fontSize="22" fill="currentColor" letterSpacing="2">FAO</text>
    <text x="52" y="39" fontFamily="sans-serif" fontWeight="700" fontSize="7.5" fill="currentColor" opacity="0.7">UNITED NATIONS</text>
  </svg>
);

export const LogoWorldBank: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="World Bank Group">
    <circle cx="24" cy="25" r="18" fill="#0071BC" />
    <circle cx="24" cy="25" r="14" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
    <path d="M 12,25 L 36,25 M 24,13 L 24,37 M 15,18 L 33,32 M 15,32 L 33,18" stroke="#FFFFFF" strokeWidth="1" />
    <text x="48" y="23" fontFamily="sans-serif" fontWeight="800" fontSize="11" fill="currentColor" letterSpacing="0.5">WORLD BANK GROUP</text>
    <text x="48" y="35" fontFamily="sans-serif" fontWeight="700" fontSize="8" fill="currentColor" opacity="0.7">AGRI GROWTH PROGRAM</text>
  </svg>
);

export const LogoCoopBank: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 170 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cooperative Bank of Oromia">
    <rect x="6" y="10" width="30" height="30" rx="8" fill="#006837" />
    <path d="M 14,25 Q 21,15 28,25 T 42,25" stroke="#FCEE21" strokeWidth="3" fill="none" />
    <circle cx="21" cy="25" r="4" fill="#FCEE21" />
    <text x="42" y="24" fontFamily="sans-serif" fontWeight="900" fontSize="13" fill="currentColor">COOP BANK</text>
    <text x="42" y="36" fontFamily="sans-serif" fontWeight="700" fontSize="8" fill="currentColor" opacity="0.7">COOPERATIVE BANK OF OROMIA</text>
  </svg>
);

export const LogoCIMMYT: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CIMMYT Maize and Wheat Improvement">
    <path d="M 12,38 C 12,20 28,10 28,10 C 28,10 22,26 22,38 Z" fill="#D7A928" />
    <path d="M 24,38 C 24,20 40,10 40,10 C 40,10 34,26 34,38 Z" fill="#087A4B" />
    <text x="46" y="27" fontFamily="sans-serif" fontWeight="900" fontSize="17" fill="currentColor" letterSpacing="1">CIMMYT</text>
    <text x="46" y="38" fontFamily="sans-serif" fontWeight="700" fontSize="8" fill="currentColor" opacity="0.7">MAIZE & WHEAT RESEARCH</text>
  </svg>
);

export const LogoILRI: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 140 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ILRI International Livestock Research Institute">
    <path d="M 10,12 L 35,12 L 35,38 L 10,38 Z" fill="#0055A5" rx="4" />
    <path d="M 16,20 C 22,16 28,24 30,32" stroke="#A3E635" strokeWidth="3" fill="none" strokeLinecap="round" />
    <text x="42" y="28" fontFamily="sans-serif" fontWeight="900" fontSize="20" fill="currentColor" letterSpacing="1.5">ILRI</text>
    <text x="42" y="38" fontFamily="sans-serif" fontWeight="700" fontSize="7.5" fill="currentColor" opacity="0.7">LIVESTOCK RESEARCH</text>
  </svg>
);

export const LogoCBE: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Commercial Bank of Ethiopia">
    <circle cx="24" cy="25" r="18" fill="#8B6F13" />
    <path d="M 18,18 L 30,18 L 30,22 L 22,22 L 22,28 L 29,28 L 29,32 L 18,32 Z" fill="#FFFFFF" />
    <text x="48" y="24" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="currentColor">CBE AGRO</text>
    <text x="48" y="36" fontFamily="sans-serif" fontWeight="700" fontSize="8" fill="currentColor" opacity="0.7">COMMERCIAL BANK ETHIOPIA</text>
  </svg>
);

export const LogoAGRA: React.FC<PartnerLogoProps> = ({ className = "h-10 w-auto" }) => (
  <svg className={className} viewBox="0 0 150 50" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AGRA Alliance for a Green Revolution in Africa">
    <circle cx="22" cy="25" r="17" fill="#008A3B" />
    <path d="M 14,22 C 22,14 30,22 30,30 C 22,34 14,30 14,22 Z" fill="#A3E635" />
    <text x="45" y="27" fontFamily="sans-serif" fontWeight="900" fontSize="20" fill="currentColor" letterSpacing="1">AGRA</text>
    <text x="45" y="38" fontFamily="sans-serif" fontWeight="700" fontSize="8" fill="currentColor" opacity="0.7">GREEN REVOLUTION</text>
  </svg>
);
