// Builds the Docker image and packs everything a server needs into one file:
//   bridge-trainer-deploy.tar.gz → bridge-trainer/{images.tar, docker-compose.yml,
//                                   .env.example, install.sh, VERSION}
// On the server: tar -xzf bridge-trainer-deploy.tar.gz && sh bridge-trainer/install.sh
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'bridge-trainer-deploy.tar.gz';
const STAGING = '.release';
const DIR = join(STAGING, 'bridge-trainer');
const IMAGE = 'bridge-trainer-web:latest';

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const capture = (cmd, args) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
// Force LF: these files are read by sh / docker on Linux.
const lf = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// The server only runs the prebuilt image, so drop each service's `build:` block.
function stripBuild(yaml) {
  const out = [];
  let skipIndent = -1;
  for (const line of yaml.split('\n')) {
    const indent = line.search(/\S/);
    if (skipIndent >= 0 && (indent === -1 || indent > skipIndent)) continue;
    skipIndent = -1;
    if (/^\s+build:\s*$/.test(line)) {
      skipIndent = indent;
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

function version() {
  try {
    const sha = capture('git', ['rev-parse', '--short', 'HEAD']);
    const dirty = capture('git', ['status', '--porcelain']) ? '-dirty' : '';
    return `${sha}${dirty} (${new Date().toISOString().slice(0, 10)})`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

console.log('==> docker compose build');
run('docker', ['compose', 'build']);

rmSync(STAGING, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });

console.log('==> docker save');
run('docker', ['save', '-o', join(DIR, 'images.tar'), IMAGE]);

const compose = stripBuild(lf('docker-compose.yml'));
if (/^\s+build:/m.test(compose)) throw new Error('docker-compose.yml: failed to strip build:');
writeFileSync(join(DIR, 'docker-compose.yml'), compose);
writeFileSync(join(DIR, '.env.example'), lf('docker/.env.example'));
writeFileSync(join(DIR, 'install.sh'), lf('docker/install.sh'));
writeFileSync(join(DIR, 'VERSION'), `${version()}\n`);
copyFileSync('src/solver/dds/LICENSE-DDS', join(DIR, 'LICENSE-DDS'));

console.log(`==> ${OUT}`);
// Relative paths only: GNU tar reads "D:..." as a remote host.
run('tar', ['-czf', OUT, '-C', STAGING, 'bridge-trainer']);
rmSync(STAGING, { recursive: true, force: true });

const mb = (statSync(OUT).size / 1024 / 1024).toFixed(0);
console.log(`\nได้ไฟล์ ${OUT} (${mb} MB) — อัปโหลดไฟล์เดียวนี้ไป server แล้ว:`);
console.log(`  tar -xzf ${OUT} && sh bridge-trainer/install.sh`);
