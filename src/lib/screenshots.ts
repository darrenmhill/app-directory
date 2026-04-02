import { prisma } from "./prisma";

const TIMEOUT = 15000; // 15s per screenshot

/**
 * Fetches a screenshot of a URL using thum.io and stores it in the database.
 */
export async function captureScreenshot(projectId: string, url: string): Promise<boolean> {
  try {
    const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

    const res = await fetch(screenshotUrl, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return false;

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());

    // Only save if we got a reasonable image (> 5KB to filter out error pages)
    if (buffer.length < 5000) return false;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        screenshotData: buffer,
        screenshotMime: contentType.split(";")[0],
      },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Captures screenshots for all projects that have a production URL
 * but no screenshot yet. Runs in parallel.
 */
export async function captureAllMissingScreenshots(): Promise<number> {
  const projects = await prisma.project.findMany({
    where: {
      productionUrl: { not: null },
      screenshotData: null,
    },
    select: { id: true, productionUrl: true, screenshotUrl: true },
  });

  return captureMany(projects);
}

/**
 * Re-captures screenshots for ALL projects that have a production URL.
 * Runs in parallel.
 */
export async function recaptureAllScreenshots(): Promise<number> {
  const projects = await prisma.project.findMany({
    where: { productionUrl: { not: null } },
    select: { id: true, productionUrl: true, screenshotUrl: true },
  });

  return captureMany(projects);
}

async function captureMany(
  projects: { id: string; productionUrl: string | null; screenshotUrl: string | null }[]
): Promise<number> {
  const results = await Promise.allSettled(
    projects.map((p) => {
      const url = p.screenshotUrl || p.productionUrl;
      return url ? captureScreenshot(p.id, url) : Promise.resolve(false);
    })
  );

  return results.filter(
    (r) => r.status === "fulfilled" && r.value === true
  ).length;
}
