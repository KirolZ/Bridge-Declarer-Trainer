// Inline markup of the guide's text (see `Rich` in types.ts).

import type { Card, Suit } from '../engine';
import { parseCardCode } from '../engine';

export type Inline =
  | { readonly t: 'text'; readonly text: string }
  | { readonly t: 'strong'; readonly text: string }
  | { readonly t: 'term'; readonly id: string; readonly label: string | null }
  | { readonly t: 'card'; readonly card: Card }
  | { readonly t: 'suit'; readonly suit: Suit };

const TOKEN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\{([SHDC])([2-9TJQKA])?\}|\*\*([^*]+)\*\*/g;

/**
 * Splits `text` into plain text, glossary links, cards, suits and bold runs. Anything that does
 * not match a token stays plain text.
 */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index;
    if (at > last) out.push({ t: 'text', text: text.slice(last, at) });
    last = at + m[0].length;
    if (m[1] !== undefined) {
      // [[id]] or [[id|label]]
      const id = m[1].trim();
      const label = m[2] === undefined ? null : m[2].trim();
      out.push({ t: 'term', id, label });
    } else if (m[3] !== undefined) {
      const suit = m[3] as Suit;
      out.push(
        m[4] === undefined ? { t: 'suit', suit } : { t: 'card', card: parseCardCode(suit + m[4]) },
      );
    } else {
      out.push({ t: 'strong', text: m[5] as string });
    }
  }
  if (last < text.length) out.push({ t: 'text', text: text.slice(last) });
  return out;
}

/** Glossary ids linked from `text`. */
export function termIds(text: string): string[] {
  return parseInline(text).flatMap((p) => (p.t === 'term' ? [p.id] : []));
}

/** Card codes separated by spaces → cards. Throws on a bad code. */
export function parseCardList(list: string): Card[] {
  const codes = list.trim().split(/\s+/).filter(Boolean);
  return codes.map(parseCardCode);
}
