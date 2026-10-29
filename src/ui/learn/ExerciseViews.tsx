// The guide's quick exercises (SPEC §7.7): pick every card that may be played, and pick an answer
// (who wins the trick, or a question's option). Answers come from the rules engine where it can
// tell, so they cannot disagree with the game.

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { Card } from '../../engine';
import {
  SEATS,
  cardCode,
  completedTricks,
  currentTrick,
  illegalReason,
  remainingHand,
  sameCard,
} from '../../engine';
import type { ChoiceExercise, LegalExercise, WinnerExercise } from '../../learn';
import { exerciseStart, legalAnswer, parseCardList, winnerAnswer } from '../../learn';
import { useSuitOrder, useT } from '../gameStore';
import { CardText } from '../table/hands';
import { SEAT_NAME } from '../table/labels';
import { sortForDisplay } from '../table/layout';
import { PlayingCard } from '../table/PlayingCard';
import { CardRow, TrickDiagram } from './examples';
import { Rich } from './Rich';

export const PRIMARY =
  'rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50';
export const SECONDARY =
  'rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:opacity-50';

export type Tone = 'ok' | 'wrong' | 'info';

const TONE: Record<Tone, string> = {
  ok: 'bg-emerald-500/15 ring-emerald-400/60',
  wrong: 'bg-red-500/15 ring-red-400/60',
  info: 'bg-sky-500/15 ring-sky-400/50',
};

/** The verdict after answering, with the explanation and what to do next. */
export function Feedback(props: { tone: Tone; title: ReactNode; children?: ReactNode }) {
  return (
    <section
      role="status"
      data-testid="feedback"
      data-tone={props.tone}
      className={`flex flex-col gap-2 rounded-xl px-3 py-3 leading-relaxed ring-1 ${TONE[props.tone]}`}
    >
      <h2 className="font-bold">{props.title}</h2>
      {props.children}
    </section>
  );
}

export function Explanation({ text }: { text: string }) {
  return (
    <p className="text-white/90" data-testid="explanation">
      <Rich text={text} />
    </p>
  );
}

// ---------- Pick every legal card ----------

type CardState = 'right' | 'wrong' | undefined;

