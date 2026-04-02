import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureScreenshot } from "@/lib/screenshots";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      githubName: true,
      displayName: true,
      githubUrl: true,
      shortDesc: true,
      longDesc: true,
      productionUrl: true,
      isExcluded: true,
      displayOrder: true,
      language: true,
      stars: true,
      isPrivate: true,
      screenshotUrl: true,
      screenshotMime: true,
      lastGithubSync: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...project, hasScreenshot: !!project.screenshotMime });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowed = ["displayName", "shortDesc", "longDesc", "productionUrl", "screenshotUrl", "isExcluded", "displayOrder"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      data[key] = body[key];
    }
  }

  // Check if productionUrl changed
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { productionUrl: true },
  });

  const project = await prisma.project.update({
    where: { id },
    data,
  });

  // Auto-capture screenshot when production URL is set or changed
  if (
    data.productionUrl &&
    data.productionUrl !== existing?.productionUrl
  ) {
    captureScreenshot(id, data.productionUrl as string).catch(() => {});
  }

  return NextResponse.json({ ...project, hasScreenshot: !!project.screenshotMime });
}
