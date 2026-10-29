// The score explained line by line, for the result panel in beginner mode (SPEC §7.8): where each
// part of the score comes from, in the words of chapter 6 (`words`: the player's language).

import type { Contract } from '../../engine';
import { SUIT_INFO, contractLabel, scoreBreakdown, tricksNeeded } from '../../engine';
import type { Messages } from '../../i18n';

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
  words: Messages['score'],
): ScoreExplanation {
  const s = scoreBreakdown(contract, tricks, vulnerable);
  const vul = words.vul(vulnerable);
  const name = contractLabel(contract);
  const needed = tricksNeeded(contract);

  if (!s.made) {
    const per = vulnerable ? 100 : 50;
    const down = -s.result;
    return {
      lines: [
        {
          label: words.down(down),
          detail: words.downDetail(down, per, vul),
          points: s.undertrickPoints,
        },
      ],
      total: s.total,
      summary: words.downSummary(name, needed, tricks),
    };
  }

  const { level } = contract;
  const minor = contract.strain === 'C' || contract.strain === 'D';
  const per = minor ? 20 : 30;
  const lines: ScoreLine[] = [
    {
      label: words.contractTricks(level),
      detail:
        contract.strain === 'NT'
          ? level === 1
            ? words.ntFirst
            : words.ntMore(level - 1)
          : words.suitDetail(level, per, strainName(contract)),
      points: s.contractPoints,
    },
  ];
  if (s.result > 0) {
    lines.push({
      label: words.overtricks(s.result),
      detail: `${s.result} × ${per}`,
      points: s.overtrickPoints,
    });
  }
  const game = s.contractPoints >= 100;
  lines.push({
    label: game ? words.gameBonus : words.partscoreBonus,
    detail: game ? words.gameDetail(vul, s.gameBonus) : words.partscoreDetail,
    points: s.gameBonus,
  });
  if (s.slamBonus > 0) {
    lines.push({ label: words.slamBonus(level === 7), detail: vul, points: s.slamBonus });
  }
  return {
    lines,
    total: s.total,
    summary: words.madeSummary(name, needed, tricks, s.result > 0),
  };
}
