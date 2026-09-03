import React from 'react';
import { Camera, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Note 03 of the Bureau's look-and-feel notes: photographs should read as
 * evidence from the field, not as a stock catalogue — "a short, kind caption
 * naming the place, the crop, and the season, so every picture is a small
 * piece of testimony."
 *
 * Until the Bureau supplies its own photographs, `src` is left undefined and
 * this renders a labelled placeholder that states exactly which picture is
 * wanted. Swapping in a real photograph is then a one-line change: pass `src`.
 */
export interface FieldPhotoProps {
  /** Supply when the Bureau's photograph is available; omit for a placeholder. */
  src?: string;
  /** Kebele / woreda / zone the picture was taken in. */
  place: string;
  /** Crop or activity shown. */
  crop: string;
  /** Season, e.g. "Meher 2018 E.C." */
  season: string;
  /** What the picture should show — used as alt text and as placeholder guidance. */
  subject: string;
  className?: string;
  /** Tailwind aspect utility; defaults to a landscape field shot. */
  aspect?: string;
}

export const FieldPhoto: React.FC<FieldPhotoProps> = ({
  src,
  place,
  crop,
  season,
  subject,
  className = '',
  aspect = 'aspect-[4/3]',
}) => {
  const { t } = useLanguage();

  return (
    <figure className={`group flex flex-col ${className}`}>
      <div
        className={`hv-zoom relative w-full ${aspect} overflow-hidden rounded-2xl border border-[#E2E8E3] dark:border-white/[0.09]`}
      >
        {src ? (
          <img
            src={src}
            alt={subject}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          /* Placeholder: deliberately legible, so nobody ships it by accident
             and so the Bureau can see which photograph is being asked for. */
          <div className="motif-contour flex h-full w-full flex-col items-center justify-center gap-3 bg-[#EFF8F2] dark:bg-[#111613] p-5 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#161d18] ring-2 ring-[#D7A928]">
              <Camera className="h-5 w-5 text-[#087A4B] dark:text-[#74d62c]" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-[#063D2A] dark:text-[#f5f6f3]">{subject}</p>
            <span className="rounded-full bg-[#D7A928]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#8A6A12] dark:text-[#e4ad37]">
              {t('photo_placeholder_badge')}
            </span>
          </div>
        )}
      </div>

      {/* The caption is the testimony: place, crop, season. */}
      <figcaption className="mt-3 space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[#0A1912] dark:text-[#f5f6f3]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#087A4B] dark:text-[#74d62c]" aria-hidden="true" />
          {place}
        </p>
        <p className="text-sm text-[#56635B] dark:text-[#a5aba6]">
          {crop} · {season}
        </p>
      </figcaption>
    </figure>
  );
};
