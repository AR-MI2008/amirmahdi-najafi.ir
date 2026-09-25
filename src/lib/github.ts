import { safeFetch } from './utils';
import { getSiteConfig } from '@/lib/content-source';

const site = getSiteConfig();

/**
 * Explicit allowlist. Repositories are shown because they were chosen,
 * not because the API returned them.
 */
const ALLOWLIST = ['webguard'];

export type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  updatedAt: string;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  updated_at: string;
  private: boolean;
};

/**
 * Server-only. The token, when present, never leaves the server.
 * Cached for an hour; on any failure the section renders nothing.
 */
export async function getRepositories(): Promise<Repo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'amirmahdi-najafi.ir',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const data = await safeFetch<GitHubRepo[]>(
    `https://api.github.com/users/${site.githubUser}/repos?per_page=100&sort=updated`,
    { headers, next: { revalidate: 3600 } },
    [],
  );

  if (!Array.isArray(data)) return [];

  return data
    .filter((repo) => !repo.private && ALLOWLIST.includes(repo.name.toLowerCase()))
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      url: repo.html_url,
      updatedAt: repo.updated_at,
    }));
}
