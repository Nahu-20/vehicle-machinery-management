import React, { useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { X, ShieldCheck, Eye, FileText } from 'lucide-react';

export type LegalModalType = 'privacy' | 'accessibility' | 'terms' | null;

interface FooterLegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
}

export const FooterLegalModals: React.FC<FooterLegalModalsProps> = ({
  activeModal,
  onClose,
}) => {
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        onClose();
      }
    };
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#D5E5D2] dark:border-white/[0.12] bg-white dark:bg-[#181c19] p-6 sm:p-8 shadow-2xl space-y-5 text-[#14251D] dark:text-[#f5f6f3] transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EFE5] dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EDF7EA] dark:bg-[#161d18] text-[#075B36] dark:text-[#74d62c]">
              {activeModal === 'privacy' && <ShieldCheck className="h-5 w-5" />}
              {activeModal === 'accessibility' && <Eye className="h-5 w-5" />}
              {activeModal === 'terms' && <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-lg sm:text-xl font-extrabold text-[#063D29] dark:text-[#f5f6f3]">
                {activeModal === 'privacy' && t('footer_privacy')}
                {activeModal === 'accessibility' && t('footer_accessibility')}
                {activeModal === 'terms' && t('footer_terms')}
              </h2>
              <p className="text-xs text-[#637A6E] dark:text-[#a5aba6]">
                {t('bureau_title')} • {t('bureau_sub_title')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-full p-2 text-[#637A6E] dark:text-[#a5aba6] hover:bg-[#F2F7EF] dark:hover:bg-[#161d18] dark:hover:text-[#f5f6f3] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-4 text-sm sm:text-base text-[#4C6054] dark:text-[#a5aba6] leading-relaxed">
          {activeModal === 'privacy' && (
            <>
              <p>
                {language === 'om'
                  ? "Biiroon Qonnaa Oromiyaa eegumsa ragaalee dhuunfaa qonnaan bultootaa, maamiltootaa fi daawwattoota marsariitii kanaaf iddoo guddaa kenna. Ragaan qonnaan bultootaa fi maamiltootaa faayidaa tajaajila mootummaa fi qorannoo qonnaatiif qofa oola."
                  : language === 'am'
                  ? "የኦሮሚያ ግብርና ቢሮ ለአርሶ አደሮች፣ ደንበኞች እና የድረ-ገጽ ጎብኚዎች የግል መረጃ ጥበቃ ከፍተኛ ትኩረት ይሰጣል። ማንኛውም መረጃ ለመንግስት አገልግሎቶች እና ለግብርና ምርምር ብቻ ይውላል።"
                  : "The Oromia Agricultural Bureau values the privacy of farmers, stakeholders, and citizens. Personal information submitted via our portal is strictly protected and utilized exclusively for official agricultural advisory services, pest alert notices, and extension program support."}
              </p>
              <div className="rounded-2xl bg-[#F4F9F2] dark:bg-[#111613] p-4 border border-[#E0ECE0] dark:border-white/[0.08] space-y-2 text-xs sm:text-sm">
                <h3 className="font-bold text-[#063D29] dark:text-[#f5f6f3]">
                  {language === 'om' ? 'Qajeeltoowwan Eegumsa Ragaa:' : language === 'am' ? 'የመረጃ ጥበቃ መርሆዎች:' : 'Data Protection Principles:'}
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{language === 'om' ? 'Ragaan bilbilaa fi teessoo hin gurguramu ykn qaama 3ffaaf hin dabarfamu.' : language === 'am' ? 'የስልክ እና የአድራሻ መረጃ ለሶስተኛ ወገን አይተላለፍም።' : 'Contact and location data are never sold or shared with commercial third parties.'}</li>
                  <li>{language === 'om' ? 'Sarara 8844 irratti bilbilli taasifamu hundi bilisa.' : language === 'am' ? 'በ8844 መስመር ላይ የሚደረጉ ጥሪዎች ሙሉ በሙሉ ነፃ ናቸው።' : 'All calls to the 8844 hotline are toll-free and handled confidentially.'}</li>
                </ul>
              </div>
            </>
          )}

          {activeModal === 'accessibility' && (
            <>
              <p>
                {language === 'om'
                  ? "Marsariitiin kun ulaagaalee dhaqqabamummaa idil-addunyaa (WCAG 2.1 AA) hordofuun qonnaan bultoota fi daawwattoota hundaaf salphaatti akka argamuuf qophaa'eera. Dubbistoota iskiriinii, filannoo afaanii fi qindaa'ina ifaa deeggara."
                  : language === 'am'
                  ? "ይህ ድረ-ገጽ የአለም አቀፍ የተደራሽነት ደረጃዎችን (WCAG 2.1 AA) በመከተል ለሁሉም ተጠቃሚዎች ምቹ ሆኖ የተዘጋጀ ነው። የስክሪን አንባቢዎችን፣ የቋንቋ አማራጮችን እና የገጽታ ቅንብሮችን ይደግፋል።"
                  : "We are dedicated to ensuring digital accessibility for all farmers, extension agents, and citizens. This platform is built in accordance with WCAG 2.1 AA guidelines, supporting full keyboard navigation, screen readers, multilingual switching (Afaan Oromoo, Amharic, English), and high-contrast color modes."}
              </p>
              <div className="rounded-2xl bg-[#F4F9F2] dark:bg-[#111613] p-4 border border-[#E0ECE0] dark:border-white/[0.08] space-y-2 text-xs sm:text-sm">
                <h3 className="font-bold text-[#063D29] dark:text-[#f5f6f3]">
                  {language === 'om' ? 'Deeggarsa Dhaqqabamummaa:' : language === 'am' ? 'የተደራሽነት ድጋፍ:' : 'Accessibility Features:'}
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{language === 'om' ? 'Dubbisa sagaleetiif qophii ta’uu fi alt text guutuu' : language === 'am' ? 'የስክሪን አንባቢ ድጋፍ እና የምስሎች ገላጭ ጽሑፍ' : 'Screen reader optimized semantics and complete image descriptions'}</li>
                  <li>{language === 'om' ? 'Haala dukkanaa fi ifaa filachuun danda’amuu' : language === 'am' ? 'የጨለማ እና የብርሃን ሁነታ ድጋፍ' : 'Seamless light and dark mode color contrast'}</li>
                  <li>{language === 'om' ? 'Sarara bilisaa 8844 fayyadamuun deeggarsa kallattii argachuu' : language === 'am' ? 'በ8844 ነፃ መስመር የቀጥታ ድጋፍ ማግኘት' : 'Voice hotline support via toll-free 8844'}</li>
                </ul>
              </div>
            </>
          )}

          {activeModal === 'terms' && (
            <>
              <p>
                {language === 'om'
                  ? "Marsariitiin kun tajaajila mootummaa naannoo Oromiyaatiin qonnaan bultoota fi uummata bal'aaf odeeffannoo, gorsa teeknoolojii qonnaa fi beeksisa hatattamaa kennuuf kan qophaa'edha."
                  : language === 'am'
                  ? "ይህ ድረ-ገጽ በኦሮሚያ ክልላዊ መንግስት ለአርሶ አደሮች እና ለህዝቡ የግብርና መረጃዎችን፣ የቴክኖሎጂ ምክሮችን እና አስቸኳይ ማስጠንቀቂያዎችን ለመስጠት የተዘጋጀ ይፋዊ መድረክ ነው።"
                  : "Welcome to the official digital portal of the Oromia Agricultural Bureau. This platform provides agricultural advisories, pest warnings, input distribution schedules, and market data for farmers across the Oromia region."}
              </p>
              <div className="rounded-2xl bg-[#F4F9F2] dark:bg-[#111613] p-4 border border-[#E0ECE0] dark:border-white/[0.08] space-y-2 text-xs sm:text-sm">
                <h3 className="font-bold text-[#063D29] dark:text-[#f5f6f3]">
                  {language === 'om' ? 'Qajeeltoowwan Itti Fayyadamaa:' : language === 'am' ? 'የአጠቃቀም መመሪያዎች:' : 'Guidelines & Conditions:'}
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{language === 'om' ? 'Odeeffannoon qonnaa hundi mootummaa naannoo Oromiyaatiin mirkanaa\'eera.' : language === 'am' ? 'ሁሉም የግብርና መረጃዎች በኦሮሚያ ክልላዊ መንግስት የተረጋገጡ ናቸው።' : 'All agricultural forecasts and agronomy guides are official advisory notices.'}</li>
                  <li>{language === 'om' ? 'Odeeffannoo hatattamaa qilleensaa fi dhukkubaa yeroo hundaa hordofaa.' : language === 'am' ? 'የአየር ሁኔታ እና የተባይ ማስጠንቀቂያዎችን በወቅቱ ይከታተሉ።' : 'Farmers should adhere to localized advisory alerts issued by zonal agricultural offices.'}</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#075B36] hover:bg-[#064A2C] dark:bg-[#74d62c] dark:hover:bg-[#8be63a] text-white dark:text-[#070908] px-6 py-2.5 text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
