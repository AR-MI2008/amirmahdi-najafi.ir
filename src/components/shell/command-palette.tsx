'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { switchLocalePath, type Locale } from '@/i18n/config';

export type PaletteItem = {
  id: string;
  label: string;
  group: string;
  href?: string;
  action?: 'theme' | 'language';
  external?: boolean;
};

type Props = { locale: Locale; items: PaletteItem[]; strings: Record<string, string> };

export function CommandPalette({ locale, items, strings }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    previouslyFocused.current?.focus();
  }, []);

  const run = useCallback(
    (item: PaletteItem) => {
      close();
      if (item.action === 'theme') {
        const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        document.documentElement.style.colorScheme = next;
        try {
          localStorage.setItem('theme', next);
        } catch {
          /* ignore */
        }
        return;
      }
      if (item.action === 'language') {
        router.push(switchLocalePath(pathname, locale === 'en' ? 'fa' : 'en'));
        return;
      }
      if (!item.href) return;
      if (item.external) window.open(item.href, '_blank', 'noopener,noreferrer');
      else router.push(item.href);
    },
    [close, locale, pathname, router],
  );

  // Global shortcut
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        previouslyFocused.current = document.activeElement as HTMLElement;
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Open from anywhere (nav button dispatches this)
  useEffect(() => {
    function onOpen() {
      previouslyFocused.current = document.activeElement as HTMLElement;
      setOpen(true);
    }
    window.addEventListener('palette:open', onOpen);
    return () => window.removeEventListener('palette:open', onOpen);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Focus trap + keyboard model
  function onDialogKeyDown(event: ReactKeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = results[active];
      if (item) run(item);
      return;
    }
    if (event.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0] as HTMLElement;
      const last = focusables[focusables.length - 1] as HTMLElement;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  if (!open) return null;

  const groups = Array.from(new Set(results.map((r) => r.group)));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgb(0_0_0/0.55)] px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={strings.placeholder ?? 'Command palette'}
        onKeyDown={onDialogKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-elevated shadow-[var(--shadow)]"
      >
        <div className="border-b border-line px-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder={strings.placeholder}
            aria-label={strings.placeholder}
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active]?.id}` : undefined}
            className="h-14 w-full bg-transparent text-[length:var(--text-base)] text-fg outline-none placeholder:text-muted"
          />
        </div>

        <ul id="palette-results" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[length:var(--text-sm)] text-muted">
              {strings.empty}
            </li>
          ) : (
            groups.map((group) => (
              <li key={group}>
                <p className="tick px-3 pb-1 pt-3">{group}</p>
                <ul>
                  {results
                    .filter((r) => r.group === group)
                    .map((item) => {
                      const index = results.indexOf(item);
                      const isActive = index === active;
                      return (
                        <li key={item.id}>
                          <button
                            id={`palette-${item.id}`}
                            role="option"
                            aria-selected={isActive}
                            type="button"
                            onMouseEnter={() => setActive(index)}
                            onClick={() => run(item)}
                            className={`flex w-full items-center justify-between rounded px-3 py-2 text-start text-[length:var(--text-sm)] ${
                              isActive ? 'bg-[color:var(--surface)] text-fg' : 'text-muted'
                            }`}
                          >
                            <span>{item.label}</span>
                            {isActive ? <span className="tick">↵</span> : null}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
