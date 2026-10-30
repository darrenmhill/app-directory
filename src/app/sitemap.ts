import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified = new Date();
  try {
    const latest = await prisma.project.findFirst({
      where: { isExcluded: false },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (latest) lastModified = latest.updatedAt;
  } catch {
    // Fall back to now if the database is unavailable
  }

  const origin = siteUrl || "http://localhost:3000";
  return [
    {
      url: `${origin}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...countsharpPages(origin),
  ];
}

// CountSharp marketing site: English at /countsharp, translations at /countsharp/<lang>.
// Keep in sync with the rewrites in next.config.ts and the hreflang links in public/countsharp.
const countsharpLanguages: Record<string, string> = {
  en: "",
  es: "/es",
  "es-MX": "/es-mx",
  fr: "/fr",
  de: "/de",
  it: "/it",
  "pt-BR": "/pt-br",
  ja: "/ja",
};

function countsharpPages(origin: string): MetadataRoute.Sitemap {
  const pages = [
    { path: "", changeFrequency: "monthly", priority: 0.8 },
    { path: "/support", changeFrequency: "yearly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  ] as const;
  return Object.values(countsharpLanguages).flatMap((prefix) =>
    pages.map(({ path, changeFrequency, priority }) => ({
      url: `${origin}/countsharp${prefix}${path}`,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ...Object.fromEntries(
            Object.entries(countsharpLanguages).map(([lang, p]) => [lang, `${origin}/countsharp${p}${path}`]),
          ),
          "x-default": `${origin}/countsharp${path}`,
        },
      },
    })),
  );
}
