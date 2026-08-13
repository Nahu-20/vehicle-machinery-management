import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';
import {
  Sprout,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  Globe,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<'privacy' | 'accessibility' | null>(null);

  return (
    <footer className="bg-[#0A1912] text-white pt-16 pb-8 border-t-4 border-[#A3E635] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#183327]">
          {/* Bureau Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#A3E635] text-[#0A1912] shadow-md font-bold">
                <Sprout className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white leading-tight">{t('bureau_title')}</h3>
                <p className="text-xs font-semibold text-[#A7F3D0]">{t('bureau_sub_title')}</p>
              </div>
            </div>
            <p className="text-sm text-[#A7F3D0]/80 leading-relaxed pr-4 font-normal">
              {t('footer_about')}
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-[#A7F3D0] font-semibold">
              <Globe className="h-4 w-4 text-[#A3E635]" />
              <span>{t('tagline')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A3E635]">{t('footer_quick_links')}</h4>
            <ul className="space-y-2.5 text-sm text-[#A7F3D0]/80">
              <li><Link to="/" className="hover:text-white transition-colors">{t('nav_home')}</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">{t('nav_about')}</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">{t('nav_services')}</Link></li>
              <li><Link to="/programs" className="hover:text-white transition-colors">{t('nav_programs')}</Link></li>
              <li><Link to="/news" className="hover:text-white transition-colors">{t('nav_news')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('nav_contact')}</Link></li>
            </ul>
          </div>

          {/* Key Services */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A3E635]">{t('footer_services')}</h4>
            <ul className="space-y-2.5 text-sm text-[#A7F3D0]/80">
              <li><Link to="/services" className="hover:text-white transition-colors">{t('service_extension_title')}</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">{t('service_market_title')}</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">{t('service_crop_title')}</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">{t('service_livestock_title')}</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">{t('service_irrigation_title')}</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">{t('service_inputs_title')}</Link></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#A3E635]">{t('footer_contact_info')}</h4>
            <ul className="space-y-3 text-sm text-[#A7F3D0]/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#A3E635] shrink-0 mt-0.5" />
                <span className="font-normal">{t('footer_address')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#A3E635] shrink-0" />
                <span className="font-semibold text-white">{t('footer_phone')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#A3E635] shrink-0" />
                <span className="font-normal">{t('footer_email')}</span>
              </li>
              <li className="pt-2">
                <div className="rounded-xl bg-[#0E241B] p-3 border border-[#183327] text-center">
                  <span className="text-[10px] text-[#A7F3D0] font-semibold block uppercase">{t('hotline_label')}</span>
                  <span className="text-base font-extrabold text-[#A3E635]">{t('hotline_number')}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Channels & Policies */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A7F3D0]/80 border-b border-[#183327]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold text-white">Social Channels:</span>
            <div className="flex items-center gap-4">
              <span className="cursor-pointer hover:text-[#A3E635] font-semibold underline">Facebook Page</span>
              <span className="cursor-pointer hover:text-[#A3E635] font-semibold underline">X (Twitter)</span>
              <span className="cursor-pointer hover:text-[#A3E635] font-semibold underline">Telegram Official</span>
              <span className="cursor-pointer hover:text-[#A3E635] font-semibold underline">YouTube Channel</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveModal('privacy')}
              className="flex items-center gap-1.5 hover:text-white transition-colors font-semibold"
            >
              <ShieldCheck className="h-4 w-4 text-[#A3E635]" />
              <span>{t('footer_privacy')}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveModal('accessibility')}
              className="flex items-center gap-1.5 hover:text-white transition-colors font-semibold"
            >
              <Eye className="h-4 w-4 text-[#A3E635]" />
              <span>{t('footer_accessibility')}</span>
            </button>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A7F3D0]/70 gap-2">
          <p className="font-normal">{t('footer_copyright')}</p>
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-[#A3E635]"></span>
            <span>{t('footer_demo_notice')}</span>
          </div>
        </div>
      </div>

      {/* Policy Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#0E241B] p-6 sm:p-7 text-white shadow-2xl border border-[#183327]">
            <div className="flex items-center justify-between border-b border-[#183327] pb-4">
              <h3 className="text-lg font-bold text-[#A3E635]">
                {activeModal === 'privacy' ? t('footer_privacy') : t('footer_accessibility')}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-white rounded-lg">✕</button>
            </div>
            <div className="mt-4 text-xs sm:text-sm space-y-3 leading-relaxed text-[#A7F3D0]/80">
              {activeModal === 'privacy' ? (
                <>
                  <p>
                    The Oromia Agricultural Bureau adheres strictly to regional data protection standards. Information collected through contact and feedback forms is solely used for agricultural extension services and public assistance.
                  </p>
                  <p>
                    No personal data is shared with third parties. Prototype data on this demonstration site is for illustrative public service testing.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    The Oromia Agricultural Bureau digital platform is built following WCAG 2.1 AA accessibility standards, ensuring inclusive digital access for all farmers, extension agents, and citizens across Oromia.
                  </p>
                  <p>
                    Features include responsive high contrast mode, readable font scaling, keyboard focus indicators, and screen-reader accessible HTML semantics.
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-full bg-[#A3E635] text-[#0A1912] hover:bg-[#92D022] px-5 py-2.5 text-xs font-bold transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

