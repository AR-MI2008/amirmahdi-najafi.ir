# Fonts

All fonts are **self-hosted**. No request to a third-party font CDN is on the
critical path — that is a hard requirement, not a preference (see
`docs/PERFORMANCE.md`).

Place these four files here before the first build:

| File | Source | Licence |
| --- | --- | --- |
| `Geist-Variable.woff2` | https://github.com/vercel/geist-font/releases | SIL OFL 1.1 |
| `GeistMono-Variable.woff2` | https://github.com/vercel/geist-font/releases | SIL OFL 1.1 |
| `Vazirmatn-Variable.woff2` | https://github.com/rastikerdar/vazirmatn/releases | SIL OFL 1.1 |

Optional, only used by the dynamic OG image route (`/api/og`), which needs
TTF rather than WOFF2:

| File | Purpose |
| --- | --- |
| `Geist-Regular.ttf` | Latin OG titles |
| `Vazirmatn-Regular.ttf` | Persian OG titles |

If the TTFs are absent the OG route still renders, using the default font.

## Why Geist and Vazirmatn

Geist is a technical grotesque with a real monospace companion, so English UI
labels and code share one voice. Vazirmatn has proper Persian metrics and a
variable weight axis, which means Persian pages get the same type scale as
English ones instead of a fallback.

Both are SIL OFL 1.1, so self-hosting is licensed.

## Subsetting (optional)

To reduce transfer size, subset with `pyftsubset`:

```bash
pyftsubset Vazirmatn-Variable.ttf \
  --unicodes="U+0600-06FF,U+200C,U+FB8A,U+067E,U+0686,U+06AF,U+0000-00FF" \
  --flavor=woff2 --output-file=Vazirmatn-Variable.woff2
```
