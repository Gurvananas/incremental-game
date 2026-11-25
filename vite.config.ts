import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works on GitHub Pages under /<repo>/ and locally.
  base: './',
  build: {
    target: 'es2022',
  },
  test: {
    include: ['src/**/*.test.ts', 'sim/**/*.test.ts'],
    environment: 'node',
  },
});
