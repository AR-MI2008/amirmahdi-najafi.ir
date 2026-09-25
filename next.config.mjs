/** @type {import('next').NextConfig} */

/*
 * Strict-Transport-Security is deliberately conservative by default.
 *
 *   Default:  max-age=31536000                (apex only, one year)
 *   Opt-in:   HSTS_INCLUDE_SUBDOMAINS=true    once EVERY subdomain serves HTTPS
 *   Opt-in:   HSTS_PRELOAD=true               only after a successful submission
 *
 * includeSubDomains is not a formatting detail: it makes every current and
 * future subdomain HTTPS-only for the full max-age, in every browser that has
 * already seen the header. If a subdomain is later needed over plain HTTP —
 * a mail interface, a legacy panel, a device on the local network — it will be
 * unreachable and there is no way to undo it remotely. See docs/DEPLOYMENT.md.
 */
function hstsValue() {
  const maxAge = Number(process.env.HSTS_MAX_AGE ?? 31536000);
  const parts = [`max-age=${Number.isFinite(maxAge) && maxAge > 0 ? maxAge : 31536000}`];
  const includeSubdomains = process.env.HSTS_INCLUDE_SUBDOMAINS === 'true';
  if (includeSubdomains) parts.push('includeSubDomains');
  // preload is meaningless — and rejected by the preload list — without
  // includeSubDomains, so it is ignored unless that is on too.
  if (includeSubdomains && process.env.HSTS_PRELOAD === 'true') parts.push('preload');
  return parts.join('; ');
}

// The Content-Security-Policy is set per request in src/proxy.ts because it
// carries a nonce. Static headers that need no nonce live here.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: hstsValue() },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  images: {
    // images.domains was removed in Next 16. remotePatterns is the only
    // supported form, and it is empty because nothing remote is rendered.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 430, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  async redirects() {
    // NOTE: "/" is NOT redirected here. Locale negotiation is owned entirely by
    // src/proxy.ts — two layers fighting over the same URL was a real bug.
    // These entries only rescue pre-launch unlocalised paths.
    return [
      { source: '/projects/:path*', destination: '/en/projects/:path*', permanent: true },
      { source: '/blog/:path*', destination: '/en/blog/:path*', permanent: true },
      { source: '/about', destination: '/en/about', permanent: true },
      { source: '/services', destination: '/en/services', permanent: true },
      { source: '/contact', destination: '/en/contact', permanent: true },
    ];
  },
};

export default nextConfig;
