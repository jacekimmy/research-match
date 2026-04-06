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
    authors: [{ name: "Jace" }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://researchmatch.site/blog/${post.slug}`,
      publishedTime: post.datePublished,
      authors: ["Jace"],
      siteName: "Research Match",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Person",
      name: "Jace",
      description: "15-year-old founder of Research Match. I've cold emailed professors at Princeton, ASU, and dozens of other universities to learn what actually gets a response.",
    },
    publisher: {
      "@type": "Organization",
      name: "Research Match",
      url: "https://researchmatch.me",
    },
    datePublished: post.datePublished,
    dateModified: post.datePublished,
    url: `https://researchmatch.site/blog/${post.slug}`,
    mainEntityOfPage: `https://researchmatch.site/blog/${post.slug}`,
  };

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Nav */}
        <nav style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#2d5a3d", textDecoration: "none" }}>
            Research Match
          </Link>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link href="/blog" style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>Blog</Link>
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

          {/* Author + date */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px", paddingBottom: "24px", borderBottom: "1px solid rgba(45,90,61,0.1)" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #2d5a3d, #2E9E72)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>J</span>
            </div>
            <div>
              <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2d5a3d", margin: 0, marginBottom: "2px" }}>Jace</p>
              <p style={{ fontSize: "0.78rem", color: "#8aaa96", margin: 0 }}>
                15-year-old founder of Research Match. Cold emailed professors at Princeton, ASU, and dozens of others to learn what actually gets a response.
                {post.datePublished && (
                  <> &middot; {new Date(post.datePublished).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>
                )}
              </p>
            </div>
          </div>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: "60px", paddingTop: "40px", borderTop: "1px solid rgba(45, 90, 61,0.3)" }}>
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
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 }}>
                    {rp.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "48px", padding: "24px 0", borderTop: "1px solid rgba(45, 90, 61,0.3)", textAlign: "center" }}>
          <Link href="/blog" style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>
            ← Back to all posts
          </Link>
        </div>
      </div>
    </div>
  );
}
