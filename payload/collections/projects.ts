import type { CollectionConfig } from 'payload';

const localized = true;

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'status', 'featured', 'order'] },
  access: {
    // Public reads are limited to published documents; everything else
    // requires an authenticated user. Never trust a client-side role check.
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  versions: { drafts: true },
  fields: [
    { name: 'name', type: 'text', required: true, localized },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'text', required: true, localized },
    { name: 'role', type: 'text', required: true, localized },
    { name: 'year', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: ['live', 'in-development', 'prototype', 'delivered'],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', required: true, defaultValue: 100 },
    { name: 'summary', type: 'textarea', required: true, localized },
    { name: 'intro', type: 'textarea', required: true, localized },
    { name: 'tech', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true, localized },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        { name: 'accent', type: 'text', required: true },
        { name: 'accentSecondary', type: 'text', required: true },
        { name: 'accentLight', type: 'text', required: true },
        { name: 'background', type: 'text', required: true },
        { name: 'surface', type: 'text', required: true },
        {
          name: 'motif',
          type: 'select',
          required: true,
          options: ['radar', 'topology', 'flow', 'trace', 'catalogue'],
        },
        { name: 'glow', type: 'number', required: true, min: 0, max: 1, defaultValue: 0.35 },
      ],
    },
    {
      name: 'capabilities',
      type: 'array',
      fields: [
        {
          name: 'state',
          type: 'select',
          required: true,
          options: ['implemented', 'in-progress', 'planned'],
        },
        { name: 'label', type: 'text', required: true, localized },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'title', type: 'text', required: true, localized },
        {
          name: 'body',
          type: 'array',
          localized,
          fields: [{ name: 'paragraph', type: 'textarea', required: true }],
        },
      ],
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'alt', type: 'text', required: true, localized },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized },
        { name: 'description', type: 'textarea', localized },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
        { name: 'noindex', type: 'checkbox', defaultValue: false },
        {
          name: 'canonicalOverride',
          type: 'text',
          admin: {
            description:
              'Leave empty. The default self-canonical is correct; an override here will break hreflang if misused.',
            position: 'sidebar',
          },
        },
      ],
    },
  ],
};
