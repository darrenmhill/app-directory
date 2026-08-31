export const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || "App Directory";

export const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "A directory of projects and applications — live demos, source code, and screenshots.";

// Absolute origin for canonical URLs, Open Graph, sitemap and structured data.
// Falls back to Railway's injected public domain when NEXT_PUBLIC_SITE_URL isn't set.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : undefined);
