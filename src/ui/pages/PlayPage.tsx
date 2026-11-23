// #/play/<dealCode>/<contract>[?v=ns][&d=<dealer>&a=<calls>] — plays the hand in the link
// (SPEC §4.4). The hand already in the store is kept when it is the same one (e.g. right after
// dealing it).

import { useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { handFromLink } from '../../game/handLink';
import { isSameHand } from '../../game/playStore';
import { gameStore, useGame, useT } from '../gameStore';
import { PlayTable } from '../table/PlayTable';

export function PlayPage() {
  const { code = '', contract = '' } = useParams();
  const [params] = useSearchParams();
  const query = params.toString();
  const setup = useMemo(
    () => handFromLink(code, contract, new URLSearchParams(query)),
    [code, contract, query],
  );
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
