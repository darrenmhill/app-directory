import { prisma } from "./prisma";
import { fetchGitHubRepos } from "./github";

// Deduplicates concurrent syncs (e.g. several page loads while stale)
let syncInFlight: Promise<number> | null = null;

export function syncGitHubRepos(): Promise<number> {
  if (!syncInFlight) {
    syncInFlight = doSync().finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

async function doSync() {
  const repos = await fetchGitHubRepos();

  await Promise.all(
    repos.map((repo) =>
      prisma.project.upsert({
        where: { githubName: repo.name },
        create: {
          githubName: repo.name,
          githubUrl: repo.html_url,
          shortDesc: repo.description || "",
          language: repo.language,
          stars: repo.stargazers_count,
          isPrivate: repo.private,
          productionUrl: repo.homepage || null,
          lastGithubSync: new Date(),
        },
        update: {
          githubUrl: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          isPrivate: repo.private,
          lastGithubSync: new Date(),
        },
      })
    )
  );

  return repos.length;
}

export async function syncIfStale(): Promise<boolean> {
  const latest = await prisma.project.findFirst({
    orderBy: { lastGithubSync: "desc" },
    select: { lastGithubSync: true },
  });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  if (!latest?.lastGithubSync || latest.lastGithubSync < oneHourAgo) {
    await syncGitHubRepos();
    return true;
  }
  return false;
}
