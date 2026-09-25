import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { Projects } from './collections/projects';
import { Posts } from './collections/posts';
import { Media } from './collections/media';
import { SiteSettings } from './collections/site-settings';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: 'users',
    // The admin route is protected by authentication and server-side access
    // control on every collection. It is not hidden — obscurity is not a
    // control, see docs/SECURITY.md.
  },
  collections: [
    {
      slug: 'users',
      auth: {
        tokenExpiration: 60 * 60 * 8,
        maxLoginAttempts: 5,
        lockTime: 15 * 60 * 1000,
        cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
      },
      access: {
        read: ({ req }) => Boolean(req.user),
        create: ({ req }) => Boolean(req.user),
        update: ({ req, id }) => Boolean(req.user && req.user.id === id),
        delete: ({ req }) => Boolean(req.user),
      },
      fields: [{ name: 'name', type: 'text' }],
    },
    Projects,
    Posts,
    Media,
  ],
  globals: [SiteSettings],
  localization: {
    locales: ['en', 'fa'],
    defaultLocale: 'en',
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL ?? '' } }),
  typescript: { outputFile: path.resolve(dirname, '../src/types/payload-types.ts') },
  upload: { limits: { fileSize: 5_000_000 } },
});
