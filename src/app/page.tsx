import { prisma } from "@/lib/prisma";
import { syncIfStale } from "@/lib/github-sync";
import ProjectCard from "@/components/project-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Auto-sync if data is stale
  try {
    await syncIfStale();
  } catch {
    // Continue with existing data
  }

  const projects = await prisma.project.findMany({
    where: { isExcluded: false },
    orderBy: [{ displayOrder: "asc" }, { stars: "desc" }],
  });

  const siteTitle =
    process.env.NEXT_PUBLIC_SITE_TITLE || "App Directory";

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{siteTitle}</h1>
          <p className="mt-2 text-gray-600">
            A collection of projects and applications
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No projects yet. Sync from GitHub via the admin panel.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                githubName={project.githubName}
                displayName={project.displayName}
                githubUrl={project.githubUrl}
                shortDesc={project.shortDesc}
                longDesc={project.longDesc}
                productionUrl={project.productionUrl}
                isPrivate={project.isPrivate}
                stars={project.stars}
                hasScreenshot={!!project.screenshotMime}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
          <a
            href="https://github.com/darrenmhill"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700"
          >
            github.com/darrenmhill
          </a>
        </div>
      </footer>
    </>
  );
}
