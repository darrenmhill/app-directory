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

  return [
    {
      url: `${siteUrl || "http://localhost:3000"}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
