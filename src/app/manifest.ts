import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Research Match",
    short_name: "Research Match",
    description:
      "Search any research interest and university. Get professor matches, plain-English paper summaries, and an email framework built on advice from real professors.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfaf4",
    theme_color: "#659983",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
