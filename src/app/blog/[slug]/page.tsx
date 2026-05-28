import Link from "next/link";
import { posts } from "../posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

function formatBlogDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function ctaForPost(post: (typeof posts)[number]) {
  const text = `${post.slug} ${post.title} ${post.keyword}`.toLowerCase();

  if (text.includes("email") || text.includes("cold")) {
    return {
      kicker: "Turn the guide into an email",
      title: "Find the right professor, then write the email around their actual work.",
      body: "Research Match helps you search by interest, read professor research in plain English, and draft outreach that sounds specific instead of copied.",
      button: "Find professors to email",
    };
  }

  if (text.includes("mentor")) {
    return {
      kicker: "Find a real mentor fit",
      title: "Stop guessing which professors might be worth reaching out to.",
      body: "Search your research interest, compare professors by recent work, and build a shortlist that feels intentional before you send a single email.",
      button: "Find mentor matches",
    };
  }

  if (text.includes("summer") || text.includes("premed") || text.includes("phd")) {
    return {
      kicker: "Build your research plan",
      title: "Turn this advice into a professor list you can act on today.",
      body: "Use Research Match to find labs aligned with your goal, understand their recent papers, and decide who deserves a thoughtful email first.",
      button: "Build my shortlist",
    };
  }

  return {
    kicker: "Go from reading to reaching out",
    title: "Find research positions by matching with professors who study your exact interests.",
    body: "Search a topic, see professor work summarized clearly, save strong matches, and use the email checker before you send.",
    button: "Find research matches",
  };
}

function articleContent(post: (typeof posts)[number]) {
  return post.content.replace(/\s*<div class="blog-cta">[\s\S]*?<\/div>\s*$/, "");
}

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
  const cta = ctaForPost(post);

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
    <div className="blog-shell blog-post-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="blog-post-container">
        {/* Nav */}
        <nav className="blog-nav">
          <Link href="/" className="blog-brand">
            Research Match
          </Link>
          <div className="blog-nav-links">
            <Link href="/blog" className="blog-nav-link">Blog</Link>
            <Link href="/app" className="blog-green-button blog-nav-button">
              Open Tool
            </Link>
          </div>
        </nav>

        {/* Article */}
        <article className="blog-article">
          <div className="blog-article-hero">
            <p className="blog-kicker">Research Match Guide</p>
            <h1 className="blog-title">
            {post.title}
            </h1>
            <p className="blog-description">{post.description}</p>
          </div>

          {/* Author + date */}
          <div className="blog-author-card">
            <div className="blog-author-avatar">
              <span>J</span>
            </div>
            <div>
              <p className="blog-author-name">Jace</p>
              <p className="blog-author-meta">
                15-year-old founder of Research Match. Cold emailed professors at Princeton, ASU, and dozens of others to learn what actually gets a response.
                {post.datePublished && (
                  <> &middot; {formatBlogDate(post.datePublished)}</>
                )}
              </p>
            </div>
          </div>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: articleContent(post) }}
          />
        </article>

        <section className="blog-conversion-panel">
          <div>
            <p className="blog-conversion-kicker">{cta.kicker}</p>
            <h2>{cta.title}</h2>
            <p>{cta.body}</p>
          </div>
          <div className="blog-conversion-actions">
            <Link href={`/app?source=blog&post=${post.slug}`} className="blog-green-button blog-conversion-button">
              {cta.button}
            </Link>
            <span>Free preview. No generic professor lists.</span>
          </div>
        </section>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="blog-related">
            <h2>
              Related posts
            </h2>
            <div className="blog-related-list">
              {relatedPosts.map((rp) => rp && (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="blog-related-card"
                >
                  <h3>
                    {rp.title}
                  </h3>
                  <p>
                    {rp.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="blog-footer">
          <Link href="/blog">
            ← Back to all posts
          </Link>
        </div>
      </div>
    </div>
  );
}
