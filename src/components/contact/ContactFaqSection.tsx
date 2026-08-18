import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PhoneCall,
  ShieldAlert,
  Sprout,
  Users,
} from 'lucide-react';

export const ContactFaqSection: React.FC = () => {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: {
        om: 'Sarara bilbila bilisaa 8844 yoomii fi akkamitti fayyadamuun danda\'ama?',
        am: 'የነፃ የስልክ መስመር 8844ን መቼ እና እንዴት መጠቀም እችላለሁ?',
        en: 'When and how can I access the Toll-Free 8844 Farmer Helpline?',
      },
      answer: {
        om: 'Sararri 8844 bilisaan Ethio Telecom fi Safaricom irraa torbanitti guyyoota 7 sa\'aatii 24 banaadha. Gorsa ogeessa qonnaa, odeeffannoo gatii gabaa, fi kalendara roobaa yeroo kamiyyuu argachuu dandeessu.',
        am: 'የ8844 መስመር ከኢትዮ ቴሌኮምና ሳፋሪኮም በነፃ በሳምንት 7 ቀናት 24 ሰዓት ክፍት ነው። የግብርና ባለሙያ ምክር፣ የገበያ ዋጋና የአየር ሁኔታ መረጃ ማግኘት ይችላሉ።',
        en: 'The 8844 helpline is accessible free of charge across Ethio Telecom and Safaricom networks 24/7. Farmers receive real-time agronomic advisory, weather updates, and input distribution notifications.',
      },
      tag: 'Hotline 8844',
    },
    {
      question: {
        om: 'Hanqina xaa\'oo ykn daldala seeraan alaa akkamittiin gabaasuun danda\'ama?',
        am: 'የማዳበሪያ እጥረት ወይም ህገ-ወጥ የዋጋ ጭማሪ እንዴት ሪፖርት ይደረጋል?',
        en: 'How do I report fertilizer price gouging or cooperative distribution irregularities?',
      },
      answer: {
        om: 'Kutaa Komii fi To\'annoo Galtee Biiroo Qonnaa sarara +251 11 551 7004 irratti ykn foormii ergaa fuula kana irra jiruun gosa "Galtee Qonnaa" filachuun gabaasa icciitii erguu dandeessu.',
        am: 'የቢሮውን የግብዓት ቁጥጥር ክፍል በ+251 11 551 7004 ወይም በዚህ ገጽ ላይ ባለው ቅጽ "የግብዓት ቅሬታ" የሚለውን በመምረጥ በሚስጥር ሪፖርት ማድረግ ይችላሉ።',
        en: 'You can submit confidential reports directly via our Input Oversight Desk at +251 11 551 7004 or use the online dispatch form on this page by selecting the "Fertilizer & Inputs" category.',
      },
      tag: 'Oversight',
    },
    {
      question: {
        om: 'Ogeessa Eksteenshinii Ganda koo (DA) akkamittiin qunnama?',
        am: 'የቀበሌ የልማት ጣቢያ (DA) ባለሙያዎችን እንዴት ማግኘት ይቻላል?',
        en: 'How can I connect with my local Kebele Development Agent (DA)?',
      },
      answer: {
        om: 'Waajjira Qonnaa Aanaa keessaniitti dhihaachuun ykn Waajjira Qonnaa Godina keessanii tarree fuula kana irra jiru fayyadamuun bilbiluun teessoo ogeessa ganda keessanii argachuu dandeessu.',
        am: 'በወረዳዎ ግብርና ጽሕፈት ቤት ወይም በዚህ ገጽ ላይ ከተዘረዘሩት የዞን መምሪያዎች ስልክ ቁጥር በመደወል የቀበሌዎን ባለሙያ አድራሻ ማግኘት ይችላሉ።',
        en: 'You can contact your respective Zonal Directorate from the directory on this page, or dial 8844 with your Kebele name to be connected to the assigned Kebele Development Agent.',
      },
      tag: 'Extension',
    },
    {
      question: {
        om: 'Invesutaroonni qonnaa carraalee investimentii Oromiyaa irratti akkamitti gorsa argatu?',
        am: 'የግብርና ባለሀብቶች በኦሮሚያ ስላሉ የኢንቨስትመንት ዕድሎች መረጃ እንዴት ያገኛሉ?',
        en: 'How can commercial agribusiness investors consult the Investment Desk?',
      },
      answer: {
        om: 'Deskii Investimentii Biiroo Qonnaa Oromiyaa info@oab.gov.et irratti xalayaa erguun ykn fuula Investimentii keenya daawwachuun kaartaa lafa qonnaa fi carraalee misoomaa qorachuu dandeessu.',
        am: 'በinfo@oab.gov.et ኢሜይል በመላክ ወይም በድረ-ገጻችን የኢንቨስትመንት ክፍል በመግባት የግብርና መሬትና የልማት አማራጮችን ማሰስ ይችላሉ።',
        en: 'Reach the Agricultural Investment Directorate via info@oab.gov.et or explore our interactive Investment Map to assess agro-ecological zones, high-value export corridors, and land lease frameworks.',
      },
      tag: 'Investment',
    },
    {
      question: {
        om: 'Ergaan sarara intarneetiin ergame yeroo hammam keessatti deebii argata?',
        am: 'በድረ-ገጹ በኩል የሚላክ መልዕክት በስንት ጊዜ ውስጥ ምላሽ ያገኛል?',
        en: 'What is the official response SLA for inquiries submitted via this portal?',
      },
      answer: {
        om: 'Ergaan kamiyyuu lakkoofsa tikkeetii kan qabaatu yoo ta\'u, sa\'aatii 24 hanga 48 keessatti ogeessa dhimmi ilaallatuun bilbilaan ykn imeelii keessaniin deebiin ni kennama.',
        am: 'ማንኛውም መልዕክት የማጣቀሻ ቁጥር የሚሰጠው ሲሆን በ24 እስከ 48 ሰዓታት ውስጥ በስልክ ወይም በኢሜይል ምላሽ ይሰጣል።',
        en: 'Every digital dispatch receives a unique tracking code (e.g. OAB-2026-XXXXX). Technical officers respond via SMS, direct phone call, or email within 24 to 48 business hours.',
      },
      tag: 'Service SLA',
    },
  ];

  return (
    <section id="faq-section" className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#15803d] dark:text-emerald-400">
          <span className="w-5 h-0.5 bg-[#15803d] rounded-full" />
          <span>
            {language === 'om'
              ? 'GAAFFIIWWAN YEROO HEDDUU GAAFATAMAN'
              : language === 'am'
              ? 'ተደጋግመው የሚጠየቁ ጥያቄዎች'
              : 'FREQUENTLY ASKED QUESTIONS'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
          {language === 'om'
            ? 'Gaaffilee Qunnamtii & Tajaajila Qonnaa'
            : language === 'am'
            ? 'ስለ ግንኙነትና አገልግሎት አሰጣጥ የተለመዱ ጥያቄዎች'
            : 'Public Contact & Agricultural Assistance FAQ'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
          {language === 'om'
            ? 'Deebiiwwan qulqulluu gaaffii sarara bilbilaa, galtee qonnaa fi tajaajila kellaa.'
            : language === 'am'
            ? 'ስለ ነፃ የስልክ መስመሮች፣ ግብዓት አቅርቦትና የቀበሌ ድጋፎች ፈጣን ምላሾች።'
            : 'Quick, transparent answers regarding hotlines, input monitoring, and field office appointments.'}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          const q = faq.question[language] || faq.question.en;
          const a = faq.answer[language] || faq.answer.en;

          return (
            <div
              key={index}
              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-2xs overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#075D3A] dark:text-emerald-400 shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug">
                      {q}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {faq.tag}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700">
                  <div className="p-4 rounded-xl bg-[#F8F7F2] dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/60">
                    {a}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
