// Chapters of the beginner's guide (SPEC §7.7), in reading order, one file per chapter in
// chapters/chNN.ts. A chapter with no blocks would show as "coming soon".

import type { Language } from '../game/settings';
import { localize, perLanguage } from './localize';
import type { Bilingual, Chapter, Part, PartId } from './types';
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

// The parts of the guide (M21), so a new player sees that six chapters are enough to play. The
// chapters themselves do not change; a part only groups them.
const PART_SOURCE: readonly Part<Bilingual>[] = [
  {
    id: 'rules',
    title: { th: 'กฎการเล่น', en: 'The rules' },
    note: {
      th: 'ต้องรู้ก่อนเล่น — อ่าน 6 บทนี้ก็เล่นเกมนี้ได้แล้ว',
      en: 'What you need to know to play. These 6 chapters are enough to start.',
    },
    chapters: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'technique',
    title: { th: 'เทคนิคการเล่น', en: 'Playing technique' },
    note: {
      th: 'อ่านเมื่อพร้อม — วิธีเล่นให้ได้ trick มากขึ้น อ่านหลังจากลองเล่นไปสักพักก็ได้',
      en: 'Read when you are ready. Ways to win more tricks, best read after a few hands.',
    },
    chapters: [7, 8, 9, 10, 11, 12, 13],
  },
  {
    id: 'app',
    title: { th: 'ใช้เกมนี้ฝึก', en: 'Using this game' },
    note: {
      th: 'ปุ่มและหน้าจอที่ช่วยให้ฝึกได้เร็วขึ้น',
      en: 'The buttons and screens that help you practise.',
    },
    chapters: [14],
  },
];

/** The parts of the guide in one language, in reading order. */
export const partsIn = perLanguage((lang): readonly Part[] =>
  PART_SOURCE.map((p) => localize(p, lang) as Part),
);

/** The parts in Thai (the source language). */
export const PARTS = partsIn('th');

/** The part a chapter belongs to. */
export function partOf(n: number, lang: Language = 'th'): Part | undefined {
  return partsIn(lang).find((p) => p.chapters.includes(n));
}

export function partById(id: PartId, lang: Language = 'th'): Part {
  return partsIn(lang).find((p) => p.id === id)!;
}
