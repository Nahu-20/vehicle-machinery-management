import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Building,
  Newspaper,
  FileText,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const DirectChannelsGrid: React.FC = () => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const channels = [
    {
      id: 'hq-sec',
      icon: Building,
      title: {
        om: 'Teessoo Waajjira Muummee (HQ)',
        am: 'የዋና መስሪያ ቤት አድራሻ',
        en: 'Bureau Headquarters & Secretariat',
      },
      badge: {
        om: 'Finfinnee HQ',
        am: 'አዲስ አበባ',
        en: 'Finfinnee HQ',
      },
      items: [
        {
          label: { om: 'Teessoo:', am: 'አድራሻ:', en: 'Address:' },
          value: 'Sarbet Oromia Bureau Complex, Finfinnee, Ethiopia',
          actionText: 'Copy Address',
          icon: MapPin,
        },
        {
          label: { om: 'Bilbila:', am: 'ስልክ:', en: 'Phone:' },
          value: '+251 11 551 7000',
          actionText: 'Call',
          isTel: true,
          icon: PhoneCall,
        },
        {
          label: { om: 'Imeelii:', am: 'ኢሜይል:', en: 'Email:' },
          value: 'info@oab.gov.et',
          actionText: 'Email',
          isMail: true,
          icon: Mail,
        },
        {
          label: { om: 'Postaa:', am: 'የፖ.ሳ.ቁ:', en: 'P.O. Box:' },
          value: 'P.O. Box 8770, Finfinnee',
          icon: FileText,
        },
      ],
    },
    {
      id: 'media-pr',
      icon: Newspaper,
      title: {
        om: 'Qunnamtii Miidiyaa & Sab-qunnamtii',
        am: 'የሚዲያና የህዝብ ግንኙነት ክፍል',
        en: 'Media Relations & Press Accreditation',
      },
      badge: {
        om: 'Press & Media',
        am: 'ፕሬስና ሚዲያ',
        en: 'Press & Media',
      },
      items: [
        {
          label: { om: 'Imeelii Miidiyaa:', am: 'የሚዲያ ኢሜይል:', en: 'Press Email:' },
          value: 'media@oab.gov.et',
          actionText: 'Email',
          isMail: true,
          icon: Mail,
        },
        {
          label: { om: 'Bilbila Qindeessaa:', am: 'የግንኙነት ስልክ:', en: 'PR Phone:' },
          value: '+251 11 551 7018',
          actionText: 'Call',
          isTel: true,
          icon: PhoneCall,
        },
        {
          label: { om: 'Sa\'aatii Gaaffii:', am: 'የጥያቄ ሰዓት:', en: 'Press Hours:' },
          value: 'Mon - Fri | 09:00 - 17:00 EAT',
          icon: Clock,
        },
        {
          label: { om: 'Maxxansaalee:', am: 'ጋዜጣዊ መግለጫዎች:', en: 'Bulletins:' },
          value: 'Official Gazette & Daily Agri Radio 98.4 FM',
          icon: Newspaper,
        },
      ],
    },
    {
      id: 'procurement-tender',
      icon: FileText,
      title: {
        om: 'Kutaa Bitta fi Caalbaasii Biiroo',
        am: 'የግዥና የጨረታ አስተዳደር ክፍል',
        en: 'Procurement & Tender Directorate',
      },
      badge: {
        om: 'Tenders & Bids',
        am: 'ጨረታዎች',
        en: 'Tenders & Bids',
      },
      items: [
        {
          label: { om: 'Imeelii Caalbaasii:', am: 'የጨረታ ኢሜይል:', en: 'Tender Email:' },
          value: 'procurement@oab.gov.et',
          actionText: 'Email',
          isMail: true,
          icon: Mail,
        },
        {
          label: { om: 'Bilbila Bitta:', am: 'የግዥ ስልክ:', en: 'Procurement Desk:' },
          value: '+251 11 551 7025',
          actionText: 'Call',
          isTel: true,
          icon: PhoneCall,
        },
        {
          label: { om: 'Gabaasa Sanadaa:', am: 'ሰነድ መግዣ:', en: 'Doc Purchase:' },
          value: 'Room 304, 3rd Floor, OAB Headquarters',
          icon: MapPin,
        },
        {
          label: { om: 'Sa\'aatii Cufiinsaa:', am: 'የመዝጊያ ሰዓት:', en: 'Bid Submissions:' },
          value: 'Mon - Fri | 08:30 - 16:30 EAT',
          icon: Clock,
        },
      ],
    },
    {
      id: 'extension-market',
      icon: Clock,
      title: {
        om: 'Sa\'aatii Tajaajilaa & Balbala Banamaa',
        am: 'የአገልግሎት ሰዓትና የእንግዳ አቀባበል',
        en: 'Public Service & Visiting Hours',
      },
      badge: {
        om: 'Official Schedule',
        am: 'የስራ ሰዓታት',
        en: 'Official Schedule',
      },
      items: [
        {
          label: { om: 'Wiixata - Kamisa:', am: 'ከሰኞ - ሐሙስ:', en: 'Mon - Thu:' },
          value: '08:30 - 12:30 & 13:30 - 17:30 EAT',
          icon: Clock,
        },
        {
          label: { om: 'Jimaata:', am: 'አርብ:', en: 'Friday:' },
          value: '08:30 - 11:30 & 13:30 - 17:30 EAT',
          icon: Clock,
        },
        {
          label: { om: 'Sanbata - Dilbata:', am: 'ቅዳሜና እሁድ:', en: 'Weekends:' },
          value: 'Closed (Toll-Free 8844 remaining active)',
          icon: Clock,
        },
        {
          label: { om: 'Ayyaana Mootummaa:', am: 'የበዓላት ቀናት:', en: 'Public Holidays:' },
          value: 'National and Regional holidays observed',
          icon: Building,
        },
      ],
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {language === 'om'
              ? 'Kutaalee fi Daayirektooreetota Biiroo Qunnamtii'
              : language === 'am'
              ? 'የዋና ቢሮው ዳይሬክቶሬቶችና የመረጃ ክፍሎች'
              : 'Direct Bureau Directorates & Department Channels'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {language === 'om'
              ? 'Kutaalee hojii ijoo adda baasuun qunnamtii saffisaa taasisaa.'
              : language === 'am'
              ? 'ለሚፈልጉት አገልግሎት ተገቢውን የስራ ክፍል በቀጥታ ያግኙ።'
              : 'Reach specialized technical departments, procurement desks, and public liaisons directly.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {channels.map((ch) => {
          const title = ch.title[language] || ch.title.en;
          const badge = ch.badge[language] || ch.badge.en;
          const Icon = ch.icon;

          return (
            <div
              key={ch.id}
              className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-xs space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-[#075D3A] dark:text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {title}
                      </h3>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    {badge}
                  </span>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
                  {ch.items.map((item, idx) => {
                    const label = item.label[language] || item.label.en;
                    const ItemIcon = item.icon;
                    const isCopied = copiedKey === item.value;

                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 py-1"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <ItemIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-gray-500 dark:text-gray-400 mr-1.5">
                              {label}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white break-words">
                              {item.value}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.isTel ? (
                            <a
                              href={`tel:${item.value.replace(/\s+/g, '')}`}
                              className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#075D3A] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-bold transition-colors"
                            >
                              Call
                            </a>
                          ) : item.isMail ? (
                            <a
                              href={`mailto:${item.value}`}
                              className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#075D3A] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-bold transition-colors"
                            >
                              Email
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopy(item.value, label)}
                              title="Copy"
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
