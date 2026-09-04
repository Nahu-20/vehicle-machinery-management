import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FieldPhoto } from '../common/FieldPhoto';
import { GrowingStem } from '../common/GrowingStem';
import coffeeHarvestImg from '../../assets/images/oromia_coffee_harvest_1785782724559.jpg';
import irrigationImg from '../../assets/images/oromia_irrigation_program_1785782711113.jpg';
import farmlandImg from '../../assets/images/oromia_hero_farmland_1785782697065.jpg';

/**
 * Note 03: "Families, kebeles, cluster plots, and extension work would make
 * each image feel like proof of the Bureau's work on the ground."
 *
 * These use the Bureau's own Oromia photographs where we have them. Swapping
 * any of them later is a one-line change — or an edit in the admin, once the
 * section is CMS-backed.
 */
const fieldStories = [
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
  const { t } = useLanguage();

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
          {fieldStories.map((story) => (
            <FieldPhoto
              key={story.id}
              src={story.image}
              place={t(story.placeKey)}
              crop={t(story.cropKey)}
              season={t(story.seasonKey)}
              subject={t(story.subjectKey)}
              onDark
              className="hv-lift"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
