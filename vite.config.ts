import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

export default defineConfig({
  // Relative base so the build works on GitHub Pages under /<repo>/ and locally.
  base: './',
  define: {
    // The version shown in the game comes from package.json: bump it with each release.
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    target: 'es2022',
  },
  test: {
    include: ['src/**/*.test.ts', 'sim/**/*.test.ts'],
    environment: 'node',
  },
});
