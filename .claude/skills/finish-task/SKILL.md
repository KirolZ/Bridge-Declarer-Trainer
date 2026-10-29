---
name: finish-task
description: Close a piece of work in the Bridge Trainer repo the same way every milestone was closed - verify every sub-task and the "done when" line, run format/lint/typecheck/unit/e2e checks, check UI on desktop and 360 px, write the dated status note in TASKS.md, record decisions in DECISIONS.md, update SPEC, and make one "Mxx:" commit. Use whenever a task is about to be reported as done.
---

# ปิดงาน = ตรวจแบบจบ milestone (ตาม `.claude/CLAUDE.md` ข้อ 4)

ห้ามรายงานว่า "เสร็จ" จนกว่าจะผ่านครบทุกข้อ ถ้าข้อไหนไม่ผ่านให้แก้ หรือบอกผู้ใช้ตรง ๆ ว่าติดอะไร

## 1. ตรวจ task

- เปิด milestone ใน `TASKS.md` — ข้อย่อยทุกข้อต้องทำแล้วจริง ติ๊ก `[x]` เฉพาะข้อที่ผ่าน
- อ่าน **เสร็จเมื่อ** แล้วตรวจทีละเงื่อนไข (มี test หรือภาพหน้าจอยืนยัน)

## 2. รัน check ทั้งหมด (ผ่าน Bash)

```bash
cd /d/Hobby/Bridge && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
cd /d/Hobby/Bridge && pnpm test:e2e      # desktop + มือถือ (Pixel 7), timeout ยาว
```

- แตะ `src/solver/` → `pnpm bench` แล้วจดผล p50 / p95 ใน DECISIONS
- จดตัวเลขที่ได้ (จำนวน test ที่ผ่าน) ไว้ใช้ในบันทึกสถานะ
- test fail → แก้ ห้ามข้ามหรือปิด test

## 3. ตรวจหน้าจอ (งานที่แตะ UI)

- เขียน spec ชั่วคราวใน `e2e/` ที่ถ่ายภาพลง scratchpad ทั้ง 1280×800 และ 360×740 แล้วเปิดดูภาพจริง
  (ลบ spec ชั่วคราวทิ้งหลังใช้)
- ดูว่า: ไม่มี scroll แนวนอน, ไม่มีอะไรบังไพ่/ข้อความ, ปุ่มกดด้วยนิ้วได้ (สูง ≈ 40 px), ไม่มี error ใน console

## 4. เอกสาร

- `SPEC.md` ตรงกับพฤติกรรมใหม่ (ตั้งค่า §7.6, UI / คีย์บอร์ด §8, testing §10 ถ้าเปลี่ยน)
- หน้าจอ/ปุ่มเปลี่ยน → บท 14 ของคู่มือ (`src/learn/chapters/ch14.ts`) ยังถูก (ห้ามใช้ศัพท์อังกฤษที่ไม่อยู่ในอภิธานศัพท์)
- `DECISIONS.md`: หัวข้อ `## Mxx — <ชื่อ> (YYYY-MM-DD)` บอกการตัดสินใจ + เหตุผล + ทางที่ลองแล้วไม่ได้ผล
- README ถ้าวิธีรัน / deploy เปลี่ยน

## 5. บันทึกสถานะใน `TASKS.md` (ต่อท้าย milestone — ห้ามแก้บันทึกเก่า)

```markdown
> **สถานะ (YYYY-MM-DD):** Mxx เสร็จ — <ทำอะไร> ไฟล์หลัก `…`, `…` (ดู DECISIONS Mxx)
> test: <test ที่เพิ่ม> — `pnpm test` N ข้อ, `pnpm test:e2e` N ข้อผ่าน, lint / typecheck / format ผ่าน
>
> **ส่งต่อ:** <เรื่องค้าง / ข้อจำกัด / สิ่งที่คนต่อไปต้องรู้> (ถ้าไม่มีให้ตัดบรรทัดนี้)
```

## 6. Commit

- commit เดียวต่อ milestone บน branch ของงาน (รวมโค้ด + test + TASKS + DECISIONS + SPEC)
- ข้อความภาษาอังกฤษแบบเดิม: `Mxx: <topic> — <short summary>` ตามด้วย body สั้น ๆ และบรรทัด attribution ที่ระบบกำหนด
- ตรวจ `git status` ว่าไม่มีไฟล์ชั่วคราว (ภาพหน้าจอ, spec ชั่วคราว) ติดไปด้วย
- **ไม่ push / merge / เปิด PR / deploy** จนกว่าผู้ใช้สั่ง

## 7. รายงานผู้ใช้ (ภาษาไทย)

ผลลัพธ์ก่อน → สิ่งที่ตรวจ (ตัวเลข test, ภาพที่ดู) → เรื่องที่ผู้ใช้ต้องตัดสินใจ (เช่น merge / ค่าเริ่มต้น)
