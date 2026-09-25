/** Skeleton, not a spinner: no fake progress, no artificial delay. */
export default function Loading() {
  return (
    <div className="shell py-24" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 rounded-sm bg-[color:var(--surface)]" />
      <div className="mt-6 h-10 w-2/3 rounded-sm bg-[color:var(--surface)]" />
      <div className="mt-4 h-4 w-1/2 rounded-sm bg-[color:var(--surface)]" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
