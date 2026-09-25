'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type PostItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  date: string;
  readingTime: number;
  featured: boolean;
};

type Strings = { search: string; all: string; readingTime: string; empty: string };

export function BlogList({
  posts,
  locale,
  strings,
  categories,
}: {
  posts: PostItem[];
  locale: string;
  strings: Strings;
  categories: { id: string; label: string }[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === 'all' || post.category === category;
      const matchesQuery =
        !q || post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [posts, query, category]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 border-y border-line py-5">
        <label htmlFor="post-search" className="sr-only">
          {strings.search}
        </label>
        <input
          id="post-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={strings.search}
          className="min-w-[14rem] flex-1 rounded border border-line bg-[color:var(--surface)] px-4 py-2.5 text-[length:var(--text-sm)] outline-none focus:border-[color:var(--accent)]"
        />
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'all', label: strings.all }, ...categories].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={`rounded border px-3 py-1.5 text-[length:var(--text-xs)] transition-colors duration-[var(--dur-fast)] ${
                category === item.id
                  ? 'border-accent text-fg'
                  : 'border-line text-muted hover:text-fg'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-[length:var(--text-base)] text-muted">{strings.empty}</p>
      ) : (
        <ul className="divide-y divide-[color:var(--border)]">
          {filtered.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/${locale}/blog/${post.slug}`}
                className="group grid gap-3 py-8 md:grid-cols-[1fr_auto] md:items-baseline md:gap-10"
              >
                <div>
                  <p className="tick">{post.categoryLabel}</p>
                  <h2 className="mt-2 text-[length:var(--text-xl)] font-medium tracking-[-0.02em] group-hover:text-accent">
                    {post.title}
                  </h2>
                  <p className="mt-2 max-w-prose text-[length:var(--text-sm)] leading-relaxed text-muted">
                    {post.excerpt}
                  </p>
                </div>
                <span className="tick whitespace-nowrap">
                  {post.date} · {post.readingTime} {strings.readingTime}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
