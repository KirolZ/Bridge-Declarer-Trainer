# Bridge Declarer Trainer

เว็บฝึกเดินไพ่ฝั่ง declarer ใน Contract Bridge แบบเล่นคนเดียว บอทฝั่งป้องกันเล่นแบบ double-dummy
ทุกอย่างรันในเบราว์เซอร์ (solver รันใน Web Worker) ไม่มี backend

> สเปกเต็มอยู่ที่ [`SPEC.md`](SPEC.md) · ลำดับงานที่ [`TASKS.md`](TASKS.md) · การตัดสินใจที่ [`DECISIONS.md`](DECISIONS.md)

## ต้องมี

- Node.js ≥ 20
- pnpm (เปิดผ่าน `corepack enable` แล้วจะได้เวอร์ชันตาม `packageManager` ใน `package.json`)

```sh
pnpm install
```

## Dev

```sh
pnpm dev          # http://localhost:5173
```

หน้า `#/dev/solver` (ไม่มีลิงก์จากแอป) ใช้ลองเรียก solver ผ่าน Web Worker: ddTable มือสุ่ม / 10 มือ,
เล่นทั้งมือแบบ DD, ยกเลิก และดูว่าหน้าจอยังกดได้ (ตัวนับ + เฟรมที่ค้างนานสุด)

## Test

```sh
pnpm test         # Vitest: engine / solver / bot / แบบฝึก
SOLVER_SLOW=1 pnpm test   # เพิ่มตำแหน่ง 5 ใบที่เทียบกับ reference solver เป็น 200 ตำแหน่ง (ช้า)
pnpm test:e2e     # Playwright (build + vite preview ให้เอง; ตั้ง E2E_BASE_URL เพื่อยิงเซิร์ฟเวอร์ที่รันอยู่แล้ว)
pnpm typecheck
pnpm lint
pnpm format:check
```

ครั้งแรกที่รัน e2e บนเครื่องใหม่ อาจต้องติดตั้ง browser ก่อน: `pnpm exec playwright install chromium`

## Bench

```sh
pnpm bench                # วัดความเร็ว solver DDS (p50 / p95) เทียบเป้า SPEC §5.4
pnpm bench --engine ts    # วัดตัว TS (ช้า ใช้กับ --cards 8 เป็นต้น)
pnpm bench --only play    # เล่นทั้งมือ: เก็บ TT ข้ามการเรียก เทียบกับล้างทุกครั้ง
```

## Solver (DDS)

