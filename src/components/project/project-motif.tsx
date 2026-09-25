import type { ProjectTheme } from '@/lib/content-source';

/**
 * Each project's geometry, drawn as inline SVG. No image requests, no layout
 * shift, and it inherits the project accent. Decorative — hidden from AT.
 */
export function ProjectMotif({
  motif,
  accent = 'var(--accent)',
  className,
}: {
  motif: ProjectTheme['motif'];
  /**
   * Defaults to the scoped accent so the motif follows the active theme.
   * Pass a literal colour only outside a `.project-scope` container.
   */
  accent?: string;
  className?: string;
}) {
  const common = {
    className: `absolute inset-0 h-full w-full ${className ?? ''}`,
    'aria-hidden': true as const,
    viewBox: '0 0 400 200',
    preserveAspectRatio: 'xMidYMid slice',
    fill: 'none',
  };

  if (motif === 'radar') {
    return (
      <svg {...common}>
        <g stroke={accent} strokeWidth="0.7" opacity="0.5">
          {[30, 60, 90, 120].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} />
          ))}
          <path d="M200 200 L200 60M200 200 L110 130M200 200 L290 130" opacity="0.4" />
        </g>
        <g stroke={accent} strokeWidth="0.5" opacity="0.18">
          <path d="M0 40h400M0 100h400M0 160h400M80 0v200M200 0v200M320 0v200" />
        </g>
        <circle cx="248" cy="118" r="3" fill={accent} />
        <circle cx="146" cy="152" r="2" fill={accent} opacity="0.7" />
      </svg>
    );
  }

  if (motif === 'flow') {
    return (
      <svg {...common}>
        <g stroke={accent} strokeWidth="0.8" opacity="0.55">
          <path d="M40 100h60m40 0h60m40 0h60" />
          <rect x="100" y="82" width="40" height="36" rx="2" />
          <rect x="200" y="82" width="40" height="36" rx="2" />
          <rect x="300" y="82" width="40" height="36" rx="2" />
          <path d="M120 82V50h120M240 118v32H120" opacity="0.35" />
        </g>
        <g fill={accent} opacity="0.9">
          <circle cx="40" cy="100" r="2.5" />
          <circle cx="360" cy="100" r="2.5" />
        </g>
      </svg>
    );
  }

  if (motif === 'topology') {
    const nodes = [
      [60, 60],
      [150, 130],
      [230, 55],
      [320, 120],
      [110, 165],
      [280, 170],
    ] as const;
    return (
      <svg {...common}>
        <g stroke={accent} strokeWidth="0.6" opacity="0.4">
          <path d="M60 60L150 130L230 55L320 120M150 130L110 165M230 55L320 120L280 170M150 130L280 170" />
        </g>
        {nodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={accent} opacity="0.85" />
        ))}
      </svg>
    );
  }

  if (motif === 'trace') {
    return (
      <svg {...common}>
        <g stroke={accent} strokeWidth="0.7" opacity="0.5" strokeLinecap="square">
          <path d="M20 40h60l20 20h80l20-20h60M20 100h40l30 30h100M340 60v40l-30 30h-60" />
          <circle cx="200" cy="100" r="34" />
          <circle cx="200" cy="100" r="18" />
        </g>
        <g fill={accent}>
          <circle cx="200" cy="100" r="4" />
          <rect x="78" y="58" width="4" height="4" />
          <rect x="298" y="128" width="4" height="4" />
        </g>
      </svg>
    );
  }

  // catalogue
  return (
    <svg {...common}>
      <g stroke={accent} strokeWidth="0.8" opacity="0.45">
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={40 + col * 84}
              y={26 + row * 56}
              width="60"
              height="40"
              rx="2"
            />
          )),
        )}
      </g>
      <rect x="40" y="26" width="60" height="40" rx="2" fill={accent} opacity="0.16" />
    </svg>
  );
}
