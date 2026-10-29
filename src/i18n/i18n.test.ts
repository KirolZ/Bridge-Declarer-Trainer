// The two dictionaries (SPEC §1, §7.6): same shape, English free of Thai, nothing left empty, and
// the guide markup in the table tips links only real glossary terms in both languages.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Card, IllegalReason, Seat } from '../engine';
import { SEATS } from '../engine';
import { glossaryEntry, parseInline } from '../learn';
import type { Messages } from '.';
import { LANGUAGE_NAME, MESSAGES, en, th } from '.';

const THAI = /[฀-๿]/;

/** Every plain string of a dictionary, with its path (functions are checked by calling them). */
function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
}

/** Nested keys, functions included: the shape both languages must share. */
function keys(value: unknown, path = ''): string[] {
  if (typeof value !== 'object' || value === null) return [path];
  return Object.entries(value).flatMap(([k, v]) => keys(v, path ? `${path}.${k}` : k));
}

const SA: Card = { suit: 'S', rank: 14 };
const H10: Card = { suit: 'H', rank: 10 };
const REASONS: IllegalReason[] = [
  { code: 'must-follow-suit', suit: 'H' },
  ...SEATS.map((seat): IllegalReason => ({ code: 'not-in-hand', seat })),
  { code: 'hand-complete' },
];

/** A sample of everything the functions say, for the checks below. */
function sayings(m: Messages): string[] {
  const seats: Seat[] = [...SEATS];
  return [
    m.cardName(SA),
    m.cardName(H10),
    ...REASONS.flatMap((r) => [m.illegal(r), m.illegal(r, 'S'), m.illegal(r, 'N')]),
    m.storeMessage({ kind: 'botFailed', detail: 'x' }),
    m.storeMessage({ kind: 'hintFailed', detail: 'x' }),
    m.storeMessage({ kind: 'claimFailed', detail: 'x' }),
    m.storeMessage({ kind: 'dealFailed', detail: 'x' }),
    m.storeMessage({ kind: 'dealRelaxed', wanted: 'slam', got: 'gameUp' }),
    m.common.notSaved(m.stats.notSavedWhat),
    m.home.chapters(3, 14),
    m.settings.locked(m.settings.botSpeedLocked),
    ...[0, 1, 2].flatMap((n) => [
      m.table.hintUsed(n),
      m.table.needed(n),
      m.table.hintStatus(n, 2),
      m.table.cardCount(n),
      m.table.dummyFaceDown(n),
      m.claim.question(n),
      m.claim.total(n, 1),
      m.claim.submit(n),
      m.result.hints(n),
      m.result.lost(n),
      m.replay.lost(n),
      m.exercise.passed(n),
      m.exercise.failed(n, 3),
    ]),
    ...seats.flatMap((s) => [
      m.table.waitFor(s),
      m.table.wonTrick(s),
      m.table.botThinking(s),
      m.table.played(s, m.cardName(SA)),
      m.replay.led(s),
      m.learn.led(s),
      m.learn.toPlay(s),
    ]),
    m.result.made('4♠'),
    m.result.down('4♠', 2),
    m.result.tricks(9, 10, 10, 0),
    m.result.tricks(11, null, 10, 1),
    m.result.lossClaim(9, 10),
    m.result.undo(true),
    m.result.undo(false),
    m.replay.title(2, 13),
    m.replay.trick(2, true),
    m.replay.ddBefore(9),
    m.replay.claimHere(10),
    m.learn.pending('topic'),
    m.learn.exerciseOf(3, 1, 4),
    m.exercise.solutionStep(2, 8),
    m.exercise.solutionEnd(4),
    m.exercise.mistakeAt(2),
    ...coachTips(m),
  ];
}

/** The beginner tips, in guide markup. */
function coachTips(m: Messages): string[] {
  const c = m.coach;
  return [
    c.contractNT(3, 9),
    c.contractSuit(4, '{S}', 10),
    ...SEATS.flatMap((s) => [
      c.ruff(2, c.who(s), '{H}', '{SA}'),
      c.overruff(2, c.who(s), '{SA}'),
      c.won(2, c.who(s), '{SA}', '{H}') + c.discard + c.nextLead(c.who(s)),
    ]),
    c.dummy,
    c.northTurn,
  ];
}

describe('dictionaries', () => {
  it('have the same keys in both languages', () => {
    expect(keys(en)).toEqual(keys(th));
    expect(Object.keys(MESSAGES)).toEqual(['th', 'en']);
  });

  it('leave nothing empty', () => {
    for (const m of [th, en]) {
      for (const [path, text] of strings(m)) expect(text.trim(), path).not.toBe('');
      for (const text of sayings(m)) expect(text.trim()).not.toBe('');
    }
  });

  it('English has no Thai, in the source or in anything it says', () => {
    const source = readFileSync(fileURLToPath(new URL('./en.ts', import.meta.url)), 'utf8');
    const line = source.split('\n').findIndex((l) => THAI.test(l));
    expect(line, `en.ts line ${line + 1}`).toBe(-1);
    for (const [path, text] of strings(en)) expect(text, path).not.toMatch(THAI);
    for (const text of sayings(en)) expect(text).not.toMatch(THAI);
  });

  it('Thai keeps its words (the source of the screens)', () => {
    expect(th.cardName(SA)).toBe('A โพดำ');
    expect(th.illegal({ code: 'must-follow-suit', suit: 'H' }, 'S')).toBe(
      'ต้องลง ♥ เพราะคุณยังมี ♥ อยู่',
    );
    expect(th.storeMessage({ kind: 'dealRelaxed', wanted: 'slam', got: 'gameUp' })).toBe(
      'หามือแบบ "slam" ไม่เจอใน 30 มือ เลยแจกแบบ "game ขึ้นไป" แทน',
    );
  });

  it('English reads naturally', () => {
    expect(en.cardName(H10)).toBe('10 of Hearts');
    expect(en.illegal({ code: 'must-follow-suit', suit: 'H' }, 'N')).toBe(
      'You must play ♥: dummy still has ♥',
    );
    expect(en.claim.submit(1)).toBe('Claim 1 trick');
    expect(en.claim.submit(9)).toBe('Claim 9 tricks');
    expect(en.result.tricks(9, 10, 10, 0)).toBe('Took 9 tricks (DD makes 10) · needed 10');
    expect(en.storeMessage({ kind: 'dealRelaxed', wanted: 'slam', got: 'gameUp' })).toBe(
      'No "Slam" hand came up in 30 deals, so this is a "Game or higher" hand instead',
    );
  });

  it('table tips link only glossary terms, in both languages', () => {
    for (const m of [th, en]) {
      for (const tip of coachTips(m)) {
        for (const part of parseInline(tip)) {
          if (part.t === 'term') expect(glossaryEntry(part.id), part.id).toBeDefined();
        }
      }
    }
    const nt = parseInline(en.coach.contractNT(3, 9)).filter((p) => p.t === 'term');
    expect(nt.map((p) => p.t === 'term' && p.id)).toEqual(['trick', 'trump', 'lead']);
  });

  it('names each language in its own words', () => {
    expect(LANGUAGE_NAME).toEqual({ th: 'ไทย', en: 'English' });
  });
});
