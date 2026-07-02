// Site-wide default social share image (applies to every route that
// doesn't define its own opengraph-image).
import { brandOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const alt = "Research Match - Find Research Professors in Minutes";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    kicker: "Cold outreach that gets replies",
    title: "Find research professors in minutes",
    subtitle:
      "Search any research interest and university. Get professor matches, plain-English paper summaries, and an email framework built on advice from real professors.",
  });
}
