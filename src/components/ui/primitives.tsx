import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '@/lib/utils';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('shell', className)}>{children}</div>;
}

/**
 * Sections are separated by hairlines rather than cards. The optional index
 * label is a real coordinate (section order), not decoration.
 */
export function Section({
  id,
  title,
  lede,
  action,
  children,
  className,
  style,
}: {
  id: string;
  title?: string;
  lede?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Used to scope project CSS variables onto a homepage section. */
  style?: CSSProperties;
}) {
  return (
    <section id={id} className={cx('rule py-20 md:py-28', className)} style={style}>
      <Container>
        {title ? (
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
            <div className="max-w-prose">
              <h2 className="text-[length:var(--text-2xl)] font-medium tracking-[-0.02em]">
                {title}
              </h2>
              {lede ? <p className="mt-3 text-[length:var(--text-base)] text-muted">{lede}</p> : null}
            </div>
            {action}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  external?: boolean;
  className?: string;
};

export function ButtonLink({ href, children, variant = 'solid', external, className }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-[length:var(--text-sm)] font-medium transition-[transform,background-color,border-color,color] duration-[var(--dur-fast)] ease-out active:scale-[0.985]';
  const styles = {
    solid: 'bg-accent text-[color:var(--accent-contrast)] hover:brightness-110',
    outline: 'border border-line text-fg hover:border-[color:var(--border-strong)] hover:bg-elevated',
    ghost: 'text-muted hover:text-fg',
  }[variant];

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cx(base, styles, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cx(base, styles, className)}>
      {children}
    </Link>
  );
}

export function Tick({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('tick', className)}>{children}</span>;
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Serialized server-side from typed objects; no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 tick">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-fg">
                {item.name}
              </Link>
            ) : (
              <span className="text-fg">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
