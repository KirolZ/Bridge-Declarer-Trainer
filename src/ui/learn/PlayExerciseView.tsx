// Play an end position out against the double-dummy defenders (SPEC §7.7). All four hands are
// open (a double-dummy problem); the player plays North and South. On a miss it names the card
// that lost the goal; "show the answer" steps through a winning line one card at a time.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, PlayState, PlayedCard, Seat } from '../../engine';
import {
  completedTricks,
  currentTrick,
  formatDealPbn,
  legalPlays,
  remainingHands,
  sameCard,
  sideOf,
  toPlay,
  totalTricks,
  tricksWon,
} from '../../engine';
import { exerciseHand, exerciseOutcome, solutionLine } from '../../game/exercise';
import type { PlayStoreState } from '../../game/playStore';
import { isHandOver, isPlayerTurn } from '../../game/playStore';
import type { PlayExercise } from '../../learn';
import { exerciseDeal, exerciseStart } from '../../learn';
import { getSolver } from '../../worker';
import { exerciseStore, useExercise } from '../gameStore';
import type { CardMode, PlayHandler } from '../table/hands';
import { CardText, DummyHand, FannedHand, OpenHand } from '../table/hands';
import { SEAT_NAME, SEAT_ROLE } from '../table/labels';
import type { CardPick } from '../table/cardPick';
import { useCardPick } from '../table/cardPick';
import { ConfirmPlayBar } from '../table/ConfirmPlayBar';
import { TrickArea } from '../table/TrickArea';
import { Explanation, Feedback, PRIMARY, SECONDARY } from './ExerciseViews';
import { Rich, SuitSymbol } from './Rich';

type BoardProps = {
  play: PlayState;
  /** Show the last finished trick (with its winner) instead of the next, empty one. */
  showLast: boolean;
  active: Seat | null;
  thinking?: boolean;
  modeOf?: (seat: Seat) => (card: Card) => CardMode;
  onPlay?: PlayHandler;
  /** The card picked for confirmation (setting `cardPlay: 'confirm'`). */
  pick?: CardPick;
  /** Remounts the trick area (no animation after a restart). */
  trickKey: string | number;
};

const idle = () => (): CardMode => 'idle';
const noHint = () => false;

