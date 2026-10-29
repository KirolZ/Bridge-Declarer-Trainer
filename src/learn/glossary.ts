// Glossary (SPEC §7.7): every bridge term used in the game and the guide, with a short Thai
// explanation. Content links here with `[[id]]`. Kept in alphabetical order of `term`.

import type { Language } from '../game/settings';
import { localize, perLanguage } from './localize';
import type { Bilingual, GlossaryEntry } from './types';

const SOURCE: readonly GlossaryEntry<Bilingual>[] = [
  {
    id: 'auction',
    term: 'auction',
    thai: 'การประมูล',
    text: {
      th: 'ช่วงก่อนเล่นไพ่ในเกมจริง ที่ทั้ง 4 คนผลัดกันเสนอ [[contract]] แข่งกัน (เรียกอีกอย่างว่า bidding) เกมนี้ข้ามช่วงนี้ไป ระบบเลือก contract ให้',
      en: 'In a real game, the part before the cards are played, when the 4 players take turns offering [[contract|contracts]] against each other (also called bidding). This game skips it and picks the contract for you.',
    },
    chapter: 4,
    aliases: ['bidding'],
  },
  {
    id: 'claim',
    term: 'claim',
    thai: 'ขอจบมือ',
    text: {
      th: 'บอกว่า [[trick]] ที่เหลือคุณจะได้อีกกี่ trick แล้วจบมือโดยไม่ต้องเล่นต่อทีละใบ ในเกมนี้ระบบตรวจก่อนว่า[[defenders|ฝั่งป้องกัน]]ยังมีทางกินไหม ถ้ามีจะให้เล่นต่อ',
      en: 'Saying how many of the remaining [[trick|tricks]] you will take, and ending the hand without playing it out. In this game the claim is checked first: if the [[defenders]] can still take more, you play on.',
    },
    chapter: 14,
  },
  {
    id: 'contract',
    term: 'contract',
    thai: 'สัญญา',
    text: {
      th: 'จำนวน [[trick]] ที่ฝั่ง [[declarer]] ต้องได้ พร้อมดอกที่เป็น [[trump]] (หรือ NT = ไม่มี trump) เขียนเป็นตัวเลข + ดอก เช่น 4{S} = ต้องได้ 6 + 4 = 10 trick โดย {S} เป็น trump',
      en: "How many [[trick|tricks]] [[declarer|declarer's]] side must take, and which suit is [[trump|trumps]] (or NT = no trumps). Written as a number + a suit: 4{S} = 6 + 4 = 10 tricks with {S} as trumps.",
    },
    chapter: 4,
  },
  {
    id: 'declarer',
    term: 'declarer',
    thai: 'ผู้เล่นตามสัญญา',
    text: {
      th: 'คนที่ต้องเล่นให้ได้ตาม [[contract]] เป็นคนเลือกไพ่ทั้งจากมือตัวเองและจาก [[dummy]] ในเกมนี้คุณคือ South',
      en: 'The player who must make the [[contract]], choosing the cards both from their own hand and from [[dummy]]. In this game that is you, South.',
    },
    chapter: 5,
  },
  {
    id: 'defenders',
    term: 'defenders',
    thai: 'ฝั่งป้องกัน',
    text: {
      th: 'ทีมที่อยู่ฝั่งตรงข้ามกับ [[declarer]] พยายามได้ [[trick]] ให้มากพอจนสัญญาไม่สำเร็จ ในเกมนี้คือ West และ East ซึ่งเป็นบอท',
      en: 'The team against [[declarer]], who try to take enough [[trick|tricks]] to defeat the contract. In this game, West and East, played by bots.',
    },
    chapter: 5,
  },
  {
    id: 'discard',
    term: 'discard',
    thai: 'ทิ้ง',
    text: {
      th: 'ลงไพ่ดอกอื่นที่ไม่ใช่ [[trump]] เมื่อไม่มีดอกที่ [[lead|นำ]] เหลืออยู่ ใบที่ทิ้งไม่มีทางกิน [[trick]] แม้จะเป็น A',
      en: 'Playing a card of another suit, not a [[trump]], when you have none of the suit [[lead|led]]. A discard can never win the [[trick]], even an ace.',
    },
    chapter: 2,
  },
  {
    id: 'double',
    term: 'double',
    thai: 'ท้า',
    text: {
      th: 'ในเกมจริง ระหว่าง[[auction|การประมูล]] ฝั่งตรงข้ามประกาศ double ได้ถ้าคิดว่า [[contract]] จะไม่สำเร็จ แล้วแต้มทั้งตอนทำได้และตอนขาดจะสูงขึ้น เกมนี้ไม่มี double',
      en: 'In a real game, during the [[auction]], an opponent can say double when they think the [[contract]] will fail; then both the score for making it and the penalty for going down get bigger. This game has no doubles.',
    },
    chapter: 6,
  },
  {
    id: 'double-dummy',
    term: 'double-dummy (DD)',
    thai: 'เห็นไพ่ทุกมือ',
    text: {
      th: 'การเล่น (หรือคำนวณ) แบบเห็นไพ่ทั้ง 4 มือ แล้วเลือกใบที่ดีที่สุดทุกใบ บอทในเกมนี้ป้องกันแบบนี้ และหน้าสรุปผลเทียบกับค่านี้ เช่น "DD ทำได้ 10" = ถ้าเล่นถูกทุกใบจะได้ 10 [[trick]]',
      en: 'Playing (or working out) with all 4 hands in view and the best card every time. The bots in this game defend this way, and the summary compares your play with it: "DD makes 10" = with every card right you would take 10 [[trick|tricks]].',
    },
    chapter: 14,
  },
  {
    id: 'draw-trumps',
    term: 'draw trumps',
    thai: 'ดึง trump',
    text: {
      th: 'นำ [[trump]] ออกไปหลายรอบจนฝั่งป้องกันไม่มี trump เหลือ เพื่อไม่ให้เขา[[ruff|ตัด]] [[winner]] ของคุณได้',
      en: 'Leading [[trump|trumps]] for several rounds until the defenders have none left, so they cannot [[ruff]] your [[winner|winners]].',
    },
    chapter: 8,
  },
  {
    id: 'duck',
    term: 'duck',
    thai: 'ยอมปล่อย',
    text: {
      th: 'ลงใบเล็กทั้งที่กินได้หรือเลือกกินได้ ยอมเสีย [[trick]] นั้นไปก่อน เพื่อให้ได้มากกว่าในภายหลัง เช่นเพื่อเก็บใบไว้พาไปอีกมือ',
      en: 'Playing a small card when you could win, giving up the [[trick]] for now to gain more later — for example, to keep a card that gets you to the other hand.',
    },
    chapter: 11,
  },
  {
    id: 'dummy',
    term: 'dummy',
    thai: 'มือหงาย',
    text: {
      th: '[[partner|คู่]]ของ [[declarer]] หลัง [[opening-lead]] dummy หงายไพ่ทั้งมือบนโต๊ะ และ declarer เป็นคนเลือกทุกใบที่มือนี้ลง ในเกมนี้คือ North',
      en: "[[declarer|Declarer's]] [[partner]]. After the [[opening-lead]], dummy lays the whole hand face up on the table, and declarer chooses every card it plays. In this game, North.",
    },
    chapter: 5,
  },
  {
    id: 'entry',
    term: 'entry',
    thai: 'ทางเข้ามือ',
    text: {
      th: 'ใบที่ทำให้มือหนึ่งได้กิน [[trick]] แล้วได้[[lead|นำ]]ต่อ เช่น A ใน [[dummy]] ถ้าไม่มี entry winner ในมือนั้นก็ไปไม่ถึง',
      en: 'A card that lets a hand win a [[trick]] and so take the [[lead]], such as an ace in [[dummy]]. Without an entry, the winners in that hand cannot be reached.',
    },
    chapter: 12,
  },
  {
    id: 'establish',
    term: 'establish',
    thai: 'ทำให้กินได้',
    text: {
      th: 'เล่นดอกหนึ่งหลายรอบ (ยอมเสียให้ใบใหญ่ของฝั่งป้องกันก่อน) จนใบที่เหลือของคุณในดอกนั้นกลายเป็น [[winner]]',
      en: "Playing a suit for several rounds (losing to the defenders' high cards first) until your remaining cards in it become [[winner|winners]].",
    },
    chapter: 11,
  },
  {
    id: 'finesse',
    term: 'finesse',
    thai: 'เล่นลอดใบ',
    text: {
      th: 'นำ**เข้าหา**มือที่มีใบสูงเว้นช่อง (เช่น A Q) แล้วลงใบรองถ้าใบที่ขาด (K) ยังไม่ออก หวังว่าใบที่ขาดอยู่กับคนที่ลงก่อนมือนั้น',
      en: 'Leading **towards** a hand with a gap in its high cards (such as A Q) and playing the lower one if the missing card (K) has not appeared, hoping the missing card is with the player who plays before that hand.',
    },
    chapter: 10,
  },
  {
    id: 'follow-suit',
    term: 'follow suit',
    thai: 'ลงตามดอก',
    text: {
      th: 'ลงไพ่ดอกเดียวกับใบที่ [[lead|นำ]] ต้องทำเสมอถ้ายังมีดอกนั้นอยู่ในมือ',
      en: 'Playing a card of the same suit as the card [[lead|led]]. You must do so whenever you still have that suit.',
    },
    chapter: 2,
  },
  {
    id: 'game',
    term: 'game',
    thai: 'เกม',
    text: {
      th: '[[contract]] ที่แต้มของ trick ตามสัญญารวมได้ตั้งแต่ 100 ขึ้นไป ทำได้แล้วได้โบนัส 300 (หรือ 500 ถ้า [[vulnerable]]) ที่ต่ำที่สุดคือ 3NT, 4{H}, 4{S}, 5{C}, 5{D}',
      en: 'A [[contract]] whose contract tricks are worth 100 or more. Making it earns a bonus of 300 (or 500 if [[vulnerable]]). The lowest are 3NT, 4{H}, 4{S}, 5{C} and 5{D}.',
    },
    chapter: 6,
  },
  {
    id: 'hold-up',
    term: 'hold-up',
    thai: 'ปล่อยก่อน',
    text: {
      th: 'ยังไม่ใช้ใบที่กินได้ (เช่น A) ปล่อยให้ฝั่งป้องกันกินดอกนั้นไปก่อน 1–2 รอบ จนคนหนึ่งของเขาหมดดอกนั้น ใช้มากใน [[nt|NT]]',
      en: 'Not yet playing a card that would win (such as an ace), letting the defenders win the suit for 1–2 rounds until one of them runs out of it. Used most in [[nt|NT]].',
    },
    chapter: 13,
  },
  {
    id: 'lead',
    term: 'lead',
    thai: 'นำ',
    text: {
      th: 'ลงใบแรกของ [[trick]] คนที่กิน trick จะเป็นคนนำ trick ถัดไป',
      en: 'Playing the first card of a [[trick]]. Whoever wins a trick leads to the next one.',
    },
    chapter: 2,
  },
  {
    id: 'level',
    term: 'level',
    thai: 'ระดับ',
    text: {
      th: 'ตัวเลข 1–7 ที่ขึ้นต้น [[contract]] (เช่น 4 ใน 4{S}) คือจำนวน [[trick]] ที่ต้องได้เกิน 6 เช่น level 4 = ต้องได้ 10 trick',
      en: 'The number 1–7 at the start of a [[contract]] (the 4 of 4{S}): the [[trick|tricks]] needed above 6. Level 4 = 10 tricks.',
    },
    chapter: 4,
  },
  {
    id: 'long-suit',
    term: 'long suit',
    thai: 'ดอกยาว',
    text: {
      th: 'ดอกที่ฝั่งคุณมีหลายใบ เมื่อฝั่งป้องกันหมดดอกนั้นแล้ว ใบเล็กที่เหลือก็กิน [[trick]] ได้',
      en: 'A suit in which your side has many cards. Once the defenders have run out of it, the small cards left win [[trick|tricks]] too.',
    },
    chapter: 11,
  },
  {
    id: 'loser',
    term: 'loser',
    thai: 'ใบที่จะเสีย',
    text: {
      th: 'ใบที่จะเสีย [[trick]] ให้ฝั่งป้องกันถ้าไม่ทำอะไร นับจากมือ [[declarer]] ใน contract ที่มี [[trump]] แล้วหาทางกำจัด เช่น[[discard|ทิ้ง]]บน winner หรือ[[ruff|ตัด]]ใน [[dummy]]',
      en: "A card that will lose a [[trick]] to the defenders if nothing is done. Count them in [[declarer|declarer's]] hand in a contract with [[trump|trumps]], then find a way to get rid of them, such as a [[discard]] on a winner or a [[ruff]] in [[dummy]].",
    },
    chapter: 7,
  },
  {
    id: 'ns-ew',
    term: 'NS / EW',
    thai: 'สองทีม',
    text: {
      th: 'ชื่อย่อของสองทีม: NS = North กับ South (ทีมของคุณ) และ EW = East กับ West ([[defenders|ฝั่งป้องกัน]] ซึ่งเป็นบอท)',
      en: 'Short names for the two teams: NS = North and South (your team), EW = East and West (the [[defenders]], played by bots).',
    },
    chapter: 1,
  },
  {
    id: 'nt',
    term: 'NT (No Trump)',
    thai: 'ไม่มีไพ่ตัด',
    text: {
      th: '[[contract]] ที่ไม่มี [[trump]] ใบที่ใหญ่ที่สุดของดอกที่ [[lead|นำ]] กิน [[trick]] เสมอ',
      en: 'A [[contract]] with no [[trump|trumps]]: the highest card of the suit [[lead|led]] always wins the [[trick]].',
    },
    chapter: 3,
  },
  {
    id: 'opening-lead',
    term: 'opening lead',
    thai: 'ใบนำแรก',
    text: {
      th: 'ใบแรกของมือ นำโดยคนที่นั่งทางซ้ายของ [[declarer]] ในเกมนี้ declarer คือ South จึงเป็น West เสมอ',
      en: "The first card of the hand, led by the player on [[declarer|declarer's]] left. In this game declarer is South, so it is always West.",
    },
    chapter: 5,
  },
  {
    id: 'overruff',
    term: 'overruff',
    thai: 'ตัดซ้อน',
    text: {
      th: '[[ruff|ตัด]]ด้วย [[trump]] ที่ใหญ่กว่า trump ของคนที่ตัดไปก่อนใน [[trick]] เดียวกัน trump ใบใหญ่ที่สุดกิน',
      en: '[[ruff|Ruffing]] with a higher [[trump]] than a player who ruffed earlier in the same [[trick]]. The highest trump wins.',
    },
    chapter: 3,
  },
  {
    id: 'overtrick',
    term: 'overtrick',
    thai: 'trick ที่เกิน',
    text: {
      th: '[[trick]] ที่ได้เกินจากที่ [[contract]] ต้องการ ได้แต้มเพิ่ม trick ละ 20 หรือ 30',
      en: 'A [[trick]] taken beyond what the [[contract]] needs, worth 20 or 30 more.',
    },
    chapter: 6,
  },
  {
    id: 'partner',
    term: 'partner',
    thai: 'คู่',
    text: {
      th: 'คนในทีมเดียวกัน นั่งตรงข้ามกัน: North กับ South เป็นคู่กัน East กับ West เป็นคู่กัน',
      en: 'Your teammate, sitting opposite you: North and South are partners, and so are East and West.',
    },
    chapter: 1,
  },
  {
    id: 'partscore',
    term: 'partscore',
    thai: 'สัญญาต่ำกว่าเกม',
    text: {
      th: '[[contract]] ที่แต้มของ trick ตามสัญญารวมไม่ถึง 100 (ต่ำกว่า [[game]]) ทำได้แล้วได้โบนัส 50',
      en: 'A [[contract]] whose contract tricks are worth less than 100 (below a [[game]]). Making it earns a bonus of 50.',
    },
    chapter: 6,
  },
  {
    id: 'ruff',
    term: 'ruff',
    thai: 'ตัด',
    text: {
      th: 'ลง [[trump]] เมื่อไม่มีดอกที่ [[lead|นำ]] แล้ว trump ชนะทุกดอกอื่น ถ้ามีหลายคนตัด trump ใบใหญ่ที่สุดกิน ([[overruff|ตัดซ้อน]])',
      en: 'Playing a [[trump]] when you have none of the suit [[lead|led]]. A trump beats every other suit; if more than one player ruffs, the highest trump wins (an [[overruff]]).',
    },
    chapter: 3,
  },
  {
    id: 'slam',
    term: 'slam',
    thai: 'สแลม',
    text: {
      th: '[[contract]] ระดับ 6 (small slam ต้องได้ 12 trick) หรือ 7 (grand slam ต้องได้ครบ 13) ได้โบนัสเพิ่มจาก [[game]]',
      en: 'A [[contract]] at level 6 (a small slam, 12 tricks) or 7 (a grand slam, all 13), with a bonus on top of [[game]].',
    },
    chapter: 6,
    aliases: ['small slam', 'grand slam'],
  },
  {
    id: 'stopper',
    term: 'stopper',
    thai: 'ใบกั้น',
    text: {
      th: 'ใบที่กันไม่ให้ฝั่งป้องกันกินดอกหนึ่งต่อกันได้หลาย [[trick]] เช่น A ของดอกนั้น',
      en: 'A card that stops the defenders from running a suit for several [[trick|tricks]], such as the ace of that suit.',
    },
    chapter: 11,
  },
  {
    id: 'suit',
    term: 'suit',
    thai: 'ดอก',
    text: {
      th: 'ไพ่มี 4 ดอก ดอกละ 13 ใบ: {S} spade (โพดำ), {H} heart (โพแดง), {D} diamond (ข้าวหลามตัด), {C} club (ดอกจิก)',
      en: 'The pack has 4 suits of 13 cards each: {S} spades, {H} hearts, {D} diamonds and {C} clubs.',
    },
    chapter: 1,
  },
  {
    id: 'trick',
    term: 'trick',
    thai: 'ตา',
    text: {
      th: 'รอบที่ทุกคนลงไพ่คนละ 1 ใบ รวม 4 ใบ ใบที่ชนะทำให้ฝั่งของตัวเองได้ trick นั้น มือละ 13 ใบจึงมี 13 trick',
      en: 'A round in which everyone plays one card, 4 in all. The winning card takes the trick for its side. With 13 cards each, a hand has 13 tricks.',
    },
    chapter: 2,
  },
  {
    id: 'trump',
    term: 'trump',
    thai: 'ไพ่ตัด',
    text: {
      th: 'ดอกที่ชนะทุกดอกอื่น กำหนดโดย [[contract]] จะ[[lead|นำ]] trump เมื่อไหร่ก็ได้ แต่ถ้ามีคนนำดอกอื่น ลง trump ได้เมื่อไม่มีดอกที่นำแล้วเท่านั้น ถ้ามีหลายใบ trump ใบใหญ่ที่สุดกิน',
      en: 'The suit that beats every other suit, set by the [[contract]]. You may [[lead]] a trump at any time, but when another suit is led you may play a trump only if you have none of that suit. If several are played, the highest trump wins.',
    },
    chapter: 3,
  },
  {
    id: 'unblock',
    term: 'unblock',
    thai: 'ปลดล็อก',
    text: {
      th: 'เล่นใบสูงของมือที่มีดอกนั้นน้อยกว่าออกไปก่อน เพื่อไม่ให้ใบนั้นกินแล้วค้างการนำไว้ในมือที่ไม่มีดอกนั้นเหลือ',
      en: 'Playing the high cards of the hand with fewer cards in a suit first, so that they do not win a trick and leave the lead in a hand with none of the suit left.',
    },
    chapter: 12,
    aliases: ['blocked'],
  },
  {
    id: 'undertrick',
    term: 'undertrick',
    thai: 'trick ที่ขาด',
    text: {
      th: '[[trick]] ที่ได้ไม่ถึงตาม [[contract]] เสีย trick ละ 50 (หรือ 100 ถ้า [[vulnerable]])',
      en: 'A [[trick]] short of what the [[contract]] needs, costing 50 a trick (or 100 if [[vulnerable]]).',
    },
    chapter: 6,
  },
  {
    id: 'vulnerable',
    term: 'vulnerable',
    thai: 'สถานะเสี่ยง (vul)',
    text: {
      th: 'สถานะที่ทำให้โบนัสของ [[game]] และ [[slam]] สูงขึ้น แต่ขาดแล้วเสียแต้มมากขึ้น ในเกมนี้ตั้งได้ในหน้าตั้งค่า',
      en: 'A state that makes the bonuses for [[game]] and [[slam]] bigger, but costs more when you go down. In this game you set it in Settings.',
    },
    chapter: 6,
    aliases: ['vul'],
  },
  {
    id: 'winner',
    term: 'winner',
    thai: 'ใบที่กินแน่',
    text: {
      th: 'ใบที่กิน [[trick]] ได้แน่ทันทีที่เล่น ไม่ต้องเสีย trick ก่อน เช่น A หรือ K เมื่อ A ออกไปแล้ว',
      en: 'A card that wins a [[trick]] the moment it is played, without losing a trick first — an ace, or a king once the ace has gone.',
    },
    chapter: 7,
  },
];

/** The glossary in one language (the terms themselves are English in both). */
export const glossaryIn = perLanguage((lang): readonly GlossaryEntry[] =>
  SOURCE.map((e) => localize(e, lang) as GlossaryEntry),
);

/** The glossary in Thai (the source language). */
export const GLOSSARY = glossaryIn('th');

export function glossaryEntry(id: string, lang: Language = 'th'): GlossaryEntry | undefined {
  return glossaryIn(lang).find((e) => e.id === id);
}
