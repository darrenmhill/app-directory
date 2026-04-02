import { verifyAdmin } from "@/lib/auth";
import { recaptureAllScreenshots } from "@/lib/screenshots";
import { NextResponse } from "next/server";

export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire and forget — don't block the response
  recaptureAllScreenshots().catch(() => {});

  return NextResponse.json({ ok: true, message: "Screenshot capture started" });
}
