import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so dist/ works from any sub-path (nginx, GitHub Pages).
  base: './',
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  server: { port: 5173 },
  preview: { port: 4173 },
});
