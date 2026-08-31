import { prisma } from "@/lib/prisma";
import { syncIfStale } from "@/lib/github-sync";
import ProjectCard from "@/components/project-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center gap-5">
          <a href="https://inzite.com" target="_blank" rel="noopener noreferrer">
            <img src="/logo-white.svg" alt="Inzite" className="h-10" />
          </a>
          <div>
            <h1 className="text-2xl font-bold">{siteTitle}</h1>
            <p className="mt-1 text-accent text-sm">
              A collection of projects and applications
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <p className="text-muted text-center py-12">
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
                screenshotVersion={project.updatedAt.getTime()}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto bg-primary text-white/60">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm">
          <a
            href="https://inzite.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            inzite.com
          </a>
        </div>
      </footer>
    </>
  );
}