function PickCard(props: {
  card: Card;
  picked: boolean;
  state: CardState;
  locked: boolean;
  onToggle: () => void;
}) {
  const { card, picked, state, locked, onToggle } = props;
  return (
    <button
      type="button"
      data-card={cardCode(card)}
      aria-pressed={picked}
      aria-disabled={locked}
      onClick={() => !locked && onToggle()}
      className={[
        'relative rounded-[6px] transition duration-150 focus-visible:ring-4 focus-visible:ring-amber-300 focus-visible:outline-none',
        picked && '-translate-y-2',
        state === 'right' && 'shadow-[0_0_0_3px_#34d399]',
        state === 'wrong' && 'shadow-[0_0_0_3px_#f87171]',
        !state && picked && 'shadow-[0_0_0_3px_#fcd34d]',
        locked ? 'cursor-default' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <PlayingCard card={card} />
      {(picked || state) && (
        <span
          aria-hidden="true"
          className={`absolute -top-2 -right-2 grid size-5 place-items-center rounded-full text-xs font-bold shadow ${
            state === 'wrong' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black'
          }`}
        >
          {state === 'wrong' ? '✗' : '✓'}
        </span>
      )}
    </button>
  );
}

export function LegalExerciseView({ ex, onPass }: { ex: LegalExercise; onPass: () => void }) {
  const play = useMemo(() => exerciseStart(ex), [ex]);
  const { seat, cards: legal } = useMemo(() => legalAnswer(ex), [ex]);
  const order = useSuitOrder();
  const t = useT();
  const w = t.exercise;
  const hand = sortForDisplay(remainingHand(play, seat), ex.trump, order);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [result, setResult] = useState<'ok' | 'wrong' | 'shown' | null>(null);

  const isLegal = (c: Card) => legal.some((l) => sameCard(l, c));
  const isPicked = (c: Card) => picked.includes(cardCode(c));
  const wrongPicks = hand.filter((c) => isPicked(c) && !isLegal(c));
  const missing = hand.filter((c) => !isPicked(c) && isLegal(c));
  const locked = result === 'ok' || result === 'shown';

  const toggle = (c: Card) => {
    const code = cardCode(c);
    setPicked(picked.includes(code) ? picked.filter((p) => p !== code) : [...picked, code]);
    if (result === 'wrong') setResult(null);
  };
  const check = () => {
    const ok = wrongPicks.length === 0 && missing.length === 0;
    setResult(ok ? 'ok' : 'wrong');
    if (ok) onPass();
  };
  const stateOf = (c: Card): CardState => {
    if (result === 'wrong' && isPicked(c) && !isLegal(c)) return 'wrong';
    if (locked && isLegal(c)) return 'right';
    return undefined;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="learn-cards flex justify-center rounded-2xl bg-black/20 py-3">
        <TrickDiagram
          plays={currentTrick(play)}
          trump={ex.trump}
          showWinner={false}
          toPlay={seat}
        />
      </div>
      <section
        aria-label={w.hand(t.seatRole[seat])}
        className="learn-cards flex flex-col items-center gap-2"
      >
        <span className="text-sm font-semibold text-white/80">{w.pickCards(t.seatRole[seat])}</span>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {hand.map((c) => (
            <PickCard
              key={cardCode(c)}
              card={c}
              picked={isPicked(c)}
              state={stateOf(c)}
              locked={locked}
              onToggle={() => toggle(c)}
            />
          ))}
        </div>
      </section>
      {!locked && (
        <div className="flex justify-center">
          <button type="button" onClick={check} disabled={picked.length === 0} className={PRIMARY}>
            {w.check}
          </button>
        </div>
      )}
      {result === 'ok' && (
        <Feedback tone="ok" title={w.right}>
          <Explanation text={ex.explanation} />
        </Feedback>
      )}
      {result === 'shown' && (
        <Feedback tone="info" title={w.legalShown}>
          <Explanation text={ex.explanation} />
          <div>
            <button
              type="button"
              onClick={() => {
                setPicked([]);
                setResult(null);
              }}
              className={SECONDARY}
            >
              {t.common.retry}
            </button>
          </div>
        </Feedback>
      )}
      {result === 'wrong' && (
        <Feedback tone="wrong" title={w.wrong}>
          <ul className="flex flex-col gap-1 text-sm">
            {wrongPicks.map((c) => {
              const reason = illegalReason(play, c);
              return (
                <li key={cardCode(c)} data-reason="illegal">
                  <CardText card={c} /> {w.cannotPlay} {reason ? t.illegal(reason) : ''}
                </li>
              );
            })}
            {missing.map((c) => (
              <li key={cardCode(c)} data-reason="missing">
                <CardText card={c} /> {w.missed}
              </li>
            ))}
          </ul>
          <p className="text-sm text-white/70">{w.fixAndCheck}</p>
          <div>
            <button
              type="button"
              onClick={() => {
                setPicked(legal.map(cardCode));
                setResult('shown');
              }}
              className={SECONDARY}
            >
              {w.showAnswer}
            </button>
          </div>
        </Feedback>
      )}
    </div>
  );
}

// ---------- Pick an answer ----------

type AnswerProps = { ex: WinnerExercise | ChoiceExercise; onPass: () => void };

export function AnswerExerciseView({ ex, onPass }: AnswerProps) {
  const w = useT().exercise;
  const { options, answer, show } = useMemo(() => {
    if (ex.kind === 'winner') {
      const trick = completedTricks(exerciseStart(ex)).at(-1)!;
      return {
        options: SEATS.map((s) => SEAT_NAME[s]),
        answer: SEATS.indexOf(winnerAnswer(ex)),
        show: (done: boolean) => (
          <div className="learn-cards flex justify-center rounded-2xl bg-black/20 py-3">
            <TrickDiagram plays={trick.plays} trump={ex.trump} showWinner={done} />
          </div>
        ),
      };
    }
    const cards = ex.cards === undefined ? null : parseCardList(ex.cards);
    return {
      options: ex.options,
      answer: ex.answer,
      show: () =>
        cards && (
          <div className="learn-cards flex justify-center rounded-2xl bg-black/20 py-3">
            <CardRow cards={cards} />
          </div>
        ),
    };
  }, [ex]);
  const [wrong, setWrong] = useState<readonly number[]>([]);
  const [done, setDone] = useState<'ok' | 'shown' | null>(null);

  const pick = (i: number) => {
    if (done || wrong.includes(i)) return;
    if (i === answer) {
      setDone('ok');
      onPass();
    } else {
      setWrong([...wrong, i]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {show(done !== null)}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={w.options}>
        {options.map((label, i) => {
          const isWrong = wrong.includes(i);
          const isRight = done !== null && i === answer;
          return (
            <button
              key={i}
              type="button"
              data-option={i}
              data-state={isRight ? 'right' : isWrong ? 'wrong' : undefined}
              aria-disabled={done !== null || isWrong}
              onClick={() => pick(i)}
              className={[
                'rounded-xl px-3 py-3 text-lg font-semibold ring-1 transition focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none',
                isRight && 'bg-emerald-500/25 ring-emerald-400',
                isWrong && 'bg-red-500/15 text-white/60 line-through ring-red-400/60',
                !isRight && !isWrong && 'bg-white/10 ring-white/15',
                !isRight && !isWrong && done === null && 'hover:bg-white/20',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {isRight && '✓ '}
              {isWrong && '✗ '}
              <Rich text={label} />
            </button>
          );
        })}
      </div>
      {done === 'ok' && (
        <Feedback tone="ok" title={w.right}>
          <Explanation text={ex.explanation} />
        </Feedback>
      )}
      {done === 'shown' && (
        <Feedback
          tone="info"
          title={
            <>
              {w.answer} <Rich text={options[answer]!} />
            </>
          }
        >
          <Explanation text={ex.explanation} />
        </Feedback>
      )}
      {done === null && wrong.length > 0 && (
        <Feedback tone="wrong" title={w.tryOther}>
          <div>
            <button type="button" onClick={() => setDone('shown')} className={SECONDARY}>
              {w.showAnswer}
            </button>
          </div>
        </Feedback>
      )}
    </div>
  );
}
