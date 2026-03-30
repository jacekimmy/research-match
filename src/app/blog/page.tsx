import Link from "next/link";
import { posts } from "./posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Research Match",
  description: "Guides on cold emailing professors, finding research opportunities, and getting into labs as a student.",
  openGraph: {
    title: "Blog - Research Match",
    description: "Guides on cold emailing professors, finding research opportunities, and getting into labs as a student.",
  },
};

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
          color: "#2d5a3d", marginBottom: "12px", letterSpacing: "-0.02em",
        }}>
          Blog
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#6b7280", marginBottom: "48px", lineHeight: 1.6 }}>
          Guides on cold emailing professors, finding research, and getting into labs.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="glass-card"
              style={{
                display: "block", padding: "28px 32px", textDecoration: "none",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "8px", lineHeight: 1.4 }}>
                {post.title}
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.6 }}>
                {post.description}
              </p>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: "60px", padding: "32px", textAlign: "center", borderTop: "1px solid rgba(45, 90, 61,0.3)" }}>
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
