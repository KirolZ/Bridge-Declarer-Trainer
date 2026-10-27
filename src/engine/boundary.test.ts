import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// M2 done-condition: engine code imports nothing from outside src/engine.
describe('engine boundary', () => {
  const dir = fileURLToPath(new URL('.', import.meta.url));
  const sources = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  it.each(sources)('%s only imports sibling engine modules', (file) => {
    const text = readFileSync(join(dir, file), 'utf8');
    const specifiers = [...text.matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map((m) => m[1]);
    for (const spec of specifiers) expect(spec).toMatch(/^\.\/[\w-]+$/);
  });
});
