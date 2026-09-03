import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FieldPhoto } from '../common/FieldPhoto';

/**
 * Note 03: "Families, kebeles, cluster plots, and extension work would make
 * each image feel like proof of the Bureau's work on the ground."
 *
 * Every entry below is a placeholder awaiting a Bureau photograph. To publish
 * a real one, import the image and pass it as `src` — nothing else changes.
 */
const fieldStories = [
  {
    id: 'cluster-wheat',
    placeKey: 'field_photo_1_place',
    cropKey: 'field_photo_1_crop',
    seasonKey: 'field_photo_1_season',
    subjectKey: 'field_photo_1_subject',
  },
  {
    id: 'coffee-family',
    placeKey: 'field_photo_2_place',
    cropKey: 'field_photo_2_crop',
    seasonKey: 'field_photo_2_season',
    subjectKey: 'field_photo_2_subject',
  },
  {
    id: 'extension-visit',
    placeKey: 'field_photo_3_place',
    cropKey: 'field_photo_3_crop',
    seasonKey: 'field_photo_3_season',
    subjectKey: 'field_photo_3_subject',
  },
];

export const FromTheFieldSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section
      id="from-the-field"
      aria-labelledby="from-the-field-heading"
      className="band-cream motif-terrace py-16 lg:py-24 border-b border-[#E2E8E3] dark:border-[#183327] transition-colors duration-200"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-eyebrow font-bold text-[#087A4B] dark:text-[#74d62c]">
            {t('field_eyebrow')}
          </p>
          <h2
            id="from-the-field-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A1912] dark:text-white"
          >
            {t('field_title')}
          </h2>
          <p className="text-reading text-[#56635B] dark:text-[#a5aba6]">
            {t('field_subtitle')}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {fieldStories.map((story) => (
            <FieldPhoto
              key={story.id}
              place={t(story.placeKey)}
              crop={t(story.cropKey)}
              season={t(story.seasonKey)}
              subject={t(story.subjectKey)}
              className="hv-lift"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
