import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface AboutBreadcrumbItem {
  label: string;
  href?: string;
}

interface AboutBreadcrumbsProps {
  items: AboutBreadcrumbItem[];
}

export const AboutBreadcrumbs: React.FC<AboutBreadcrumbsProps> = ({ items }) => {
  const { t } = useLanguage();
  const crumbs: AboutBreadcrumbItem[] = [
    { label: t('nav_home'), href: '/' },
    ...items,
  ];

  return (
    <nav aria-label={t('about_breadcrumb_aria')} className="mb-6 sm:mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[#56635B] dark:text-[#a5aba6]">
        {crumbs.map((item, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5 min-w-0">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
              )}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="truncate hover:text-[#063D2A] dark:hover:text-[#74d62c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] rounded"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${isLast ? 'font-semibold text-[#0A1912] dark:text-[#f5f6f3]' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
