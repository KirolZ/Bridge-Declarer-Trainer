// Card faces and backs (adapted from the Blackjack project's PlayingCard.tsx). Sized by the
// `--card-w` CSS variable, 5:7.

import { motion } from 'framer-motion';
import { useId } from 'react';
import type { Card, Suit } from '../../engine';
import { SUIT_INFO, rankLabel } from '../../engine';

/** Suit shapes in a 100×100 box (own drawings, not font glyphs). */
const SUIT_PATHS: Record<Suit, string> = {
  H: 'M50 90C22 67 4 50 4 31 4 15 16 4 30 4c10 0 17 6 20 14 3-8 10-14 20-14 14 0 26 11 26 27 0 19-18 36-46 59z',
  D: 'M50 2 90 50 50 98 10 50z',
  S: 'M50 3c20 27 46 39 46 60 0 14-11 24-24 24-9 0-16-4-20-10 1 10 5 16 12 21H36c7-5 11-11 12-21-4 6-11 10-20 10C15 87 4 77 4 63 4 42 30 30 50 3z',
  C: 'M50 6a21 21 0 0 1 17 33 21 21 0 1 1-5 40c-4 0-8-2-10-4 1 10 5 17 12 22H36c7-5 11-12 12-22-2 2-6 4-10 4a21 21 0 1 1-5-40A21 21 0 0 1 50 6z',
};

const SUIT_COLOR = { red: '#c0262d', black: '#1c1c1c' } as const;
const EDGE_COLOR = '#d6d3c4';

function suitColor(suit: Suit): string {
  return SUIT_INFO[suit].red ? SUIT_COLOR.red : SUIT_COLOR.black;
}

/**
 * Where the corner index sits, so it stays visible when cards overlap:
 * `stack` = rank above suit in the left strip (cards fanned sideways),
 * `row` = rank and suit side by side along the top (cards stacked downwards, like dummy).
 */
export type IndexLayout = 'stack' | 'row';

function SuitShape({ suit, x, y, size }: { suit: Suit; x: number; y: number; size: number }) {
  return <path d={SUIT_PATHS[suit]} transform={`translate(${x} ${y}) scale(${size / 100})`} />;
}

function CornerIndex({ card, layout }: { card: Card; layout: IndexLayout }) {
  const label = rankLabel(card.rank);
  const ten = label.length > 1;
  const text = (
    <text
      x="7"
      y="27"
      fontSize={ten ? 23 : 27}
      fontWeight="700"
      fontFamily="Georgia, 'Times New Roman', serif"
      letterSpacing={ten ? -2 : 0}
    >
      {label}
    </text>
  );
  return layout === 'stack' ? (
    <g>
      {text}
      <SuitShape suit={card.suit} x={8} y={32} size={18} />
    </g>
  ) : (
    <g>
      {text}
      <SuitShape suit={card.suit} x={ten ? 33 : 26} y={9} size={19} />
    </g>
  );
}

type CardFaceProps = {
  card: Card;
  layout?: IndexLayout;
  /** Edge colour matching a frame drawn around the card (default: the plain grey edge). */
  edge?: string;
  /** Classes for the face under the edge (e.g. fading it while the edge stays solid). */
  faceClassName?: string;
};

/** The card's edge: 2 units wide on the outline, so its outer corner is 10% of the width. */
function Edge({ color }: { color: string }) {
  return (
    <rect x="1" y="1" width="98" height="138" rx="9" fill="none" stroke={color} strokeWidth="2" />
  );
}

export function CardFace({ card, layout = 'stack', edge, faceClassName }: CardFaceProps) {
  const isFace = card.rank >= 11 && card.rank <= 13;
  const label = rankLabel(card.rank);
  return (
    <svg viewBox="0 0 100 140" className="block h-full w-full" aria-hidden="true">
      <g className={faceClassName}>
        <rect x="1" y="1" width="98" height="138" rx="9" fill="#fdfcf7" />
        {!edge && <Edge color={EDGE_COLOR} />}
        <g fill={suitColor(card.suit)}>
          <CornerIndex card={card} layout={layout} />
          <g transform="rotate(180 50 70)">
            <CornerIndex card={card} layout={layout} />
          </g>
          {isFace ? (
            <>
              <rect
                x="28"
                y="38"
                width="44"
                height="64"
                rx="5"
                fill="none"
                stroke={suitColor(card.suit)}
                strokeWidth="2.5"
              />
              <text
                x="50"
                y="80"
                fontSize="36"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
              >
                {label}
              </text>
              <SuitShape suit={card.suit} x={42} y={84} size={16} />
            </>
          ) : (
            <SuitShape
              suit={card.suit}
              x={card.rank === 14 ? 24 : 31}
              y={card.rank === 14 ? 42 : 50}
              size={card.rank === 14 ? 52 : 38}
            />
          )}
        </g>
      </g>
      {edge && <Edge color={edge} />}
    </svg>
  );
}

export function CardBack() {
  const id = `back-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 100 140" className="block h-full w-full" aria-hidden="true">
      <defs>
        <pattern
          id={id}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="10" height="10" fill="#1e3a8a" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#2f56b0" strokeWidth="4" />
        </pattern>
      </defs>
      <rect
        x="1"
        y="1"
        width="98"
        height="138"
        rx="9"
        fill="#fdfcf7"
        stroke="#d6d3c4"
        strokeWidth="2"
      />
      <rect x="8" y="8" width="84" height="124" rx="5" fill={`url(#${id})`} />
      <rect
        x="8"
        y="8"
        width="84"
        height="124"
        rx="5"
        fill="none"
        stroke="#fde68a"
        strokeOpacity="0.6"
        strokeWidth="2"
      />
    </svg>
  );
}

type PlayingCardProps = {
  /** null = face down. */
  card: Card | null;
  layout?: IndexLayout;
  /** Turn over from face down when first shown, after this many seconds (dummy after the lead). */
  flipInDelay?: number;
  /** Width relative to `--card-w` (default 1). */
  scale?: number;
  /**
   * Colour of a frame drawn around the card: the edge takes it and the drop shadow goes, since the
   * shadow (3px down) would paint over the inside of the frame and leave an uneven gap.
   */
  frame?: string;
  /** See `CardFace`. */
  faceClassName?: string;
};

export function PlayingCard(props: PlayingCardProps) {
  const { card, layout, flipInDelay, scale = 1, frame, faceClassName } = props;
  const shadow = frame ? '' : ' drop-shadow-md';
  const flip = flipInDelay !== undefined;
  return (
    <div
      className="relative shrink-0"
      style={{ width: `calc(var(--card-w) * ${scale})`, aspectRatio: '5 / 7', perspective: 600 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        initial={flip ? { rotateY: 180 } : false}
        animate={{ rotateY: card ? 0 : 180 }}
        transition={{ duration: 0.45, ease: 'easeInOut', delay: flipInDelay ?? 0 }}
      >
        <div className={`absolute inset-0${shadow}`} style={{ backfaceVisibility: 'hidden' }}>
          {card && (
            <CardFace card={card} layout={layout} edge={frame} faceClassName={faceClassName} />
          )}
        </div>
        <div
          className={`absolute inset-0${shadow}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CardBack />
        </div>
      </motion.div>
    </div>
  );
}
