"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  githubName: string;
  displayName: string | null;
  githubUrl: string;
  shortDesc: string;
  longDesc: string;
  productionUrl: string | null;
  screenshotUrl: string | null;
  isExcluded: boolean;
  displayOrder: number;
  language: string | null;
  stars: number;
  hasScreenshot: boolean;
}

export default function AdminProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/admin/projects/${params.id}`)
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => data && setProject(data));
  }, [params.id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    setMessage("");

    await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: project.displayName || null,
        shortDesc: project.shortDesc,
        longDesc: project.longDesc,
        productionUrl: project.productionUrl || null,
        screenshotUrl: project.screenshotUrl || null,
        isExcluded: project.isExcluded,
        displayOrder: project.displayOrder,
      }),
    });

    setMessage("Saved!");
    setSaving(false);
    setTimeout(() => setMessage(""), 2000);
  }

  async function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("screenshot", file);

    const res = await fetch(`/api/admin/projects/${project.id}/screenshot`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setProject({ ...project, hasScreenshot: true });
    }
    setUploading(false);
  }

  async function handleScreenshotDelete() {
    if (!project) return;
    await fetch(`/api/admin/projects/${project.id}/screenshot`, {
      method: "DELETE",
    });
    setProject({ ...project, hasScreenshot: false });
  }

  if (!project) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {project.githubName}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={project.displayName || ""}
            onChange={(e) =>
              setProject({ ...project, displayName: e.target.value })
            }
            placeholder={project.githubName}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Overrides the repo name shown on the card. Leave blank to use &ldquo;{project.githubName}&rdquo;.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Description
          </label>
          <input
            type="text"
            value={project.shortDesc}
            onChange={(e) =>
              setProject({ ...project, shortDesc: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Long Description
          </label>
          <textarea
            value={project.longDesc}
            onChange={(e) =>
              setProject({ ...project, longDesc: e.target.value })
            }
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Production URL
          </label>
          <input
            type="url"
            value={project.productionUrl || ""}
            onChange={(e) =>
              setProject({ ...project, productionUrl: e.target.value })
            }
            placeholder="https://..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Screenshot URL
          </label>
          <input
            type="url"
            value={project.screenshotUrl || ""}
            onChange={(e) =>
              setProject({ ...project, screenshotUrl: e.target.value })
            }
            placeholder="https://... (overrides production URL for screenshot capture)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            If set, this URL is used for screenshot capture instead of the production URL.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={project.displayOrder}
            onChange={(e) =>
              setProject({
                ...project,
                displayOrder: parseInt(e.target.value) || 0,
              })
            }
            className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear first. 0 = default (sorted by stars).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={project.isExcluded}
              onChange={(e) =>
                setProject({ ...project, isExcluded: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Exclude from public listing
            </span>
          </label>
        </div>

        {/* Screenshot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Screenshot
          </label>
          {project.hasScreenshot && (
            <div className="mb-3">
              <img
                src={`/api/screenshots/${project.id}`}
                alt={`${project.githubName} screenshot`}
                className="w-full max-w-md rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleScreenshotDelete}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove screenshot
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleScreenshotUpload}
            disabled={uploading}
            className="text-sm text-gray-600"
          />
          {uploading && (
            <p className="mt-1 text-sm text-gray-500">Uploading...</p>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {message && (
            <span className="text-sm text-green-600 font-medium">
              {message}
            </span>
          )}
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            View on GitHub &rarr;
          </a>
        </div>
      </form>
    </div>
  );
}
