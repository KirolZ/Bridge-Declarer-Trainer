// Beginner-mode tips on the table (SPEC §7.8): one short message at a time at the corner of the
// table; "เข้าใจแล้ว" hides that tip for good. Which tip shows is `coachTip` (src/game/coach.ts).

import { motion } from 'framer-motion';
import type { Contract, Seat } from '../../engine';
import { cardCode, tricksNeeded } from '../../engine';
import type { CoachTip, TrickWin } from '../../game/coach';
import { Rich, TermSheetProvider } from '../learn/Rich';

/** The seat as the tip names it: you, dummy or a defender. */
function who(seat: Seat): string {
  if (seat === 'S') return 'คุณ (South)';
  if (seat === 'N') return 'dummy (North)';
  return seat === 'E' ? 'East' : 'West';
}

function contractText(contract: Contract): string {
  const needed = tricksNeeded(contract);
  if (contract.strain === 'NT') {
    return `contract คือ ${contract.level}NT — ต้องได้ ${needed} [[trick]] และไม่มี [[trump]]: ใบใหญ่ที่สุดของดอกที่[[lead|นำ]]กินเสมอ`;
  }
  const s = `{${contract.strain}}`;
  return `contract คือ ${contract.level}${s} — ต้องได้ ${needed} [[trick]] โดย ${s} เป็น [[trump]]`;
}

function winText(win: TrickWin, last: boolean): string {
  const card = `{${cardCode(win.card)}}`;
  const led = `{${win.led}}`;
  let text: string;
  if (win.how === 'ruff') {
    text = `trick ${win.trick}: ${who(win.winner)} ไม่มี ${led} จึง[[ruff|ตัด]]ด้วย ${card} — [[trump]] ชนะทุกดอกอื่น จึงกิน`;
  } else if (win.how === 'overruff') {
    text = `trick ${win.trick}: มีคนตัดด้วย [[trump]] มากกว่า 1 คน ${card} ของ ${who(win.winner)} เป็น trump ใบใหญ่ที่สุด จึงกิน ([[overruff|ตัดซ้อน]])`;
  } else {
    text = `trick ${win.trick}: ${who(win.winner)} กินด้วย ${card} — ใบใหญ่ที่สุดของดอกที่[[lead|นำ]] (${led})`;
    if (win.discard) text += ' ใบดอกอื่นที่[[discard|ทิ้ง]]ลงมากินไม่ได้';
  }
  if (!last) text += ` · ${who(win.winner)} นำ trick ถัดไป`;
  return text;
}

function tipText(tip: CoachTip, contract: Contract, totalTricks: number): string {
  switch (tip.id) {
    case 'contract':
      return contractText(contract);
    case 'dummy':
      return 'North คือ [[dummy]] — หงายไพ่ให้ทุกคนเห็น และ**คุณเป็นคนเลือก**ทุกใบที่มือนี้ลง';
    case 'north-turn':
      return 'ตอนนี้ถึงตา dummy — กดไพ่ของ **North ด้านบน**';
    case 'ruff':
    case 'trick-won':
      return winText(tip.win, tip.win.trick === totalTricks);
  }
}

type CoachTipViewProps = {
  tip: CoachTip | null;
  contract: Contract;
  totalTricks: number;
  onDismiss: (id: CoachTip['id']) => void;
};

export function CoachTipView({ tip, contract, totalTricks, onDismiss }: CoachTipViewProps) {
  const key = tip ? `${tip.id}${'win' in tip ? tip.win.trick : ''}` : 'none';
  return (
    <TermSheetProvider>
      {tip && (
        <motion.aside
          key={key}
          role="status"
          aria-label="คำแนะนำ"
          data-testid="coach-tip"
          data-tip={tip.id}
          className="z-10 m-2 mb-0 flex items-start gap-2 rounded-xl bg-sky-950/90 px-3 py-2 text-sm leading-relaxed shadow-lg ring-1 ring-sky-300/40 lg:absolute lg:top-16 lg:left-6 lg:m-0 lg:w-56"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span aria-hidden="true">💬</span>
          <span className="flex-1">
            <Rich text={tipText(tip, contract, totalTricks)} />
            <button
              type="button"
              onClick={() => onDismiss(tip.id)}
              data-testid="coach-dismiss"
              className="mt-1 block rounded-md bg-sky-300 px-2.5 py-0.5 text-xs font-semibold text-black hover:bg-sky-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              เข้าใจแล้ว
            </button>
          </span>
        </motion.aside>
      )}
    </TermSheetProvider>
  );
}
