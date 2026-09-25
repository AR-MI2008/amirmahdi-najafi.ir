'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell flex min-h-[70svh] flex-col justify-center py-24">
      <p className="tick">Error</p>
      <h1 className="mt-5 text-[length:var(--text-2xl)] font-medium tracking-[-0.02em]">
        Something on this page failed to load.
      </h1>
      <p className="mt-4 max-w-prose text-[length:var(--text-base)] text-muted">
        Reloading usually fixes it. If it does not, the contact form is still available.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 w-fit rounded border border-line px-5 py-3 text-[length:var(--text-sm)]"
      >
        Try again
      </button>
    </div>
  );
}
