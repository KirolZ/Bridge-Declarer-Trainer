// Practice buttons on the info panel (SPEC §8): hint, undo, claim and the menu (play this hand
// again, new hand, study mode, home). Keys: H = hint, U = undo (handled by the table).

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type ActionButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
  label: string;
  /** Accessible name when it says more than `label` (e.g. the hint count). */
  name?: string;
  children: ReactNode;
};

const BUTTON =
  'flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-white/10 px-2.5 text-sm whitespace-nowrap hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10 sm:flex-none';

function ActionButton(props: ActionButtonProps) {
  const { onClick, disabled, shortcut, label, name, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={name ?? label}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={BUTTON}
    >
      {children}
    </button>
  );
}

type MenuProps = {
  studyMode: boolean;
  onRestart: () => void;
  onNewHand: () => void;
  onStudyMode: (on: boolean) => void;
};

const MENU_ITEM =
  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none';

function GameMenu({ studyMode, onRestart, onNewHand, onStudyMode }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={root} className="relative flex flex-1 sm:flex-none">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={BUTTON}
      >
        <span aria-hidden="true">☰</span> เมนู
      </button>
      {open && (
        <div
          role="menu"
          aria-label="เมนู"
          className="absolute top-full right-0 z-30 mt-1 flex min-w-48 flex-col rounded-xl border border-white/10 bg-felt-dark p-1 shadow-2xl"
        >
          <button type="button" role="menuitem" className={MENU_ITEM} onClick={pick(onRestart)}>
            เล่นมือนี้ใหม่
          </button>
          <button type="button" role="menuitem" className={MENU_ITEM} onClick={pick(onNewHand)}>
            มือใหม่
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={studyMode}
            className={MENU_ITEM}
            onClick={pick(() => onStudyMode(!studyMode))}
          >
            <span
              aria-hidden="true"
              className={`grid size-4 place-items-center rounded border text-[10px] ${
                studyMode ? 'border-amber-300 bg-amber-300 text-black' : 'border-white/50'
              }`}
            >
              {studyMode ? '✓' : ''}
            </span>
            โหมดศึกษา (เปิดไพ่ทุกมือ)
          </button>
          <Link to="/" role="menuitem" className={MENU_ITEM}>
            หน้าแรก
          </Link>
        </div>
      )}
    </div>
  );
}

type ActionBarProps = MenuProps & {
  canHint: boolean;
  hintLoading: boolean;
  hintsUsed: number;
  canUndo: boolean;
  canClaim: boolean;
  onHint: () => void;
  onUndo: () => void;
  onClaim: () => void;
};

export function ActionBar(props: ActionBarProps) {
  const { canHint, hintLoading, hintsUsed, canUndo, canClaim, onHint, onUndo, onClaim } = props;
  return (
    <nav
      aria-label="เครื่องมือฝึก"
      // Phones: a row of its own under the contract; wider screens: inline in the header.
      className="order-last flex basis-full gap-1.5 sm:order-none sm:basis-auto"
    >
      <ActionButton
        onClick={onHint}
        disabled={!canHint}
        shortcut="H"
        label="คำใบ้"
        name={hintsUsed > 0 ? `คำใบ้ (ใช้ไปแล้ว ${hintsUsed} ครั้ง)` : 'คำใบ้'}
      >
        <span aria-hidden="true">💡</span>
        {hintLoading ? 'กำลังคิด…' : 'คำใบ้'}
        {hintsUsed > 0 && (
          <span
            className="rounded-full bg-amber-300 px-1.5 text-xs font-semibold text-black tabular-nums"
            data-testid="hints-used"
          >
            {hintsUsed}
          </span>
        )}
      </ActionButton>
      <ActionButton onClick={onUndo} disabled={!canUndo} shortcut="U" label="ย้อน">
        <span aria-hidden="true">↶</span> ย้อน
      </ActionButton>
      <ActionButton onClick={onClaim} disabled={!canClaim} label="Claim">
        Claim
      </ActionButton>
      <GameMenu {...props} />
    </nav>
  );
}
