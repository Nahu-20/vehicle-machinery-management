/**
 * Non-authoritative UI Analytics abstraction.
 * Completely separated from authoritative `adminAuditLogs`.
 */

export type UIAnalyticsEventType =
  | 'page_view'
  | 'filter_changed'
  | 'menu_opened'
  | 'button_clicked'
  | 'tab_selected';

export interface UIAnalyticsEvent {
  eventType: UIAnalyticsEventType;
  pagePath: string;
  details?: Record<string, any>;
  timestamp: number;
}

const ANALYTICS_ENABLED = false; // Disabled until explicit Bureau privacy policy is configured

export function trackUIEvent(eventType: UIAnalyticsEventType, details?: Record<string, any>): void {
  if (!ANALYTICS_ENABLED) {
    return;
  }

  const event: UIAnalyticsEvent = {
    eventType,
    pagePath: typeof window !== 'undefined' ? window.location.pathname : '',
    details,
    timestamp: Date.now(),
  };

  console.log('[UIAnalytics]', event);
}
