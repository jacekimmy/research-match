import Link from "next/link";
import { posts } from "./posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Match Blog - How to Find and Land Undergraduate Research",
  description: "Guides, tips, and real stories about finding professors, writing cold emails, and landing research positions as an undergrad or high school student.",
  openGraph: {
    title: "Research Match Blog - How to Find and Land Undergraduate Research",
    description: "Guides, tips, and real stories about finding professors, writing cold emails, and landing research positions as an undergrad or high school student.",
    type: "website",
    siteName: "Research Match",
  },
};

const CATEGORIES: { label: string; slugs: string[] }[] = [
  {
    label: "Finding Professors",
    slugs: [
      "how-to-find-research-opportunities",
      "how-to-get-research-experience-undergrad",
      "research-opportunities-for-high-school-students",
      "how-to-find-a-research-mentor",
      "summer-research-opportunities",
      "undergraduate-research-benefits",
    ],
  },
  {
    label: "Writing the Email",
    slugs: [
      "how-to-cold-email-a-professor",
      "how-to-email-a-professor-about-research",
      "cold-email-professor-template",
      "research-interest-statement",
      "best-time-to-email-professors",
      "cold-email-vs-warm-intro",
    ],
  },
  {
    label: "After You Send",
    slugs: [
      "how-to-follow-up-with-a-professor",
      "do-professors-respond-to-cold-emails",
      "what-professors-look-for-in-research-students",
    ],
  },
  {
    label: "Common Mistakes",
    slugs: [
      "cold-email-mistakes",
    ],
  },
  {
    label: "Specific Goals",
    slugs: [
      "premed-research-experience",
      "research-experience-for-phd-applications",
    ],
  },
];

export default function BlogIndex() {
  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <nav style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#2d5a3d", textDecoration: "none" }}>
            Research Match
          </Link>
          <Link href="/app" className="btn-cta rm-search-btn" style={{ padding: "10px 24px", fontSize: "0.85rem", textDecoration: "none" }}>
            Open Tool
          </Link>
        </nav>

        <h1 style={{
          fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800,
          color: "#2d5a3d", marginBottom: "20px", letterSpacing: "-0.02em",
          lineHeight: 1.15,
        }}>
          The Complete Guide to Getting Undergraduate Research
        </h1>

        <div style={{ fontSize: "1rem", color: "#4b5563", lineHeight: 1.75, marginBottom: "52px", maxWidth: "640px" }}>
          <p style={{ marginBottom: "16px" }}>
            Getting research experience as an undergrad is one of the best things you can do for grad school, med school, or just figuring out what you actually want to do. But nobody teaches you how to do it.
          </p>
          <p style={{ marginBottom: "16px" }}>
            Most students either wait around for a posting that never comes or send a generic cold email that gets deleted in two seconds. Neither works. What works is knowing how to find the right professor, writing an email that sounds like a human wrote it, and following up without being annoying.
          </p>
          <p>
            These guides cover the whole process from scratch. Start with finding professors if you have no idea where to look, or jump straight to the email guides if you just need help with what to actually say.
          </p>
        </div>

        {CATEGORIES.map((cat) => {
          const catPosts = cat.slugs
            .map((slug) => posts.find((p) => p.slug === slug))
            .filter(Boolean) as typeof posts;
          if (catPosts.length === 0) return null;
          return (
            <div key={cat.label} style={{ marginBottom: "52px" }}>
              <h2 style={{
                fontSize: "1.1rem", fontWeight: 700, color: "#2d5a3d",
                textTransform: "uppercase", letterSpacing: "0.06em",
                marginBottom: "20px", paddingBottom: "10px",
                borderBottom: "2px solid rgba(45,90,61,0.12)",
              }}>
                {cat.label}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {catPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    style={{ display: "block", textDecoration: "none", padding: "18px 24px", borderRadius: "14px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(45,90,61,0.08)", transition: "background 0.2s ease, border-color 0.2s ease" }}
                  >
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "6px", lineHeight: 1.4 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                      {post.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: "20px", padding: "32px", textAlign: "center", borderTop: "1px solid rgba(45, 90, 61,0.3)" }}>
          <p style={{ fontSize: "0.95rem", color: "#6b7280", marginBottom: "16px" }}>
            Ready to find your research professor?
          </p>
          <Link href="/app" className="btn-cta rm-search-btn" style={{ padding: "14px 36px", fontSize: "1rem", textDecoration: "none" }}>
            Try Research Match — free
          </Link>
        </div>
      </div>
    </div>
  );
}
