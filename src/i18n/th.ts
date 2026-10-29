// Thai text of every screen (SPEC §1): the source dictionary. `en.ts` must have the same shape
// (the `Messages` type), so a missing translation fails the type check. Bridge terms stay in
// English as Thai players say them. The guide's own content (chapters, exercises, glossary) lives
// in src/learn, not here.

import type { Card, IllegalReason, Seat, Suit, SuitOrder, Vulnerability } from '../engine';
import { SUIT_INFO, rankLabel } from '../engine';
import type { StoreMessage } from '../game/playStore';
import type { BotSpeed, CardPlay, ContractType, Difficulty } from '../game/settings';

type Option = { readonly label: string; readonly note?: string };

const SEAT: Readonly<Record<Seat, string>> = { N: 'North', E: 'East', S: 'South', W: 'West' };

const CONTRACT_TYPE: Readonly<Record<ContractType, string>> = {
  any: 'อะไรก็ได้',
  gameUp: 'game ขึ้นไป',
  slam: 'slam',
  nt: 'NT เท่านั้น',
  suit: 'suit เท่านั้น',
  noSlam: 'partscore / game',
};

const BEGINNER_ON = 'โหมดมือใหม่เปิดอยู่';

export const th = {
  common: {
    back: 'กลับ',
    backHome: 'กลับหน้าแรก',
    home: 'หน้าแรก',
    cancel: 'ยกเลิก',
    retry: 'ลองใหม่',
    close: 'ปิด',
    settings: 'ตั้งค่า',
    stats: 'สถิติ',
    guide: 'คู่มือ',
    language: 'ภาษา',
    /** `what` cannot be saved (blocked storage, SPEC §7.6). */
    notSaved: (what: string) =>
      `เบราว์เซอร์นี้ไม่ให้บันทึกข้อมูล — ${what}ใช้ได้ตามปกติ แต่จะหายเมื่อปิดหรือรีเฟรชหน้า`,
    notFound: 'ไม่พบหน้านี้',
    badHandLink: 'ลิงก์มือไพ่ไม่ถูกต้อง',
  },

  /** Seat with its role, e.g. "North (dummy)". */
  seatRole: { N: 'North (dummy)', E: 'East', S: 'South (คุณ)', W: 'West' } as Readonly<
    Record<Seat, string>
  >,
  suitName: {
    S: SUIT_INFO.S.thaiName,
    H: SUIT_INFO.H.thaiName,
    D: SUIT_INFO.D.thaiName,
    C: SUIT_INFO.C.thaiName,
  } as Readonly<Record<Suit, string>>,
  /** Spoken name of a card, e.g. "A โพดำ", "10 โพแดง". */
  cardName: (card: Card) => `${rankLabel(card.rank)} ${SUIT_INFO[card.suit].thaiName}`,
  /** "♠K, ♠Q หรือ ♥2": the word before the last card of a list. */
  or: ' หรือ ',
  /**
   * Why a card cannot be played, e.g. "ต้องลง ♥ เพราะยังมี ♥ อยู่". With the seat of the card's
   * hand (the table, SPEC §7.8): "…เพราะคุณยังมี ♥ อยู่", or for dummy "…เพราะ dummy ยังมี…".
   */
  illegal: (reason: IllegalReason, owner?: Seat): string => {
    switch (reason.code) {
      case 'must-follow-suit': {
        const s = SUIT_INFO[reason.suit].symbol;
        const who = owner === 'S' ? 'คุณ' : owner === 'N' ? ' dummy ' : '';
        return `ต้องลง ${s} เพราะ${who}ยังมี ${s} อยู่`;
      }
      case 'not-in-hand':
        if (reason.seat === 'N') return 'ตอนนี้ถึงตา dummy — กดไพ่ของ North ด้านบน';
        if (reason.seat === 'S') return 'ตอนนี้ถึงตาคุณ — กดไพ่จากมือ South ด้านล่าง';
        return `ไม่ใช่ไพ่ของ ${SEAT[reason.seat]}`;
      case 'hand-complete':
        return 'เล่นครบทุก trick แล้ว';
    }
  },
  vulnerability: { none: 'ไม่มีฝ่ายไหน vul', ns: 'NS vul' } as Readonly<
    Record<Vulnerability, string>
  >,
  contractType: CONTRACT_TYPE,
  /** Errors and notices of the play store. */
  storeMessage: (m: StoreMessage): string => {
    switch (m.kind) {
      case 'botFailed':
        return `บอทคิดไม่สำเร็จ (${m.detail})`;
      case 'hintFailed':
        return `คำใบ้ไม่สำเร็จ (${m.detail})`;
      case 'claimFailed':
        return `ตรวจ claim ไม่สำเร็จ (${m.detail})`;
      case 'dealFailed':
        return `แจกไพ่ไม่สำเร็จ (${m.detail})`;
      case 'dealRelaxed':
        return (
          `หามือแบบ "${CONTRACT_TYPE[m.wanted]}" ไม่เจอใน 30 มือ ` +
          `เลยแจกแบบ "${CONTRACT_TYPE[m.got]}" แทน`
        );
    }
  },

  home: {
    tagline: 'ฝึกเดินไพ่ฝั่ง declarer กับบอทที่เห็นไพ่ทุกมือ',
    welcomeTitle: 'เคยเล่น bridge ไหม?',
    welcomeNew: 'ยังไม่เคย',
    welcomeNewNote: 'เริ่มจากคู่มือ + โหมดมือใหม่',
    welcomeKnown: 'เคยเล่นแล้ว',
    welcomeKnownNote: 'เริ่มเล่นเลย',
    welcomeLater: 'เปลี่ยนใจได้ทุกเมื่อ: คู่มืออยู่ที่หน้านี้ โหมดมือใหม่อยู่ในตั้งค่า',
    play: 'เริ่มเล่น',
    mainMenu: 'เมนูหลัก',
    chapters: (read: number, total: number) => `${read}/${total} บท`,
    creditsBy: 'โดย Bo Haglund, Soren Hein และคณะ',
  },

  dealing: 'กำลังแจกไพ่...',

  settings: {
    notSavedWhat: 'ตั้งค่า',
    beginner: 'โหมดมือใหม่',
    beginnerNote:
      'contract ง่าย (มีเผื่อ ไม่มี slam), บอทเล่นช้า, บอกเหตุผลเมื่อกดใบที่ลงไม่ได้, ข้อความแนะนำบนโต๊ะ และหน้าสรุปอธิบายแต้มทีละส่วน',
    /** A setting decided by beginner mode: why it is locked. */
    locked: (why: string) => `${BEGINNER_ON}: ${why}`,
    dealSection: 'การแจกไพ่ (มีผลตั้งแต่มือถัดไป)',
    contractType: 'ประเภท contract',
    contractTypeLocked: 'partscore หรือ game เท่านั้น ไม่มี slam',
    difficulty: 'ความยาก',
    difficultyLocked: 'ใช้แบบมีเผื่อเสมอ',
    difficultyOptions: {
      exact: { label: 'พอดี', note: 'contract เท่ากับที่ทำได้สูงสุด ต้องเล่นแม่นทุกใบ' },
      cushion: { label: 'มีเผื่อ', note: 'ต่ำกว่าที่ทำได้ 1 level (ถ้าลดได้) พลาดได้ 1 trick' },
    } as Readonly<Record<Difficulty, Option>>,
    vulnerability: 'Vulnerability',
    vulnerabilityOptions: {
      none: { label: 'ไม่ vul' },
      ns: { label: 'NS vul', note: 'ทำได้แต้มสูงขึ้น แต่ขาดก็เสียแต้มมากขึ้น' },
    } as Readonly<Record<Vulnerability, Option>>,
    playSection: 'ระหว่างเล่น',
    cardPlay: 'การลงไพ่',
    cardPlayOptions: {
      tap: { label: 'แตะแล้วลงเลย', note: 'แตะไพ่ครั้งเดียว ไพ่ลงทันที' },
      confirm: {
        label: 'แตะเลือก แล้วยืนยัน',
        note: 'แตะครั้งแรก ไพ่จะไปรอกลางโต๊ะ แล้วแตะไพ่กลางโต๊ะ (หรือใบเดิมซ้ำ) เพื่อลงจริง กันลงผิดใบ — แตะที่อื่นบนโต๊ะหรือกด Esc เพื่อยกเลิก',
      },
    } as Readonly<Record<CardPlay, Option>>,
    botSpeed: 'ความเร็วบอท',
    botSpeedLocked: 'บอทเล่นช้า',
    botSpeedOptions: { slow: 'ช้า', normal: 'ปกติ', fast: 'เร็ว' } as Readonly<
      Record<BotSpeed, string>
    >,
    suitOrder: 'การเรียงดอก',
    suitOrderOptions: {
      alternate: { label: 'สลับดำ-แดง', note: 'trump ขึ้นก่อน แบบที่ dummy วางบนโต๊ะจริง' },
      rank: { label: '♠ ♥ ♦ ♣', note: 'ลำดับเดิมตลอด ไม่ขึ้นกับ contract' },
    } as Readonly<Record<SuitOrder, Option>>,
    study: 'โหมดศึกษา',
    studyNote: 'เปิดไพ่ทุกมือระหว่างเล่น — มือที่เปิดโหมดนี้ตอนไหนก็ตามไม่นับสถิติ',
    saved: 'บันทึกให้อัตโนมัติทุกครั้งที่เปลี่ยน',
    notSaved: 'เปลี่ยนแล้วมีผลทันที',
  },

  stats: {
    notSavedWhat: 'สถิติ',
    empty: 'ยังไม่มีสถิติ — เล่นให้จบสักมือก่อน',
    kind: 'ประเภท',
    hands: 'มือ',
    made: 'ทำได้',
    lost: 'เสีย trick',
    hints: 'คำใบ้',
    perHand: '/มือ',
    all: 'ทั้งหมด',
    suit: 'suit',
    note: '"เสีย trick" นับเทียบกับการเล่นที่ดีที่สุด (double dummy) ตามหน้าวิเคราะห์หลังจบมือ · นับครั้งแรกที่เล่นจบของแต่ละมือ ส่วนการย้อนหรือเล่นมือเดิมซ้ำไม่นับเพิ่ม · มือที่เปิดโหมดศึกษาไม่นับ',
    reset: 'ล้างสถิติ',
    resetArmed: 'กดอีกครั้งเพื่อล้างสถิติทั้งหมด',
  },

  table: {
    tools: 'เครื่องมือฝึก',
    hint: 'คำใบ้',
    hintUsed: (n: number) => `คำใบ้ (ใช้ไปแล้ว ${n} ครั้ง)`,
    thinking: 'กำลังคิด…',
    undo: 'ย้อน',
    guideHere: 'คู่มือบทที่เกี่ยวกับตอนนี้',
    menu: 'เมนู',
    restart: 'เล่นมือนี้ใหม่',
    newDeal: 'แจกไพ่ใหม่',
    studyMode: 'โหมดศึกษา (เปิดไพ่ทุกมือ)',
    byDeclarer: 'โดย South',
    needed: (n: number) => `ต้องได้ ${n} trick`,
    seatThinking: 'กำลังคิด',
    waitFor: (seat: Seat) => `รอ ${SEAT[seat]} ลงก่อน`,
    wonTrick: (seat: Seat) => `${SEAT[seat]} กิน trick นี้`,
    confirmStatus: (card: string) => `แตะไพ่กลางโต๊ะ หรือกด ${card} อีกครั้งเพื่อลง`,
    hintStatus: (tricks: number, needed: number) =>
      `คำใบ้: ใบที่ยกขึ้นยังทำได้ ${tricks} trick${tricks < needed ? ` — ไม่พอแล้ว (ต้องได้ ${needed})` : ''}`,
    dummyTurn: 'ถึงตา dummy — กดไพ่ของ North ด้านบน',
    yourTurn: 'ถึงตาคุณ — ลงไพ่จากมือ South',
    botThinking: (seat: Seat) => `${SEAT[seat]} กำลังคิด…`,
    played: (seat: Seat, card: string) => `${SEAT[seat]} ลง ${card}`,
    tapToPlay: 'แตะเพื่อลง',
    playCard: (card: string) => `ลง ${card}`,
    trickNumber: (n: number) => `trick ที่ ${n}`,
    cardIllegal: ' (ลงไม่ได้)',
    cardPicked: ' (เลือกอยู่ — กดอีกครั้งเพื่อลง)',
    cardHinted: ' (คำใบ้)',
    cardCount: (n: number) => `${n} ใบ`,
    noCards: 'ไม่มีไพ่',
    dummyFaceDown: (n: number) => `dummy ยังคว่ำอยู่: ${n} ใบ`,
    tip: 'คำแนะนำ',
    gotIt: 'เข้าใจแล้ว',
  },

  /** Beginner-mode tips on the table (SPEC §7.8), in guide markup. */
  coach: {
    who: (seat: Seat): string =>
      seat === 'S' ? 'คุณ (South)' : seat === 'N' ? 'dummy (North)' : SEAT[seat],
    contractNT: (level: number, needed: number) =>
      `contract คือ ${level}NT — ต้องได้ ${needed} [[trick]] และไม่มี [[trump]]: ใบใหญ่ที่สุดของดอกที่[[lead|นำ]]กินเสมอ`,
    contractSuit: (level: number, suit: string, needed: number) =>
      `contract คือ ${level}${suit} — ต้องได้ ${needed} [[trick]] โดย ${suit} เป็น [[trump]]`,
    ruff: (trick: number, who: string, led: string, card: string) =>
      `trick ${trick}: ${who} ไม่มี ${led} จึง[[ruff|ตัด]]ด้วย ${card} — [[trump]] ชนะทุกดอกอื่น จึงกิน`,
    overruff: (trick: number, who: string, card: string) =>
      `trick ${trick}: มีคนตัดด้วย [[trump]] มากกว่า 1 คน ${card} ของ ${who} เป็น trump ใบใหญ่ที่สุด จึงกิน ([[overruff|ตัดซ้อน]])`,
    won: (trick: number, who: string, card: string, led: string) =>
      `trick ${trick}: ${who} กินด้วย ${card} — ใบใหญ่ที่สุดของดอกที่[[lead|นำ]] (${led})`,
    discard: ' ใบดอกอื่นที่[[discard|ทิ้ง]]ลงมากินไม่ได้',
    nextLead: (who: string) => ` · ${who} นำ trick ถัดไป`,
    dummy: 'North คือ [[dummy]] — หงายไพ่ให้ทุกคนเห็น และ**คุณเป็นคนเลือก**ทุกใบที่มือนี้ลง',
    northTurn: 'ตอนนี้ถึงตา dummy — กดไพ่ของ **North ด้านบน**',
  },

  claim: {
    rejected: 'Claim ไม่ผ่าน — ฝั่งป้องกันยังมีทางกิน',
    goOnNote: 'เล่นต่อจากตรงนี้ได้เลย',
    goOn: 'เล่นต่อ',
    question: (left: number) =>
      `จะได้อีกกี่ trick จาก ${left} trick ที่เหลือ? ระบบจะตรวจว่าฝั่งป้องกันเล่นดีที่สุดแล้วยังได้ตามนั้นไหม`,
    fewer: 'ลด',
    more: 'เพิ่ม',
    total: (total: number, needed: number) =>
      `NS จะได้รวม ${total} trick (ต้องได้ ${needed}) · ${total >= needed ? 'ทำ contract ได้' : `ขาด ${needed - total}`}`,
    checking: 'กำลังตรวจ…',
    submit: (n: number) => `Claim ${n} trick`,
  },

  share: {
    share: '🔗 แชร์มือนี้',
    copied: '✓ คัดลอกลิงก์แล้ว',
    copiedStatus: 'คัดลอกลิงก์ของมือนี้แล้ว',
    failed: 'คัดลอกอัตโนมัติไม่ได้ — คัดลอกลิงก์นี้เอง',
  },

  result: {
    made: (contract: string) => `ทำ ${contract} ได้!`,
    down: (contract: string, n: number) => `${contract} ขาด ${n} trick`,
    tricks: (ns: number, dd: number | null, needed: number, over: number) =>
      `ได้ ${ns} trick${dd !== null ? ` (DD ทำได้ ${dd})` : ''} · ต้องได้ ${needed}${over > 0 ? ` · เกิน ${over}` : ''}`,
    points: 'แต้ม',
    byClaim: 'จบด้วย claim',
    hints: (n: number): string => (n > 0 ? `ใช้คำใบ้ ${n} ครั้ง` : 'ไม่ได้ใช้คำใบ้'),
    studied: 'โหมดศึกษา (ไม่นับสถิติ)',
    scoreSource: 'ที่มาของแต้ม',
    total: 'รวม',
    scoreChapter: 'การคิดแต้ม (คู่มือบทที่ 6)',
    /** "<seat> ลง <card> · ควรลง <cards>" */
    lossPlayed: 'ลง',
    lossBetter: 'ควรลง',
    lossClaim: (claimed: number, before: number) =>
      `Claim รวม ${claimed} trick แต่ยังทำได้ ${before} · ควรเล่นต่อ เช่น`,
    reviewFailed: 'วิเคราะห์ไม่สำเร็จ',
    reviewing: 'กำลังวิเคราะห์…',
    perfect: 'เสีย 0 trick — เล่นได้ดีที่สุดแบบ double-dummy ทุกใบ',
    lost: (n: number) => `เสีย ${n} trick เทียบกับ double-dummy`,
    trick: (n: number) => `trick ${n}`,
    lossHelp: 'กดรายการเพื่อดูย้อนหลัง trick นั้น',
    replay: '▶ ดูย้อนหลัง',
    undo: (claimed: boolean): string => `↶ ย้อน${claimed ? ' claim' : 'ใบล่าสุด'}`,
  },

  /** The score line by line (beginner mode, SPEC §7.8), in the words of chapter 6. */
  score: {
    vul: (vulnerable: boolean): string => (vulnerable ? 'vul' : 'ไม่ vul'),
    down: (n: number) => `ขาด ${n} trick`,
    downDetail: (n: number, per: number, vul: string) => `${n} × ${per} (${vul}: trick ละ ${per})`,
    downSummary: (contract: string, needed: number, tricks: number) =>
      `${contract} ต้องได้ ${needed} trick แต่ได้ ${tricks} — ทำไม่ได้จึงไม่ได้แต้มของ trick เลย และเสียแต้มให้ฝั่งป้องกันตามจำนวน trick ที่ขาด`,
    contractTricks: (level: number) => `trick ตามสัญญา (${level} trick เกิน 6)`,
    ntFirst: 'NT trick แรก 40',
    ntMore: (more: number) => `NT trick แรก 40 + อีก ${more} × 30`,
    suitDetail: (level: number, per: number, suit: string) =>
      `${level} × ${per} (${suit} trick ละ ${per})`,
    overtricks: (n: number) => `trick ที่เกิน ${n} trick`,
    gameBonus: 'โบนัส game',
    partscoreBonus: 'โบนัส partscore',
    gameDetail: (vul: string, bonus: number) =>
      `แต้มของ trick ตามสัญญาถึง 100 · ${vul} ได้ ${bonus}`,
    partscoreDetail: 'แต้มของ trick ตามสัญญาไม่ถึง 100',
    slamBonus: (grand: boolean): string => (grand ? 'โบนัส grand slam' : 'โบนัส small slam'),
    madeSummary: (contract: string, needed: number, tricks: number, over: boolean) =>
      `${contract} ต้องได้ ${needed} trick และได้ ${tricks} — ทำได้ จึงได้แต้มของ trick ตามสัญญา${over ? ' trick ที่เกิน' : ''} และโบนัส`,
  },

  replay: {
    legendPlayed: 'ลงใน trick นี้',
    legendWrong: 'ใบที่เสีย trick',
    legendBetter: 'ใบที่ควรลง',
    back: 'กลับหน้าสรุป',
    title: (trick: number, count: number) => `ดูย้อนหลัง · trick ${trick}/${count}`,
    pickTrick: 'เลือก trick',
    trick: (n: number, lossy: boolean) => `trick ${n}${lossy ? ' (เสีย trick)' : ''}`,
    led: (seat: Seat) => `${SEAT[seat]} นำ`,
    ddBefore: (n: number) => `ก่อน trick นี้ DD ทำได้ ${n} trick`,
    claimHere: (n: number) => `Claim ตรงนี้ — NS ได้รวม ${n} trick`,
    lost: (n: number) => `เสีย ${n} trick: `,
    prev: '◀ trick ก่อน',
    next: 'trick ถัดไป ▶',
    playFromHere: 'ลองเล่นใหม่จากตรงนี้',
  },

  /** The guide's pages around the content (the content itself is in src/learn). */
  learn: {
    notFound: (what: string) => `ไม่พบ${what}`,
    thisChapter: 'บทนี้',
    thisExercise: 'แบบฝึกนี้',
    toGuide: 'ไปที่คู่มือ',
    progressWhat: 'ความคืบหน้า',
    progress: 'ความคืบหน้า',
    /** "อ่านแล้ว <b>3/14</b> บท · แบบฝึกผ่าน <b>2/32</b> ข้อ" around the two numbers. */
    progressRead: 'อ่านแล้ว',
    progressPassed: 'บท · แบบฝึกผ่าน',
    progressEnd: 'ข้อ',
    chaptersRead: 'บทที่อ่านแล้ว',
    readInOrder: 'อ่านเรียงตามลำดับ หรือข้ามไปบทไหนก็ได้',
    glossary: 'อภิธานศัพท์',
    glossaryNote: 'ศัพท์ bridge ทุกคำพร้อมคำอธิบายภาษาไทย',
    chapter: (n: number) => `บทที่ ${n}`,
    chapterOf: (n: number, total: number) => `บทที่ ${n} / ${total}`,
    soon: 'เร็ว ๆ นี้',
    read: 'อ่านแล้ว',
    exercisesDone: (done: number, total: number) => `แบบฝึก ${done}/${total}`,
    /** Parts of the chapter list (M21). */
    partRead: (read: number, total: number) => `อ่านแล้ว ${read}/${total}`,
    showPart: (n: number) => `ดู ${n} บท`,
    hidePart: 'ซ่อน',
    rulesDone: 'อ่านกฎครบแล้ว — เล่นได้เลย',
    rulesDoneNote:
      'เทคนิคการเล่นในบทที่ 7–13 ค่อยกลับมาอ่านหลังจากลองเล่นสักพักก็ได้ ระหว่างเล่นกดปุ่ม ? บนโต๊ะเพื่อเปิดคู่มือได้ตลอด',
    backToChapters: 'กลับไปรายการบท',
    pending: (topic: string) => `บทนี้ยังเขียนไม่เสร็จ — เรื่องที่จะมี: ${topic}`,
    exercises: 'แบบฝึก',
    passed: 'ผ่านแล้ว',
    notDone: 'ยังไม่ได้ทำ',
    lessons: 'บทเรียน',
    prevChapter: '← บทก่อน',
    nextChapter: 'บทถัดไป →',
    backToChapter: (n: number) => `กลับไปบทที่ ${n}`,
    exerciseOf: (chapter: number, i: number, total: number) =>
      `แบบฝึกบทที่ ${chapter} · ข้อ ${i}/${total}`,
    hint: 'คำใบ้:',
    askHint: 'ขอคำใบ้',
    nextExercise: 'ข้อต่อไป →',
    toChapter: (n: number) => `บทที่ ${n} →`,
    backToGuide: 'กลับไปคู่มือ',
    glossaryIntro: 'ศัพท์ bridge ใช้ภาษาอังกฤษตามที่คนไทยเล่นกัน เรียงตามตัวอักษร',
    related: 'คำที่เกี่ยวข้อง:',
    allTerms: 'อภิธานศัพท์ทั้งหมด',
    pickChapter: 'เลือกบท',
    closeGuide: 'ปิดคู่มือ',
    openInGuide: 'เปิดในหน้าคู่มือ (ออกจากโต๊ะ)',
    /** Trick diagrams in the guide. */
    led: (seat: Seat) => `${SEAT[seat]} นำ`,
    wins: ' · กิน',
    winsLabel: ' (กิน)',
    toPlay: (seat: Seat) => `${SEAT[seat]}: ถึงตา`,
  },

  exercise: {
    hand: (role: string) => `มือ ${role}`,
    pickCards: (role: string) => `มือ ${role} — กดเลือกใบ`,
    check: 'ตรวจคำตอบ',
    right: 'ถูกต้อง!',
    legalShown: 'เฉลย: ใบที่มีเครื่องหมาย ✓ คือใบที่ลงได้',
    wrong: 'ยังไม่ถูก',
    cannotPlay: 'ลงไม่ได้ —',
    missed: 'ก็ลงได้ แต่ยังไม่ได้เลือก',
    fixAndCheck: 'แก้ที่เลือกแล้วกดตรวจอีกครั้ง หรือดูเฉลย',
    showAnswer: 'ดูเฉลย',
    options: 'ตัวเลือก',
    answer: 'เฉลย:',
    tryOther: 'ยังไม่ใช่ — ลองตัวเลือกอื่น',
    /** Play exercises. */
    noTrump: 'ไม่มี trump (NT)',
    goal: 'เป้า: NS ได้',
    goalOf: (total: number) => `จาก ${total} trick`,
    northTurn: 'ถึงตา North (dummy) — กดไพ่ด้านบน',
    southTurn: 'ถึงตา South (คุณ) — ลงไพ่จากมือด้านล่าง',
    solution: 'เฉลย',
    solutionFailed: 'โหลดเฉลยไม่สำเร็จ',
    solutionLoading: 'กำลังเตรียมเฉลย…',
    backToPlay: 'กลับไปเล่นเอง',
    solutionStep: (step: number, total: number) => `เฉลย — ใบที่ ${step}/${total}`,
    stepHelp: 'กด "ถัดไป" เพื่อดูทีละใบ',
    solutionEnd: (n: number) => `จบแล้ว NS ได้ ${n} trick ตามเป้า`,
    prev: '← ก่อนหน้า',
    next: 'ถัดไป →',
    playYourself: 'เล่นเอง',
    retry: '↺ ลองใหม่',
    preparing: 'กำลังเตรียมโต๊ะ…',
    passed: (n: number) => `ผ่าน! NS ได้ ${n} trick ตามเป้า`,
    failed: (n: number, goal: number) => `ยังไม่ผ่าน — NS ได้ ${n} trick (เป้า ${goal})`,
    mistakeAt: (trick: number) => `พลาดที่ trick ${trick}:`,
    reviewFailed: 'หาจุดพลาดไม่สำเร็จ',
    reviewing: 'กำลังหาจุดที่พลาด…',
  },
};

export type Messages = typeof th;
