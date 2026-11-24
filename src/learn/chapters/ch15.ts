// Chapter 15 (SPEC §7.7, M32): reading the auction — what calls show, who declares, counting the
// points and cards out of sight, and using it to place the missing cards. In the technique part,
// read after chapter 13 (its number stays 15: progress and links refer to it).

import type { Bilingual, Chapter } from '../types';

export const CH15: Chapter<Bilingual> = {
  n: 15,
  title: { th: 'อ่านการประมูล', en: 'Reading the auction' },
  topic: {
    th: 'call บอกแต้มและดอก — นับว่าไพ่ที่มองไม่เห็นอยู่ที่ใคร',
    en: 'What calls show, and where the cards you cannot see are',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'ก่อนเล่นไพ่ ทั้ง 4 คนผลัดกัน[[call|ประมูล]]ใน[[auction|การประมูล]] และทุก call บอกอะไรบางอย่างเกี่ยวกับมือของคนนั้น เช่นมีกี่ [[hcp|HCP]] (A = 4, K = 3, Q = 2, J = 1 ทั้งสำรับมี 40) และดอกไหนยาว เกมนี้ประมูลทั้ง 4 ที่นั่งด้วยระบบ [[sayc|SAYC]] ฝั่งป้องกันก็ใช้ระบบเดียวกัน คุณจึงอ่านการประมูลของเขาแล้วเดาได้ว่าไพ่ที่มองไม่เห็นอยู่ที่ใคร',
        en: 'Before any card is played, the 4 players take turns to [[call]] in the [[auction]], and every call tells something about the hand: how many [[hcp|HCP]] it holds (A = 4, K = 3, Q = 2, J = 1, 40 in the pack) and which suits are long. The game bids all 4 seats with the [[sayc|SAYC]] system, the defenders too, so their auction tells you where the cards you cannot see probably are.',
      },
    },
    { kind: 'h', text: { th: 'ใครเป็น declarer', en: 'Who is declarer' } },
    {
      kind: 'p',
      text: {
        th: 'การประมูลจบเมื่อมีคน [[pass|Pass]] ต่อกัน 3 คน และ call สุดท้ายที่เป็นตัวเลข + ดอกคือ [[contract]] แต่ [[declarer]] **ไม่ใช่**คนที่ประมูลครั้งสุดท้ายเสมอไป: declarer คือ**คนแรกของฝั่งนั้นที่เอ่ยดอกของ contract** (หรือ NT) ส่วนคู่ของเขาเป็น [[dummy]]',
        en: 'The auction ends when 3 players in a row [[pass]], and the last number + suit is the [[contract]]. But [[declarer]] is **not** always the player who bid last: declarer is **the first player of that side to name the suit of the contract** (or NT), and their partner is [[dummy]].',
      },
    },
    {
      kind: 'auction',
      dealer: 'S',
      calls: '1H-P-4H-P-P-P',
      caption: {
        th: 'North ประมูล 4{H} เป็นคนสุดท้าย แต่ South เอ่ย {H} ก่อน South จึงเป็น declarer และ North เป็น dummy',
        en: 'North bid 4{H} last, but South named {H} first, so South is declarer and North is dummy.',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ในเกมนี้คุณเป็น South และเป็น declarer เสมอ ถ้าการประมูลได้ North เป็น declarer เกมจะหมุนโต๊ะครึ่งรอบก่อนให้คุณเล่น',
        en: 'In this game you are South and always declarer. When the auction makes North declarer, the game turns the table round before you play.',
      },
    },
    { kind: 'h', text: { th: 'ช่วงแต้มที่ควรจำ', en: 'Ranges worth knowing' } },
    {
      kind: 'list',
      items: [
        {
          th: '[[opening|เปิดประมูล]]ระดับ 1: 12–21 HCP (1{H} / 1{S} มีดอกนั้น 5 ใบขึ้นไป)',
          en: 'An [[opening|opening bid]] at the 1 level: 12–21 HCP (1{H} / 1{S} with 5 or more cards in the suit)',
        },
        {
          th: 'เปิด 1NT: 15–17 HCP มือ [[balanced]] (ทุกดอกมีอย่างน้อย 2 ใบ) · เปิด 2{C}: 22 HCP ขึ้นไป (ไม่ได้บอกว่ามี {C})',
          en: 'A 1NT opening: 15–17 HCP, [[balanced]] (at least 2 cards in every suit) · a 2{C} opening: 22 HCP or more (it says nothing about {C})',
        },
        {
          th: '[[weak-two|weak two]] (2{D} 2{H} 2{S}) และ [[preempt]] ระดับ 3: แค่ 5–10 HCP แต่ดอกยาว 6 ใบ / 7 ใบขึ้นไป',
          en: 'A [[weak-two|weak two]] (2{D} 2{H} 2{S}) and a [[preempt]] at the 3 level: only 5–10 HCP but a long suit of 6 / 7 or more cards',
        },
        {
          th: '[[overcall]] ระดับ 1: 8–16 HCP กับดอกนั้น 5 ใบขึ้นไป · X หลังฝั่งตรงข้ามเปิดคือ [[takeout-double|takeout double]]: 12 HCP ขึ้นไป สั้นในดอกที่เขาเปิด',
          en: 'An [[overcall]] at the 1 level: 8–16 HCP with 5 or more cards in the suit · X after the other side opens is a [[takeout-double|takeout double]]: 12 or more HCP, short in their suit',
        },
        {
          th: 'Pass ก็บอกอะไรได้: คนที่ Pass ตอนยังไม่มีใครเปิด มีไม่เกิน 11 HCP และคนที่ Pass หลังคู่ของเขาเปิด 1 ในดอก (โดยไม่มีใครแทรก) มีไม่เกิน 5 HCP',
          en: "A pass tells you something too: a player who passes before anyone has opened holds at most 11 HCP, and one who passes after partner's opening of 1 in a suit (with nobody bidding in between) holds at most 5.",
        },
      ],
    },
    {
      kind: 'p',
      text: {
        th: 'ไม่ต้องจำทั้งหมด: แตะ call ในตารางประมูล แล้วเกมจะบอกความหมายให้ (ศัพท์อื่น ๆ เช่น [[raise]], [[rebid]], [[reverse]], [[jump-shift|jump shift]], [[two-over-one|2/1]], [[stayman|Stayman]], [[transfer]] และ [[blackwood|Blackwood]] มีในอภิธานศัพท์) ระบบทั้งหมดพร้อมตัวอย่างอยู่ในหน้า **ระบบประมูลของเกม** ท้ายรายการคู่มือ',
        en: "No need to learn it all: tap a call in the auction table and the game tells you what it means. (Other names, such as a [[raise]], a [[rebid]], a [[reverse]], a [[jump-shift|jump shift]], a [[two-over-one|2/1]], [[stayman|Stayman]], a [[transfer]] and [[blackwood|Blackwood]], are in the glossary.) The whole system, with examples, is on the page **The game's bidding system** at the end of the guide's list.",
      },
    },
    { kind: 'h', text: { th: 'นับสิ่งที่เหลือ', en: 'Count what is left' } },
    {
      kind: 'p',
      text: {
        th: 'เมื่อ dummy หงาย คุณเห็น 2 มือ: นับ HCP ของ South + North แล้วลบจาก 40 ที่เหลือคือแต้มของ West + East รวมกัน ถ้าคนหนึ่งบอกช่วงแต้มไว้ในการประมูล ก็รู้ว่าอีกคนมีได้เท่าไหร่',
        en: 'Once dummy is face up you can see 2 hands: add up the HCP of South + North and take it from 40. What is left is what West and East hold between them. If one of them showed a range in the auction, you know what the other can hold.',
      },
    },
    {
      kind: 'auction',
      dealer: 'E',
      calls: '1H-1S-P-2S-P-P-P',
      caption: {
        th: 'ถ้า South + North มี 22 HCP ที่เหลือ 18 อยู่ที่ West + East · East เปิด 1{H} = อย่างน้อย 12 · West จึงมีได้ไม่เกิน 18 − 12 = 6',
        en: 'If South + North hold 22 HCP, the other 18 are with West + East · East opened 1{H}: at least 12 · so West holds at most 18 − 12 = 6.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ความยาวดอกก็นับแบบเดียวกัน: แต่ละดอกมี 13 ใบ ถ้า East บอกว่ามี {H} 5 ใบขึ้นไป และคุณกับ dummy มี {H} รวม 6 ใบ ที่เหลือ 7 ใบ West จึงมี {H} ได้ไม่เกิน 2 ใบ — เล่น {H} รอบที่ 3 เมื่อไหร่ West อาจ[[ruff|ตัด]]ได้',
        en: 'Suit lengths work the same way: each suit has 13 cards. If East showed 5 or more {H} and you and dummy hold 6 {H} between you, 7 are left, so West holds at most 2 {H} — when you play a third round of {H}, West may [[ruff]].',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ในตารางการประมูลมี**ฝั่งป้องกันน่าจะมี** ที่นับแบบนี้ให้แล้ว ลองนับเองก่อน แล้วค่อยดูว่าตรงไหม',
        en: 'In the auction table, **The defenders probably hold** does this count for you. Try it yourself first, then check.',
      },
    },
    { kind: 'h', text: { th: 'ใช้ตอนเล่น', en: 'Using it in play' } },
    {
      kind: 'p',
      text: {
        th: 'การประมูลช่วยมากที่สุดเมื่อต้องเดาว่าไพ่ใบหนึ่งอยู่ที่ใคร เช่น [[finesse]] ที่เล่นได้สองทาง: ถ้าคนหนึ่งบอกว่ามีแต้มเกือบทั้งหมดที่เหลือ ไพ่ใหญ่ที่หายไปก็น่าจะอยู่ที่เขา ส่วนคนที่ Pass ตลอดก็มักไม่มี',
        en: 'The auction helps most when you must guess who holds a card, such as a [[finesse]] you can take either way: if one player showed nearly all the points that are left, the missing high card is probably theirs, and a player who passed throughout usually does not have it.',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'บอทฝั่งป้องกันเล่นแบบเห็นไพ่ทุกใบ ([[double-dummy]]) ไม่ได้อาศัยการประมูล แต่ไพ่ในมือเขาตรงกับที่ประมูลไว้เสมอ และเกมเลือกเฉพาะมือที่ contract ทำได้ถ้าเล่นถูก ส่วนในเกมจริง finesse ได้แค่ราวครึ่งหนึ่ง และมือที่ทำไม่ได้ก็มี',
        en: 'The defending bots play as if they could see every card ([[double-dummy]]) and do not use the auction, but their cards always match what they bid, and the game only keeps hands where the contract makes with the right play. In a real game a finesse works only about half the time, and some contracts cannot be made.',
      },
    },
  ],
};
