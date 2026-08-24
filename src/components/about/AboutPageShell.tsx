import React from 'react';
import { AboutBreadcrumbs, AboutBreadcrumbItem } from './AboutBreadcrumbs';
import { useLanguage } from '../../context/LanguageContext';

interface AboutPageShellProps {
  children: React.ReactNode;
  breadcrumbs?: AboutBreadcrumbItem[];
  showPlaceholderBanner?: boolean;
  className?: string;
}

export const AboutPageShell: React.FC<AboutPageShellProps> = ({
  children,
  breadcrumbs,
  showPlaceholderBanner = true,
  className = '',
}) => {
  const { t } = useLanguage();

  return (
    <div
      className={`bg-[#F8F7F2] dark:bg-[#070908] min-h-screen text-[#111310] dark:text-[#f5f6f3] transition-colors duration-300 ${className}`}
    >
      {showPlaceholderBanner && (
        <div
          role="status"
          className="border-b border-[#D7A928]/35 bg-[#FFF8E8] dark:bg-[#1a1810] dark:border-[#e4ad37]/25 px-4 py-2.5 text-center text-xs sm:text-sm text-[#5C4A12] dark:text-[#e8d9a8]"
        >
          {t('about_placeholder_banner')}
        </div>
      )}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {breadcrumbs && breadcrumbs.length > 0 && <AboutBreadcrumbs items={breadcrumbs} />}
      </div>
      {children}
    </div>
  );
};
