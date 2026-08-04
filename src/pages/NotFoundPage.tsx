import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-[#EFF8F2] via-white to-[#EFF8F2] px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-xl w-full text-center bg-white border border-[#DDE8E1] rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        {/* Top Decorative Graphic */}
        <div className="mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-emerald-100 text-[#087A4B] mb-6 shadow-inner border border-emerald-200">
          <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-[#087A4B]" />
        </div>

        <span className="inline-block px-4 py-1 rounded-full bg-[#087A4B]/10 border border-[#087A4B]/20 text-[#087A4B] text-xs sm:text-sm font-black tracking-wider uppercase mb-3">
          Error 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-[#14251D] tracking-tight mb-4">
          {t('not_found_title')}
        </h1>

        <p className="text-sm sm:text-base text-[#637069] leading-relaxed mb-8 max-w-md mx-auto font-medium">
          {t('not_found_desc')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
          <button
            onClick={handleGoBack}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-[#DDE8E1] bg-white text-[#14251D] hover:bg-emerald-50 text-xs sm:text-sm font-black transition-all shadow-2xs hover:shadow-xs transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="h-4 w-4 text-[#087A4B]" />
            <span>{t('back_previous')}</span>
          </button>

          <Link
            to="/"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#063D2A] to-[#087A4B] text-white hover:from-[#087A4B] hover:to-[#063D2A] text-xs sm:text-sm font-black transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="h-4 w-4 text-[#D7A928]" />
            <span>{t('back_home')}</span>
          </Link>
        </div>

        {/* Quick Search Tip */}
        <div className="mt-8 pt-6 border-t border-[#DDE8E1] flex items-center justify-center gap-2 text-xs text-[#637069] font-medium">
          <Search className="h-4 w-4 text-[#087A4B]" />
          <span>Need help finding something? Try using the header search bar.</span>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
