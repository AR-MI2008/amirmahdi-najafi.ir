import type { CollectionConfig } from 'payload';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'publishedAt', '_status'] },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  // Drafts are excluded from public read access above, which is what keeps
  // them out of the sitemap and out of the index.
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea', required: true, localized: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: ['development', 'ai', 'security', 'engineering', 'projects', 'behind-the-build'],
    },
    { name: 'tags', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    { name: 'publishedAt', type: 'date', required: true },
    { name: 'updatedAtOverride', type: 'date' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText', required: true, localized: true },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
        { name: 'noindex', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
};
