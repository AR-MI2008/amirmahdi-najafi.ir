import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Default to node. tests/unit/turnstile-widget.test.tsx opts into jsdom
    // with a `@vitest-environment jsdom` pragma, so only the one file that
    // needs a DOM pays for it.
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
