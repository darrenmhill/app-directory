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
    ];
  },
};

export default nextConfig;
