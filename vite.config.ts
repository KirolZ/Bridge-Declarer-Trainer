import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * The security headers nginx sends in production (`add_header Name "value" always;`), so that
 * `vite preview` — and with it e2e — runs under the same CSP. One source of truth.
 */
function securityHeaders(): Record<string, string> {
  const conf = readFileSync(new URL('./docker/security-headers.conf', import.meta.url), 'utf8');
  const headers: Record<string, string> = {};
  for (const m of conf.matchAll(/^\s*add_header\s+(\S+)\s+"([^"]*)"/gm)) headers[m[1]!] = m[2]!;
  return headers;
}

/** Ships the DDS license next to the app (Apache-2.0 asks for it); the home page links to it. */
function ddsLicense(): Plugin {
  return {
    name: 'dds-license',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'LICENSE-DDS.txt',
        source: readFileSync(new URL('./src/solver/dds/LICENSE-DDS', import.meta.url), 'utf8'),
      });
    },
  };
}

export default defineConfig({
  // Relative asset paths so dist/ works from any sub-path (nginx, GitHub Pages).
  base: './',
  plugins: [react(), tailwindcss(), ddsLicense()],
  worker: { format: 'es' },
  server: { port: 5173 },
  preview: { port: 4173, headers: securityHeaders() },
});
