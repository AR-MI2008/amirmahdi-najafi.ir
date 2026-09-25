/**
 * Runs before paint so the theme never flashes. Inline by necessity; it is
 * the only inline script on the site and it executes under the CSP nonce.
 */
export function ThemeScript({ nonce }: { nonce: string }) {
  const code = `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: light)').matches;var t=s||(m?'light':'dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: code }} />;
}
