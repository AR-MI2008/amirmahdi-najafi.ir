'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) ?? 'dark';
    setTheme(current);
  }, []);

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={() => apply(theme === 'dark' ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded border border-line text-muted transition-colors duration-[var(--dur-fast)] hover:border-[color:var(--border-strong)] hover:text-fg"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none">
        <circle cx="10" cy="10" r="4.2" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M10 1.6v2M10 16.4v2M18.4 10h-2M3.6 10h-2M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5 4.1 4.1"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          className="origin-center transition-opacity duration-[var(--dur-normal)]"
          style={{ opacity: theme === 'light' ? 1 : 0.25 }}
        />
      </svg>
    </button>
  );
}
