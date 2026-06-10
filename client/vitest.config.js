import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'src/__tests__/**/*.test.{js,jsx}',
      '../tests/client/**/*.test.{js,jsx}',
    ],
    setupFiles: ['./vitest.setup.js'],
    css: true,
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
});
