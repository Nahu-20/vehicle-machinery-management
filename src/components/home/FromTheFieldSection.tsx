import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FieldPhoto } from '../common/FieldPhoto';
import { GrowingStem } from '../common/GrowingStem';
import { listContentPublished } from '../../services/contentCmsService';
import { FIELD_PHOTO_TOPIC, type ContentEntry } from '../../types/content';
import coffeeHarvestImg from '../../assets/images/oromia_coffee_harvest_1785782724559.jpg';
import irrigationImg from '../../assets/images/oromia_irrigation_program_1785782711113.jpg';
import farmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

/**
 * Photographs of the Bureau's work, each captioned with its place, crop and
 * season.
 *
 * The photographs and their captions are managed from the admin (Section
 * Content → Homepage Photographs). The three images bundled with the build are
 * the fallback shown until something is published there, so the section is
 * never empty on a fresh environment.
 */
const bundledStories = [
  {
    id: 'cluster-wheat',
    image: irrigationImg,
    placeKey: 'field_photo_1_place',
    cropKey: 'field_photo_1_crop',
    seasonKey: 'field_photo_1_season',
    subjectKey: 'field_photo_1_subject',
  },
  {
    id: 'coffee-family',
    image: coffeeHarvestImg,
    placeKey: 'field_photo_2_place',
    cropKey: 'field_photo_2_crop',
    seasonKey: 'field_photo_2_season',
    subjectKey: 'field_photo_2_subject',
  },
  {
    id: 'extension-visit',
    image: farmlandImg,
    placeKey: 'field_photo_3_place',
    cropKey: 'field_photo_3_crop',
    seasonKey: 'field_photo_3_season',
    subjectKey: 'field_photo_3_subject',
  },
];

export const FromTheFieldSection: React.FC = () => {
  const { t, currentLang } = useLanguage();
  const [published, setPublished] = useState<ContentEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    listContentPublished('field', FIELD_PHOTO_TOPIC)
      .then((rows) => {
        if (!cancelled) setPublished(rows.filter((row) => row.imageUrl));
      })
      .catch(() => {
        // The bundled photographs already cover this; never break the page.
        if (!cancelled) setPublished([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // title -> place, summary -> crop, body -> season (see types/content.ts)
  const stories =
    published.length > 0
      ? published.map((entry) => ({
          id: entry.id,
          image: entry.imageUrl as string,
          place: entry.title[currentLang] || entry.title.en,
          crop: entry.summary[currentLang] || entry.summary.en,
          season: entry.body[currentLang] || entry.body.en,
          subject: entry.title[currentLang] || entry.title.en,
        }))
      : bundledStories.map((story) => ({
          id: story.id,
          image: story.image,
          place: t(story.placeKey),
          crop: t(story.cropKey),
          season: t(story.seasonKey),
          subject: t(story.subjectKey),
        }));

  return (
    <section
      id="from-the-field"
      aria-labelledby="from-the-field-heading"
      className="band-forest motif-terrace py-16 lg:py-24 border-b border-[#0B2418] transition-colors duration-200"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <GrowingStem onDark className="mt-1 shrink-0" />
          <div className="max-w-2xl space-y-3">
            <p className="text-eyebrow font-bold text-[#A3E635]">{t('field_eyebrow')}</p>
            <h2
              id="from-the-field-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
            >
              {t('field_title')}
            </h2>
            <p className="text-reading text-[#C9D8CC]">{t('field_subtitle')}</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {stories.map((story) => (
            <FieldPhoto
              key={story.id}
              src={story.image}
              place={story.place}
              crop={story.crop}
              season={story.season}
              subject={story.subject}
              onDark
              className="hv-lift"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
