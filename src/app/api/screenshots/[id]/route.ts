import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { screenshotData: true, screenshotMime: true, updatedAt: true },
  });

  if (!project?.screenshotData || !project.screenshotMime) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // URLs are versioned with ?v=<updatedAt>, so cached responses are never stale:
  // a new upload bumps updatedAt and produces a new URL. Requests without ?v
  // (or with an old ?v) must revalidate so replaced screenshots show immediately.
  const versioned = request.nextUrl.searchParams.get("v") === String(project.updatedAt.getTime());

  return new NextResponse(project.screenshotData, {
    headers: {
      "Content-Type": project.screenshotMime,
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
