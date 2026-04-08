"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [capturing, setCapturing] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/admin/sync", { method: "POST" });
    setSyncing(false);
    window.dispatchEvent(new Event("admin-sync-complete"));
    router.refresh();
  }

  async function handleCapture() {
    setCapturing(true);
    await fetch("/api/admin/screenshots", { method: "POST" });
    setCapturing(false);
    window.dispatchEvent(new Event("admin-sync-complete"));
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary text-white px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/admin" className="text-lg md:text-xl font-bold">
              Admin
            </Link>
            <Link
              href="/"
              className="text-sm text-white/60 hover:text-accent transition-colors"
            >
              View Site
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {syncing ? "Syncing..." : "Sync GitHub"}
            </button>
            <button
              onClick={handleCapture}
              disabled={capturing}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-accent-dark text-white rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
            >
              {capturing ? "Capturing..." : "Screenshots"}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
