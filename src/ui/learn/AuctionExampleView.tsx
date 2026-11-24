// An auction in the guide (M32): the game's own auction table, open, with every call's meaning a
// tap away. There are no hands in sight here, so no summary of what the defenders hold.

import { useMemo, useState } from 'react';
import { explainAuction } from '../../bidding';
import { decodeAuction } from '../../engine';
import type { AuctionExample } from '../../learn';
import { AuctionTable } from '../table/AuctionTable';

export function AuctionExampleView({ example }: { example: AuctionExample }) {
  const auction = useMemo(() => decodeAuction(example.dealer, example.calls), [example]);
  const info = useMemo(
    () => (auction ? { meanings: explainAuction(auction, 'none'), inference: {} } : null),
    [auction],
  );
  const [open, setOpen] = useState(true);
  if (!auction || !info) return null;
  return (
    <div className="w-full text-left" data-testid="guide-auction">
      <AuctionTable
        auction={auction}
        vulnerability="none"
        info={info}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        className="rounded-xl px-1 py-1"
      />
    </div>
  );
}
