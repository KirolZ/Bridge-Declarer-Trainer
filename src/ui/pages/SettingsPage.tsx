// #/settings (SPEC §7.6). Every change applies and is saved at once; deal settings take effect
// from the next new hand, the rest straight away (also on a hand in progress).

import type { ReactNode } from 'react';
import type { SuitOrder, Vulnerability } from '../../engine';
import { CONTRACT_TYPE_LABEL } from '../../game/playStore';
import type { BotSpeed, ContractType, Difficulty, Settings } from '../../game/settings';
import {
  BOT_SPEEDS,
  CONTRACT_TYPES,
  DIFFICULTIES,
  SUIT_ORDER_OPTIONS,
  VULNERABILITIES,
} from '../../game/settings';
import { updateSettings, useSettings } from '../gameStore';
import { NotSavedNotice, PageHeader } from './PageHeader';

type Option<T> = { value: T; label: string; note?: string };

const DIFFICULTY: Readonly<Record<Difficulty, Omit<Option<Difficulty>, 'value'>>> = {
  exact: { label: 'พอดี', note: 'contract เท่ากับที่ทำได้สูงสุด ต้องเล่นแม่นทุกใบ' },
  cushion: { label: 'มีเผื่อ', note: 'ต่ำกว่าที่ทำได้ 1 level (ถ้าลดได้) พลาดได้ 1 trick' },
};

const VULNERABILITY: Readonly<Record<Vulnerability, Omit<Option<Vulnerability>, 'value'>>> = {
  none: { label: 'ไม่ vul' },
  ns: { label: 'NS vul', note: 'ทำได้แต้มสูงขึ้น แต่ขาดก็เสียแต้มมากขึ้น' },
};

const BOT_SPEED: Readonly<Record<BotSpeed, string>> = {
  slow: 'ช้า',
  normal: 'ปกติ',
  fast: 'เร็ว',
};

const SUIT_ORDER: Readonly<Record<SuitOrder, Omit<Option<SuitOrder>, 'value'>>> = {
  alternate: { label: 'สลับดำ-แดง', note: 'trump ขึ้นก่อน แบบที่ dummy วางบนโต๊ะจริง' },
  rank: { label: '♠ ♥ ♦ ♣', note: 'ลำดับเดิมตลอด ไม่ขึ้นกับ contract' },
};

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
            <span className="block cursor-pointer rounded-lg bg-white/10 px-2 py-2 text-center text-sm whitespace-nowrap peer-checked:bg-amber-300 peer-checked:font-semibold peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-white hover:bg-white/20 peer-checked:hover:bg-amber-300">
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
  const locked = settings.beginnerMode ? 'โหมดมือใหม่เปิดอยู่' : undefined;
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      updateSettings({ [key]: value });

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-8">
      <PageHeader title="ตั้งค่า" />
      {!persistent && <NotSavedNotice what="ตั้งค่า" />}

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
            <span className="font-semibold">โหมดมือใหม่</span>
            <span className="text-sm text-white/70">
              contract ง่าย (มีเผื่อ ไม่มี slam), บอทเล่นช้า, บอกเหตุผลเมื่อกดใบที่ลงไม่ได้,
              ข้อความแนะนำบนโต๊ะ และหน้าสรุปอธิบายแต้มทีละส่วน
            </span>
          </span>
        </label>
      </section>

      <Section title="การแจกไพ่ (มีผลตั้งแต่มือถัดไป)">
        <Choice<ContractType>
          name="contractType"
          legend="ประเภท contract"
          options={CONTRACT_TYPES.map((value) => ({ value, label: CONTRACT_TYPE_LABEL[value] }))}
          value={settings.contractType}
          onChange={set('contractType')}
          lockedBy={locked && `${locked}: partscore หรือ game เท่านั้น ไม่มี slam`}
        />
        <Choice<Difficulty>
          name="difficulty"
          legend="ความยาก"
          options={DIFFICULTIES.map((value) => ({ value, ...DIFFICULTY[value] }))}
          value={settings.difficulty}
          onChange={set('difficulty')}
          lockedBy={locked && `${locked}: ใช้แบบมีเผื่อเสมอ`}
        />
        <Choice<Vulnerability>
          name="vulnerability"
          legend="Vulnerability"
          options={VULNERABILITIES.map((value) => ({ value, ...VULNERABILITY[value] }))}
          value={settings.vulnerability}
          onChange={set('vulnerability')}
        />
      </Section>

      <Section title="ระหว่างเล่น">
        <Choice<BotSpeed>
          name="botSpeed"
          legend="ความเร็วบอท"
          options={BOT_SPEEDS.map((value) => ({ value, label: BOT_SPEED[value] }))}
          value={settings.botSpeed}
          onChange={set('botSpeed')}
          lockedBy={locked && `${locked}: บอทเล่นช้า`}
        />
        <Choice<SuitOrder>
          name="suitOrder"
          legend="การเรียงดอก"
          options={SUIT_ORDER_OPTIONS.map((value) => ({ value, ...SUIT_ORDER[value] }))}
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
            <span className="font-semibold">โหมดศึกษา</span>
            <span className="text-sm text-white/70">
              เปิดไพ่ทุกมือระหว่างเล่น — มือที่เปิดโหมดนี้ตอนไหนก็ตามไม่นับสถิติ
            </span>
          </span>
        </label>
      </Section>

      <p className="text-center text-sm text-white/60">
        {persistent ? 'บันทึกให้อัตโนมัติทุกครั้งที่เปลี่ยน' : 'เปลี่ยนแล้วมีผลทันที'}
      </p>
    </main>
  );
}
