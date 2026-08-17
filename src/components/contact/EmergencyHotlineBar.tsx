import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  PhoneCall,
  Flame,
  Bug,
  CloudRain,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const EmergencyHotlineBar: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopy = (num: string, label: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    showToast(`${label}: ${num} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const emergencyContacts = [
    {
      id: 'hotline-main',
      icon: PhoneCall,
      color: 'bg-emerald-600',
      title: {
        om: 'Sarara Bilisaa Qonnaan Bulaa',
        am: 'የገበሬዎች ነፃ የጥሪ መስመር',
        en: 'Smallholder Farmer Hotline',
      },
      number: '8844',
      telLink: 'tel:8844',
      badge: {
        om: 'Toll-Free 24/7',
        am: 'ነፃ 24/7',
        en: 'Toll-Free 24/7',
      },
      desc: {
        om: 'Gorsa oomishtummaa, sanyii filatamaa fi gabaa bilisaan.',
        am: 'የምርታማነት፣ የምርጥ ዘርና የገበያ መረጃ በነፃ።',
        en: 'Direct agronomist advisory, input delivery & crop guidance.',
      },
    },
    {
      id: 'hotline-pest',
      icon: Bug,
      color: 'bg-amber-600',
      title: {
        om: 'Ittisa Dhukkubaa & Awaannisaa',
        am: 'የተምችና አደጋዎች መከላከያ',
        en: 'Desert Locust & Pest Rapid Response',
      },
      number: '+251 11 551 7000',
      telLink: 'tel:+251115517000',
      badge: {
        om: 'Rapid Dispatch',
        am: 'ፈጣን ምላሽ',
        en: 'Rapid Dispatch',
      },
      desc: {
        om: 'Gabaasa ariifachiisaa dhukkuba midhaanii fi arsiisaa.',
        am: 'ለአጣዳፊ የሰብል በሽታዎችና የበረሃ አንበጣ ሪፖርት ማድረጊያ።',
        en: 'Immediate escalation for armyworm, rust & locust swarms.',
      },
    },
    {
      id: 'hotline-input',
      icon: ShieldAlert,
      color: 'bg-rose-600',
      title: {
        om: 'Komii Raabsa Xaa\'oo & Galtee',
        am: 'የማዳበሪያና ግብዓት ቅሬታ ሰሚ',
        en: 'Fertilizer Price & Input Oversight',
      },
      number: '+251 11 551 7004',
      telLink: 'tel:+251115517004',
      badge: {
        om: 'Grievance Desk',
        am: 'የቅሬታ ሰሚ',
        en: 'Grievance Desk',
      },
      desc: {
        om: 'Gabaasa daldala seeraan alaa fi hanqina xaa\'oo.',
        am: 'ህገ-ወጥ የግብዓት ንግድና የማዳበሪያ እጥረት ሪፖርት ማድረጊያ።',
        en: 'Confidential reporting for price-gouging and cooperative issues.',
      },
    },
  ];

  return (
    <section id="hotlines" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <Flame className="w-4 h-4 animate-pulse" />
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {language === 'om'
              ? 'Sarara Bilbila Ariifachiisaa & Deeggarsa Hatattamaa'
              : language === 'am'
              ? 'የአደጋ ጊዜና የድንገተኛ ድጋፍ የስልክ መስመሮች'
              : 'Emergency Hotlines & Rapid Response Desks'}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {emergencyContacts.map((contact) => {
          const title = contact.title[language] || contact.title.en;
          const badge = contact.badge[language] || contact.badge.en;
          const desc = contact.desc[language] || contact.desc.en;
          const Icon = contact.icon;
          const isCopied = copiedNumber === contact.number;

          return (
            <div
              key={contact.id}
              className="relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${contact.color} text-white shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#075D3A] dark:text-emerald-400 font-mono tracking-tight">
                    {contact.number}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.number, title)}
                    title="Copy Phone Number"
                    aria-label={`Copy ${contact.number}`}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={contact.telLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#075D3A] hover:bg-[#064E3B] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{language === 'om' ? 'Bilbili' : language === 'am' ? 'ይደውሉ' : 'Call'}</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
