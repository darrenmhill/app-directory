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

  // Don't show admin chrome on login page
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Admin
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View Site
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? "Syncing..." : "Sync from GitHub"}
            </button>
            <button
              onClick={handleCapture}
              disabled={capturing}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {capturing ? "Capturing..." : "Capture Screenshots"}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
