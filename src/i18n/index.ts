// Screens in two languages (SPEC §1, §7.6): Thai (the source) and English. Each language is a
// dictionary of the same shape; the UI picks one by the `language` setting.

import type { Language } from '../game/settings';
import { en } from './en';
import type { Messages } from './th';
import { th } from './th';

export type { Messages };
export { en, th };

export const MESSAGES: Readonly<Record<Language, Messages>> = { th, en };

/** Each language named in its own words, as language pickers show them. */
export const LANGUAGE_NAME: Readonly<Record<Language, string>> = { th: 'ไทย', en: 'English' };

/** Short code on the home page switch. */
export const LANGUAGE_CODE: Readonly<Record<Language, string>> = { th: 'TH', en: 'EN' };
