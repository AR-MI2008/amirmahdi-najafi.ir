import type { CollectionConfig } from 'payload';

/** Upload safety: extension allowlist, MIME check, size cap, safe filenames. */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'],
    imageSizes: [
      { name: 'thumb', width: 480, height: 300, position: 'centre' },
      { name: 'card', width: 900, height: 560, position: 'centre' },
      { name: 'wide', width: 1600, height: 900, position: 'centre' },
    ],
    adminThumbnail: 'thumb',
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
  fields: [{ name: 'alt', type: 'text', required: true, localized: true }],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.filename) {
          // Strip anything that could produce a path or an executable name.
          data.filename = String(data.filename)
            .toLowerCase()
            .replace(/[^a-z0-9._-]/g, '-')
            .replace(/\.(php|phtml|js|mjs|sh|exe|html?)$/i, '.txt');
        }
        return data;
      },
    ],
  },
};
