// The table (SPEC §8): dummy on top, South at the bottom, the defenders left and right and the
// trick in the middle. The player plays South's and dummy's cards; the store plays the defenders.
// Practice tools (SPEC §7.2–§7.4, §7.6): hint (H), undo (U), claim, play again, study mode.
// The `?` button opens the guide chapter about the situation in a side panel (SPEC §7.7); beginner
// mode (SPEC §7.8) adds tips at the corner and says why a card cannot be played.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, Seat } from '../../engine';
import {
  completedTricks,
  currentTrick,
  illegalReason,
  legalPlays,
  remainingHands,
  sameCard,
  toPlay,
  totalTricks,
  tricksNeeded,
  tricksWon,
} from '../../engine';
import { coachTip, guideChapterFor } from '../../game/coach';
import { canUndo, isHandOver, isPlayerTurn, tricksLeft } from '../../game/playStore';
import { reviewHand } from '../../game/review';
import { DealingOverlay } from '../DealingOverlay';
import {
  gameStore,
  learnStore,
  updateSettings,
  useDealNew,
  useGame,
  useLearn,
  useSettings,
} from '../gameStore';
import { GuidePanel } from '../learn/GuidePanel';
import { ActionBar } from './ActionBar';
import { ClaimDialog } from './ClaimDialog';
import { CoachTipView } from './CoachTip';
import { useCardPick } from './cardPick';
import type { BlockedHandler, CardMode, PlayHandler } from './hands';
import { DummyHand, FaceDownRow, FannedHand, HiddenHand, OpenHand } from './hands';
import { InfoBar } from './InfoBar';
import { SEAT_NAME, SEAT_ROLE, cardName, illegalText } from './labels';
import type { ReviewStatus } from './ResultPanel';
import { ResultPanel } from './ResultPanel';
import { ReplayView } from './ReplayView';
import type { PendingPlay } from './TrickArea';
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

/** Keys for the practice tools; ignored while typing or with a modifier held. */
function useShortcuts(enabled: boolean, onHint: () => void, onUndo: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if ((e.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) {
        return;
      }
      // `code` is the physical key, so H / U also work with the Thai keyboard layout.
      if (e.code === 'KeyH') onHint();
      else if (e.code === 'KeyU') onUndo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, onHint, onUndo]);
}

function reviewStatus(complete: boolean, failed: boolean): ReviewStatus {
  if (complete) return 'ready';
  return failed ? 'failed' : 'loading';
}

