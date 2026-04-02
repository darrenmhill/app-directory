import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    orderBy: [{ displayOrder: "asc" }, { githubName: "asc" }],
    select: {
      id: true,
      githubName: true,
      githubUrl: true,
      shortDesc: true,
      longDesc: true,
      productionUrl: true,
      isExcluded: true,
      displayOrder: true,
      language: true,
      stars: true,
      isPrivate: true,
      screenshotMime: true,
      lastGithubSync: true,
      updatedAt: true,
    },
  });

  const result = projects.map((p) => ({
    ...p,
    hasScreenshot: !!p.screenshotMime,
  }));

  return NextResponse.json(result);
}
