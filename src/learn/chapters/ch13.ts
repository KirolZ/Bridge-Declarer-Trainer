// Chapter 13 (SPEC §7.7): the hold-up in NT — let the defenders win first to cut their
// communication.

import type { Bilingual, Chapter } from '../types';

export const CH13: Chapter<Bilingual> = {
  n: 13,
  title: { th: 'Hold-up ใน NT', en: 'The hold-up in NT' },
  topic: {
    th: 'ปล่อยให้กินก่อนเพื่อตัดการติดต่อ',
    en: 'Let them win first, to cut the defenders apart',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'ใน [[nt|NT]] ฝั่งป้องกันมักนำจากดอกที่ยาวที่สุดของเขา หวังจะ [[establish]] ดอกนั้นแบบเดียวกับที่คุณทำในบทที่ 11 ถ้าคุณมี A ของดอกนั้นใบเดียวเป็น [[stopper]] คำถามคือ: **ควรใช้ A ตอนไหน?**',
        en: 'In [[nt|NT]] the defenders usually lead their longest suit, hoping to [[establish]] it just as you did in chapter 11. If your only [[stopper]] in that suit is the ace, the question is: **when should you play the ace?**.',
      },
    },
    {
      kind: 'p',
      text: {
        th: '[[hold-up]] คือ**ยังไม่กิน** ปล่อยให้ฝั่งป้องกันกินดอกนั้นไปก่อน 1–2 รอบ จนคนหนึ่งของเขา**หมดดอกนั้น** แล้วค่อยใช้ A ถ้าคนที่หมดได้นำทีหลัง เขาจะไม่มีดอกนั้นนำกลับไปหา[[partner|คู่]]ของเขา',
        en: 'A [[hold-up]] means **not winning yet**: let the defenders win the suit for 1–2 rounds, until one of them **runs out of it**, and only then play the ace. If the player who ran out gets the lead later, they have none of the suit left to lead back to their [[partner]].',
      },
    },
    {
      kind: 'deal',
      hands: { N: 'T5...', E: '863...', S: 'A72...', W: 'KQJ94...' },
      trump: 'NT',
      caption: {
        th: 'West นำ {SK} · East มี {S} 3 ใบ: ปล่อย 2 รอบ แล้วกิน {SA} รอบที่ 3 East จะหมด {S} — ถ้า East ได้นำทีหลัง ก็ไม่มี {S} ส่งไปให้ West กิน',
        en: 'West leads {SK} · East has 3 {S}: hold up twice and win the third round with {SA}, and East has no {S} left — if East gets the lead later, there is no {S} to send back for West to win',
      },
    },
    { kind: 'h', text: { th: 'ปล่อยกี่รอบ', en: 'How many rounds to hold up' } },
    {
      kind: 'p',
      text: {
        th: 'นับว่าฝั่งป้องกันมีดอกนั้นกี่ใบ (13 − ของคุณ) แล้วคิดว่าคู่ของคนที่นำ (มักมีน้อยกว่า) มีกี่ใบ ปล่อยจนเขาหมด:',
        en: "Count how many cards of the suit the defenders hold (13 − yours) and work out how many the leader's partner (usually the shorter one) has. Hold up until that player is out:",
      },
    },
    {
      kind: 'list',
      items: [
        {
          th: 'เขามี 2 ใบ → ปล่อย 1 รอบ แล้วกินรอบที่ 2',
          en: '2 cards → hold up once, win the second round',
        },
        {
          th: 'เขามี 3 ใบ → ปล่อย 2 รอบ แล้วกินรอบที่ 3',
          en: '3 cards → hold up twice, win the third round',
        },
      ],
    },
    { kind: 'h', text: { th: 'ได้ผลเมื่อไหร่', en: 'When it works' } },
    {
      kind: 'p',
      text: {
        th: 'hold-up ได้ผลเมื่อ trick ที่คุณต้องเสียต่อจากนี้ (เช่น ตอนสร้างดอกยาว) **เสียให้คนที่หมดดอกนั้นแล้ว** ตัวอย่าง: ถ้า {DA} อยู่กับ East แล้ว East หมด {S} ก่อน East กิน {DA} ก็ทำอันตรายอะไรไม่ได้ แต่ถ้า {DA} อยู่กับ West ซึ่งมี {S} ยาว hold-up ช่วยไม่ได้',
        en: 'A hold-up works when the tricks you still have to lose (setting up a long suit, say) **go to the player who is out of the suit**. For example, if {DA} is with East and East has run out of {S}, East winning {DA} does no harm; but if {DA} is with West, who has the long {S}, the hold-up cannot help.',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ไม่ต้อง hold-up ทุกครั้ง: ถ้ามี [[winner]] พอทำ contract โดยไม่ต้องเสีย trick ให้ใครเลย ก็กินได้ทันที — hold-up ใช้เมื่อคุณ**ต้อง**ยอมให้ฝั่งป้องกันได้นำอีกครั้ง',
        en: 'You do not have to hold up every time: if you have enough [[winner|winners]] to make the contract without losing a trick, win at once — the hold-up is for when you **must** let the defenders have the lead again.',
      },
    },
  ],
};
