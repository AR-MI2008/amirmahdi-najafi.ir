import type { MetadataRoute } from 'next';
import { absolute } from '@/lib/seo';

/**
 * robots.txt is a crawl directive, not access control. Anything that must be
 * protected is protected by authentication — see docs/SECURITY.md.
 * CSS and JS are never disallowed; blocking them breaks rendering for crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/preview', '/*?preview='],
      },
    ],
    sitemap: absolute('/sitemap.xml'),
    host: absolute('/').replace(/\/$/, ''),
  };
}
