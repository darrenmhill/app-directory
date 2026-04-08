"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  githubName: string;
  shortDesc: string;
  productionUrl: string | null;
  isExcluded: boolean;
  displayOrder: number;
  language: string | null;
  stars: number;
  isPrivate: boolean;
  hasScreenshot: boolean;
}

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  function loadProjects() {
    fetch("/api/admin/projects")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return [];
        }
        return res.json();
      })
      .then(setProjects)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProjects();

    const onSync = () => loadProjects();
    window.addEventListener("admin-sync-complete", onSync);
    return () => window.removeEventListener("admin-sync-complete", onSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleExclude(project: Project) {
    await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isExcluded: !project.isExcluded }),
    });
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, isExcluded: !p.isExcluded } : p
      )
    );
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Projects</h1>
      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`bg-white rounded-xl shadow-sm p-4 ${
              project.isExcluded ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {project.githubName}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {project.shortDesc}
                </div>
              </div>
              <Link
                href={`/admin/projects/${project.id}`}
                className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {project.language && <span>{project.language}</span>}
              {project.stars > 0 && <span>{project.stars} stars</span>}
              <span className="flex items-center gap-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    project.hasScreenshot ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                Img
              </span>
              <span className="flex items-center gap-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    project.productionUrl ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                URL
              </span>
              <button
                onClick={() => toggleExclude(project)}
                className={`ml-auto px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  project.isExcluded
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {project.isExcluded ? "Hidden" : "Visible"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                Name
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                Language
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                Stars
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                Screenshot
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                Production URL
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                Visible
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => (
              <tr
                key={project.id}
                className={project.isExcluded ? "opacity-50" : ""}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {project.githubName}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {project.shortDesc}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {project.language || "—"}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {project.stars}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      project.hasScreenshot ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      project.productionUrl ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleExclude(project)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                      project.isExcluded
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {project.isExcluded ? "Hidden" : "Visible"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
