import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,

  {
    name: 'project/rules',
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // The content-source layer is the ONLY module allowed to reach into
      // src/content at runtime. This is what makes the "single swap seam"
      // claim in docs/CMS.md enforceable rather than aspirational.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/content/*', '**/content/projects', '**/content/posts', '**/content/services', '**/content/site'],
              message:
                'Import content through @/lib/content-source. Only content-source.ts may import src/content directly.',
            },
          ],
        },
      ],
    },
  },

  {
    name: 'project/content-source-exemption',
    files: ['src/lib/content-source.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'payload/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
