import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { captureScreenshot } from "@/lib/screenshots";
import { isValidPublicUrl } from "@/lib/url-validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  displayName: z.string().max(255).nullable().optional(),
  shortDesc: z.string().max(500).optional(),
  longDesc: z.string().max(5000).optional(),
  productionUrl: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .refine((val) => !val || isValidPublicUrl(val), "Invalid or private URL"),
  screenshotUrl: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .refine((val) => !val || isValidPublicUrl(val), "Invalid or private URL"),
  isExcluded: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(9999).optional(),
});

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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { productionUrl: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });

  // Auto-capture screenshot when production URL is set or changed
  if (
    parsed.data.productionUrl &&
    parsed.data.productionUrl !== existing.productionUrl
  ) {
    captureScreenshot(id, parsed.data.productionUrl).catch((err) => {
      console.error(`[SCREENSHOT] Failed to capture for ${id}:`, err);
    });
  }

  return NextResponse.json({ ...project, hasScreenshot: !!project.screenshotMime });
}
