import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { EventItem } from '../../data/newsEventsData';
import { useToast } from '../../context/ToastContext';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Download,
  Share2,
  CheckCircle2,
  Building2,
  ExternalLink,
  Sparkles,
  Search,
} from 'lucide-react';

interface EventsCalendarSectionProps {
  events: EventItem[];
  onOpenRSVP: (event: EventItem) => void;
}

export const EventsCalendarSection: React.FC<EventsCalendarSectionProps> = ({
  events,
  onOpenRSVP,
}) => {
  const { t, getLocalizedText, language } = useLanguage();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const title = getLocalizedText(evt.title).toLowerCase();
      const desc = getLocalizedText(evt.description).toLowerCase();
      const venue = getLocalizedText(evt.venue).toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        title.includes(q) ||
        desc.includes(q) ||
        venue.includes(q) ||
        evt.zone.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'all' || evt.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [events, selectedCategory, searchQuery, getLocalizedText]);

  // Generate and download .ics calendar file
  const handleDownloadICS = (evt: EventItem) => {
    const title = getLocalizedText(evt.title);
    const desc = getLocalizedText(evt.description);
    const venue = getLocalizedText(evt.venue);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Oromia Agricultural Bureau//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:${title.replace(/\n/g, ' ')}
DESCRIPTION:${desc.replace(/\n/g, ' ')}
LOCATION:${venue.replace(/\n/g, ' ')}
STATUS:CONFIRMED
DTSTART;VALUE=DATE:20260828
DTEND;VALUE=DATE:20260831
ORGANIZER;CN="Oromia Agricultural Bureau":MAILTO:${evt.contactEmail}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${evt.slug}-calendar.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Calendar invite (.ics) downloaded successfully!', 'success', title);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'expo':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'summit':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'field_day':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'workshop':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info & Controls */}
      <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase tracking-wider mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              Regional Events & Demonstrations
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Official Agricultural Events Calendar
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
              Participate in regional agricultural technology expos, farmers' field demonstration days, and coffee cupping summits.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, venue, or zone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/80">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'expo', label: 'Expos & Trade Shows' },
            { id: 'summit', label: 'Conferences & Summits' },
            { id: 'field_day', label: 'Farmers\' Field Days' },
            { id: 'workshop', label: 'Technical Workshops' },
            { id: 'training', label: 'Extension Masterclasses' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#075D3A] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {filteredEvents.map((evt) => {
          const title = getLocalizedText(evt.title);
          const desc = getLocalizedText(evt.description);
          const venue = getLocalizedText(evt.venue);
          const organizer = getLocalizedText(evt.organizer);

          // Parse start date for visual badge
          const dateParts = evt.startDate.split(' ');
          const month = dateParts[0] ? dateParts[0].slice(0, 3).toUpperCase() : 'AUG';
          const day = dateParts[1] ? dateParts[1].replace(',', '') : '28';

          return (
            <div
              key={evt.id}
              className="rounded-3xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col lg:flex-row gap-6 items-start justify-between"
            >
              {/* Date Box & Meta Info */}
              <div className="flex items-start gap-4 sm:gap-6 w-full lg:w-auto">
                {/* Big Date Badge */}
                <div className="w-20 h-24 shrink-0 rounded-2xl bg-gradient-to-br from-[#075D3A] to-[#043E26] text-white flex flex-col items-center justify-center p-2 shadow-md text-center">
                  <span className="text-[11px] font-black tracking-widest text-[#A3E635] uppercase">
                    {month}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white leading-none my-0.5">
                    {day}
                  </span>
                  <span className="text-[10px] text-emerald-200 font-semibold">
                    2026
                  </span>
                </div>

                {/* Event Core Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getCategoryColor(evt.category)}`}>
                      {evt.category.replace('_', ' ')}
                    </span>
                    {evt.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D5A62E] text-gray-900 uppercase tracking-wider">
                        Featured Expo
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {evt.time}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white group-hover:text-[#075D3A] dark:group-hover:text-emerald-400 transition-colors">
                    {title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                    {desc}
                  </p>

                  {/* Venue & Organizer Details */}
                  <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{venue} ({evt.zone})</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{evt.expectedAttendance}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>{organizer}</span>
                    </span>
                  </div>

                  {/* Agenda Peek */}
                  {evt.agendaHighlights && evt.agendaHighlights.length > 0 && (
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1.5">
                        Key Highlights:
                      </span>
                      <ul className="space-y-1">
                        {evt.agendaHighlights.map((ag, agIdx) => (
                          <li
                            key={agIdx}
                            className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span>{getLocalizedText(ag)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Column */}
              <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2.5 w-full lg:w-56 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => onOpenRSVP(evt)}
                  className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#075D3A] hover:bg-[#05482d] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-xs active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>RSVP / Register</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadICS(evt)}
                  className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Add to Calendar (.ics)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
