// The table (SPEC §8): dummy on top, South at the bottom, the defenders left and right and the
// trick in the middle. The player plays South's and dummy's cards; the store plays the defenders.

import { useEffect, useRef } from 'react';
import type { Card, Seat } from '../../engine';
import {
  completedTricks,
  currentTrick,
  isComplete,
  legalPlays,
  remainingHands,
  sameCard,
  sideOf,
  toPlay,
  totalTricks,
  tricksWon,
} from '../../engine';
import { DealingOverlay } from '../DealingOverlay';
import { gameStore, useDealNew, useGame } from '../gameStore';
import type { CardMode, PlayHandler } from './hands';
import { DummyHand, FaceDownRow, FannedHand, HiddenHand } from './hands';
import { InfoBar } from './InfoBar';
import { SEAT_NAME, SEAT_ROLE, cardName } from './labels';
import { ResultPanel } from './ResultPanel';
import { TrickArea } from './TrickArea';

type SeatTagProps = { seat: Seat; active: boolean; thinking?: boolean; className?: string };

function SeatTag({ seat, active, thinking, className }: SeatTagProps) {
  return (
    <span
      data-seat={seat}
      data-active={active || undefined}
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap sm:text-sm',
        active
          ? 'bg-amber-300 text-black shadow-[0_0_12px_rgba(252,211,77,0.7)]'
          : 'bg-black/35 text-white/85',
        className,
      ].join(' ')}
    >
      {SEAT_ROLE[seat]}
      {thinking && (
        <span className="inline-flex gap-0.5" aria-label="กำลังคิด">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1 animate-bounce rounded-full bg-current"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      )}
    </span>
  );
}

export function PlayTable() {
  const hand = useGame((s) => s.hand);
  const play = useGame((s) => s.play);
  const trickPause = useGame((s) => s.trickPause);
  const botThinking = useGame((s) => s.botThinking);
  const error = useGame((s) => s.error);
  const notice = useGame((s) => s.notice);
  const dealNew = useDealNew();
  const root = useRef<HTMLDivElement>(null);
  /** The last card was played from the keyboard: keep focus on the cards. */
  const keyboard = useRef(false);

  const seat = play ? toPlay(play) : null;
  const playerTurn = !trickPause && !error && seat !== null && sideOf(seat) === 'NS';
  const plays = play?.plays.length ?? 0;

  useEffect(() => {
    if (!playerTurn || !keyboard.current) return;
    root.current?.querySelector<HTMLElement>('[data-playable="true"]')?.focus();
  }, [playerTurn, plays]);

  if (!hand || !play) return null;

  const done = completedTricks(play);
  const total = totalTricks(play);
  const over = isComplete(play) && !trickPause;
  const shown = trickPause ? done.at(-1) : undefined;
  const trickPlays = shown ? shown.plays : currentTrick(play);
  const trickNumber = Math.min(done.length + (trickPause ? 0 : 1), total);
  const legal = playerTurn ? legalPlays(play) : [];
  const hands = remainingHands(play);
  const trump = play.contract.strain;
  const last = play.plays.at(-1);

  const modeOf =
    (owner: Seat) =>
    (card: Card): CardMode => {
      if (!playerTurn || seat !== owner) return 'idle';
      return legal.some((c) => sameCard(c, card)) ? 'playable' : 'illegal';
    };
  const onPlay: PlayHandler = (card, viaKeyboard) => {
    keyboard.current = viaKeyboard;
    gameStore.getState().playCard(card);
  };
  const active = (s: Seat) => !trickPause && !over && seat === s;

  let status = '';
  if (over) status = '';
  else if (error) status = error;
  else if (shown?.winner) status = `${SEAT_NAME[shown.winner]} กิน trick นี้`;
  else if (seat === 'N') status = 'ถึงตา dummy — กดไพ่ของ North ด้านบน';
  else if (seat === 'S') status = 'ถึงตาคุณ — ลงไพ่จากมือ South';
  else if (seat) status = `${SEAT_NAME[seat]} กำลังคิด…`;

  return (
    <div ref={root} className="flex min-h-full flex-col">
      <InfoBar
        contract={play.contract}
        vulnerability={hand.vulnerability}
        won={tricksWon(play)}
        trickNumber={trickNumber}
        totalTricks={total}
      />
      {notice && (
        <div
          className="flex items-start gap-2 bg-amber-300 px-3 py-2 text-sm text-black"
          role="status"
        >
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            onClick={() => gameStore.getState().dismissNotice()}
            className="rounded px-2 font-semibold hover:bg-black/10"
          >
            ปิด
          </button>
        </div>
      )}

      <main className="flex flex-1 flex-col p-2 sm:p-4">
        <div
          className="table-felt relative mx-auto flex w-full max-w-4xl flex-1 flex-col"
          style={{ containerType: 'inline-size' }}
        >
          <div className="table-cards flex flex-1 flex-col justify-between gap-2 p-2 sm:gap-3 sm:p-4">
            <section
              aria-label="North (dummy)"
              data-turn={active('N') || undefined}
              className={[
                'relative flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-colors',
                active('N') && 'bg-amber-300/10 ring-2 ring-amber-300',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Wider screens: name tags in the corner, to save height. */}
              <SeatTag seat="N" active={active('N')} className="sm:absolute sm:top-2 sm:left-3" />
              {plays > 0 ? (
                <DummyHand cards={hands.N} trump={trump} modeOf={modeOf('N')} onPlay={onPlay} />
              ) : (
                <FaceDownRow count={hands.N.length} />
              )}
            </section>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
              <section aria-label="West" className="flex flex-col items-center gap-1.5">
                <SeatTag seat="W" active={active('W')} thinking={active('W') && botThinking} />
                <HiddenHand count={hands.W.length} label="West" />
              </section>
              <div className="flex justify-center">
                <TrickArea
                  trickNumber={trickNumber}
                  plays={trickPlays}
                  winner={shown?.winner ?? null}
                  gatherTo={done.at(-1)?.winner ?? null}
                />
              </div>
              <section aria-label="East" className="flex flex-col items-center gap-1.5">
                <SeatTag seat="E" active={active('E')} thinking={active('E') && botThinking} />
                <HiddenHand count={hands.E.length} label="East" />
              </section>
            </div>

            <section
              aria-label="South (คุณ)"
              data-turn={active('S') || undefined}
              className={[
                'relative flex flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-colors',
                active('S') && 'bg-amber-300/10 ring-2 ring-amber-300',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <p
                className="min-h-5 text-center text-sm text-white/90"
                data-testid="status"
                aria-live="polite"
              >
                {status}
                {error && (
                  <button
                    type="button"
                    onClick={() => gameStore.getState().retry()}
                    className="ml-2 rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
                  >
                    ลองใหม่
                  </button>
                )}
              </p>
              <FannedHand cards={hands.S} trump={trump} modeOf={modeOf('S')} onPlay={onPlay} />
              <SeatTag seat="S" active={active('S')} className="sm:absolute sm:top-2 sm:left-3" />
            </section>
          </div>
        </div>
      </main>

      <p className="sr-only" aria-live="polite">
        {last ? `${SEAT_NAME[last.seat]} ลง ${cardName(last.card)}` : ''}
      </p>
      {over && (
        <ResultPanel
          contract={play.contract}
          vulnerability={hand.vulnerability}
          nsTricks={tricksWon(play).NS}
          onNewHand={() => void dealNew()}
        />
      )}
      <DealingOverlay />
    </div>
  );
}
