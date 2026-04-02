export interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  private: boolean;
  homepage: string | null;
}

const GITHUB_USER = "darrenmhill";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cachedRepos: GitHubRepo[] | null = null;
let cacheTimestamp = 0;

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const now = Date.now();
  if (cachedRepos && now - cacheTimestamp < CACHE_TTL) {
    return cachedRepos;
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // Use authenticated endpoint to include private repos when token is available
  const url = process.env.GITHUB_TOKEN
    ? `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner`
    : `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const allRepos: GitHubRepo[] = await res.json();
  // Filter to only repos owned by this user (affiliation=owner should handle this,
  // but belt-and-suspenders for the unauthenticated path)
  const repos = allRepos.filter(
    (r) => r.html_url.toLowerCase().includes(`github.com/${GITHUB_USER.toLowerCase()}/`)
  );
  cachedRepos = repos;
  cacheTimestamp = now;
  return repos;
}
