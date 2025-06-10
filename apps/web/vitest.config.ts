import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'src/test/**',
      ],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      '@itzam/server': path.resolve(__dirname, '../../packages/server/src'),
      '@itzam/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@itzam/hono': path.resolve(__dirname, '../../packages/hono/src'),
    },
  },
});