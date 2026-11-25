// End-of-hand summary (SPEC §7.5): made / down and the score (§4.3), tricks taken against the
// double-dummy value, where tricks were lost and which cards would have kept them, hints used
// (§7.2), and the ways on: replay, share, new hand, play again, undo (§7.3).

import { motion } from 'framer-motion';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Card, Contract, Vulnerability } from '../../engine';
import { contractLabel, isDeclarerVulnerable, scoreBreakdown, tricksNeeded } from '../../engine';
import type { HandSetup } from '../../game/playStore';
import type { HandReview, Loss } from '../../game/review';
import { useT } from '../gameStore';
import type { AuctionInfo } from './auctionInfo';
import { AuctionTable } from './AuctionTable';
import { CardText } from './hands';
import { SEAT_NAME } from './labels';
import { explainScore } from './scoreExplain';
import { ShareButton } from './ShareButton';

export type ReviewStatus = 'loading' | 'failed' | 'ready';

type ResultPanelProps = {
  hand: HandSetup;
  contract: Contract;
  vulnerability: Vulnerability;
  /** Meanings and what the defenders held, for a hand with an auction (M31). */
  auctionInfo?: AuctionInfo | null;
  review: HandReview;
  /** `ready` once every analysis the review needs is in. */
  reviewStatus: ReviewStatus;
  /** The hand ended with an accepted claim. */
  claimed: boolean;
  hintsUsed: number;
  /** Study mode was on: the hand does not count for the stats. */
  studied: boolean;
  /** Beginner mode: explain the score line by line (SPEC §7.8). */
  beginner?: boolean;
  onRetryReview: () => void;
  /** Opens the replay at `trick` (1-based). */
  onReplay: (trick: number) => void;
  onNewHand: () => void;
  onRestart: () => void;
  onUndo: () => void;
};

const SECONDARY =
  'flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none';

/** "♠K, ♠Q or ♥2" */
export function CardList({ cards }: { cards: readonly Card[] }) {
  const t = useT();
  return (
    <>
      {cards.map((c, i) => (
        <Fragment key={`${c.suit}${c.rank}`}>
          {i > 0 && (i === cards.length - 1 ? t.or : ', ')}
          <CardText card={c} />
        </Fragment>
      ))}
    </>
  );
}

/** Where the score comes from, line by line (beginner mode). */
function ScoreExplain({
  contract,
  tricks,
  vulnerable,
}: {
  contract: Contract;
  tricks: number;
  vulnerable: boolean;
}) {
  const t = useT();
  const e = explainScore(contract, tricks, vulnerable, t.score);
  const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
  return (
    <section
      className="flex w-full flex-col gap-1.5 rounded-xl bg-black/25 p-3 text-left text-sm"
      data-testid="score-explain"
      aria-label={t.result.scoreSource}
    >
      <p className="leading-relaxed text-white/85">{e.summary}</p>
      <dl className="flex flex-col gap-1">
        {e.lines.map((l) => (
          <div key={l.label} className="flex items-baseline gap-2">
            <dt className="flex-1">
              <span className="font-semibold">{l.label}</span>
              <span className="block text-xs text-white/65">{l.detail}</span>
            </dt>
            <dd className="font-semibold tabular-nums">{signed(l.points)}</dd>
          </div>
        ))}
        <div className="flex items-baseline gap-2 border-t border-white/15 pt-1">
          <dt className="flex-1 font-semibold">{t.result.total}</dt>
          <dd className="font-bold tabular-nums">{signed(e.total)}</dd>
        </div>
      </dl>
      <Link to="/learn/6" className="self-start text-xs text-amber-200 hover:underline">
        {t.result.scoreChapter}
      </Link>
    </section>
  );
}

