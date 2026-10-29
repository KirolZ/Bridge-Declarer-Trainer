// The guide's structure (SPEC §7.7): markup, chapters, glossary links, card examples, progress.

import { describe, expect, it } from 'vitest';
import { SEATS, parseHand, trickWinner } from '../engine';
import { CHAPTERS, PARTS, chaptersIn, partOf, partsIn } from './chapters';
import { trickPlays } from './exercise';
import { EXERCISES, exercisesIn } from './exercises';
import { GLOSSARY, glossaryEntry, glossaryIn } from './glossary';
import { isBilingual, localize } from './localize';
import { parseCardList, parseInline, termIds } from './markup';
import {
  EMPTY_PROGRESS,
  isFirstVisit,
  parseProgress,
  withPassed,
  withRead,
  withTipDismissed,
  withWelcomed,
} from './progress';
import type { Block } from './types';

describe('parseInline', () => {
  it('splits text, terms, cards, suits and bold', () => {
    expect(parseInline('a [[trick]] b [[lead|นำ]] {SA} {H}{DT} **c**')).toEqual([
      { t: 'text', text: 'a ' },
      { t: 'term', id: 'trick', label: null },
      { t: 'text', text: ' b ' },
      { t: 'term', id: 'lead', label: 'นำ' },
      { t: 'text', text: ' ' },
      { t: 'card', card: { suit: 'S', rank: 14 } },
      { t: 'text', text: ' ' },
      { t: 'suit', suit: 'H' },
      { t: 'card', card: { suit: 'D', rank: 10 } },
      { t: 'text', text: ' ' },
      { t: 'strong', text: 'c' },
    ]);
  });

  it('leaves anything else as text', () => {
    expect(parseInline('{X} {S1} [[]] *a* plain')).toEqual([
      { t: 'text', text: '{X} {S1} [[]] *a* plain' },
    ]);
    expect(parseInline('')).toEqual([]);
  });

  it('does not nest markup in bold (it would show as raw text)', () => {
    expect(parseInline('**เล่น {C} ก่อน**')).toEqual([{ t: 'strong', text: 'เล่น {C} ก่อน' }]);
    const all = [
      ...CHAPTERS.flatMap((c) => c.blocks.flatMap(blockTexts)),
      ...EXERCISES.flatMap((e) => [
        e.title,
        e.instruction,
        e.explanation,
        e.hint,
        ...(e.kind === 'choice' ? e.options : []),
        ...(e.kind === 'play' ? e.wrong.map((w) => w.why) : []),
      ]),
      ...GLOSSARY.map((e) => e.text),
    ];
    for (const text of all) {
      for (const p of parseInline(text)) {
        if (p.t === 'strong') expect(p.text, text).not.toMatch(/\{|\[\[/);
      }
    }
  });

  it('lists the terms linked', () => {
    expect(termIds('[[trick]] และ [[follow-suit|ลงตามดอก]]')).toEqual(['trick', 'follow-suit']);
  });

  it('parses card lists', () => {
    expect(parseCardList(' SA  HT ')).toEqual([
      { suit: 'S', rank: 14 },
      { suit: 'H', rank: 10 },
    ]);
    expect(() => parseCardList('SA X1')).toThrow();
  });
});

function blockTexts(b: Block): string[] {
  switch (b.kind) {
    case 'p':
    case 'note':
      return [b.text];
    case 'h':
      return [b.text];
    case 'list':
      return [...b.items];
    default:
      return b.caption === undefined ? [] : [b.caption];
  }
}

describe('chapters', () => {
  it('are numbered 1–14 in order, each with a title and topic', () => {
    expect(CHAPTERS.map((c) => c.n)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    for (const c of CHAPTERS) {
      expect(c.title.trim()).not.toBe('');
      expect(c.topic.trim()).not.toBe('');
    }
  });

  it('fall into parts (M21): every chapter in exactly one, in reading order', () => {
    expect(PARTS.map((p) => p.id)).toEqual(['rules', 'technique', 'app']);
    expect(PARTS.flatMap((p) => p.chapters)).toEqual(CHAPTERS.map((c) => c.n));
    // The rules are what a new player needs before the first hand: chapters 1–6.
    expect(PARTS[0]!.chapters).toEqual([1, 2, 3, 4, 5, 6]);
    for (const p of PARTS) {
      expect(p.title.trim()).not.toBe('');
      expect(p.note.trim()).not.toBe('');
    }
    expect(partOf(6)?.id).toBe('rules');
    expect(partOf(7)?.id).toBe('technique');
    expect(partOf(14)?.id).toBe('app');
    expect(partOf(15)).toBeUndefined();
    expect(partsIn('en').map((p) => [p.id, p.chapters])).toEqual(
      PARTS.map((p) => [p.id, p.chapters]),
    );
  });

  describe.each(CHAPTERS.filter((c) => c.blocks.length > 0).map((c) => [c.n, c] as const))(
    'chapter %i',
    (_, chapter) => {
      it('links only glossary terms that exist', () => {
        for (const text of chapter.blocks.flatMap(blockTexts)) {
          for (const id of termIds(text)) expect(glossaryEntry(id), `[[${id}]]`).toBeDefined();
        }
      });

      it('has valid card examples', () => {
        for (const b of chapter.blocks) {
          if (b.kind === 'cards') expect(parseCardList(b.cards).length).toBeGreaterThan(0);
          if (b.kind === 'hand') expect(parseHand(b.hand).length).toBeGreaterThan(0);
          if (b.kind === 'trick') {
            const cards = parseCardList(b.cards);
            expect(cards.length).toBeGreaterThanOrEqual(1);
            expect(cards.length).toBeLessThanOrEqual(4);
            expect(new Set(b.cards.split(/\s+/)).size).toBe(cards.length);
          }
          if (b.kind === 'deal') {
            const codes = SEATS.flatMap((s) => {
              const h = b.hands[s];
              return h === undefined ? [] : parseHand(h).map((c) => `${c.suit}${c.rank}`);
            });
            expect(new Set(codes).size).toBe(codes.length);
          }
        }
      });
    },
  );

  it('trick captions name the winner the rules give', () => {
    // e.g. "East จึงกิน", "North (dummy) กิน" — every seat named as taking the trick must be the winner.
    const said = /(North|East|South|West)(?: \(dummy\))?(?: จึง)? ?กิน/g;
    const names: Record<string, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };
    for (const c of CHAPTERS) {
      for (const b of c.blocks) {
        if (b.kind !== 'trick' || parseCardList(b.cards).length < 4) continue;
        const winner = trickWinner(trickPlays(b.leader, parseCardList(b.cards)), b.trump);
        const named = [...(b.caption ?? '').matchAll(said)].map((m) => m[1]);
        expect(named.length, `chapter ${c.n}: ${b.cards}`).toBeGreaterThan(0);
        for (const n of named) expect(n, `chapter ${c.n}: ${b.cards}`).toBe(names[winner]);
      }
    }
  });
});

describe('glossary', () => {
  it('has unique ids, in alphabetical order of the term', () => {
    const ids = GLOSSARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const terms = GLOSSARY.map((e) => e.term.toLowerCase());
    expect(terms).toEqual([...terms].sort());
  });

  it('entries are filled in and link only existing entries', () => {
    for (const e of GLOSSARY) {
      expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(e.term.trim()).not.toBe('');
      expect(e.thai.trim()).not.toBe('');
      expect(e.text.trim()).not.toBe('');
      for (const id of termIds(e.text)) expect(glossaryEntry(id), `[[${id}]]`).toBeDefined();
      if (e.chapter !== undefined) expect(CHAPTERS.some((c) => c.n === e.chapter)).toBe(true);
    }
  });

  it('explains every English word the guide uses (TASKS 12.6)', () => {
    // Bridge terms stay in English (SPEC §7.7), so any English word in the guide must be a
    // glossary term or one of its aliases. Words that are not bridge terms are listed here.
    const notTerms = ['north', 'east', 'south', 'west', 'bridge'];
    // Named in the `suit` entry.
    const suitNames = ['spade', 'heart', 'diamond', 'club'];
    const known = new Set([
      ...notTerms,
      ...suitNames,
      ...GLOSSARY.flatMap((e) => [e.term, ...(e.aliases ?? [])])
        .flatMap((t) => t.toLowerCase().split(/[^a-z-]+/))
        .filter(Boolean),
    ]);
    const english = (text: string) =>
      parseInline(text)
        .flatMap((p) => {
          if (p.t === 'text' || p.t === 'strong') return [p.text];
          if (p.t === 'term') return [p.label ?? glossaryEntry(p.id)?.term ?? ''];
          return [];
        })
        .join(' ')
        .match(/[A-Za-z][A-Za-z-]*[A-Za-z]/g) ?? [];
    const texts = [
      ...CHAPTERS.flatMap((c) => [c.title, c.topic, ...c.blocks.flatMap(blockTexts)]),
      ...EXERCISES.flatMap((e) => [
        e.title,
        e.instruction,
        e.explanation,
        e.hint,
        ...(e.kind === 'choice' ? e.options : []),
        ...(e.kind === 'play' ? e.wrong.map((w) => w.why) : []),
      ]),
      ...GLOSSARY.map((e) => e.text),
      ...PARTS.flatMap((p) => [p.title, p.note]),
    ];
    const unknown = new Set<string>();
    for (const text of texts) {
      for (const word of english(text)) {
        const w = word.toLowerCase();
        if (!known.has(w) && !known.has(w.replace(/s$/, ''))) unknown.add(word);
      }
    }
    expect([...unknown]).toEqual([]);
  });

  it('covers the terms the game screens use', () => {
    for (const id of ['contract', 'trick', 'trump', 'nt', 'dummy', 'declarer', 'vulnerable']) {
      expect(glossaryEntry(id), id).toBeDefined();
    }
    for (const id of ['claim', 'double-dummy', 'ns-ew', 'game', 'slam', 'partscore']) {
      expect(glossaryEntry(id), id).toBeDefined();
    }
  });

  it('covers every term linked from chapters and exercises', () => {
    const linked = new Set([
      ...CHAPTERS.flatMap((c) => c.blocks.flatMap(blockTexts)).flatMap(termIds),
      ...EXERCISES.flatMap((e) => [e.instruction, e.explanation, e.hint]).flatMap(termIds),
    ]);
    for (const id of linked) expect(glossaryEntry(id), id).toBeDefined();
  });

  // English (M18): "game" is also the everyday word ("a card game", "this game" = the app), so
  // its first plain use is not a missing link there.
  it.each([
    ['th', []],
    ['en', ['game']],
  ] as const)(
    'links every term the first time a reader meets it (TASKS 12.9, %s)',
    (lang, everyday) => {
      const CHAPTERS = chaptersIn(lang);
      const EXERCISES = exercisesIn(lang);
      const GLOSSARY = glossaryIn(lang);
      // Reading order: each chapter, then its exercises (instruction, options, hint, explanation).
      // Headings are left out: the text right under a heading explains it.
      const pieces = CHAPTERS.flatMap((c) => [
        ...c.blocks
          .filter((b) => b.kind !== 'h')
          .flatMap(blockTexts)
          .map((text) => ({ where: `ch${c.n}`, text })),
        ...EXERCISES.filter((e) => e.chapter === c.n).flatMap((e) =>
          [
            e.instruction,
            ...(e.kind === 'choice' ? e.options : []),
            e.hint,
            e.explanation,
            ...(e.kind === 'play' ? e.wrong.map((w) => w.why) : []),
          ].map((text) => ({ where: e.id, text })),
        ),
      ]);
      // "NT (No Trump)" → nt, no trump; "NS / EW" → ns, ew. Longest first, so "opening lead" is not
      // also read as "lead".
      const names = GLOSSARY.flatMap((e) =>
        [...e.term.replace(/[()]/g, '/').split('/'), ...(e.aliases ?? [])]
          .map((n) => n.trim().toLowerCase())
          .filter(Boolean)
          .map((name) => ({ id: e.id, re: new RegExp(`(?<![a-z])${name}s?(?![a-z])`, 'g') })),
      ).sort((a, b) => b.re.source.length - a.re.source.length);

      const seen = new Set<string>();
      const unlinked: string[] = [];
      for (const { where, text } of pieces) {
        const linked = new Set(termIds(text));
        let plain = parseInline(text)
          .map((p) => (p.t === 'text' || p.t === 'strong' ? p.text : ' '))
          .join(' ')
          .toLowerCase();
        const used = new Set(linked);
        for (const { id, re } of names) {
          if (plain.match(re)) used.add(id);
          plain = plain.replace(re, ' ');
        }
        for (const id of used) {
          if (seen.has(id)) continue;
          seen.add(id);
          if (!linked.has(id) && !(everyday as readonly string[]).includes(id))
            unlinked.push(`${id} (${where})`);
        }
      }
      expect(unlinked).toEqual([]);
      // Every glossary term is met somewhere in the guide.
      expect(GLOSSARY.filter((e) => !seen.has(e.id)).map((e) => e.id)).toEqual([]);
    },
  );
});

describe('the guide in English (M18)', () => {
  const chapters = chaptersIn('en');
  const exercises = exercisesIn('en');
  const glossary = glossaryIn('en');
  /** Every text of the English guide, with where it is. */
  const texts = [
    ...chapters.flatMap((c) =>
      [c.title, c.topic, ...c.blocks.flatMap(blockTexts)].map((text) => ({
        where: `ch${c.n}`,
        text,
      })),
    ),
    ...exercises.flatMap((e) =>
      [
        e.title,
        e.instruction,
        e.explanation,
        e.hint,
        ...(e.kind === 'choice' ? e.options : []),
        ...(e.kind === 'play' ? e.wrong.map((w) => w.why) : []),
      ].map((text) => ({ where: e.id, text })),
    ),
    ...glossary.map((e) => ({ where: e.id, text: e.text })),
    ...partsIn('en').flatMap((p) => [p.title, p.note].map((text) => ({ where: p.id, text }))),
  ];

  it('has the same chapters, exercises and terms as the Thai guide', () => {
    expect(chapters.map((c) => [c.n, c.blocks.map((b) => b.kind)])).toEqual(
      CHAPTERS.map((c) => [c.n, c.blocks.map((b) => b.kind)]),
    );
    expect(exercises.map((e) => [e.id, e.kind])).toEqual(EXERCISES.map((e) => [e.id, e.kind]));
    expect(glossary.map((e) => e.id)).toEqual(GLOSSARY.map((e) => e.id));
  });

  it('is all English, nothing left empty', () => {
    for (const { where, text } of texts) {
      expect(text.trim(), where).not.toBe('');
      expect(text, where).not.toMatch(/[\u0E00-\u0E7F]/);
    }
  });

  it('links only glossary terms that exist, and never nests markup in bold', () => {
    for (const { where, text } of texts) {
      for (const id of termIds(text))
        expect(glossaryEntry(id, 'en'), `${where} [[${id}]]`).toBeDefined();
      for (const p of parseInline(text)) {
        if (p.t === 'strong') expect(p.text, where).not.toMatch(/\{|\[\[/);
      }
    }
  });

  it('shows the same cards and suits as the Thai text it translates', () => {
    // A translation that names another card would teach the wrong thing.
    const cards = (text: string) =>
      parseInline(text)
        .flatMap((p) =>
          p.t === 'card' ? [`${p.card.suit}${p.card.rank}`] : p.t === 'suit' ? [p.suit] : [],
        )
        .sort();
    const pairs: [string, string][] = [];
    const walk = (th: unknown, en: unknown) => {
      if (typeof th === 'string' && typeof en === 'string') pairs.push([th, en]);
      else if (typeof th === 'object' && th !== null && typeof en === 'object' && en !== null)
        for (const k of Object.keys(th)) walk((th as never)[k], (en as never)[k]);
    };
    walk(CHAPTERS, chapters);
    walk(EXERCISES, exercises);
    walk(GLOSSARY, glossary);
    expect(pairs.length).toBeGreaterThan(400);
    for (const [th, en] of pairs) expect(cards(en), en).toEqual(cards(th));
  });

  it('trick captions name the winner the rules give', () => {
    const said = /(North|East|South|West)(?: \(dummy\))? (?:wins|takes)/g;
    const names: Record<string, string> = { N: 'North', E: 'East', S: 'South', W: 'West' };
    for (const c of chapters) {
      for (const b of c.blocks) {
        if (b.kind !== 'trick' || parseCardList(b.cards).length < 4) continue;
        const winner = trickWinner(trickPlays(b.leader, parseCardList(b.cards)), b.trump);
        const named = [...(b.caption ?? '').matchAll(said)].map((m) => m[1]);
        expect(named.length, `chapter ${c.n}: ${b.caption}`).toBeGreaterThan(0);
        for (const n of named) expect(n, `chapter ${c.n}: ${b.caption}`).toBe(names[winner]);
      }
    }
  });

  it('keeps the Thai gloss of each term only for the Thai screens', () => {
    expect(glossary.map((e) => e.thai)).toEqual(GLOSSARY.map((e) => e.thai));
    expect(glossary.find((e) => e.id === 'trick')?.text).toMatch(/^A round in which/);
  });

  it('localizes only { th, en } texts', () => {
    expect(isBilingual({ th: 'ก', en: 'a' })).toBe(true);
    expect(isBilingual({ N: 'A', S: 'K' })).toBe(false);
    expect(isBilingual({ th: 'ก', en: 'a', x: 1 })).toBe(false);
    expect(
      localize({ t: { th: 'ก', en: 'a' }, cards: 'SA', l: [{ th: 'ข', en: 'b' }] }, 'en'),
    ).toEqual({
      t: 'a',
      cards: 'SA',
      l: ['b'],
    });
  });
});

describe('progress', () => {
  it('reads back what was saved and drops bad entries', () => {
    expect(parseProgress(undefined)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('x')).toEqual(EMPTY_PROGRESS);
    expect(
      parseProgress({ read: [3, 1, 3, 'a', 0, 2.5, null], passed: ['b', 'a', 'b', 4, ''] }),
    ).toEqual({ ...EMPTY_PROGRESS, read: [1, 3], passed: ['b', 'a'] });
    expect(parseProgress({ read: 'x', passed: {}, welcomed: 'yes', tips: 3 })).toEqual(
      EMPTY_PROGRESS,
    );
    expect(parseProgress({ welcomed: true, tips: ['a', 'a', 1] })).toEqual({
      ...EMPTY_PROGRESS,
      welcomed: true,
      tips: ['a'],
    });
    // Saved before 12.7 (no `welcomed` / `tips`).
    expect(parseProgress({ read: [1], passed: [] })).toEqual({ ...EMPTY_PROGRESS, read: [1] });
  });

  it('adds chapters and exercises once', () => {
    let p = withRead(EMPTY_PROGRESS, 5);
    p = withRead(p, 2);
    expect(withRead(p, 5)).toBe(p);
    expect(p.read).toEqual([2, 5]);
    p = withPassed(p, 'ch2-x');
    expect(withPassed(p, 'ch2-x')).toBe(p);
    expect(p.passed).toEqual(['ch2-x']);
    p = withTipDismissed(p, 'dummy');
    expect(withTipDismissed(p, 'dummy')).toBe(p);
    expect(p.tips).toEqual(['dummy']);
  });

  it('is a first visit until the question is answered or any progress is made', () => {
    expect(isFirstVisit(EMPTY_PROGRESS)).toBe(true);
    expect(isFirstVisit(withWelcomed(EMPTY_PROGRESS))).toBe(false);
    expect(isFirstVisit(withRead(EMPTY_PROGRESS, 1))).toBe(false);
    expect(isFirstVisit(withPassed(EMPTY_PROGRESS, 'ch2-x'))).toBe(false);
    const w = withWelcomed(EMPTY_PROGRESS);
    expect(withWelcomed(w)).toBe(w);
  });
});
