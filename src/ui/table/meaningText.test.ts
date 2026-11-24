import { describe, expect, it } from 'vitest';
import type { Meaning, MeaningName } from '../../bidding';
import { MAX_HCP } from '../../bidding';
import { en, th } from '../../i18n';
import { glossaryEntry, termIds } from '../../learn';
import { inferenceMarkup, meaningMarkup, plainText, rangeText } from './meaningText';

const NAMES = Object.keys(th.meaning.name) as MeaningName[];

describe('meaningMarkup', () => {
  it('writes a weak two the way a player says it', () => {
    const m: Meaning = { name: 'weakTwo', hcp: [5, 10], len: { H: [6, 6] } };
    expect(plainText(meaningMarkup(m, th), 'th')).toBe('weak two · 5–10 HCP · ♥ 6 ใบ');
    expect(plainText(meaningMarkup(m, en), 'en')).toBe('Weak two · 5–10 HCP · ♥ 6');
  });

  it('writes open ranges, limits, shape, aces, stoppers, forcing and artificial calls', () => {
    const m: Meaning = {
      name: 'notrump',
      hcp: [16, MAX_HCP],
      len: { S: [0, 4], H: [5, 13], D: [0, 0], C: [0, 13] },
      balanced: true,
      stoppers: ['D'],
      forcing: 'game',
    };
    expect(plainText(meaningMarkup(m, th), 'th')).toBe(
      'NT · 16+ HCP · ♠ ไม่เกิน 4 ใบ · ♥ 5 ใบขึ้นไป · ไม่มี ♦ · มือ balanced · มีใบกั้นใน ♦ · บังคับถึง game',
    );
    expect(plainText(meaningMarkup(m, en), 'en')).toBe(
      'Notrump · 16+ HCP · ♠ at most 4 · ♥ 5+ · no ♦ · balanced · stoppers in ♦ · forcing to game',
    );
    const ace: Meaning = { name: 'aceReply', aces: [0, 4], artificial: true };
    expect(plainText(meaningMarkup(ace, th), 'th')).toBe(
      'ตอบจำนวน A · A 0 หรือ 4 ใบ · ไม่ได้บอกว่ามีดอกที่ประมูล',
    );
    expect(plainText(meaningMarkup({ aces: [1] }, en), 'en')).toBe('1 ace');
  });

  it('says when the system has nothing to say, and leaves out what says nothing', () => {
    expect(meaningMarkup(null, th)).toBe(th.meaning.none);
    expect(meaningMarkup({}, en)).toBe(en.meaning.none);
    expect(plainText(meaningMarkup({ name: 'pass', hcp: [0, MAX_HCP] }, en), 'en')).toBe('Pass');
  });

  it('has words for every name in both languages, linking only glossary terms', () => {
    expect(Object.keys(en.meaning.name).sort()).toEqual([...NAMES].sort());
    for (const lang of [th, en]) {
      for (const name of NAMES) {
        const text = lang.meaning.name[name];
        expect(text.trim(), name).not.toBe('');
        for (const id of termIds(text))
          expect(glossaryEntry(id), `${name}: [[${id}]]`).toBeDefined();
      }
    }
  });

  it('uses no English word on the Thai screen that the glossary does not explain', () => {
    // Words that are not bridge terms: the call itself and card names.
    const allowed = new Set(['A', 'NT', 'HCP']);
    const pieces = [
      ...Object.values(th.meaning.name),
      th.meaning.none,
      th.meaning.balanced,
      th.meaning.artificial,
      th.meaning.pick,
      th.meaning.inferTitle,
      th.meaning.inferNote,
      th.meaning.nothing,
      ...Object.values(th.meaning.forcing),
    ];
    for (const text of pieces) {
      // Linked terms are explained; drop them and look at what is left.
      const plain = text.replace(/\[\[[^\]]+\]\]/g, ' ').replace(/\{[SHDC]\}/g, ' ');
      for (const word of plain.match(/[A-Za-z][A-Za-z/-]*/g) ?? []) {
        expect(
          allowed.has(word) || glossaryEntry(word.toLowerCase()) !== undefined,
          `${text}: ${word}`,
        ).toBe(true);
      }
    }
  });
});

describe('inferenceMarkup', () => {
  it('writes the points and only the suits the player can tell about', () => {
    const text = inferenceMarkup(
      {
        hcp: [12, 16],
        len: { S: [0, 5], H: [5, 8], D: [0, 3], C: [1, 4] },
        unseen: { S: 5, H: 8, D: 4, C: 4 },
        balanced: false,
      },
      th,
    );
    expect(plainText(text, 'th')).toBe('12–16 HCP · ♥ 5 ใบขึ้นไป · ♦ ไม่เกิน 3 ใบ · ♣ 1 ใบขึ้นไป');
  });
});

describe('rangeText', () => {
  it('writes ranges', () => {
    expect(rangeText([12, 37], 37)).toBe('12+');
    expect(rangeText([6, 6], 13)).toBe('6');
    expect(rangeText([0, 5], 37)).toBe('0–5');
  });
});
