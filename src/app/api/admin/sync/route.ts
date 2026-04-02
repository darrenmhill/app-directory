import { verifyAdmin } from "@/lib/auth";
import { syncGitHubRepos } from "@/lib/github-sync";
import { captureAllMissingScreenshots } from "@/lib/screenshots";
import { NextResponse } from "next/server";

export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await syncGitHubRepos();
  // Fire and forget — don't block sync response
  captureAllMissingScreenshots().catch(() => {});
  return NextResponse.json({ ok: true, synced: count });
}