solver ที่ใช้จริงคือ [DDS](https://github.com/dds-bridge/dds) ของ Bo Haglund, Soren Hein และผู้ร่วมพัฒนา
(Apache-2.0, ดู `src/solver/dds/LICENSE-DDS`) compile เป็น WebAssembly แล้ว commit ไว้ที่
`src/solver/dds/dds-wasm.mjs` ส่วน solver ที่เขียนด้วย TS ล้วนเก็บไว้ใช้ตรวจเทียบใน test

build ใหม่เฉพาะตอนจะเปลี่ยนเวอร์ชัน DDS หรือแก้ `native/dds/bridge.cpp` (ต้องมี git + Docker):

```sh
pnpm build:dds
```

## Build

```sh
pnpm build        # ได้ dist/ เป็นไฟล์ static (hash routing + asset แบบ relative — วางไว้ที่ไหนก็ได้)
pnpm preview      # เปิด dist/ ที่ http://localhost:4173 พร้อม security header ชุดเดียวกับ nginx
```

## Deploy

### Docker (เครื่องที่มี source)

```sh
docker compose up -d --build      # http://localhost:8081
docker compose down               # ปิด
```

ต้องมี Docker Engine 24+ (Compose v2) image ชื่อ `bridge-trainer-web:latest` เป็น nginx แบบ non-root เสิร์ฟ `dist/`
ที่พอร์ต 8080 ใน container เปลี่ยนพอร์ตข้างนอกด้วย `APP_PORT` (ใน `.env` หรือ shell เช่น `APP_PORT=9000 docker compose up -d`)
ไม่มี secret หรือข้อมูลที่ต้องเก็บ — สถิติ / ตั้งค่าอยู่ในเบราว์เซอร์ของแต่ละคน

### ไฟล์เดียว (เครื่องที่ไม่มี source / ไม่มี Node)

```sh
pnpm package:images               # build image แล้วได้ bridge-trainer-deploy.tar.gz (~20 MB)
```

อัปโหลดไฟล์นี้ไปเครื่องปลายทาง (มีแค่ Docker ก็พอ) แล้ว:

```sh
tar -xzf bridge-trainer-deploy.tar.gz && sh bridge-trainer/install.sh
```

`install.sh` โหลด image, สร้าง `.env` (มีแค่ `APP_PORT=8081`) ถ้ายังไม่มี แล้ว `docker compose up -d --wait`
อัปเดตเวอร์ชันใหม่ก็สั่งแบบเดิม (project name ตายตัว `bridge-trainer` จึงแทนที่ container เดิมไม่ว่าแตกไว้โฟลเดอร์ไหน)
ถ้าจะลองติดตั้งคู่กับตัวที่รันอยู่ ให้แยก project และพอร์ต:
`COMPOSE_PROJECT_NAME=bridge-trainer-test APP_PORT=18081 sh bridge-trainer/install.sh`

### GitHub Pages (หรือ static host อื่น)

`dist/` ใช้ได้เลยเพราะเป็น hash routing และ path แบบ relative เช่น push `dist/` ขึ้น branch `gh-pages`:

```sh
pnpm build && pnpm dlx gh-pages -d dist
```

แล้วตั้ง Settings → Pages → Deploy from a branch → `gh-pages` / root
(GitHub Pages ตั้ง header เองไม่ได้ จึงไม่มี CSP แบบใน Docker — แอปทำงานเหมือนเดิม)

### Cloudflare Pages

ต่างจาก GitHub Pages ตรงที่ได้ security header ครบแบบ Docker เพราะ `pnpm build` สร้าง `dist/_headers`
จาก `docker/security-headers.conf` ให้เอง (Cloudflare อ่านไฟล์นี้แล้วส่ง header ตามนั้น) ไม่ต้องตั้งอะไรเพิ่ม

**อัปโหลดจากเครื่อง** ด้วย Wrangler:

```sh
pnpm dlx wrangler login                                   # ครั้งแรกครั้งเดียว — เปิด browser ให้ login
pnpm dlx wrangler pages project create bridge-trainer --production-branch main   # ครั้งแรกครั้งเดียว
pnpm build && pnpm dlx wrangler pages deploy dist --project-name bridge-trainer
```

ได้ `https://bridge-trainer.pages.dev` (ถ้าชื่อซ้ำกับคนอื่นให้เปลี่ยนชื่อ project) ครั้งต่อไปสั่งแค่บรรทัดสุดท้าย

**หรือต่อกับ GitHub** ให้ deploy เองทุกครั้งที่ push: dashboard → Workers & Pages → Create → Pages → Connect to Git
→ เลือก repo แล้วตั้ง

| ช่อง                   | ค่า                                               |
| ---------------------- | ------------------------------------------------- |
| Framework preset       | None                                              |
| Build command          | `pnpm build`                                      |
| Build output directory | `dist`                                            |
| Production branch      | `main`                                            |
| Environment variables  | `NODE_VERSION` = `20`, `PNPM_VERSION` = `12.15.0` |

(DDS wasm อยู่ใน git แล้ว ที่ `src/solver/dds/dds-wasm.mjs` เครื่อง build ของ Cloudflare จึงไม่ต้องมี Emscripten)

ตรวจ header หลัง deploy: `curl -sI https://bridge-trainer.pages.dev/ | grep -i content-security`

### ให้คนใน LAN เข้า

Docker เปิดพอร์ตบนทุก network interface อยู่แล้ว เครื่องอื่นในวงเดียวกันเข้าที่ `http://<IP ของเครื่องนี้>:8081`
(ดู IP ด้วย `ipconfig` บน Windows หรือ `ip addr` บน Linux) ถ้าเข้าไม่ได้ให้เปิดพอร์ตใน firewall เช่น Windows:

```powershell
New-NetFirewallRule -DisplayName "Bridge Trainer" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

ตอน dev ใช้ `pnpm dev --host` หรือ `pnpm preview --host` ให้ Vite รับจากเครื่องอื่น

### Security headers

`docker/security-headers.conf` เป็นที่เดียวที่กำหนด header (nginx ใช้, `vite preview` อ่านไฟล์เดียวกัน
e2e จึงเจอ CSP ที่ผิดก่อน deploy, และ `pnpm build` แปลงเป็น `dist/_headers` ให้ Cloudflare Pages): CSP ให้โหลดทุกอย่างจาก origin เดียวกัน, `worker-src 'self'` สำหรับ solver worker,
`'wasm-unsafe-eval'` ให้ DDS compile WebAssembly ได้, ห้ามฝังใน frame, ไม่เรียก network ภายนอก

e2e กับ container: `E2E_BASE_URL=http://localhost:8081 pnpm test:e2e`

## โครงสร้าง

| โฟลเดอร์     | หน้าที่                                                     |
| ------------ | ----------------------------------------------------------- |
| `src/engine` | กติกา bridge ล้วน (pure TS)                                 |
| `src/solver` | double-dummy solver (DDS wasm + TS) + reference brute-force |
| `native/dds` | wrapper C++ ของ DDS สำหรับ build wasm                       |
| `src/bot`    | เลือกใบของบอทฝั่งป้องกัน                                    |
| `src/worker` | Web Worker ห่อ solver + `SolverClient` (Promise / ยกเลิก)   |
| `src/game`   | Zustand store ของมือที่กำลังเล่น                            |
| `src/learn`  | เนื้อหาคู่มือ + ข้อมูลแบบฝึก                                |
| `src/ui`     | React components + pages                                    |
| `bench/`     | สคริปต์วัดความเร็ว solver                                   |
| `e2e/`       | Playwright                                                  |
| `docker/`    | nginx config, security headers, `install.sh`                |
| `scripts/`   | build DDS wasm, แพ็ก deploy ไฟล์เดียว                       |

`engine` / `solver` / `bot` ห้ามใช้ React, DOM, Zustand หรือ import `ui/` `game/` `worker/`
บังคับสองชั้น: ESLint (`no-restricted-imports`, `no-restricted-globals`, ห้าม `Math.random`)
และ `tsconfig.core.json` ที่ type-check โฟลเดอร์เหล่านี้โดยไม่มี DOM types
