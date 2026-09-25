export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only rounded bg-accent px-4 py-2 text-[color:var(--accent-contrast)] focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[200]"
    >
      {label}
    </a>
  );
}