export function PlayTable() {
  const state = useGame((s) => s);
  const { hand, play, trickPause, botThinking, error, notice, hint, studyMode, epoch } = state;
  const dealing = useGame((s) => s.dealing);
  const dealNew = useDealNew();
  const root = useRef<HTMLDivElement>(null);
  /** The last action came from the keyboard: keep focus on the cards. */
  const keyboard = useRef(false);
  const [claimOpen, setClaimOpen] = useState(false);
  /** Trick on show in the replay (1-based), or null for the summary. */
  const [replayTrick, setReplayTrick] = useState<number | null>(null);
  const [reviewFailed, setReviewFailed] = useState(false);
  /** Bumped by "ลองใหม่" on a failed review. */
  const [reviewTry, setReviewTry] = useState(0);
  /** Chapter open in the guide panel, or null when closed. */
  const [guide, setGuide] = useState<number | null>(null);
  /** Why the card just clicked cannot be played (beginner mode), for position `at`. */
  const [blocked, setBlocked] = useState<{ at: number; text: string } | null>(null);
  const beginner = useSettings((s) => s.settings.beginnerMode);
  const dismissedTips = useLearn((s) => s.progress.tips);

  const seat = play ? toPlay(play) : null;
  const playerTurn = isPlayerTurn(state);
  const plays = play?.plays.length ?? 0;
  const over = isHandOver(state);
  const pick = useCardPick(playerTurn ? `${epoch}:${plays}` : null, (card, viaKeyboard) => {
    keyboard.current = viaKeyboard;
    gameStore.getState().playCard(card);
  });

  // Post-hand review (SPEC §7.5): fetch any analysis still missing once the hand is over.
  const { analyses, claimed } = state;
  const review = useMemo(
    () => (over && play ? reviewHand(play, analyses, claimed) : null),
    [over, play, analyses, claimed],
  );
  useEffect(() => {
    if (!over) {
      setReplayTrick(null);
      return;
    }
    let live = true;
    setReviewFailed(false);
    void gameStore
      .getState()
      .completeReview()
      .then((ok) => {
        if (live && !ok) setReviewFailed(true);
      });
    return () => {
      live = false;
    };
  }, [over, epoch, reviewTry]);

  useEffect(() => {
    if (!playerTurn || !keyboard.current) return;
    root.current?.querySelector<HTMLElement>('[data-playable="true"]')?.focus();
  }, [playerTurn, plays, epoch]);

  useEffect(() => {
    if (!hint || !keyboard.current) return;
    root.current?.querySelector<HTMLElement>('[data-hint="true"]')?.focus();
  }, [hint]);

  const onHint = useCallback(() => {
    void gameStore.getState().showHint();
  }, []);
  const onUndo = useCallback(() => {
    gameStore.getState().undo();
  }, []);
  const onRestart = useCallback(() => gameStore.getState().restart(), []);
  // Study mode is a saved setting; the store follows it (see gameStore.ts).
  const onStudyMode = useCallback((on: boolean) => updateSettings({ studyMode: on }), []);
  const onKeyHint = useCallback(() => {
    keyboard.current = true;
    onHint();
  }, [onHint]);
  const onKeyUndo = useCallback(() => {
    keyboard.current = true;
    onUndo();
  }, [onUndo]);
  const onPlayFrom = useCallback((trick: number) => {
    gameStore.getState().rewindTo((trick - 1) * 4);
  }, []);
  const onCloseReplay = useCallback(() => setReplayTrick(null), []);
  const onCloseGuide = useCallback(() => setGuide(null), []);
  const onDismissTip = useCallback((id: string) => learnStore.getState().dismissTip(id), []);
  useShortcuts(
    !claimOpen && !dealing && replayTrick === null && guide === null,
    onKeyHint,
    onKeyUndo,
  );

  if (!hand || !play) return null;

  const done = completedTricks(play);
  const total = totalTricks(play);
  const shown = trickPause ? done.at(-1) : undefined;
  const trickPlays = shown ? shown.plays : currentTrick(play);
  const trickNumber = Math.min(done.length + (trickPause ? 0 : 1), total);
  const legal = playerTurn ? legalPlays(play) : [];
  const hands = remainingHands(play);
  const trump = play.contract.strain;
  const last = play.plays.at(-1);
  const won = tricksWon(play);
  const needed = tricksNeeded(play.contract);
  const liveHint = playerTurn && hint?.at === plays ? hint : null;

  const modeOf =
    (owner: Seat) =>
    (card: Card): CardMode => {
      if (!playerTurn || seat !== owner) return 'idle';
      return legal.some((c) => sameCard(c, card)) ? 'playable' : 'illegal';
    };
  const hintOf =
    (owner: Seat) =>
    (card: Card): boolean =>
      liveHint !== null && seat === owner && liveHint.cards.some((c) => sameCard(c, card));
  const onPlay: PlayHandler = pick.onPlay;
  const picked = pick.picked;
  const pending: PendingPlay | null =
    picked && seat ? { seat, card: picked, onConfirm: pick.confirm, onCancel: pick.cancel } : null;
  // Beginner mode: say why the card cannot be played now (SPEC §7.8).
  const onBlocked: BlockedHandler | undefined = beginner
    ? (card) => {
        if (trickPause || over || !seat) return;
        let text: string;
        if (!playerTurn) text = `รอ ${SEAT_NAME[seat]} ลงก่อน`;
        else {
          const reason = illegalReason(play, card);
          if (!reason) return;
          text = illegalText(reason, hands.N.some((c) => sameCard(c, card)) ? 'N' : 'S');
        }
        setBlocked({ at: plays, text });
      }
    : undefined;
  const blockedText = blocked?.at === plays ? blocked.text : null;
  const tip = beginner && !over ? coachTip(play, dismissedTips) : null;
  const active = (s: Seat) => !trickPause && !over && seat === s;

  let status = '';
  if (over) status = '';
  else if (error) status = error;
  else if (shown?.winner) status = `${SEAT_NAME[shown.winner]} กิน trick นี้`;
  else if (blockedText) status = blockedText;
  else if (picked) status = `แตะไพ่กลางโต๊ะ หรือกด ${cardName(picked)} อีกครั้งเพื่อลง`;
  else if (liveHint) {
    const short = liveHint.tricks < needed ? ` — ไม่พอแล้ว (ต้องได้ ${needed})` : '';
    status = `คำใบ้: ใบที่ยกขึ้นยังทำได้ ${liveHint.tricks} trick${short}`;
  } else if (seat === 'N') status = 'ถึงตา dummy — กดไพ่ของ North ด้านบน';
  else if (seat === 'S') status = 'ถึงตาคุณ — ลงไพ่จากมือ South';
  else if (seat) status = `${SEAT_NAME[seat]} กำลังคิด…`;

  const defender = (s: 'W' | 'E') =>
    studyMode ? (
      <OpenHand cards={hands[s]} trump={trump} label={SEAT_NAME[s]} />
    ) : (
      <HiddenHand count={hands[s].length} label={SEAT_NAME[s]} />
    );

  return (
    <div ref={root} className="flex min-h-full flex-col">
      <InfoBar
        contract={play.contract}
        vulnerability={hand.vulnerability}
        won={won}
        trickNumber={trickNumber}
        totalTricks={total}
        actions={
          <ActionBar
            canHint={playerTurn}
            hintLoading={state.hintLoading}
            hintsUsed={state.hintsUsed}
            canUndo={canUndo(state)}
            canClaim={playerTurn && !state.claimChecking}
            studyMode={studyMode}
            onHint={onHint}
            onUndo={onUndo}
            onClaim={() => setClaimOpen(true)}
            onGuide={() => setGuide(guideChapterFor(play, over))}
            onRestart={onRestart}
            onNewHand={() => void dealNew()}
            onStudyMode={onStudyMode}
          />
        }
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
          <CoachTipView
            tip={tip}
            contract={play.contract}
            totalTricks={total}
            onDismiss={onDismissTip}
          />
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
              {plays > 0 || studyMode ? (
                <DummyHand
                  cards={hands.N}
                  trump={trump}
                  modeOf={modeOf('N')}
                  hintOf={hintOf('N')}
                  picked={picked}
                  onPlay={onPlay}
                  onBlocked={onBlocked}
                />
              ) : (
                <FaceDownRow count={hands.N.length} />
              )}
            </section>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
              <section aria-label="West" className="flex flex-col items-center gap-1.5">
                <SeatTag seat="W" active={active('W')} thinking={active('W') && botThinking} />
                {defender('W')}
              </section>
              <div className="flex justify-center">
                {/* Remounted on undo / restart so rewound cards don't animate. */}
                <TrickArea
                  key={epoch}
                  trickNumber={trickNumber}
                  plays={trickPlays}
                  winner={shown?.winner ?? null}
                  gatherTo={done.at(-1)?.winner ?? null}
                  pending={pending}
                />
              </div>
              <section aria-label="East" className="flex flex-col items-center gap-1.5">
                <SeatTag seat="E" active={active('E')} thinking={active('E') && botThinking} />
                {defender('E')}
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
                className={`min-h-5 text-center text-sm ${
                  blockedText && status === blockedText
                    ? 'font-semibold text-amber-200'
                    : picked
                      ? 'font-semibold text-amber-100'
                      : liveHint
                        ? 'font-semibold text-emerald-200'
                        : 'text-white/90'
                }`}
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
              <FannedHand
                cards={hands.S}
                trump={trump}
                modeOf={modeOf('S')}
                hintOf={hintOf('S')}
                picked={picked}
                onPlay={onPlay}
                onBlocked={onBlocked}
              />
              <SeatTag seat="S" active={active('S')} className="sm:absolute sm:top-2 sm:left-3" />
            </section>
          </div>
        </div>
      </main>

      <p className="sr-only" aria-live="polite">
        {last ? `${SEAT_NAME[last.seat]} ลง ${cardName(last.card)}` : ''}
      </p>
      {claimOpen && playerTurn && (
        <ClaimDialog
          left={tricksLeft(play)}
          won={won.NS}
          needed={needed}
          checking={state.claimChecking}
          onClaim={(n) => gameStore.getState().claim(n)}
          onClose={() => setClaimOpen(false)}
        />
      )}
      {review && replayTrick === null && (
        <ResultPanel
          hand={hand}
          contract={play.contract}
          vulnerability={hand.vulnerability}
          review={review}
          reviewStatus={reviewStatus(review.complete, reviewFailed)}
          claimed={claimed !== null}
          hintsUsed={state.hintsUsed}
          studied={state.studied}
          beginner={beginner}
          onRetryReview={() => setReviewTry((n) => n + 1)}
          onReplay={setReplayTrick}
          onNewHand={() => void dealNew()}
          onRestart={onRestart}
          onUndo={onUndo}
        />
      )}
      {review && replayTrick !== null && (
        <ReplayView
          play={play}
          analyses={analyses}
          review={review}
          claimed={claimed}
          trick={replayTrick}
          onTrick={setReplayTrick}
          onClose={onCloseReplay}
          onPlayFrom={onPlayFrom}
        />
      )}
      {guide !== null && <GuidePanel chapter={guide} onChapter={setGuide} onClose={onCloseGuide} />}
      <DealingOverlay />
    </div>
  );
}
