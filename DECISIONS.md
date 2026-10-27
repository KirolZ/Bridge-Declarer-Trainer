# Decisions

บันทึกการตัดสินใจที่สเปกไม่ได้ระบุชัด หรือที่ต่างจากสเปก (ใหม่สุดอยู่ล่างสุด)

## M1 — Scaffold (2026-10-27)

- **pnpm 12.15.0** — pin ตามเวอร์ชันที่ติดตั้งในเครื่อง pnpm ≥ 10 บล็อก build script ของ dependency
  เป็นค่าเริ่มต้น จึงอนุญาตเฉพาะ `esbuild` ไว้ใน `pnpm-workspace.yaml` (`allowBuilds`)
  ไฟล์นี้มีไว้เก็บ config ของ pnpm เท่านั้น โปรเจกต์ยังเป็น package เดียว ไม่ใช่ monorepo
- **เวอร์ชัน dependency** — ใช้ชุดเดียวกับ Blackjack (Vite 5.4, Vitest 2.1, TS 5.6, Tailwind 4.3,
  Playwright 1.64.1) เพื่อให้ใช้ Playwright browser ที่ติดตั้งไว้แล้วร่วมกันได้ และลดความเสี่ยงเรื่องความเข้ากัน
- **Hash router** — ใช้ `createHashRouter` ของ `react-router-dom` v7 แทนการเขียนเอง
- **บังคับขอบเขต engine/solver/bot สองชั้น** — นอกจาก ESLint ตามสเปกแล้ว เพิ่ม `tsconfig.core.json`
  ที่ type-check โฟลเดอร์เหล่านี้ด้วย `lib: ES2022` ล้วน (ไม่มี DOM, ไม่มี @types/node)
  ใช้ DOM API เมื่อไหร่ `pnpm typecheck` จะพังทันที — ใน M2 การเรียก `crypto.getRandomValues`
  จึงต้องเข้าผ่าน `globalThis` พร้อม type ที่ประกาศเอง
- **ห้าม `Math.random` ใน `engine/` ด้วย** (สเปกกำหนดแค่ solver/bot) เพราะสเปก §4.1 ให้การแจกใช้ crypto
  หรือ RNG แบบ seed อยู่แล้ว
- **Bench รันด้วย `tsx`** — Node รัน TS ที่ import แบบไม่มีนามสกุลไฟล์เองไม่ได้
- **e2e** — ค่าเริ่มต้นให้ Playwright `build` + `vite preview` (พอร์ต 4173) เอง ถ้าตั้ง `E2E_BASE_URL`
  จะยิงเซิร์ฟเวอร์ที่รันอยู่แล้วแทน (ใช้กับ Docker ใน M13) รันทั้ง desktop และมือถือ (Pixel 7)
- **Vite `base: './'`** — asset เป็น path แบบ relative เพื่อให้ `dist/` วางไว้ใต้ sub-path ไหนก็ได้
  (เช่น GitHub Pages)
- `SPEC.md` / `TASKS.md` ไม่ผ่าน Prettier เพื่อไม่ให้ format เอกสารต้นฉบับใหม่

## M2 — Engine (2026-10-27)

- **โมดูล** — `card` (type + helper), `rng`, `deal`, `encode` (รหัสมือ 18 ตัว, PBN, รหัส contract), `play`,
  `scoring` รวมไว้ที่ `src/engine/index.ts` ลบ placeholder `suits.ts` จาก M1 ทิ้ง
- **`Rng` = ฟังก์ชันคืนเลขทศนิยม [0, 1)** ทั้ง `mulberry32(seed)` และ `cryptoRng()` (crypto เติม buffer
  ทีละ 64 ค่า) `dealRandom()` ใช้ crypto ถ้าไม่ส่ง RNG มา ส่วน `withStrongerSouth` แยกเป็นฟังก์ชันของตัวเอง
  (§7.1 ข้อ 1) ให้ M6 เรียกต่อเอง
- **`PlayState.leader` (optional)** — คนนำ trick แรก ค่าเริ่มต้นคือคนทางซ้ายของ declarer (West)
  ใช้กับแบบฝึกที่เริ่มจากคนนำอื่น นอกนั้นตรงตาม §4.2
- **`toPlay` คืน `null` เมื่อจบมือ** และ `currentTrick` คืน `[]` ทันทีที่ trick ครบ 4 ใบ
  (UI ใช้ `completedTricks().at(-1)` แสดง trick ที่เพิ่งจบ)
- **`illegalReason(state, card)`** — คืนเหตุผลที่ลงใบนั้นไม่ได้ (`must-follow-suit` + ดอก, `not-in-hand`,
  `hand-complete`) เตรียมไว้ให้โหมดมือใหม่ (§7.8) บอกเหตุผลได้โดยไม่ต้องเขียนกติกาซ้ำใน UI
- **รหัสมือไพ่ decode แบบเข้มงวด** — ต้องยาว 18 ตัวพอดี, ไม่มี `=`, และ 4 bit ท้ายต้องเป็น 0
  จึงมีรหัสเดียวต่อมือ (ลิงก์เทียบกันตรง ๆ ได้)
- **PBN** — รับเฉพาะ `T` แทน 10 (ไม่รับ `10`) และตัวพิมพ์ใหญ่เท่านั้น นอกจากมือเดี่ยวแล้วมี
  `parseDealPbn` / `formatDealPbn` แบบ `N:<N> <E> <S> <W>` (ไล่ตามเข็มนาฬิกาจากทิศแรก) ไว้เขียน test / แบบฝึก
- **รหัส contract ใน URL** — `encodeContract` / `decodeContract` (`4S`, `3N`) อยู่ใน engine ด้วย
- **Scoring** — `scoreBreakdown` คืนแต้มแยกส่วน (contract, overtrick, game/partscore, slam, undertrick)
  ไว้ใช้กับคำอธิบายแต้มเต็มในโหมดมือใหม่ `score` คืนแค่ยอดรวม
- **ชื่อดอกภาษาไทย** — `SUIT_INFO` มีทั้งชื่ออังกฤษและไทย (โพดำ / โพแดง / ข้าวหลามตัด / ดอกจิก)
- **Test ขอบเขต engine** — `boundary.test.ts` สแกนว่าไฟล์ใน `src/engine` import ได้แค่ `./...`
