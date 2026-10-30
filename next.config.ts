import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  // App marketing sites are static files in public/<app>/; serve them at clean URLs
  async rewrites() {
    return [
      { source: "/countsharp", destination: "/countsharp/index.html" },
      { source: "/countsharp/privacy", destination: "/countsharp/privacy.html" },
      { source: "/countsharp/support", destination: "/countsharp/support.html" },
      // Translations live in public/countsharp/<lang>/ (English stays at the URLs above)
      { source: "/countsharp/:lang(es|es-mx|fr|de|it|pt-br|ja)", destination: "/countsharp/:lang/index.html" },
      {
        source: "/countsharp/:lang(es|es-mx|fr|de|it|pt-br|ja)/:page(privacy|support)",
        destination: "/countsharp/:lang/:page.html",
      },
      // RealmQuest 2.0 marketing site (English only for now)
      { source: "/realmquest2", destination: "/realmquest2/index.html" },
      { source: "/realmquest2/privacy", destination: "/realmquest2/privacy.html" },
      { source: "/realmquest2/support", destination: "/realmquest2/support.html" },
    ];
  },
};

export default nextConfig;
