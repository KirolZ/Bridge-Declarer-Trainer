// Beginner-mode tips and the `?` chapter (SPEC §7.7, §7.8).

import { describe, expect, it } from 'vitest';
import type { Contract, PlayState, Strain } from '../engine';
import { applyPlay, newPlayState, parseCardCode, parseHand } from '../engine';
import type { CoachTip } from './coach';
import { coachTip, guideChapterFor, trickWin } from './coach';

// West leads ♥A; South has no ♥ and ruffs, then wins ♦5 and ♠3.
const deal = {
  N: parseHand('.Q2.3.'),
  E: parseHand('.J3.4.'),
  S: parseHand('32..5.'),
  W: parseHand('.AK.2.'),
};
const LINE = ['HA', 'H2', 'H3', 'S2', 'D5', 'D2', 'D3', 'D4', 'S3', 'HK', 'HQ', 'HJ'];

function after(n: number, strain: Strain = 'S'): PlayState {
  const contract: Contract = { level: 1, strain, declarer: 'S' };
  let play = newPlayState(deal, contract);
  for (const code of LINE.slice(0, n)) play = applyPlay(play, parseCardCode(code));
  return play;
}

const summary = (tip: CoachTip | null) =>
  tip === null
    ? null
    : 'win' in tip
      ? `${tip.id}:${tip.win.trick}:${tip.win.winner}:${tip.win.how}`
      : tip.id;

describe('coachTip', () => {
  it('shows the contract first, then dummy, until each is dismissed', () => {
    expect(summary(coachTip(after(0), []))).toBe('contract');
    // Dummy is not face up before the opening lead.
    expect(coachTip(after(0), ['contract'])).toBeNull();
    expect(summary(coachTip(after(1), ['contract', 'north-turn']))).toBe('dummy');
  });

  it('puts "North to play" first while it is North’s turn', () => {
    expect(summary(coachTip(after(1), []))).toBe('north-turn');
    expect(summary(coachTip(after(2), []))).toBe('contract');
  });

  it('explains a ruff, then who won each of the first 3 tricks', () => {
    const seen = ['contract', 'north-turn', 'dummy'];
    expect(summary(coachTip(after(4), seen))).toBe('ruff:1:S:ruff');
    expect(summary(coachTip(after(4), [...seen, 'ruff']))).toBe('trick-won:1:S:ruff');
    // The ruff tip stays until dismissed, also after later tricks.
    expect(summary(coachTip(after(8), seen))).toBe('ruff:1:S:ruff');
    expect(summary(coachTip(after(8), [...seen, 'ruff']))).toBe('trick-won:2:S:high');
    expect(summary(coachTip(after(6), [...seen, 'ruff']))).toBe('trick-won:1:S:ruff');
    expect(coachTip(after(12), [...seen, 'ruff', 'trick-won'])).toBeNull();
  });

  it('stops explaining tricks after the third', () => {
    const play = after(12);
    const tip = coachTip(play, ['contract', 'north-turn', 'dummy', 'ruff']);
    expect(summary(tip)).toBe('trick-won:3:S:high');
    expect(tip && 'win' in tip && tip.win.discard).toBe(true);
  });
});

describe('trickWin', () => {
  it('tells a high card, a ruff and an overruff apart', () => {
    const p = (seat: 'N' | 'E' | 'S' | 'W', code: string) => ({ seat, card: parseCardCode(code) });
    const trick = (winner: 'N' | 'E' | 'S' | 'W', ...plays: ReturnType<typeof p>[]) => ({
      leader: plays[0]!.seat,
      plays,
      winner,
    });
    const over = trickWin(
      trick('E', p('W', 'HA'), p('N', 'S2'), p('E', 'S3'), p('S', 'H4')),
      5,
      'S',
    );
    expect(over).toMatchObject({
      trick: 5,
      winner: 'E',
      how: 'overruff',
      led: 'H',
      discard: false,
    });
    const high = trickWin(
      trick('W', p('W', 'SA'), p('N', 'S2'), p('E', 'S3'), p('S', 'H4')),
      1,
      'S',
    );
    // Trumps led: the highest trump wins as a high card.
    expect(high).toMatchObject({ how: 'high', discard: true });
    const nt = trickWin(
      trick('W', p('W', 'HA'), p('N', 'S2'), p('E', 'S3'), p('S', 'H4')),
      1,
      'NT',
    );
    expect(nt).toMatchObject({ winner: 'W', how: 'high', discard: true });
  });
});

describe('guideChapterFor', () => {
  it('opens the chapter about the situation', () => {
    expect(guideChapterFor(after(0), false)).toBe(4); // contract, before the lead
    expect(guideChapterFor(after(1), false)).toBe(5); // North (dummy) to play
    expect(guideChapterFor(after(2), false)).toBe(2); // a defender to play
    expect(guideChapterFor(after(3), false)).toBe(3); // South has no ♥: may trump
    expect(guideChapterFor(after(3, 'NT'), false)).toBe(2); // …or discard in NT
    expect(guideChapterFor(after(4), false)).toBe(3); // leading after a ruff
    expect(guideChapterFor(after(8), false)).toBe(7); // leading: plan the play
    expect(guideChapterFor(after(12), true)).toBe(6); // hand over: the score
  });
});
