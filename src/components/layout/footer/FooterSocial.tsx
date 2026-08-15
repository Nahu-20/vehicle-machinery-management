import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Facebook, Twitter, Youtube, Linkedin, Send } from 'lucide-react';

interface SocialLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export const FooterSocial: React.FC = () => {
  const { t } = useLanguage();

  const socialLinks: SocialLink[] = [
    { name: 'Facebook', href: 'https://facebook.com/OromiaAgriBureau', icon: Facebook },
    { name: 'X', href: 'https://x.com/OromiaAgri', icon: Twitter },
    { name: 'YouTube', href: 'https://youtube.com/@OromiaAgriBureau', icon: Youtube },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/oromia-agricultural-bureau', icon: Linkedin },
    { name: 'Telegram', href: 'https://t.me/OromiaAgriBureau', icon: Send },
  ];

  return (
    <div className="space-y-3">
      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#063D29] dark:text-[#A3E635] block">
        {t('footer_follow_us')}
      </span>
      <div className="flex items-center flex-wrap gap-2.5">
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Oromia Agricultural Bureau on ${social.name}`}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#F2F7EF] dark:bg-[#153424] border border-[#DCEBD9] dark:border-[#224E38] text-[#075B36] dark:text-[#A7F3D0] hover:bg-[#075B36] hover:text-white dark:hover:bg-[#087A4B] dark:hover:text-white hover:border-transparent transition-all duration-200 shadow-2xs hover:shadow-xs hover:scale-105"
            >
              <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </div>
  );
};
