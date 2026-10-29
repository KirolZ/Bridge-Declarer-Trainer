// A flag for each language of the screens (the home page switch, SPEC §8). Drawn as SVG: flag
// emoji show as two letters on Windows. Each flag keeps its own proportions and is cropped from
// the centre to fill the box it is given.

import { useId } from 'react';
import type { Language } from '../game/settings';

/** Thailand, 3:2: red, white, blue (double width), white, red. */
function Thailand() {
  return (
    <>
      <rect width="60" height="40" fill="#A51931" />
      <rect y="6.67" width="60" height="26.67" fill="#F4F5F8" />
      <rect y="13.33" width="60" height="13.33" fill="#2D2A4A" />
    </>
  );
}

/** United Kingdom (the Union Jack), 2:1. */
function UnitedKingdom() {
  const clip = `${useId()}-diagonals`;
  return (
    <>
      <clipPath id={clip}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath={`url(#${clip})`}
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </>
  );
}

const VIEW_BOX: Readonly<Record<Language, string>> = { th: '0 0 60 40', en: '0 0 60 30' };

export function Flag({ language, className }: { language: Language; className?: string }) {
  return (
    <svg
      viewBox={VIEW_BOX[language]}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      data-flag={language}
      className={className}
    >
      {language === 'th' ? <Thailand /> : <UnitedKingdom />}
    </svg>
  );
}
