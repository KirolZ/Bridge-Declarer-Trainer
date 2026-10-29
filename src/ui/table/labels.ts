// Seat names shown on the table: the same in every language. Text that differs by language
// (seat roles, card names, why a card cannot be played) is in src/i18n.

import type { Seat } from '../../engine';

export const SEAT_NAME: Readonly<Record<Seat, string>> = {
  N: 'North',
  E: 'East',
  S: 'South',
  W: 'West',
};
