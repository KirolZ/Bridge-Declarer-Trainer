// #/play/<dealCode>/<contract>[?v=ns] — plays the hand in the link (SPEC §4.4). The hand
// already in the store is kept when it is the same one (e.g. right after dealing it).

import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { decodeContract, decodeDeal } from '../../engine';
import type { HandSetup } from '../../game/playStore';
import { isSameHand } from '../../game/playStore';
import { gameStore, useGame, useT } from '../gameStore';
import { PlayTable } from '../table/PlayTable';

function handFromLink(code: string, contract: string, vul: string | null): HandSetup | null {
  const deal = decodeDeal(code);
  const c = decodeContract(contract);
  if (!deal || !c) return null;
  return { deal, contract: c, vulnerability: vul === 'ns' ? 'ns' : 'none' };
}

export function PlayPage() {
  const { code = '', contract = '' } = useParams();
  const [params] = useSearchParams();
  const vul = params.get('v');
  const setup = useMemo(() => handFromLink(code, contract, vul), [code, contract, vul]);
  const ready = useGame((s) => setup !== null && isSameHand(s, setup));
  const t = useT();

  useEffect(() => {
    if (setup && !isSameHand(gameStore.getState(), setup)) gameStore.getState().startHand(setup);
  }, [setup]);

  if (!setup) {
    return (
      <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">{t.common.badHandLink}</h1>
        <Link to="/" className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
          {t.common.backHome}
        </Link>
      </main>
    );
  }
  return ready ? <PlayTable /> : null;
}
