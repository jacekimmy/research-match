"use client";
import Link from "next/link";

const STEPS = [
  {
    num: "01",
    title: "Search your interest",
    desc: "Type in any research topic and a university. We search 250M+ academic papers to find professors actively publishing in that area.",
  },
  {
    num: "02",
    title: "Understand their work",
    desc: "Get a plain-English summary of each professor's research, their recent papers, and what makes their work unique.",
  },
  {
    num: "03",
    title: "Write an email that works",
    desc: "Use our framework built on advice from real professors to write a personalized email. No AI-generated emails, just the research you need to write your own.",
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f0ea", fontFamily: "DM Sans, Inter, sans-serif" }}>
      {/* Responsive style */}
      <style>{`
        @media (max-width: 768px) {
          .hiw-step-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <nav className="sp-nav">
        <Link href="/app" className="sp-nav-back">← Research Match</Link>
        <span className="sp-nav-title">How It Works</span>
        <Link href="/app" className="sp-nav-cta">Try it</Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "96px 24px 80px" }}>
        <div className="sp-hero">
          <h1 className="sp-heading">How <em>Research Match</em> Works</h1>
          <p className="sp-subheading">Three steps from topic to personalized email — in minutes.</p>
        </div>

        {/* Step cards */}
        <div
          className="hiw-step-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            marginBottom: "64px",
          }}
        >
          {STEPS.map((step, i) => (
            <div key={i} className="hiw-step-card">
              <div className="hiw-step-num">
                {step.num}
              </div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#1a1a1a", margin: 0, lineHeight: 1.35 }}>
                {step.title}
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1rem", color: "#6b7280", marginBottom: "20px" }}>
            Find your next research mentor in minutes.
          </p>
          <Link href="/app" className="sp-cta-link">Start searching →</Link>
        </div>
      </div>
    </div>
  );
}
