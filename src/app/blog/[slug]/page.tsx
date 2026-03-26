import Link from "next/link";
import { posts } from "../posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | Research Match`,
    description: post.description,
    keywords: post.keyword,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://researchmatch.me/blog/${post.slug}`,
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const relatedPosts = post.relatedSlugs
    .map((s) => posts.find((p) => p.slug === s))
    .filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Nav */}
        <nav style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#2d5a3d", textDecoration: "none" }}>
            Research Match
          </Link>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link href="/blog" style={{ fontSize: "0.85rem", color: "#8A8D72", textDecoration: "none" }}>Blog</Link>
            <Link href="/app" className="btn-cta rm-search-btn" style={{ padding: "10px 24px", fontSize: "0.85rem", textDecoration: "none" }}>
              Open Tool
            </Link>
          </div>
        </nav>

        {/* Article */}
        <article className="blog-article">
          <h1 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800,
            color: "#2d5a3d", marginBottom: "16px", lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}>
            {post.title}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#BAC095", marginBottom: "40px" }}>
            Research Match Team
          </p>
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: "60px", paddingTop: "40px", borderTop: "1px solid rgba(186,192,149,0.3)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "20px" }}>
              Related posts
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {relatedPosts.map((rp) => rp && (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="glass-card"
                  style={{
                    display: "block", padding: "20px 24px", textDecoration: "none",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "6px" }}>
                    {rp.title}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#8A8D72", lineHeight: 1.5 }}>
                    {rp.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "48px", padding: "24px 0", borderTop: "1px solid rgba(186,192,149,0.3)", textAlign: "center" }}>
          <Link href="/blog" style={{ fontSize: "0.85rem", color: "#8A8D72", textDecoration: "none" }}>
            ← Back to all posts
          </Link>
        </div>
      </div>
    </div>
  );
}
