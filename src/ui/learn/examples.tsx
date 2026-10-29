// Card examples in the guide (SPEC §7.7: every example uses the game's own cards): a row of
// cards, a hand, a trick around the table and a bridge diagram, plus the chapter block renderer.

import type { ReactNode } from 'react';
import type { Card, PlayedCard, Seat, Strain } from '../../engine';
import { SEATS, cardCode, parseHand, trickWinner } from '../../engine';
import type { Block } from '../../learn';
import { parseCardList, trickPlays } from '../../learn';
import { useSuitOrder, useT } from '../gameStore';
import { OpenHand } from '../table/hands';
import { SEAT_NAME } from '../table/labels';
import { sortForDisplay } from '../table/layout';
import { PlayingCard } from '../table/PlayingCard';
import { Rich } from './Rich';

function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="learn-cards flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3">
      {children}
      {caption !== undefined && (
        <figcaption className="max-w-prose px-1 text-center text-sm leading-relaxed text-white/80">
          <Rich text={caption} />
        </figcaption>
      )}
    </figure>
  );
}

/** Cards side by side, as given. */
export function CardRow({ cards }: { cards: readonly Card[] }) {
  const t = useT();
  return (
    <div
      role="img"
      aria-label={cards.map(t.cardName).join(', ')}
      className="flex flex-wrap justify-center gap-1.5"
    >
      {cards.map((c) => (
        <PlayingCard key={cardCode(c)} card={c} />
      ))}
    </div>
  );
}

