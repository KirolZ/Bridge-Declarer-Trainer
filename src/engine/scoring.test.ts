import { describe, expect, it } from 'vitest';
import type { Contract, Level, Strain } from './card';
import { isDeclarerVulnerable, score, scoreBreakdown } from './scoring';

const c = (level: Level, strain: Strain): Contract => ({ level, strain, declarer: 'S' });

describe('score — contract made', () => {
  // [contract, tricks, non-vul, vul]
  const cases: [Contract, number, number, number][] = [
    // partscores
    [c(1, 'C'), 7, 70, 70],
    [c(1, 'NT'), 7, 90, 90],
    [c(2, 'H'), 8, 110, 110],
    [c(2, 'NT'), 8, 120, 120],
    [c(4, 'C'), 10, 130, 130], // 80 < 100 → still a partscore
    [c(3, 'D'), 11, 150, 150], // 60 + 2 × 20 + 50
    [c(2, 'S'), 10, 170, 170], // 60 + 2 × 30 + 50
    [c(2, 'NT'), 9, 150, 150], // 70 + 30 + 50 (NT overtricks are 30)
    [c(1, 'C'), 13, 190, 190], // 20 + 6 × 20 + 50
    // games
    [c(3, 'NT'), 9, 400, 600],
    [c(3, 'NT'), 10, 430, 630],
    [c(4, 'H'), 10, 420, 620],
    [c(4, 'S'), 11, 450, 650],
    [c(5, 'C'), 11, 400, 600],
    [c(5, 'D'), 12, 420, 620],
    // slams
    [c(6, 'C'), 12, 920, 1370],
    [c(6, 'S'), 12, 980, 1430],
    [c(6, 'NT'), 12, 990, 1440],
    [c(6, 'H'), 13, 1010, 1460],
    [c(7, 'C'), 13, 1440, 2140],
    [c(7, 'S'), 13, 1510, 2210],
    [c(7, 'NT'), 13, 1520, 2220],
  ];

  it.each(cases)('%o taking %i tricks → %i / %i', (contract, tricks, nv, vul) => {
    expect(score(contract, tricks, false)).toBe(nv);
    expect(score(contract, tricks, true)).toBe(vul);
  });
});

describe('score — contract failed', () => {
  const cases: [Contract, number, number, number][] = [
    [c(4, 'S'), 9, -50, -100],
    [c(3, 'NT'), 6, -150, -300],
    [c(1, 'C'), 6, -50, -100],
    [c(6, 'NT'), 11, -50, -100],
    [c(7, 'NT'), 12, -50, -100],
    [c(7, 'NT'), 0, -650, -1300], // down 13
    [c(1, 'C'), 0, -350, -700],
  ];

  it.each(cases)('%o taking %i tricks → %i / %i', (contract, tricks, nv, vul) => {
    expect(score(contract, tricks, false)).toBe(nv);
    expect(score(contract, tricks, true)).toBe(vul);
  });
});

describe('scoreBreakdown', () => {
  it('itemises a made slam with an overtrick', () => {
    expect(scoreBreakdown(c(6, 'H'), 13, true)).toEqual({
      made: true,
      result: 1,
      contractPoints: 180,
      overtrickPoints: 30,
      gameBonus: 500,
      slamBonus: 750,
      undertrickPoints: 0,
      total: 1460,
    });
  });

  it('itemises a failed contract', () => {
    expect(scoreBreakdown(c(4, 'S'), 8, false)).toEqual({
      made: false,
      result: -2,
      contractPoints: 0,
      overtrickPoints: 0,
      gameBonus: 0,
      slamBonus: 0,
      undertrickPoints: -100,
      total: -100,
    });
  });

  it('rejects impossible trick counts', () => {
    expect(() => score(c(1, 'C'), -1, false)).toThrow();
    expect(() => score(c(1, 'C'), 14, false)).toThrow();
    expect(() => score(c(1, 'C'), 7.5, false)).toThrow();
  });

  it('only NS vulnerability matters to South', () => {
    expect(isDeclarerVulnerable('none')).toBe(false);
    expect(isDeclarerVulnerable('ns')).toBe(true);
  });
});
