import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const isReducedMotion = useReducedMotionPreference();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: isReducedMotion ? 'auto' : 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[76px] right-4 sm:bottom-[92px] sm:right-6 z-40 print:hidden pb-[env(safe-area-inset-bottom)] transition-all duration-200">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        className="group flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#063D2A] dark:bg-emerald-800 text-white shadow-xl hover:bg-[#087A4B] dark:hover:bg-emerald-700 active:scale-95 transition-all duration-200 border border-emerald-500/40 ring-2 ring-emerald-900/10 focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
      >
        <ArrowUp className="h-5 w-5 text-[#A3E635] group-hover:-translate-y-0.5 transition-transform duration-200" />
      </button>
    </div>
  );
};
