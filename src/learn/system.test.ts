// The bidding-system page of the guide (M34): every example auction is legal and its last call has
// a meaning from the game's own system; texts in both languages; how auctions are written.

import { describe, expect, it } from 'vitest';
import { explainAuction } from '../bidding';
import { auctionError, decodeAuction } from '../engine';
import { glossaryEntry, glossaryIn } from './glossary';
import { parseInline, termIds } from './markup';
import { SYSTEM_PAGE_WORDS, auctionSequence, systemPageIn } from './system';

const th = systemPageIn('th');
const en = systemPageIn('en');
const rows = th.sections.flatMap((s) => s.rows.map((r) => ({ section: s.id, ...r })));

function texts(page: typeof th): string[] {
  return [
    page.title,
    ...page.intro,
    ...page.sections.flatMap((s) => [s.title, ...(s.intro ? [s.intro] : [])]),
    ...page.sections.flatMap((s) => s.rows.flatMap((r) => (r.note ? [r.note] : []))),
    page.notUsedTitle,
    ...page.notUsed,
  ];
}

describe('the bidding-system page', () => {
  it.each(rows.map((r) => [`${r.section} ${r.auction.calls}`, r] as const))(
    '%s: a legal auction whose last call the system explains',
    (_, r) => {
      const auction = decodeAuction(r.auction.dealer, r.auction.calls);
      expect(auction).not.toBeNull();
      expect(auctionError(auction!)).toBeNull();
      const last = explainAuction(auction!, 'none').at(-1);
      expect(last, 'the system has no meaning for this call').toBeTruthy();
      expect(Object.keys(last!).length).toBeGreaterThan(0);
    },
  );

  it('has no example twice', () => {
    const keys = rows.map((r) => `${r.auction.dealer}:${r.auction.calls}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('is written in both languages, the same shape, linking only glossary terms', () => {
    expect(en.sections.map((s) => [s.id, s.rows.length, s.rows.map((r) => !!r.note)])).toEqual(
      th.sections.map((s) => [s.id, s.rows.length, s.rows.map((r) => !!r.note)]),
    );
    for (const page of [th, en]) {
      for (const text of texts(page)) {
        expect(text.trim()).not.toBe('');
        for (const id of termIds(text)) expect(glossaryEntry(id), `[[${id}]]`).toBeDefined();
      }
    }
    // The same cards and suits in both languages.
    const suits = (t: string) =>
      parseInline(t)
        .flatMap((p) => (p.t === 'suit' ? [p.suit] : []))
        .sort();
    texts(th).forEach((t, i) => expect(suits(texts(en)[i]!), t).toEqual(suits(t)));
  });

  it('uses no English word on the Thai page that the glossary does not explain', () => {
    const known = new Set([
      ...SYSTEM_PAGE_WORDS.map((w) => w.toLowerCase()),
      ...glossaryIn('th')
        .flatMap((e) => [e.term, ...(e.aliases ?? [])])
        .flatMap((t) => t.toLowerCase().split(/[^a-z0-9-]+/))
        .filter(Boolean),
      'nt',
    ]);
    const unknown = new Set<string>();
    for (const text of texts(th)) {
      const plain = parseInline(text)
        .map((p) => (p.t === 'text' || p.t === 'strong' ? p.text : ' '))
        .join(' ');
      for (const w of plain.match(/[A-Za-z][A-Za-z-]*[A-Za-z]/g) ?? []) {
        const l = w.toLowerCase();
        if (!known.has(l) && !known.has(l.replace(/s$/, ''))) unknown.add(w);
      }
    }
    expect([...unknown]).toEqual([]);
  });
});

describe('auctionSequence', () => {
  const seq = (dealer: 'N' | 'E', calls: string) => auctionSequence(decodeAuction(dealer, calls)!);

  it('leaves out the passes of a side that never bid', () => {
    expect(seq('N', '1S-P-2S')).toBe('1{S} – 2{S}');
    expect(seq('N', '1H-P-1N-P-P')).toBe('1{H} – 1NT – Pass');
  });

  it('puts the other side in brackets once they bid', () => {
    expect(seq('N', '1H-1S')).toBe('(1{H}) – 1{S}');
    expect(seq('N', '1H-X-P-1S')).toBe('(1{H}) – X – (Pass) – 1{S}');
    expect(seq('N', '1H-1S-2H')).toBe('1{H} – (1{S}) – 2{H}');
  });

  it('leaves out the passes before the opening', () => {
    expect(seq('E', 'P-1S-P-2S')).toBe('1{S} – 2{S}');
    expect(seq('N', 'P-1H-1S')).toBe('(1{H}) – 1{S}');
  });
});
