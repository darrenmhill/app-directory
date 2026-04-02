import { prisma } from "@/lib/prisma";
import { syncIfStale } from "@/lib/github-sync";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await syncIfStale();
  } catch {
    // Continue with existing data if sync fails
  }

  const projects = await prisma.project.findMany({
    where: { isExcluded: false },
    orderBy: [{ displayOrder: "asc" }, { stars: "desc" }],
    select: {
      id: true,
      githubName: true,
      githubUrl: true,
      shortDesc: true,
      longDesc: true,
      productionUrl: true,
      language: true,
      stars: true,
      screenshotMime: true,
      displayOrder: true,
    },
  });

  // Add hasScreenshot flag instead of sending binary data
  const result = projects.map((p) => ({
    ...p,
    hasScreenshot: !!p.screenshotMime,
  }));

  return NextResponse.json(result);
}