/** A hand sorted and fanned, overlapped just enough to fit the width. */
export function HandFan({ cards, seat }: { cards: readonly Card[]; seat?: Seat }) {
  const order = useSuitOrder();
  const t = useT();
  const sorted = sortForDisplay(cards, 'NT', order);
  const gaps = Math.max(sorted.length - 1, 1);
  const step = `min(calc(var(--card-w) * 0.6), calc((100cqw - var(--card-w)) / ${gaps}))`;
  const label = `${seat ? `${SEAT_NAME[seat]}: ` : ''}${sorted.map(t.cardName).join(', ')}`;
  return (
    <div className="flex w-full flex-col items-center gap-1">
      {seat && <span className="text-xs font-semibold text-white/70">{SEAT_NAME[seat]}</span>}
      <div className="w-full" style={{ containerType: 'inline-size' }}>
        <div
          role="img"
          aria-label={label}
          className="relative mx-auto"
          style={{
            width: `calc(var(--card-w) + ${sorted.length - 1} * ${step})`,
            height: 'calc(var(--card-w) * 1.4)',
          }}
        >
          {sorted.map((c, i) => (
            <div
              key={cardCode(c)}
              className="absolute top-0"
              style={{ left: `calc(${i} * ${step})` }}
            >
              <PlayingCard card={c} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const GRID_AREA: Record<Seat, string> = {
  N: '1 / 2 / 2 / 3',
  W: '2 / 1 / 3 / 2',
  E: '2 / 3 / 3 / 4',
  S: '3 / 2 / 4 / 3',
};

type TrickDiagramProps = {
  plays: readonly PlayedCard[];
  trump: Strain;
  /** Highlight the winner once the trick is complete. */
  showWinner?: boolean;
  /** Seat to play next, marked with "?". */
  toPlay?: Seat | null;
};

/** A trick around the table: cards numbered in play order, the winner highlighted. */
export function TrickDiagram({ plays, trump, showWinner = true, toPlay }: TrickDiagramProps) {
  const winner = showWinner && plays.length === 4 ? trickWinner(plays, trump) : null;
  const t = useT();
  return (
    <div
      className="grid items-center justify-items-center gap-x-2 gap-y-1"
      style={{
        gridTemplateColumns: 'repeat(3, var(--card-w))',
        gridTemplateRows: 'repeat(3, auto)',
      }}
      data-trick-diagram
      data-winner={winner ?? undefined}
    >
      <div
        className="grid size-full place-items-center text-center text-[11px] leading-tight text-white/60"
        style={{ gridArea: '2 / 2 / 3 / 3' }}
      >
        {plays[0] ? t.learn.led(plays[0].seat) : ''}
      </div>
      {SEATS.map((seat) => {
        const i = plays.findIndex((p) => p.seat === seat);
        const p = plays[i];
        const won = winner === seat;
        return (
          <div
            key={seat}
            className="flex flex-col items-center gap-0.5"
            style={{ gridArea: GRID_AREA[seat] }}
          >
            <span
              className={`text-[11px] font-semibold whitespace-nowrap ${won ? 'text-amber-300' : 'text-white/70'}`}
            >
              {SEAT_NAME[seat]}
              {won && t.learn.wins}
            </span>
            {p ? (
              <div
                className={`relative rounded-[6px] ${won ? 'shadow-[0_0_0_3px_#fcd34d,0_0_14px_3px_rgba(252,211,77,0.55)]' : ''}`}
                aria-label={`${i + 1}. ${SEAT_NAME[seat]}: ${t.cardName(p.card)}${won ? t.learn.winsLabel : ''}`}
                role="img"
                data-trick-seat={seat}
              >
                <PlayingCard card={p.card} />
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-sky-600 text-[11px] font-bold text-white shadow"
                >
                  {i + 1}
                </span>
              </div>
            ) : (
              <div
                className={`grid place-items-center rounded-[6px] border-2 border-dashed text-lg font-bold ${toPlay === seat ? 'border-amber-300 text-amber-300' : 'border-white/20 text-transparent'}`}
                style={{ width: 'var(--card-w)', aspectRatio: '5 / 7' }}
                aria-label={toPlay === seat ? t.learn.toPlay(seat) : undefined}
              >
                ?
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** A bridge diagram: the hands given, around the table. */
export function DealDiagram({
  hands,
  trump,
}: {
  hands: Partial<Record<Seat, string>>;
  /** Shown in the middle when given. */
  trump?: Strain;
}) {
  const slot = (seat: Seat) => {
    const h = hands[seat];
    if (h === undefined) return null;
    return (
      <div className="flex flex-col items-center gap-0.5" style={{ gridArea: GRID_AREA[seat] }}>
        <span className="text-[11px] font-semibold text-white/70">{SEAT_NAME[seat]}</span>
        <OpenHand cards={parseHand(h)} trump={trump ?? 'NT'} label={SEAT_NAME[seat]} />
      </div>
    );
  };
  return (
    <div className="w-full" style={{ containerType: 'inline-size' }}>
      <div className="mx-auto grid w-fit grid-cols-3 items-center justify-items-center gap-2">
        {SEATS.map((s) => (
          <div key={s} className="contents">
            {slot(s)}
          </div>
        ))}
        <div className="text-xs text-white/60" style={{ gridArea: '2 / 2 / 3 / 3' }}>
          {trump === undefined ? null : trump === 'NT' ? 'NT' : <Rich text={`trump {${trump}}`} />}
        </div>
      </div>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return (
        <p className="leading-relaxed">
          <Rich text={block.text} />
        </p>
      );
    case 'h':
      return <h2 className="mt-2 text-lg font-bold text-amber-200">{block.text}</h2>;
    case 'list':
      return (
        <ul className="flex list-disc flex-col gap-1 pl-6 leading-relaxed">
          {block.items.map((item, i) => (
            <li key={i}>
              <Rich text={item} />
            </li>
          ))}
        </ul>
      );
    case 'note':
      return (
        <aside className="rounded-xl bg-amber-300/10 px-3 py-2 leading-relaxed ring-1 ring-amber-300/40">
          <Rich text={block.text} />
        </aside>
      );
    case 'cards':
      return (
        <Figure caption={block.caption}>
          <CardRow cards={parseCardList(block.cards)} />
        </Figure>
      );
    case 'hand':
      return (
        <Figure caption={block.caption}>
          <HandFan cards={parseHand(block.hand)} seat={block.seat} />
        </Figure>
      );
    case 'trick':
      return (
        <Figure caption={block.caption}>
          <TrickDiagram
            plays={trickPlays(block.leader, parseCardList(block.cards))}
            trump={block.trump}
          />
        </Figure>
      );
    case 'deal':
      return (
        <Figure caption={block.caption}>
          <DealDiagram hands={block.hands} trump={block.trump} />
        </Figure>
      );
  }
}

/** A chapter's content. */
export function Blocks({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}