function SeatLabel({
  seat,
  active,
  thinking,
}: {
  seat: Seat;
  active: boolean;
  thinking?: boolean;
}) {
  return (
    <span
      data-seat={seat}
      data-active={active || undefined}
      className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
        active ? 'bg-amber-300 text-black' : 'bg-black/35 text-white/85'
      }`}
    >
      {SEAT_ROLE[seat]}
      {thinking && ' …'}
    </span>
  );
}

function Board({
  play,
  showLast,
  active,
  thinking,
  modeOf = idle,
  onPlay = () => {},
  pick,
  trickKey,
}: BoardProps) {
  const done = completedTricks(play);
  const shown = showLast ? done.at(-1) : undefined;
  const total = totalTricks(play);
  const trickNumber = Math.min(done.length + (showLast ? 0 : 1), total);
  const hands = remainingHands(play);
  const trump = play.contract.strain;
  const picked = pick?.picked ?? null;
  const confirmBar = (side: 'above' | 'below') =>
    pick &&
    picked && (
      <ConfirmPlayBar card={picked} side={side} onConfirm={pick.confirm} onCancel={pick.cancel} />
    );
  return (
    <div className="table-felt mx-auto w-full max-w-2xl" style={{ containerType: 'inline-size' }}>
      <div className="exercise-cards flex flex-col gap-2 p-2 sm:p-3">
        <section aria-label="North (dummy)" className="relative flex flex-col items-center gap-1">
          <SeatLabel seat="N" active={active === 'N'} />
          <DummyHand
            cards={hands.N}
            trump={trump}
            modeOf={modeOf('N')}
            hintOf={noHint}
            picked={picked}
            onPlay={onPlay}
          />
          {active === 'N' && confirmBar('below')}
        </section>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
          {(['W', 'E'] as const).map((s) => (
            <section
              key={s}
              aria-label={SEAT_NAME[s]}
              className={`flex flex-col items-center gap-1 ${s === 'E' ? 'order-3' : ''}`}
            >
              <SeatLabel seat={s} active={active === s} thinking={active === s && thinking} />
              <OpenHand cards={hands[s]} trump={trump} label={SEAT_NAME[s]} />
            </section>
          ))}
          <div className="order-2 flex justify-center">
            <TrickArea
              key={trickKey}
              trickNumber={trickNumber}
              plays={shown ? shown.plays : currentTrick(play)}
              winner={shown?.winner ?? null}
              gatherTo={done.at(-1)?.winner ?? null}
            />
          </div>
        </div>
        <section aria-label="South (คุณ)" className="relative flex flex-col items-center gap-1">
          <FannedHand
            cards={hands.S}
            trump={trump}
            modeOf={modeOf('S')}
            hintOf={noHint}
            picked={picked}
            onPlay={onPlay}
          />
          {active === 'S' && confirmBar('above')}
          <SeatLabel seat="S" active={active === 'S'} />
        </section>
      </div>
    </div>
  );
}

function Score({ play, goal }: { play: PlayState; goal: number }) {
  const won = tricksWon(play);
  const trump = play.contract.strain;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
      <span>
        {trump === 'NT' ? (
          'ไม่มี trump (NT)'
        ) : (
          <>
            trump <SuitSymbol suit={trump} />
          </>
        )}
      </span>
      <span>
        เป้า: NS ได้ <strong data-testid="goal">{goal}</strong> จาก {totalTricks(play)} trick
      </span>
      <span className="tabular-nums">
        NS <strong data-testid="tricks-ns">{won.NS}</strong> · EW{' '}
        <strong data-testid="tricks-ew">{won.EW}</strong>
      </span>
    </div>
  );
}

function statusText(state: PlayStoreState): string {
  const { play, trickPause, error } = state;
  if (!play) return '';
  if (error) return error;
  const last = completedTricks(play).at(-1);
  if (trickPause && last?.winner) return `${SEAT_NAME[last.winner]} กิน trick นี้`;
  const seat = toPlay(play);
  if (seat === 'N') return 'ถึงตา North (dummy) — กดไพ่ด้านบน';
  if (seat === 'S') return 'ถึงตา South (คุณ) — ลงไพ่จากมือด้านล่าง';
  if (seat) return `${SEAT_NAME[seat]} กำลังคิด…`;
  return '';
}

type Solution =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; line: PlayedCard[]; step: number };

function SolutionView(props: {
  ex: PlayExercise;
  start: PlayState;
  solution: Solution;
  onStep: (step: number) => void;
  onExit: () => void;
}) {
  const { ex, start, solution, onStep, onExit } = props;
  if (solution.status !== 'ready') {
    return (
      <Feedback tone={solution.status === 'error' ? 'wrong' : 'info'} title="เฉลย">
        <p>{solution.status === 'error' ? 'โหลดเฉลยไม่สำเร็จ' : 'กำลังเตรียมเฉลย…'}</p>
        <div>
          <button type="button" onClick={onExit} className={SECONDARY}>
            กลับไปเล่นเอง
          </button>
        </div>
      </Feedback>
    );
  }
  const { line, step } = solution;
  const play: PlayState = { ...start, plays: [...start.plays, ...line.slice(0, step)] };
  const showLast = step > 0 && play.plays.length % 4 === 0;
  const last = line[step - 1];
  const winner = showLast ? completedTricks(play).at(-1)?.winner : undefined;
  const end = step === line.length;
  return (
    <div className="flex flex-col gap-3" data-testid="solution" data-step={step}>
      <Score play={play} goal={ex.goal.nsTricks} />
      <Board play={play} showLast={showLast} active={null} trickKey="solution" />
      <Feedback tone="info" title={`เฉลย — ใบที่ ${step}/${line.length}`}>
        <p data-testid="solution-step">
          {last ? (
            <>
              {SEAT_ROLE[last.seat]} ลง <CardText card={last.card} />
              {winner && ` · ${SEAT_NAME[winner]} กิน trick นี้`}
            </>
          ) : (
            'กด "ถัดไป" เพื่อดูทีละใบ'
          )}
        </p>
        {end && (
          <p className="font-semibold text-emerald-200">
            จบแล้ว NS ได้ {tricksWon(play).NS} trick ตามเป้า
          </p>
        )}
        <Explanation text={ex.explanation} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onStep(step - 1)}
            disabled={step === 0}
            className={SECONDARY}
          >
            ← ก่อนหน้า
          </button>
          <button type="button" onClick={() => onStep(step + 1)} disabled={end} className={PRIMARY}>
            ถัดไป →
          </button>
          <button type="button" onClick={onExit} className={SECONDARY}>
            เล่นเอง
          </button>
        </div>
      </Feedback>
    </div>
  );
}

export function PlayExerciseView({ ex, onPass }: { ex: PlayExercise; onPass: () => void }) {
  const state = useExercise((s) => s);
  const start = useMemo(() => exerciseStart(ex), [ex]);
  const pbn = useMemo(() => formatDealPbn(exerciseDeal(ex)), [ex]);
  const [solution, setSolution] = useState<Solution | null>(null);
  const solutionRun = useRef(0);
  const [reviewFailed, setReviewFailed] = useState(false);
  const [reviewTry, setReviewTry] = useState(0);

  useEffect(() => {
    exerciseStore.getState().startHand(exerciseHand(ex));
    return () => exerciseStore.getState().leave();
  }, [ex]);

  const { play, analyses, epoch } = state;
  // The store may still hold another exercise for a moment.
  const ready = play !== null && formatDealPbn(play.deal) === pbn;
  const over = ready && isHandOver(state);
  const outcome = useMemo(
    () => (over && play ? exerciseOutcome(ex, play, analyses) : null),
    [over, play, analyses, ex],
  );
  const passed = outcome?.passed === true;
  const pick = useCardPick(
    ready && isPlayerTurn(state) ? `${pbn}:${epoch}:${play.plays.length}` : null,
    (card) => exerciseStore.getState().playCard(card),
  );

  useEffect(() => {
    if (passed) onPass();
  }, [passed, onPass]);

  // On a miss, fetch the analyses still needed to name the mistake.
  const needReview = over && outcome !== null && !outcome.passed;
  useEffect(() => {
    if (!needReview) return;
    let live = true;
    setReviewFailed(false);
    void exerciseStore
      .getState()
      .completeReview()
      .then((ok) => {
        if (live && !ok) setReviewFailed(true);
      });
    return () => {
      live = false;
    };
  }, [needReview, epoch, reviewTry]);

  const retry = useCallback(() => {
    solutionRun.current++;
    setSolution(null);
    const store = exerciseStore.getState();
    if (store.play && formatDealPbn(store.play.deal) === pbn) store.restart();
    else store.startHand(exerciseHand(ex));
  }, [ex, pbn]);

  const showSolution = useCallback(async () => {
    const run = ++solutionRun.current;
    exerciseStore.getState().leave();
    setSolution({ status: 'loading' });
    try {
      const line = await solutionLine(ex, (pos) => getSolver().analyze(pos));
      if (run === solutionRun.current) setSolution({ status: 'ready', line, step: 0 });
    } catch {
      if (run === solutionRun.current) setSolution({ status: 'error' });
    }
  }, [ex]);

  const buttons = (
    <div className="flex flex-wrap justify-center gap-2">
      <button type="button" onClick={retry} className={SECONDARY}>
        ↺ ลองใหม่
      </button>
      <button type="button" onClick={() => void showSolution()} className={SECONDARY}>
        ดูเฉลย
      </button>
    </div>
  );

  if (solution) {
    return (
      <SolutionView
        ex={ex}
        start={start}
        solution={solution}
        onStep={(step) => solution.status === 'ready' && setSolution({ ...solution, step })}
        onExit={retry}
      />
    );
  }
  if (!ready || !play) return <p className="text-center text-white/70">กำลังเตรียมโต๊ะ…</p>;

  const playerTurn = isPlayerTurn(state);
  const seat = toPlay(play);
  const legal = playerTurn ? legalPlays(play) : [];
  const modeOf =
    (owner: Seat) =>
    (card: Card): CardMode => {
      if (!playerTurn || seat !== owner) return 'idle';
      return legal.some((c) => sameCard(c, card)) ? 'playable' : 'illegal';
    };
  const onPlay = pick.onPlay;
  const active = !state.trickPause && !over ? seat : null;
  const goal = ex.goal.nsTricks;

  return (
    <div className="flex flex-col gap-3">
      <Score play={play} goal={goal} />
      <Board
        play={play}
        showLast={state.trickPause}
        active={active}
        thinking={state.botThinking && active !== null && sideOf(active) === 'EW'}
        modeOf={modeOf}
        onPlay={onPlay}
        pick={pick}
        trickKey={epoch}
      />
      {!over && (
        <p
          className="min-h-5 text-center text-sm text-white/90"
          data-testid="status"
          aria-live="polite"
        >
          {statusText(state)}
          {state.error && (
            <button
              type="button"
              onClick={() => exerciseStore.getState().retry()}
              className="ml-2 rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
            >
              ลองใหม่
            </button>
          )}
        </p>
      )}
      {outcome?.passed && (
        <Feedback tone="ok" title={`ผ่าน! NS ได้ ${outcome.tricks} trick ตามเป้า`}>
          <Explanation text={ex.explanation} />
        </Feedback>
      )}
      {outcome && !outcome.passed && (
        <Feedback tone="wrong" title={`ยังไม่ผ่าน — NS ได้ ${outcome.tricks} trick (เป้า ${goal})`}>
          {outcome.mistake ? (
            <div
              data-testid="mistake"
              data-card={`${outcome.mistake.card.suit}${outcome.mistake.card.rank}`}
            >
              <p>
                พลาดที่ trick {outcome.mistake.trick}: {SEAT_ROLE[outcome.mistake.seat]} ลง{' '}
                <CardText card={outcome.mistake.card} /> · ควรลง{' '}
                {outcome.mistake.best.map((c, i) => (
                  <span key={i}>
                    {i > 0 && ' หรือ '}
                    <CardText card={c} />
                  </span>
                ))}
              </p>
              {outcome.mistake.why && (
                <p className="mt-1 text-white/90">
                  <Rich text={outcome.mistake.why} />
                </p>
              )}
            </div>
          ) : reviewFailed ? (
            <p className="text-sm">
              หาจุดพลาดไม่สำเร็จ{' '}
              <button
                type="button"
                onClick={() => setReviewTry((n) => n + 1)}
                className="ml-1 rounded bg-white/15 px-2 py-0.5 hover:bg-white/25"
              >
                ลองใหม่
              </button>
            </p>
          ) : (
            <p className="text-sm text-white/70">กำลังหาจุดที่พลาด…</p>
          )}
          <Explanation text={ex.explanation} />
        </Feedback>
      )}
      {buttons}
    </div>
  );
}
