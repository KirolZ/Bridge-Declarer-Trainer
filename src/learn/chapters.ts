// Chapters of the beginner's guide (SPEC §7.7), in reading order, one file per chapter in
// chapters/chNN.ts. A chapter with no blocks would show as "coming soon".

import type { Language } from '../game/settings';
import { localize, perLanguage } from './localize';
import type { Bilingual, Chapter } from './types';
import { CH1 } from './chapters/ch01';
import { CH2 } from './chapters/ch02';
import { CH3 } from './chapters/ch03';
import { CH4 } from './chapters/ch04';
import { CH5 } from './chapters/ch05';
import { CH6 } from './chapters/ch06';
import { CH7 } from './chapters/ch07';
import { CH8 } from './chapters/ch08';
import { CH9 } from './chapters/ch09';
import { CH10 } from './chapters/ch10';
import { CH11 } from './chapters/ch11';
import { CH12 } from './chapters/ch12';
import { CH13 } from './chapters/ch13';
import { CH14 } from './chapters/ch14';

const SOURCE: readonly Chapter<Bilingual>[] = [
  CH1,
  CH2,
  CH3,
  CH4,
  CH5,
  CH6,
  CH7,
  CH8,
  CH9,
  CH10,
  CH11,
  CH12,
  CH13,
  CH14,
];

/** Every chapter in one language. */
export const chaptersIn = perLanguage((lang): readonly Chapter[] =>
  SOURCE.map((c) => localize(c, lang) as Chapter),
);

/** The chapters in Thai (the source language). */
export const CHAPTERS = chaptersIn('th');

export function chapterOf(n: number, lang: Language = 'th'): Chapter | undefined {
  return chaptersIn(lang).find((c) => c.n === n);
}
