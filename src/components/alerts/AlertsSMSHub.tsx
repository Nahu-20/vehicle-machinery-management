import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Smartphone,
  CheckCircle2,
  BellRing,
  Sparkles,
  ShieldCheck,
  Send,
  MapPin,
  Layers,
  Radio,
} from 'lucide-react';

export const AlertsSMSHub: React.FC = () => {
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedZone, setSelectedZone] = useState('Arsi');
  const [selectedLanguage, setSelectedLanguage] = useState('om');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Wheat', 'Maize']);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const availableCrops = ['Wheat', 'Maize', 'Barley', 'Teff', 'Coffee', 'Livestock / Dairy', 'Horticulture'];

  const toggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== crop));
      }
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      setIsSubscribed(true);
    }
  };

  return (
    <section id="alerts-sms-hub" className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-gradient-to-br from-[#062417] via-[#073D26] to-[#0A110D] text-white rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-2xl border border-white/10">
        
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A3E635]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Information & Value Proposition */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#A3E635] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/15">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Direct Mobile Broadcast Service</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Get Instant SMS & Voice Alerts on Any Mobile Phone
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              Receive hyper-local weather shifts, locust swarm trajectory updates, stripe rust alerts, and fertilizer delivery dates delivered free to your phone in <strong>Afaan Oromoo</strong> or <strong>Amharic</strong>.
            </p>

            <div className="space-y-2.5 pt-2 text-xs font-bold text-emerald-100">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#A3E635] shrink-0" />
                <span>100% Free Public Service (Supported by Ethio Telecom & Safaricom)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#A3E635] shrink-0" />
                <span>Works on basic 2G feature phones via SMS & Automated Voice Calls</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#A3E635] shrink-0" />
                <span>Filtered precisely to your specific Woreda and agricultural crops</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Subscription Form */}
          <div className="lg:col-span-6 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/15 shadow-xl">
            {isSubscribed ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A3E635] text-[#0A1912]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">Subscribed Successfully!</h3>
                  <p className="text-xs text-emerald-100/80 max-w-sm mx-auto">
                    Phone <strong>{phoneNumber}</strong> is now registered for early warning dispatches in <strong>{selectedZone}</strong> ({selectedCrops.join(', ')}).
                  </p>
                </div>
                <button
                  onClick={() => setIsSubscribed(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/20"
                >
                  Register Another Number
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-extrabold text-white text-sm">Farmer Alert Registration</span>
                  <span className="text-[11px] text-[#A3E635] font-bold">Quick Setup (30s)</span>
                </div>

                {/* Phone input */}
                <div className="space-y-1">
                  <label className="font-bold text-white">
                    Mobile Phone Number <span className="text-[#A3E635]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0911-XXXXXX or 07XXXXXXXX"
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-emerald-200/50 text-sm font-medium focus:outline-none focus:border-[#A3E635]"
                  />
                </div>

                {/* Zone and Language selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-white">Select Your Zone</label>
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white font-medium focus:outline-none focus:border-[#A3E635]"
                    >
                      <option value="Arsi">Arsi</option>
                      <option value="West Arsi">West Arsi</option>
                      <option value="Bale">Bale</option>
                      <option value="East Shewa">East Shewa</option>
                      <option value="West Shewa">West Shewa</option>
                      <option value="North Shewa">North Shewa</option>
                      <option value="Jimma">Jimma</option>
                      <option value="Illubabor">Illubabor</option>
                      <option value="East Hararghe">East Hararghe</option>
                      <option value="West Hararghe">West Hararghe</option>
                      <option value="Borena">Borena</option>
                      <option value="Guji">Guji</option>
                      <option value="East Wollega">East Wollega</option>
                      <option value="West Wollega">West Wollega</option>
                      <option value="Horo Guduru">Horo Guduru</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-white">Preferred Language</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white font-medium focus:outline-none focus:border-[#A3E635]"
                    >
                      <option value="om">Afaan Oromoo</option>
                      <option value="am">Amharic (አማርኛ)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                {/* Crop & Enterprise selection chips (wrap nicely) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-white">Select Crops / Enterprises to Monitor:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCrops.map((crop) => {
                      const isChecked = selectedCrops.includes(crop);
                      return (
                        <button
                          type="button"
                          key={crop}
                          onClick={() => toggleCrop(crop)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isChecked
                              ? 'bg-[#A3E635] text-[#0A1912] font-black'
                              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                          }`}
                        >
                          {isChecked ? '✓ ' : ''}{crop}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#A3E635] hover:bg-[#92D022] text-[#0A1912] font-black text-sm transition-all shadow-lg hover:scale-[1.02]"
                  >
                    <BellRing className="h-4 w-4" />
                    <span>Activate Free SMS Alert Subscription</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
