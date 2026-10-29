---
name: start-task
description: Start any new piece of work in the Bridge Trainer repo (feature, fix, or tweak) the way the project rules require - branch from main, open a new milestone in TASKS.md with sub-tasks and a "done when" line, and read the relevant SPEC / DECISIONS sections before writing code. Use at the start of every request that changes the repo.
---

# เริ่มงานใหม่ (ตาม `.claude/CLAUDE.md` ข้อ 1–2)

ทำตามลำดับ ก่อนแก้โค้ดบรรทัดแรก:

1. **ตรวจสถานะ git** — `git status` ต้องสะอาด (ถ้ามีงานค้าง ถามผู้ใช้ก่อนว่าจะทำอย่างไร)
   แล้วแตก branch จาก `main`: `feature/<slug>`, `fix/<slug>` หรือ `chore/<slug>`
   (ถ้าผู้ใช้อยู่บน branch ของงานนี้อยู่แล้ว ใช้ branch นั้นต่อ)

2. **หาเลข milestone ถัดไป** — ดูหัวข้อ `## Mxx` ตัวสุดท้ายใน `TASKS.md` แล้วบวก 1

3. **ลง task ใน `TASKS.md`** (ต่อท้ายไฟล์) รูปแบบ:

   ```markdown
   ## M14 — <ชื่องานสั้น ๆ>

   > ที่มา (YYYY-MM-DD): <ใครขอ / ปัญหาที่ผู้ใช้เจอ / เป้าหมาย> · branch `feature/<slug>`

   - [ ] **14.1** <ข้อย่อยที่ตรวจได้ — อ้าง SPEC § ถ้ามี>
   - [ ] **14.2** test: <unit / e2e ที่ต้องเพิ่ม>
   - [ ] **14.3** เอกสาร: SPEC § ที่ต้องแก้, บท 14 ของคู่มือถ้าหน้าจอเปลี่ยน

   **เสร็จเมื่อ:** <เงื่อนไขที่ตรวจได้จริง เช่น e2e X ผ่านทั้ง desktop + มือถือ, ภาพ 360 px ไม่มี scroll แนวนอน>
   ```

   - แตกงานให้แต่ละข้อเล็กพอจะติ๊กได้ในการทำงานรอบเดียว
   - ข้อ test และข้อเอกสารต้องมีเสมอ (ถ้าไม่ต้องแก้เอกสารจริง ๆ ให้เขียนว่าตรวจแล้วไม่ต้องแก้ตอนปิดงาน)

4. **อ่านบริบท** — `SPEC.md` ส่วนที่เกี่ยวข้อง และหัวข้อใน `DECISIONS.md` ของ milestone ที่เคยแตะโค้ดส่วนนี้
   (ค้นชื่อไฟล์หรือชื่อฟีเจอร์) อย่าตัดสินใจขัดกับของเดิมโดยไม่จดเหตุผล

5. **บอกผู้ใช้สั้น ๆ** ว่าเปิด milestone อะไร branch อะไร และจะทำอะไรบ้าง แล้วเริ่มงาน
   ถ้ามีทางเลือกที่ผู้ใช้ควรตัดสินเอง (ค่าเริ่มต้น พฤติกรรมที่เห็นได้) ให้ถามตอนนี้
