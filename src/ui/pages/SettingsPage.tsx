// #/settings (SPEC §7.6). Every change applies and is saved at once; deal settings take effect
// from the next new hand, the rest straight away (also on a hand in progress).

import type { ReactNode } from 'react';
import type { SuitOrder, Vulnerability } from '../../engine';
import type {
  BotSpeed,
  CardPlay,
  ContractType,
  Difficulty,
  Language,
  Settings,
} from '../../game/settings';
import {
  BOT_SPEEDS,
  CARD_PLAY_OPTIONS,
  CONTRACT_TYPES,
  DIFFICULTIES,
  LANGUAGES,
  SUIT_ORDER_OPTIONS,
  VULNERABILITIES,
} from '../../game/settings';
import { LANGUAGE_NAME } from '../../i18n';
import { updateSettings, useSettings, useT } from '../gameStore';
import { NotSavedNotice, PageHeader } from './PageHeader';

/** `lang`: the option is written in another language than the page (language names). */
type Option<T> = { value: T; label: string; note?: string; lang?: string };

type ChoiceProps<T extends string> = {
  name: keyof Settings;
  legend: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Set when another setting decides this one (beginner mode): shown instead of the note. */
  lockedBy?: string;
};

/** A row of radio buttons drawn as a segmented control, with the picked option's note below. */
function Choice<T extends string>(props: ChoiceProps<T>) {
  const { name, legend, options, value, onChange, lockedBy } = props;
  const note = lockedBy ?? options.find((o) => o.value === value)?.note;
  return (
    <fieldset
      className="flex flex-col gap-1.5"
      disabled={lockedBy !== undefined}
      data-locked={lockedBy !== undefined || undefined}
    >
      <legend className="mb-1.5 font-semibold">{legend}</legend>
      <div className={`flex flex-wrap gap-1.5 ${lockedBy ? 'opacity-45' : ''}`}>
        {options.map((o) => (
          <label key={o.value} className="flex-1 basis-[calc(33%-0.375rem)] sm:basis-0">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              lang={o.lang}
              className="block cursor-pointer rounded-lg bg-white/10 px-2 py-2 text-center text-sm whitespace-nowrap peer-checked:bg-amber-300 peer-checked:font-semibold peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-white hover:bg-white/20 peer-checked:hover:bg-amber-300"
            >
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {note && <p className={`text-sm ${lockedBy ? 'text-amber-200' : 'text-white/70'}`}>{note}</p>}
    </fieldset>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-black/25 p-4">
      <h2 className="text-sm font-semibold tracking-wide text-amber-200">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const settings = useSettings((s) => s.settings);
  const persistent = useSettings((s) => s.persistent);
  const t = useT();
  const w = t.settings;
  const locked = settings.beginnerMode ? w.locked : undefined;
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      updateSettings({ [key]: value });

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-8">
      <PageHeader title={t.common.settings} />
      {!persistent && <NotSavedNotice what={w.notSavedWhat} />}

      <section className="flex flex-col gap-3 rounded-2xl bg-black/25 p-4">
        <Choice<Language>
          name="language"
          legend={t.common.language}
          options={LANGUAGES.map((value) => ({ value, label: LANGUAGE_NAME[value], lang: value }))}
          value={settings.language}
          onChange={set('language')}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-black/25 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="beginnerMode"
            checked={settings.beginnerMode}
            onChange={(e) => updateSettings({ beginnerMode: e.target.checked })}
            className="mt-1 size-5 shrink-0 accent-amber-300"
          />
          <span className="flex flex-col">
            <span className="font-semibold">{w.beginner}</span>
            <span className="text-sm text-white/70">{w.beginnerNote}</span>
          </span>
        </label>
      </section>

      <Section title={w.dealSection}>
        <Choice<ContractType>
          name="contractType"
          legend={w.contractType}
          options={CONTRACT_TYPES.map((value) => ({ value, label: t.contractType[value] }))}
          value={settings.contractType}
          onChange={set('contractType')}
          lockedBy={locked?.(w.contractTypeLocked)}
        />
        <Choice<Difficulty>
          name="difficulty"
          legend={w.difficulty}
          options={DIFFICULTIES.map((value) => ({ value, ...w.difficultyOptions[value] }))}
          value={settings.difficulty}
          onChange={set('difficulty')}
          lockedBy={locked?.(w.difficultyLocked)}
        />
        <Choice<Vulnerability>
          name="vulnerability"
          legend={w.vulnerability}
          options={VULNERABILITIES.map((value) => ({ value, ...w.vulnerabilityOptions[value] }))}
          value={settings.vulnerability}
          onChange={set('vulnerability')}
        />
      </Section>

      <Section title={w.playSection}>
        <Choice<CardPlay>
          name="cardPlay"
          legend={w.cardPlay}
          options={CARD_PLAY_OPTIONS.map((value) => ({ value, ...w.cardPlayOptions[value] }))}
          value={settings.cardPlay}
          onChange={set('cardPlay')}
        />
        <Choice<BotSpeed>
          name="botSpeed"
          legend={w.botSpeed}
          options={BOT_SPEEDS.map((value) => ({ value, label: w.botSpeedOptions[value] }))}
          value={settings.botSpeed}
          onChange={set('botSpeed')}
          lockedBy={locked?.(w.botSpeedLocked)}
        />
        <Choice<SuitOrder>
          name="suitOrder"
          legend={w.suitOrder}
          options={SUIT_ORDER_OPTIONS.map((value) => ({ value, ...w.suitOrderOptions[value] }))}
          value={settings.suitOrder}
          onChange={set('suitOrder')}
        />
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="studyMode"
            checked={settings.studyMode}
            onChange={(e) => updateSettings({ studyMode: e.target.checked })}
            className="mt-1 size-5 shrink-0 accent-amber-300"
          />
          <span className="flex flex-col">
            <span className="font-semibold">{w.study}</span>
            <span className="text-sm text-white/70">{w.studyNote}</span>
          </span>
        </label>
      </Section>

      <p className="text-center text-sm text-white/60">{persistent ? w.saved : w.notSaved}</p>
    </main>
  );
}
