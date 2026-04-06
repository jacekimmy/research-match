import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "research-match-three.vercel.app" }],
        destination: "https://researchmatch.site/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
