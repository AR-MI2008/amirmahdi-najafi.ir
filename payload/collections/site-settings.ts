import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true, update: ({ req }) => Boolean(req.user) },
  fields: [
    { name: 'fullName', type: 'text', required: true, localized: true },
    { name: 'headline', type: 'text', required: true, localized: true },
    { name: 'bio', type: 'textarea', required: true, localized: true },
    { name: 'email', type: 'email', required: true },
    { name: 'telegram', type: 'text' },
    { name: 'github', type: 'text' },
    // Empty means the icon is not rendered. Never render a dead social link.
    { name: 'linkedin', type: 'text' },
    { name: 'instagram', type: 'text' },
    { name: 'defaultOgImage', type: 'upload', relationTo: 'media' },
    { name: 'siteAccent', type: 'text', defaultValue: '#42D9FF' },
    {
      name: 'availability',
      type: 'group',
      fields: [
        { name: 'open', type: 'checkbox', defaultValue: false },
        { name: 'label', type: 'text', localized: true },
      ],
    },
    {
      name: 'metrics',
      type: 'array',
      maxRows: 5,
      admin: {
        description:
          'Verified numbers only. Anything you cannot evidence should be deleted, not estimated.',
      },
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'note', type: 'text', localized: true },
      ],
    },
  ],
};
