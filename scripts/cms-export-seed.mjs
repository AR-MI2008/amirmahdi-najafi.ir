// Development-only: validate typed content and export a portable production seed.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, file) => {
  module._compile(
    ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    file,
  );
};
const { posts } = require('../src/content/posts.ts');
const { projects } = require('../src/content/projects.ts');
const { adminPostSchema } = require('../src/lib/admin/post-validation.ts');
const { adminProjectSchema } = require('../src/lib/admin/project-validation.ts');
const entries = [
  ...posts.map((data) => ({ kind: 'post', data: adminPostSchema.parse(data) })),
  ...projects.map((data) => ({
    kind: 'project',
    data: adminProjectSchema.parse({ ...data, draft: false }),
  })),
];
const sha256 = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
writeFileSync(
  resolve('database/seed-content.json'),
  JSON.stringify({ version: 1, sha256, entries }, null, 2) + '\n',
);
process.stdout.write(
  `Validated seed exported: ${posts.length} posts, ${projects.length} projects.\n`,
);
