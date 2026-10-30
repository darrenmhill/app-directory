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
    { url: `${origin}/countsharp`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/countsharp/support`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${origin}/countsharp/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
