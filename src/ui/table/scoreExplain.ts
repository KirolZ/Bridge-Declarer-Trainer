// The score explained line by line, for the result panel in beginner mode (SPEC §7.8): where each
// part of the score comes from, in the words of chapter 6.

import type { Contract } from '../../engine';
import { SUIT_INFO, contractLabel, scoreBreakdown, tricksNeeded } from '../../engine';

export type ScoreLine = {
  readonly label: string;
  /** How the points were worked out, e.g. "4 × 30". */
  readonly detail: string;
  readonly points: number;
};

export type ScoreExplanation = {
  readonly lines: readonly ScoreLine[];
  readonly total: number;
  /** One sentence on what the total means. */
  readonly summary: string;
};

function strainName(contract: Contract): string {
  return contract.strain === 'NT' ? 'NT' : SUIT_INFO[contract.strain].symbol;
}

export function explainScore(
  contract: Contract,
  tricks: number,
  vulnerable: boolean,
): ScoreExplanation {
  const s = scoreBreakdown(contract, tricks, vulnerable);
  const vul = vulnerable ? 'vul' : 'ไม่ vul';
  const name = contractLabel(contract);

  if (!s.made) {
    const per = vulnerable ? 100 : 50;
    const down = -s.result;
    return {
      lines: [
        {
          label: `ขาด ${down} trick`,
          detail: `${down} × ${per} (${vul}: trick ละ ${per})`,
          points: s.undertrickPoints,
        },
      ],
      total: s.total,
      summary: `${name} ต้องได้ ${tricksNeeded(contract)} trick แต่ได้ ${tricks} — ทำไม่ได้จึงไม่ได้แต้มของ trick เลย และเสียแต้มให้ฝั่งป้องกันตามจำนวน trick ที่ขาด`,
    };
  }

  const { level } = contract;
  const minor = contract.strain === 'C' || contract.strain === 'D';
  const per = minor ? 20 : 30;
  const lines: ScoreLine[] = [
    {
      label: `trick ตามสัญญา (${level} trick เกิน 6)`,
      detail:
        contract.strain === 'NT'
          ? level === 1
            ? 'NT trick แรก 40'
            : `NT trick แรก 40 + อีก ${level - 1} × 30`
          : `${level} × ${per} (${strainName(contract)} trick ละ ${per})`,
      points: s.contractPoints,
    },
  ];
  if (s.result > 0) {
    lines.push({
      label: `trick ที่เกิน ${s.result} trick`,
      detail: `${s.result} × ${per}`,
      points: s.overtrickPoints,
    });
  }
  const game = s.contractPoints >= 100;
  lines.push({
    label: game ? 'โบนัส game' : 'โบนัส partscore',
    detail: game
      ? `แต้มของ trick ตามสัญญาถึง 100 · ${vul} ได้ ${s.gameBonus}`
      : 'แต้มของ trick ตามสัญญาไม่ถึง 100',
    points: s.gameBonus,
  });
  if (s.slamBonus > 0) {
    lines.push({
      label: level === 7 ? 'โบนัส grand slam' : 'โบนัส small slam',
      detail: vul,
      points: s.slamBonus,
    });
  }
  return {
    lines,
    total: s.total,
    summary: `${name} ต้องได้ ${tricksNeeded(contract)} trick และได้ ${tricks} — ทำได้ จึงได้แต้มของ trick ตามสัญญา${s.result > 0 ? ' trick ที่เกิน' : ''} และโบนัส`,
  };
}
