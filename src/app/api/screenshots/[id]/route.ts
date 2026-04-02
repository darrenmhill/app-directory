import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { screenshotData: true, screenshotMime: true },
  });

  if (!project?.screenshotData || !project.screenshotMime) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(project.screenshotData, {
    headers: {
      "Content-Type": project.screenshotMime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
