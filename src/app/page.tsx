import type { Metadata } from "next";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncIfStale } from "@/lib/github-sync";
import { siteDescription, siteTitle, siteUrl } from "@/lib/site";
import ProjectCard from "@/components/project-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const projectSelect = {
  id: true,
  githubName: true,
  displayName: true,
  githubUrl: true,
  shortDesc: true,
  longDesc: true,
  productionUrl: true,
  isPrivate: true,
  language: true,
  stars: true,
  screenshotMime: true,
  updatedAt: true,
} as const;

export default async function HomePage() {
  let projects = await prisma.project.findMany({
    where: { isExcluded: false },
    orderBy: [{ displayOrder: "asc" }, { stars: "desc" }],
    select: projectSelect,
  });

  if (projects.length === 0) {
    // First run with an empty database: sync before rendering so the page isn't blank
    try {
      await syncIfStale();
      projects = await prisma.project.findMany({
        where: { isExcluded: false },
        orderBy: [{ displayOrder: "asc" }, { stars: "desc" }],
        select: projectSelect,
      });
    } catch {
      // Continue with existing data
    }
  } else {
    // Refresh GitHub data in the background after the response is sent
    after(() => syncIfStale().catch(() => {}));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteTitle,
        description: siteDescription,
        ...(siteUrl ? { url: siteUrl } : {}),
      },
      {
        "@type": "ItemList",
        name: siteTitle,
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareSourceCode",
            name: project.displayName || project.githubName,
            ...(project.shortDesc || project.longDesc
              ? { description: project.shortDesc || project.longDesc }
              : {}),
            ...(project.isPrivate ? {} : { codeRepository: project.githubUrl }),
            ...(project.language
              ? { programmingLanguage: project.language }
              : {}),
            url: project.productionUrl || project.githubUrl,
            ...(project.screenshotMime && siteUrl
              ? {
                  image: `${siteUrl}/api/screenshots/${project.id}?v=${project.updatedAt.getTime()}`,
                }
              : {}),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center gap-5">
          <a href="https://inzite.com" target="_blank" rel="noopener noreferrer">
            <img
              src="/logo-white.svg"
              alt="Inzite"
              className="h-10"
              width="118"
              height="40"
            />
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
            {projects.map((project, index) => (
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
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto bg-primary text-white/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center gap-6 text-sm">
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