/** One place where tricks were lost; opens the replay at that trick. */
export function LossText({ loss }: { loss: Loss }) {
  const t = useT();
  if (loss.kind === 'card') {
    return (
      <>
        {SEAT_NAME[loss.seat]} {t.result.lossPlayed} <CardText card={loss.card} /> ·{' '}
        {t.result.lossBetter} <CardList cards={loss.best} />
      </>
    );
  }
  return (
    <>
      {t.result.lossClaim(loss.claimed, loss.before)} <CardList cards={loss.best} />
    </>
  );
}

function ReviewSection(
  props: Pick<ResultPanelProps, 'review' | 'reviewStatus' | 'onReplay'> & {
    onRetry: () => void;
  },
) {
  const { review, reviewStatus, onReplay, onRetry } = props;
  const t = useT();
  if (reviewStatus === 'failed') {
    return (
      <p className="text-sm text-red-200" data-testid="review" data-status="failed">
        {t.result.reviewFailed}{' '}
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 rounded bg-white/15 px-2 py-0.5 text-white hover:bg-white/25"
        >
          {t.common.retry}
        </button>
      </p>
    );
  }
  if (reviewStatus === 'loading') {
    return (
      <p className="text-sm text-white/70" data-testid="review" data-status="loading">
        {t.result.reviewing}
      </p>
    );
  }
  if (review.lost === 0) {
    return (
      <p
        className="font-semibold text-emerald-300"
        data-testid="review"
        data-status="ready"
        data-lost="0"
      >
        {t.result.perfect}
      </p>
    );
  }
  return (
    <section
      className="flex w-full flex-col gap-2 text-left"
      data-testid="review"
      data-status="ready"
      data-lost={review.lost}
      aria-labelledby="losses-title"
    >
      <h3 id="losses-title" className="text-center font-semibold text-red-200">
        {t.result.lost(review.lost)}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {review.losses.map((loss) => (
          <li key={`${loss.kind}${loss.index}`}>
            <button
              type="button"
              data-testid="loss"
              data-trick={loss.trick}
              onClick={() => onReplay(loss.trick)}
              className="flex w-full items-start gap-2 rounded-lg bg-black/25 px-3 py-2 text-left text-sm hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              <span className="shrink-0 font-semibold whitespace-nowrap text-white/90">
                {t.result.trick(loss.trick)}
              </span>
              <span className="flex-1 leading-relaxed text-white/85">
                <LossText loss={loss} />
              </span>
              <span className="shrink-0 font-semibold whitespace-nowrap text-red-300 tabular-nums">
                −{loss.lost}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-white/55">{t.result.lossHelp}</p>
    </section>
  );
}

export function ResultPanel(props: ResultPanelProps) {
  const { contract, vulnerability, review, claimed, hintsUsed, studied } = props;
  const { nsTricks, ddTricks } = review;
  const result = scoreBreakdown(contract, nsTricks, isDeclarerVulnerable(vulnerability));
  const needed = tricksNeeded(contract);
  const first = useRef<HTMLButtonElement>(null);
  const t = useT();
  const [auctionOpen, setAuctionOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const [buttonsHidden, setButtonsHidden] = useState(false);
  // A line between the content and the buttons only while the content scrolls (M35).
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const content = contentRef.current;
    if (!body || !content) return;
    const check = () => setScrollable(body.scrollHeight > body.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(body);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
  // No scroll: on a phone the buttons are below the fold, the result should stay in view.
  useEffect(() => first.current?.focus({ preventScroll: true }), []);

  const notes = [
    claimed && t.result.byClaim,
    t.result.hints(hintsUsed),
    studied && t.result.studied,
  ].filter(Boolean);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Never taller than the screen (M35): the content scrolls, the buttons stay at the bottom. */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        data-testid="result"
        data-made={result.made}
        data-scrollable={scrollable}
        className="result-dialog flex max-h-full w-full max-w-md flex-col rounded-2xl border border-white/10 bg-felt-dark text-center shadow-2xl"
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div
          ref={bodyRef}
          data-testid="result-body"
          className="result-body min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-2 sm:px-6 sm:pt-6"
        >
          <div ref={contentRef} className="flex flex-col items-center gap-3">
            <h2
              id="result-title"
              className={`text-2xl font-bold ${result.made ? 'text-amber-300' : 'text-red-300'}`}
            >
              {result.made
                ? t.result.made(contractLabel(contract))
                : t.result.down(contractLabel(contract), -result.result)}
            </h2>
            <p className="text-white/85" data-testid="result-tricks">
              {t.result.tricks(nsTricks, ddTricks, needed, result.made ? result.result : 0)}
            </p>
            <p className="text-3xl font-bold tabular-nums" data-testid="score">
              {result.total > 0 ? `+${result.total}` : result.total}
              <span className="ml-1 text-base font-normal text-white/70">{t.result.points}</span>
            </p>
            {props.beginner && (
              <ScoreExplain
                contract={contract}
                tricks={nsTricks}
                vulnerable={isDeclarerVulnerable(vulnerability)}
              />
            )}
            <p className="text-sm text-white/65" data-testid="result-notes">
              {notes.map((note, i) => (
                <Fragment key={i}>
                  {i > 0 && ' · '}
                  <span className="whitespace-nowrap">{note}</span>
                </Fragment>
              ))}
            </p>

            <ReviewSection
              review={review}
              reviewStatus={props.reviewStatus}
              onReplay={props.onReplay}
              onRetry={props.onRetryReview}
            />

            {props.hand.auction && props.auctionInfo && (
              <div className="w-full rounded-xl bg-black/25 text-left">
                <AuctionTable
                  auction={props.hand.auction}
                  vulnerability={vulnerability}
                  info={props.auctionInfo}
                  open={auctionOpen}
                  onToggle={() => setAuctionOpen((o) => !o)}
                  className="px-1.5 py-1.5"
                />
              </div>
            )}
          </div>
        </div>

        <div
          data-testid="result-actions"
          data-hidden={buttonsHidden}
          className={
            buttonsHidden
              ? 'flex justify-end border-t border-white/10 px-3 py-2'
              : `relative flex flex-col px-5 pb-5 sm:px-6 sm:pb-6 ${scrollable ? 'border-t border-white/10 pt-3' : 'pt-2'}`
          }
        >
          {/* Hide the buttons to read a long summary with the whole height (M35, the user).
              Only while the content scrolls (or the buttons are hidden): otherwise it gains nothing. */}
          {(scrollable || buttonsHidden) && (
            <button
              type="button"
              onClick={() => setButtonsHidden((h) => !h)}
              aria-expanded={!buttonsHidden}
              aria-controls="result-buttons"
              data-testid="result-buttons-toggle"
              className={`rounded-full border border-white/15 bg-felt-dark px-2.5 py-0.5 text-xs text-white/80 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none ${buttonsHidden ? '' : 'absolute -top-3 right-3'}`}
            >
              {buttonsHidden ? t.result.showButtons : t.result.hideButtons}{' '}
              <span aria-hidden="true">{buttonsHidden ? '▴' : '▾'}</span>
            </button>
          )}
          {!buttonsHidden && (
            <div id="result-buttons" className="flex flex-col gap-3">
              <div className="flex w-full flex-wrap gap-2">
                <button type="button" onClick={() => props.onReplay(1)} className={SECONDARY}>
                  {t.result.replay}
                </button>
                <ShareButton hand={props.hand} className={SECONDARY} />
              </div>
              <div className="flex w-full gap-2">
                <button
                  ref={first}
                  type="button"
                  onClick={props.onNewHand}
                  className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  {t.table.newDeal}
                </button>
                <button type="button" onClick={props.onRestart} className={SECONDARY}>
                  {t.table.restart}
                </button>
              </div>
              <div className="flex w-full gap-2">
                {/* Undo is for beginner mode only (M22). */}
                {props.beginner && (
                  <button
                    type="button"
                    onClick={props.onUndo}
                    aria-keyshortcuts="U"
                    className={SECONDARY}
                  >
                    {t.result.undo(claimed)}
                  </button>
                )}
                <Link to="/" className={SECONDARY}>
                  {t.common.home}
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
