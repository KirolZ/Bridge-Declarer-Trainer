// Seat and vulnerability names shown on the table.

import type { Card, Seat, Vulnerability } from '../../engine';
import { SUIT_INFO, rankLabel } from '../../engine';

export const SEAT_NAME: Readonly<Record<Seat, string>> = {
  N: 'North',
  E: 'East',
  S: 'South',
  W: 'West',
};

/** Seat name with its role, e.g. "North (dummy)". */
export const SEAT_ROLE: Readonly<Record<Seat, string>> = {
  N: 'North (dummy)',
  E: 'East',
  S: 'South (คุณ)',
  W: 'West',
};

export const VULNERABILITY_LABEL: Readonly<Record<Vulnerability, string>> = {
  none: 'ไม่มีฝ่ายไหน vul',
  ns: 'NS vul',
};

/** Spoken name of a card, e.g. "A โพดำ", "10 โพแดง". */
export function cardName(card: Card): string {
  return `${rankLabel(card.rank)} ${SUIT_INFO[card.suit].thaiName}`;
}
