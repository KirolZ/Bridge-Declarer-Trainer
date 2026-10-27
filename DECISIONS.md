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
