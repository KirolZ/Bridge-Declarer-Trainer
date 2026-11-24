// The words for a call's meaning and for what the defenders hold (SPEC §6.5, §8 — M31), written
// from the data the bidder used (src/bidding/meaning.ts), in the guide's inline markup so terms
// open the glossary and suits show in colour. `plainText` gives the same words for a tooltip.

import type { Range, Meaning } from '../../bidding';
import { MAX_HCP } from '../../bidding';
import type { Inference } from '../../game/inference';
import type { Suit } from '../../engine';
import { SUITS, SUIT_INFO, cardLabel } from '../../engine';
import type { Messages } from '../../i18n';
import type { Language } from '../../game/settings';
import { glossaryEntry, parseInline } from '../../learn';

/** `12–16`, `6`, or `12+` when the range reaches `max`. */
export function rangeText([lo, hi]: Range, max: number): string {
  if (hi >= max) return `${lo}+`;
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}

function cardsText(t: Messages, suit: Suit, [lo, hi]: Range, max: number): string {
  return t.meaning.cards(suit, lo, hi >= max ? null : hi);
}

const SEP = ' · ';

/** What a call says, or that the system does not explain it. */
export function meaningMarkup(m: Meaning | null, t: Messages): string {
  if (!m || Object.keys(m).length === 0) return t.meaning.none;
  const parts: string[] = [];
  if (m.name) parts.push(t.meaning.name[m.name]);
  if (m.hcp && !(m.hcp[0] === 0 && m.hcp[1] >= MAX_HCP)) {
    parts.push(t.meaning.hcp(rangeText(m.hcp, MAX_HCP)));
  }
  for (const s of SUITS) {
    const r = m.len?.[s];
    if (r && !(r[0] === 0 && r[1] >= 13)) parts.push(cardsText(t, s, r, 13));
  }
  if (m.balanced) parts.push(t.meaning.balanced);
  if (m.aces) parts.push(t.meaning.aces(m.aces));
  if (m.stoppers && m.stoppers.length > 0) parts.push(t.meaning.stoppers(m.stoppers));
  if (m.forcing) parts.push(t.meaning.forcing[m.forcing]);
  if (m.artificial) parts.push(t.meaning.artificial);
  return parts.length > 0 ? parts.join(SEP) : t.meaning.none;
}

/** What is known about a hidden hand: its points, then every suit the player can tell about. */
export function inferenceMarkup(inf: Inference, t: Messages): string {
  const parts = [t.meaning.hcp(rangeText(inf.hcp, MAX_HCP + 1))];
  for (const s of SUITS) {
    const r = inf.len[s];
    const max = inf.unseen[s];
    if (!(r[0] === 0 && r[1] >= max)) parts.push(cardsText(t, s, r, max));
  }
  if (inf.balanced) parts.push(t.meaning.balanced);
  return parts.join(SEP);
}

/** Markup as plain text: terms as their words, suits and cards as symbols. */
export function plainText(markup: string, lang: Language): string {
  return parseInline(markup)
    .map((p) => {
      switch (p.t) {
        case 'text':
        case 'strong':
          return p.text;
        case 'term':
          return p.label ?? glossaryEntry(p.id, lang)?.term ?? p.id;
        case 'suit':
          return SUIT_INFO[p.suit].symbol;
        case 'card':
          return cardLabel(p.card);
      }
    })
    .join('');
}
