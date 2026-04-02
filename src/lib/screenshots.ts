import { prisma } from "./prisma";
import { isValidPublicUrl } from "./url-validation";

const TIMEOUT = 15000; // 15s per screenshot

/**
 * Fetches a screenshot of a URL using Microlink and stores it in the database.
 */
export async function captureScreenshot(projectId: string, url: string): Promise<boolean> {
  if (!isValidPublicUrl(url)) {
    console.warn(`[SCREENSHOT] Blocked private/invalid URL for ${projectId}: ${url}`);
    return false;
  }

  try {
    const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

    const res = await fetch(screenshotUrl, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) {
      console.warn(`[SCREENSHOT] Microlink returned ${res.status} for ${projectId}`);
      return false;
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length < 5000) {
      console.warn(`[SCREENSHOT] Image too small (${buffer.length}b) for ${projectId}`);
      return false;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        screenshotData: buffer,
        screenshotMime: contentType.split(";")[0],
      },
    });

    console.log(`[SCREENSHOT] Captured for ${projectId} (${buffer.length}b)`);
    return true;
  } catch (err) {
    console.error(`[SCREENSHOT] Failed for ${projectId}:`, err instanceof Error ? err.message : err);
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
