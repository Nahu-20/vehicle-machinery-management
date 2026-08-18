import type { LanguageCode } from '../../../types/index.js';
import { translations } from '../../../i18n/translations.js';
import {
  mockServices,
  mockPrograms,
  mockPublications,
  mockMarketPrices,
  mockOffices,
} from '../../../data/mockData.js';
import type { ChatSourceType, RetrievedDoc } from '../types.js';
import { ALL_LANGS, fromLookup, langsPresent } from './localized.js';

/**
 * Adapts the static content in src/data/mockData.ts into RetrievedDoc.
 *
 * Market prices, the office directory, services, programs and publications are
 * not in Firestore — marketPrices and resources have security rules but no code
 * reads or writes them. Those happen to be the topics farmers ask about most, so
 * the retrieval layer abstracts over "content source" rather than over Firestore.
 * When this content is migrated into real collections, only this file is replaced.
 *
 * Three storage shapes have to be normalized here:
 *   - translation keys  (services, programs, publications) -> resolved per language
 *   - LocalizedText     (market prices)                    -> used directly
 *   - literal om text   (offices)                          -> treated as om-only
 */
function tr(key: string, lang: LanguageCode): string {
  const dict = translations[lang];
  const value = dict?.[key];
  // An unresolved key would otherwise leak "service_extension_title" into an answer.
  return value !== undefined ? value : '';
}

function fromKeys(titleKey: string, descKey: string) {
  return {
    title: fromLookup((lang) => tr(titleKey, lang)),
    body: fromLookup((lang) => tr(descKey, lang)),
  };
}

type Draft = Omit<RetrievedDoc, 'score'>;

function serviceDocs(): Draft[] {
  return mockServices.map((service) => {
    const { title, body } = fromKeys(service.titleKey, service.descriptionKey);
    return {
      id: service.id,
      sourceType: 'service' as ChatSourceType,
      title,
      body,
      url: service.linkUrl,
      availableLangs: langsPresent(title, body),
    };
  });
}

function programDocs(): Draft[] {
  return mockPrograms.map((program) => {
    const { title, body } = fromKeys(program.titleKey, program.descriptionKey);
    const context = `${program.categoryKey}. ${program.targetArea}. ${program.beneficiaries}.`;
    return {
      id: program.id,
      sourceType: 'program' as ChatSourceType,
      title,
      // Target area and beneficiary counts are language-neutral facts worth
      // matching on, so they are appended to every language variant.
      body: fromLookup((lang) => {
        const desc = tr(program.descriptionKey, lang);
        return desc ? `${desc} ${context}` : '';
      }),
      url: '/programs',
      availableLangs: langsPresent(title, body),
    };
  });
}

function publicationDocs(): Draft[] {
  return mockPublications.map((publication) => {
    const { title, body } = fromKeys(publication.titleKey, publication.descriptionKey);
    return {
      id: publication.id,
      sourceType: 'publication' as ChatSourceType,
      title,
      body,
      url: '/resources',
      availableLangs: langsPresent(title, body),
    };
  });
}

/** Field labels for the composed records, so answers do not mix languages. */
const LABELS: Record<LanguageCode, Record<string, string>> = {
  om: {
    market: 'Gabaa', zone: 'Godina', change: 'Jijjiirama', updated: 'Haaromfame',
    woreda: 'Aanaa', head: 'Itti gaafatamaa', phone: 'Bilbila', email: 'Imeelii',
    address: 'Teessoo', hours: "Sa'aatii hojii",
  },
  am: {
    market: 'ገበያ', zone: 'ዞን', change: 'ለውጥ', updated: 'የተዘመነው',
    woreda: 'ወረዳ', head: 'ኃላፊ', phone: 'ስልክ', email: 'ኢሜይል',
    address: 'አድራሻ', hours: 'የሥራ ሰዓት',
  },
  en: {
    market: 'Market', zone: 'Zone', change: 'Change', updated: 'Updated',
    woreda: 'Woreda', head: 'Head', phone: 'Phone', email: 'Email',
    address: 'Address', hours: 'Hours',
  },
};

function marketPriceDocs(): Draft[] {
  return mockMarketPrices.map((price) => {
    const title = fromLookup((lang) => {
      const commodity =
        (typeof price.commodity === 'object' ? price.commodity?.[lang] : price.commodity) ?? '';
      const market = (typeof price.market === 'object' ? price.market?.[lang] : price.market) ?? '';
      if (!commodity && !market) return '';
      return [commodity, market].filter(Boolean).join(' - ');
    });

    const body = fromLookup((lang) => {
      const commodity =
        (typeof price.commodity === 'object' ? price.commodity?.[lang] : price.commodity) ?? '';
      if (!commodity) return '';
      const market = (typeof price.market === 'object' ? price.market?.[lang] : price.market) ?? '';
      const zone = (typeof price.zone === 'object' ? price.zone?.[lang] : price.zone) ?? '';
      const unit = (typeof price.unit === 'object' ? price.unit?.[lang] : price.unit) ?? '';
      const label = LABELS[lang];
      return [
        `${commodity}: ${price.priceETB} ETB / ${unit}`,
        market ? `${label.market}: ${market}` : '',
        zone ? `${label.zone}: ${zone}` : '',
        `${label.change}: ${price.changePercent}% (${price.trend})`,
        `${label.updated}: ${price.updatedDate}`,
      ]
        .filter(Boolean)
        .join('. ');
    });

    return {
      id: price.id,
      sourceType: 'marketPrice' as ChatSourceType,
      title,
      body,
      url: '/services#market',
      availableLangs: langsPresent(title, body),
      publishedAt: Date.parse(price.updatedDate) || undefined,
    };
  });
}

function officeDocs(): Draft[] {
  return mockOffices.map((office) => {
    // nameKey/zoneKey hold literal Afaan Oromo text here, not translation keys —
    // the same assumption SearchModal makes when it substring-matches them.
    const contact = (lang: LanguageCode) => {
      const label = LABELS[lang];
      return [
        `${label.zone}: ${office.zoneKey}`,
        office.woreda ? `${label.woreda}: ${office.woreda}` : '',
        `${label.head}: ${office.headName}`,
        `${label.phone}: ${office.phone}`,
        `${label.email}: ${office.email}`,
        `${label.address}: ${office.address}`,
        `${label.hours}: ${office.operatingHours}`,
      ]
        .filter(Boolean)
        .join('. ');
    };

    return {
      id: office.id,
      sourceType: 'office' as ChatSourceType,
      title: { om: office.nameKey },
      // Phone numbers, emails and addresses are language-neutral, so the contact
      // block is offered in all three languages with localized field labels. The
      // office name and zone remain Afaan Oromo, which availableLangs records.
      body: Object.fromEntries(ALL_LANGS.map((lang) => [lang, contact(lang)])),
      url: '/contact',
      availableLangs: ['om'],
    };
  });
}

const BUILDERS: Record<string, () => Draft[]> = {
  service: serviceDocs,
  program: programDocs,
  publication: publicationDocs,
  marketPrice: marketPriceDocs,
  office: officeDocs,
};

/** Static content matching the requested source types. Never throws. */
export function loadStaticDocs(sourceTypes: ChatSourceType[]): Draft[] {
  const docs: Draft[] = [];
  for (const type of sourceTypes) {
    const build = BUILDERS[type];
    if (!build) continue;
    try {
      docs.push(...build());
    } catch {
      // A malformed static entry must not take down the whole answer.
    }
  }
  return docs;
}
