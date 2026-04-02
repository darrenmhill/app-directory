import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Magic byte signatures for allowed image types
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function detectMimeType(buffer: Buffer): string | null {
  for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => buffer[i] === byte)) {
        return mime;
      }
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("screenshot") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Max 5MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate actual file content, not client-provided MIME type
  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPEG, WebP" },
      { status: 400 }
    );
  }

  await prisma.project.update({
    where: { id },
    data: {
      screenshotData: buffer,
      screenshotMime: detectedMime,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.project.update({
    where: { id },
    data: {
      screenshotData: null,
      screenshotMime: null,
    },
  });

  return NextResponse.json({ ok: true });
}
