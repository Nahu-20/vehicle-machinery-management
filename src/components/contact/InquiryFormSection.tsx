import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  Send,
  CheckCircle2,
  Paperclip,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  Copy,
  Printer,
} from 'lucide-react';

interface InquiryFormProps {
  onSuccess?: (ticketId: string) => void;
}

export const InquiryFormSection: React.FC<InquiryFormProps> = ({ onSuccess }) => {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    zone: 'Shawaa Bahaa (East Shewa)',
    woreda: '',
    category: 'extension',
    subject: '',
    message: '',
    preferredContact: 'phone',
    languagePreference: 'om',
    attachmentName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    date: string;
    category: string;
    name: string;
    phone: string;
    zone: string;
  } | null>(null);

  const categories = [
    {
      id: 'extension',
      label: {
        om: 'Deeggarsa Eksteenshinii & Gorsa Qonnaa',
        am: 'የኤክስቴንሽንና የግብርና ሙያ ድጋፍ',
        en: 'Extension & Agronomic Advisory',
      },
    },
    {
      id: 'fertilizer-inputs',
      label: {
        om: 'Raabsa Xaa\'oo, Sanyii & Galtee Qonnaa',
        am: 'የማዳበሪያና የምርጥ ዘር አቅርቦት ቅሬታ',
        en: 'Fertilizer, Seed & Input Oversight',
      },
    },
    {
      id: 'market-export',
      label: {
        om: 'Odeeffannoo Gabaa & Walitti Hidhamiinsa',
        am: 'የገበያ ትስስርና የኤክስፖርት መረጃ',
        en: 'Agri-Market Linkage & Export Inquiries',
      },
    },
    {
      id: 'irrigation',
      label: {
        om: 'Misooma Jallisii & Paampii Soolaraa',
        am: 'የመስኖ ልማትና የፀሐይ ኃይል ፓምፖች',
        en: 'Irrigation Schemes & Solar Pump Access',
      },
    },
    {
      id: 'tender-procurement',
      label: {
        om: 'Caalbaasii Bitta & Dhiheessaa',
        am: 'የጨረታና አቅርቦት መረጃ',
        en: 'Tenders & Machinery Procurement',
      },
    },
    {
      id: 'media-public',
      label: {
        om: 'Gaaffii Miidiyaa & Akkiriditeeshinii',
        am: 'የሚዲያና ጋዜጣዊ ጥያቄዎች',
        en: 'Media Inquiries & Public Information',
      },
    },
  ];

  const oromiaZones = [
    'Shawaa Bahaa (East Shewa)',
    'Shawaa Dhihaa (West Shewa)',
    'Shawaa Kaabaa (North Shewa)',
    'Shawaa Kibba Lixaa (South West Shewa)',
    'Godina Addaa Finfinnee (Special Zone)',
    'Arsii (Arsi)',
    'Arsii Lixaa (West Arsi)',
    'Baalee (Bale)',
    'Baalee Bahaa (East Bale)',
    'Boorana (Borena)',
    'Gujii (Guji)',
    'Gujii Dhihaa (West Guji)',
    'Jimmaa (Jimma)',
    'Iluu Abbaa Booraa (Illubabor)',
    'Bunnoo Baddallee (Buno Bedele)',
    'Wallagga Bahaa (East Wollega)',
    'Wallagga Dhihaa (West Wollega)',
    'Qelleem Wallaggaa (Kelem Wollega)',
    'Horroo Guduruu Wallaggaa (Horo Guduru)',
    'Harargee Bahaa (East Hararghe)',
    'Harargee Dhihaa (West Hararghe)',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        attachmentName: e.target.files[0].name,
      });
      showToast(`Attached: ${e.target.files[0].name}`, 'info');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.message) {
      showToast('Please fill in required fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    // Simulate official tracking ID generation
    setTimeout(() => {
      const generatedId = `OAB-${new Date().getFullYear()}-${Math.floor(
        10000 + Math.random() * 90000
      )}`;
      
      const ticket = {
        id: generatedId,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        category: formData.category,
        name: formData.fullName,
        phone: formData.phone,
        zone: formData.zone,
      };

      setSubmittedTicket(ticket);
      setIsSubmitting(false);
      showToast(
        `Inquiry submitted successfully! Reference: ${generatedId}`,
        'success'
      );
      if (onSuccess) onSuccess(generatedId);
    }, 1200);
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      zone: 'Shawaa Bahaa (East Shewa)',
      woreda: '',
      category: 'extension',
      subject: '',
      message: '',
      preferredContact: 'phone',
      languagePreference: 'om',
      attachmentName: '',
    });
  };

  return (
    <section id="inquiry-form" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#15803d] dark:text-emerald-400">
            <span className="w-5 h-0.5 bg-[#15803d] rounded-full" />
            <span>
              {language === 'om'
                ? 'FOORMII GAARGAARSA & ERGAA HODHOOFTOOTA'
                : language === 'am'
                ? 'የኦንላይን መልዕክትና የቅሬታ ማስተላለፊያ'
                : 'OFFICIAL INQUIRY & GRIEVANCE SUBMISSION'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
            {language === 'om'
              ? 'Ergaa ykn Gaaffii Keessan Nuuf Ergaa'
              : language === 'am'
              ? 'ጥያቄዎትን ወይም አስተያየትዎን ይላኩ'
              : 'Submit an Inquiry, Grievance, or Technical Request'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
          <Clock className="w-3.5 h-3.5 text-[#075D3A] dark:text-emerald-400" />
          <span>Average Turnaround: 24 - 48 hours</span>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-md p-6 sm:p-10">
        {submittedTicket ? (
          <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#075D3A] dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                {language === 'om'
                  ? 'Ergaan Keessan Milka\'inaan Galmaa\'eera!'
                  : language === 'am'
                  ? 'መልዕክትዎ በተሳካ ሁኔታ ተመዝግቧል!'
                  : 'Your Dispatch Has Been Logged!'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {language === 'om'
                  ? 'Ogeessonni Biiroo Qonnaa Oromiyaa lakkoofsa tikkeetii kanaan dhimma keessan hordofu.'
                  : language === 'am'
                  ? 'የኦሮሚያ ግብርና ቢሮ ባለሙያዎች በዚህ የማጣቀሻ ቁጥር መሰረት ምላሽ ይሰጡዎታል።'
                  : 'An official ticket has been assigned. Technical officers will respond via your preferred contact channel.'}
              </p>
            </div>

            {/* Generated Official Ticket Card */}
            <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Official Dispatch Reference
                </span>
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                  {submittedTicket.date}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tracking Code</div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-[#075D3A] dark:text-emerald-400">
                    {submittedTicket.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submittedTicket.id);
                    showToast('Tracking ID copied to clipboard!', 'success');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-[#075D3A] dark:text-emerald-400 flex items-center gap-1.5 shadow-2xs hover:bg-emerald-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-semibold text-gray-500">Contact: </span>
                  {submittedTicket.name} ({submittedTicket.phone})
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Zonal Office: </span>
                  {submittedTicket.zone}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-[#075D3A] hover:bg-[#064E3B] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {language === 'om' ? 'Ergaa Birroo Ergi' : language === 'am' ? 'ሌላ መልዕክት ይላኩ' : 'Send Another Inquiry'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selector Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {language === 'om'
                  ? 'Gosa Dhimmaa / Gaaffii Filadhaa'
                  : language === 'am'
                  ? 'የጉዳዩን ዘርፍ ይምረጡ'
                  : 'Select Inquiry Category'} *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const label = cat.label[language] || cat.label.en;
                  const isSelected = formData.category === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`p-3 rounded-2xl text-left text-xs font-bold border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#075D3A] text-white border-[#075D3A] shadow-xs'
                          : 'bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="truncate">{label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D5A62E] shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#075D3A] dark:text-emerald-400" />
                  <span>
                    {language === 'om' ? 'Maqaa Guutuu' : language === 'am' ? 'ሙሉ ስም' : 'Full Name'} *
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Obbo / Adde / Dr..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] focus:ring-1 focus:ring-[#075D3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#075D3A] dark:text-emerald-400" />
                  <span>
                    {language === 'om' ? 'Lakk. Bilbilaa' : language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'} *
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251 91... or +251 7..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] focus:ring-1 focus:ring-[#075D3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#075D3A] dark:text-emerald-400" />
                  <span>{language === 'om' ? 'Imeelii (Optional)' : language === 'am' ? 'ኢሜይል (አማራጭ)' : 'Email Address'}</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="farmer@domain.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] focus:ring-1 focus:ring-[#075D3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#075D3A] dark:text-emerald-400" />
                  <span>
                    {language === 'om' ? 'Godina Oromiyaa' : language === 'am' ? 'የኦሮሚያ ዞን' : 'Oromia Zone'} *
                  </span>
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] outline-none"
                >
                  {oromiaZones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'om' ? 'Aanaa / Ganda (Woreda/Kebele)' : language === 'am' ? 'ወረዳ / ቀበሌ' : 'Woreda / Kebele'}
                </label>
                <input
                  type="text"
                  value={formData.woreda}
                  onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                  placeholder="e.g. Dodota, Siree, Limmu..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'om' ? 'Afaan Filatamaa' : language === 'am' ? 'ተመራጭ ቋንቋ' : 'Preferred Language'}
                </label>
                <select
                  value={formData.languagePreference}
                  onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] outline-none"
                >
                  <option value="om">Afaan Oromoo</option>
                  <option value="am">አማርኛ (Amharic)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Subject and Detailed Message */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'om' ? 'Mata Duree Ergaa' : language === 'am' ? 'የመልዕክቱ ርዕስ' : 'Subject Summary'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={
                    language === 'om'
                      ? 'Ibsa gabaabaa dhimma keessanii...'
                      : language === 'am'
                      ? 'የጉዳዩ አጭር ማጠቃለያ...'
                      : 'Brief subject or issue description...'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'om' ? 'Ibsa Guutuu / Yaada' : language === 'am' ? 'ዝርዝር ማብራሪያ' : 'Detailed Message / Description'} *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    language === 'om'
                      ? 'Dhimma keessan bal\'inaan barreessaa...'
                      : language === 'am'
                      ? 'ዝርዝር መልዕክትዎን እዚህ ያስፍሩ...'
                      : 'Please provide full details, farm location, crop types, or specific assistance required...'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:border-[#075D3A] outline-none"
                />
              </div>
            </div>

            {/* Attachments & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="w-full sm:w-auto">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer transition-colors">
                  <Paperclip className="w-4 h-4 text-emerald-600" />
                  <span>
                    {formData.attachmentName
                      ? formData.attachmentName
                      : language === 'om'
                      ? 'Waraqaa / Suuraa Dabali (Max 10MB)'
                      : language === 'am'
                      ? 'ፎቶ ወይም ሰነድ ያያይዙ'
                      : 'Attach Photo or Document'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.docx,.doc"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#075D3A] hover:bg-[#064E3B] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px] cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#D5A62E]" />
                  <span>
                    {isSubmitting
                      ? language === 'om'
                        ? 'Ergamaa jira...'
                        : 'Submitting...'
                      : language === 'om'
                      ? 'Ergaa Ergi'
                      : language === 'am'
                      ? 'መልዕክት ይላኩ'
                      : 'Submit Dispatch'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
