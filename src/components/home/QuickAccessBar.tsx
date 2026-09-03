import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CloudSun,
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  MonitorSmartphone,
  FolderDown,
  Bot,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * The eight shortcuts the Bureau's navigation document asks for under
 * "Important Quick-Access Buttons". Placed directly under the hero so a
 * farmer reaches the common tasks without opening a menu (note 10).
 */
const quickAccess = [
  { id: 'emergency', labelKey: 'qa_emergency', to: '/alerts', Icon: AlertTriangle, tone: 'urgent' },
  { id: 'weather', labelKey: 'qa_weather', to: '/services/weather', Icon: CloudSun, tone: 'normal' },
  { id: 'dashboard', labelKey: 'qa_dashboard', to: '/resources/dashboards', Icon: LayoutDashboard, tone: 'normal' },
  { id: 'calendar', labelKey: 'qa_calendar', to: '/services/crop-calendar', Icon: CalendarDays, tone: 'normal' },
  { id: 'market', labelKey: 'qa_market', to: '/services/market-prices', Icon: TrendingUp, tone: 'normal' },
  { id: 'online', labelKey: 'qa_online_services', to: '/services', Icon: MonitorSmartphone, tone: 'normal' },
  { id: 'downloads', labelKey: 'qa_downloads', to: '/resources/downloads', Icon: FolderDown, tone: 'normal' },
  { id: 'ai', labelKey: 'qa_ai', to: '/digital/ai', Icon: Bot, tone: 'normal' },
] as const;

export const QuickAccessBar: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="quick-access-heading"
      className="border-b border-[#E2E8E3] dark:border-[#183327] bg-white dark:bg-[#0B1912] py-8 lg:py-10"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="quick-access-heading"
          className="text-eyebrow font-bold text-[#087A4B] dark:text-[#74d62c] mb-5"
        >
          {t('qa_title')}
        </h2>

        <ul className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
          {quickAccess.map(({ id, labelKey, to, Icon, tone }) => (
            <li key={id}>
              <Link
                to={to}
                className={`hv-lift flex h-full flex-col items-center justify-start gap-2.5 rounded-2xl border p-4 text-center transition-colors ${
                  tone === 'urgent'
                    ? 'border-[#E4B4B4] dark:border-[#5c2b2b] bg-[#FDF3F3] dark:bg-[#1c1010] hover:bg-[#FBE9E9] dark:hover:bg-[#241414]'
                    : 'border-[#E2E8E3] dark:border-white/[0.09] bg-[#F8FAF7] dark:bg-[#111613] hover:bg-[#EFF8F2] dark:hover:bg-[#161d18]'
                }`}
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                    tone === 'urgent'
                      ? 'bg-[#C0392B]/12 text-[#B03A2E] dark:text-[#f08a80]'
                      : 'bg-[#087A4B]/12 text-[#087A4B] dark:text-[#74d62c]'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold leading-snug text-[#0A1912] dark:text-[#f5f6f3]">
                  {t(labelKey)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
