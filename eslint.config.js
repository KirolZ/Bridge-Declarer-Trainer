import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Folders that hold pure bridge logic: must run in Node (tests) and in the Web Worker.
const CORE = ['src/engine/**/*.ts', 'src/solver/**/*.ts', 'src/bot/**/*.ts'];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.release/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['bench/**/*.ts', 'e2e/**/*.ts', 'scripts/**/*.mjs', '*.{js,ts}', 'src/**/*.test.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: CORE,
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML is forbidden.',
        },
      ],
    },
  },
  {
    // SPEC §3: engine / solver / bot stay framework- and DOM-free.
    files: CORE,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'engine/solver/bot must not depend on React (SPEC §3).' },
            { name: 'react-dom', message: 'engine/solver/bot must not depend on React (SPEC §3).' },
            { name: 'zustand', message: 'engine/solver/bot must not depend on Zustand (SPEC §3).' },
            { name: 'framer-motion', message: 'engine/solver/bot must not depend on UI libs.' },
          ],
          patterns: [
            {
              group: ['react-dom/*', 'zustand/*', 'react-router-dom', 'react-router-dom/*'],
              message: 'engine/solver/bot must not depend on UI libs (SPEC §3).',
            },
            {
              group: ['**/ui', '**/ui/**', '**/game', '**/game/**', '**/worker', '**/worker/**'],
              message: 'engine/solver/bot must not import ui/, game/ or worker/ (SPEC §3).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'self'].map(
          (name) => ({ name, message: 'No DOM / browser globals in engine/solver/bot (SPEC §3).' }),
        ),
      ],
    },
  },
  {
    // SPEC §5.2 / §6: solver and bot must be deterministic; engine deals with crypto RNG.
    files: CORE,
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Math.random is forbidden here: use the seeded RNG or crypto (SPEC §4.1, §5.2).',
        },
      ],
    },
  },
  prettier,
);
