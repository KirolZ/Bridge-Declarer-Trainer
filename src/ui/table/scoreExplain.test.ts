import { describe, expect, it } from 'vitest';
import type { Contract, Level, Strain } from '../../engine';
import { score } from '../../engine';
import { en, th } from '../../i18n';
import { explainScore } from './scoreExplain';

const c = (level: Level, strain: Strain): Contract => ({ level, strain, declarer: 'S' });

describe('explainScore', () => {
  it('adds up to the score for every contract and result', () => {
    for (const strain of ['C', 'D', 'H', 'S', 'NT'] as const) {
      for (let level = 1; level <= 7; level++) {
        for (let tricks = 0; tricks <= 13; tricks++) {
          for (const vul of [false, true]) {
            for (const words of [th.score, en.score]) {
              const contract = c(level as Level, strain);
              const e = explainScore(contract, tricks, vul, words);
              expect(e.total).toBe(score(contract, tricks, vul));
              expect(e.lines.reduce((sum, l) => sum + l.points, 0)).toBe(e.total);
            }
          }
        }
      }
    }
  });

  it('explains a made game with an overtrick', () => {
    const e = explainScore(c(4, 'S'), 11, false, th.score);
    expect(e.lines.map((l) => [l.label, l.detail, l.points])).toEqual([
      ['trick ตามสัญญา (4 trick เกิน 6)', '4 × 30 (♠ trick ละ 30)', 120],
      ['trick ที่เกิน 1 trick', '1 × 30', 30],
      ['โบนัส game', 'แต้มของ trick ตามสัญญาถึง 100 · ไม่ vul ได้ 300', 300],
    ]);
    expect(e.total).toBe(450);
  });

  it('explains NT tricks, a partscore and a contract gone down', () => {
    expect(explainScore(c(2, 'NT'), 8, false, th.score).lines.map((l) => l.detail)).toEqual([
      'NT trick แรก 40 + อีก 1 × 30',
      'แต้มของ trick ตามสัญญาไม่ถึง 100',
    ]);
    const down = explainScore(c(3, 'NT'), 7, true, th.score);
    expect(down.lines).toEqual([
      { label: 'ขาด 2 trick', detail: '2 × 100 (vul: trick ละ 100)', points: -200 },
    ]);
  });

  it('explains the same score in English (SPEC §7.6)', () => {
    const e = explainScore(c(4, 'S'), 11, false, en.score);
    expect(e.lines.map((l) => [l.label, l.detail, l.points])).toEqual([
      ['Contract tricks (4 above 6)', '4 × 30 (♠: 30 a trick)', 120],
      ['Overtricks: 1', '1 × 30', 30],
      ['Game bonus', 'Contract tricks reach 100 · not vul: 300', 300],
    ]);
    expect(e.summary).toBe(
      '4♠ needs 10 tricks and took 11 — made, so it scores the contract tricks, the overtricks and the bonus',
    );
    expect(explainScore(c(3, 'NT'), 7, true, en.score).lines).toEqual([
      { label: 'Down 2', detail: '2 × 100 (vul: 100 a trick)', points: -200 },
    ]);
  });
});
