import type { LanguageCode, LocalizedText } from '../../../types/index.js';

export const ALL_LANGS: LanguageCode[] = ['om', 'am', 'en'];

/**
 * Resolve a LocalizedText in one language without falling back to another.
 *
 * Deliberately unlike getLocalizedText() in LanguageContext, which falls back
 * om -> en -> am. Retrieval must be able to tell "this record has no Amharic"
 * from "this record's Amharic happens to equal its Afaan Oromo", because that
 * distinction is what triggers the machine-translation label.
 */
export function textIn(value: LocalizedText | undefined, lang: LanguageCode): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return (value[lang] ?? '').trim();
}

/** Every language this value carries real (non-empty) text in. */
export function langsPresent(...values: (LocalizedText | undefined)[]): LanguageCode[] {
  const found = new Set<LanguageCode>();
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string') {
      if (value.trim()) found.add('om');
      continue;
    }
    for (const lang of ALL_LANGS) {
      if ((value[lang] ?? '').trim()) found.add(lang);
    }
  }
  return ALL_LANGS.filter((lang) => found.has(lang));
}

/** Concatenate every language variant, for cross-language term matching. */
export function allText(value: LocalizedText | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return ALL_LANGS.map((lang) => value[lang] ?? '').join(' ');
}

/** Build a LocalizedText from a per-language lookup, dropping empty entries. */
export function fromLookup(lookup: (lang: LanguageCode) => string): LocalizedText {
  const out: { om?: string; am?: string; en?: string } = {};
  for (const lang of ALL_LANGS) {
    const value = (lookup(lang) ?? '').trim();
    if (value) out[lang] = value;
  }
  return out;
}
