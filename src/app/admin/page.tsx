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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
