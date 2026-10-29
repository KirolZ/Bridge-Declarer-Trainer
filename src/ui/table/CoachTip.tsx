// Beginner-mode tips on the table (SPEC §7.8): one short message at a time at the corner of the
// table; "got it" hides that tip for good. Which tip shows is `coachTip` (src/game/coach.ts).

import { motion } from 'framer-motion';
import type { Contract } from '../../engine';
import { cardCode, tricksNeeded } from '../../engine';
import type { CoachTip, TrickWin } from '../../game/coach';
import type { Messages } from '../../i18n';
import { useT } from '../gameStore';
import { Rich, TermSheetProvider } from '../learn/Rich';

type Coach = Messages['coach'];

function contractText(c: Coach, contract: Contract): string {
  const needed = tricksNeeded(contract);
  if (contract.strain === 'NT') return c.contractNT(contract.level, needed);
  return c.contractSuit(contract.level, `{${contract.strain}}`, needed);
}

function winText(c: Coach, win: TrickWin, last: boolean): string {
  const card = `{${cardCode(win.card)}}`;
  const led = `{${win.led}}`;
  const who = c.who(win.winner);
  let text: string;
  if (win.how === 'ruff') text = c.ruff(win.trick, who, led, card);
  else if (win.how === 'overruff') text = c.overruff(win.trick, who, card);
  else {
    text = c.won(win.trick, who, card, led);
    if (win.discard) text += c.discard;
  }
  if (!last) text += c.nextLead(who);
  return text;
}

function tipText(c: Coach, tip: CoachTip, contract: Contract, totalTricks: number): string {
  switch (tip.id) {
    case 'contract':
      return contractText(c, contract);
    case 'dummy':
      return c.dummy;
    case 'north-turn':
      return c.northTurn;
    case 'ruff':
    case 'trick-won':
      return winText(c, tip.win, tip.win.trick === totalTricks);
  }
}

type CoachTipViewProps = {
  tip: CoachTip | null;
  contract: Contract;
  totalTricks: number;
  onDismiss: (id: CoachTip['id']) => void;
};

export function CoachTipView({ tip, contract, totalTricks, onDismiss }: CoachTipViewProps) {
  const t = useT();
  const key = tip ? `${tip.id}${'win' in tip ? tip.win.trick : ''}` : 'none';
  return (
    <TermSheetProvider>
      {tip && (
        <motion.aside
          key={key}
          role="status"
          aria-label={t.table.tip}
          data-testid="coach-tip"
          data-tip={tip.id}
          className="z-10 m-2 mb-0 flex items-start gap-2 rounded-xl bg-sky-950/90 px-3 py-2 text-sm leading-relaxed shadow-lg ring-1 ring-sky-300/40 lg:absolute lg:top-16 lg:left-6 lg:m-0 lg:w-56"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span aria-hidden="true">💬</span>
          <span className="flex-1">
            <Rich text={tipText(t.coach, tip, contract, totalTricks)} />
            <button
              type="button"
              onClick={() => onDismiss(tip.id)}
              data-testid="coach-dismiss"
              className="mt-1 block rounded-md bg-sky-300 px-2.5 py-0.5 text-xs font-semibold text-black hover:bg-sky-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {t.table.gotIt}
            </button>
          </span>
        </motion.aside>
      )}
    </TermSheetProvider>
  );
}
