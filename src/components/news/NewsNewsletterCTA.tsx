import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Send, CheckCircle2, ShieldCheck, Sparkles, Bell } from 'lucide-react';

export const NewsNewsletterCTA: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [inputVal, setInputVal] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setSubscribed(true);
    showToast(
      channel === 'email'
        ? `Subscribed ${inputVal} to the Weekly Agricultural Dispatch!`
        : `Registered ${inputVal} for SMS Farmer Bulletins!`,
      'success',
      'Subscription Confirmed'
    );
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-[#075D3A] to-[#043E26] text-white p-6 sm:p-10 shadow-xl border border-emerald-700/50">
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#D5A62E] text-xs font-black uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>Direct Farmer & Stakeholder Dispatch</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Receive Weekly Agricultural Bulletins & Event Alerts
          </h3>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
            Get the latest policy notices, fertilizer dispatch timetables, weather advisories, and procurement calls sent straight to your inbox or SMS phone line.
          </p>
        </div>

        {/* Form Console */}
        <div className="lg:col-span-5">
          {subscribed ? (
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#A3E635] mx-auto" />
              <h4 className="text-base font-bold text-white">Subscription Active!</h4>
              <p className="text-xs text-emerald-200">
                You will receive our next regional news digest and advisory bulletins.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Channel Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    channel === 'email'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-black/30 text-emerald-200 hover:bg-white/10'
                  }`}
                >
                  Email Newsletter
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    channel === 'sms'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-black/30 text-emerald-200 hover:bg-white/10'
                  }`}
                >
                  SMS Mobile Alert
                </button>
              </div>

              {/* Input Group */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type={channel === 'email' ? 'email' : 'tel'}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={
                    channel === 'email'
                      ? 'Enter your email address...'
                      : 'Enter phone number (e.g. 0911...)'
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-emerald-600/60 text-white placeholder-emerald-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                />

                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#A3E635] text-gray-900 font-black text-xs hover:bg-[#b5f347] transition-all shadow-md active:scale-95"
                >
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>Zero spam. Direct official broadcasts from Oromia Agricultural Bureau.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
