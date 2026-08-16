import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Mail, CheckCircle2 } from 'lucide-react';

export const FooterNewsletter: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setIsSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setIsSubscribed(false);
    }, 4000);
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#EBF5E8] dark:bg-[#161d18] text-[#075B36] dark:text-[#74d62c] shrink-0 shadow-2xs">
          <Mail className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#063D29] dark:text-[#74d62c]">
            {t('footer_stay_updated')}
          </h4>
          <p className="text-xs sm:text-sm text-[#4E6155] dark:text-[#a5aba6] font-normal">
            {t('footer_newsletter_desc')}
          </p>
        </div>
      </div>

      {isSubscribed ? (
        <div className="flex items-center gap-2 rounded-2xl bg-[#EDF7EA] dark:bg-[#161d18] border border-[#D0E5CC] dark:border-white/[0.12] p-3 text-xs sm:text-sm font-semibold text-[#075B36] dark:text-[#74d62c] animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-[#075B36] dark:text-[#74d62c] shrink-0" />
          <span>{t('footer_subscribed_msg')}</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-1.5">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                id="footer-newsletter-email-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder={t('footer_newsletter_placeholder')}
                aria-label={t('footer_newsletter_placeholder')}
                className="w-full rounded-full bg-white dark:bg-[#181c19] border border-[#CCDDC8] dark:border-white/[0.12] px-4 py-2.5 text-xs sm:text-sm text-[#063D29] dark:text-[#f5f6f3] placeholder-[#7A8E83] dark:placeholder-[#737b75] focus:outline-none focus:ring-2 focus:ring-[#075B36] dark:focus:ring-[#74d62c] shadow-2xs"
              />
            </div>
            <button
              type="submit"
              id="footer-newsletter-subscribe-btn"
              className="inline-flex items-center justify-center rounded-full bg-[#075B36] hover:bg-[#064A2C] dark:bg-[#74d62c] dark:hover:bg-[#8be63a] text-white dark:text-[#070908] px-6 py-2.5 text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer shrink-0 min-h-[40px]"
            >
              {t('footer_subscribe_btn')}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400 pl-3">{error}</p>}
        </form>
      )}
    </div>
  );
};
