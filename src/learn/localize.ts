// The guide's data in one language (M18): every `{ th, en }` text becomes the string of `lang`;
// everything else (cards, hands, answers) is kept as it is.

import type { Language } from '../game/settings';
import type { Bilingual } from './types';

/** `T` with every bilingual text replaced by a string. */
export type Localized<T> = T extends Bilingual
  ? string
  : T extends readonly (infer U)[]
    ? readonly Localized<U>[]
    : T extends object
      ? { readonly [K in keyof T]: Localized<T[K]> }
      : T;

export function isBilingual(value: unknown): value is Bilingual {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).length === 2 && typeof v.th === 'string' && typeof v.en === 'string';
}

export function localize<T>(value: T, lang: Language): Localized<T> {
  if (isBilingual(value)) return value[lang] as Localized<T>;
  if (Array.isArray(value)) return value.map((v: unknown) => localize(v, lang)) as Localized<T>;
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = localize(v, lang);
    return out as Localized<T>;
  }
  return value as Localized<T>;
}

/** One list per language, made once (the guide's data never changes while the app runs). */
export function perLanguage<R>(make: (lang: Language) => R): (lang: Language) => R {
  const cache = new Map<Language, R>();
  return (lang) => {
    let made = cache.get(lang);
    if (made === undefined) {
      made = make(lang);
      cache.set(lang, made);
    }
    return made;
  };
}
