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
    <div style={{ minHeight: "100vh", background: "#faf7f2", fontFamily: "DM Sans, Inter, sans-serif" }}>
      {/* Responsive style */}
      <style>{`
        @media (max-width: 768px) {
          .hiw-step-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(250,247,242,0.92)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(45,90,61,0.1)",
        padding: "0 24px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          fontSize: "0.95rem", fontWeight: 600, color: "#2d5a3d",
          textDecoration: "none", display: "flex", alignItems: "center", gap: "6px",
        }}>
          ← Research Match
        </Link>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1rem", fontWeight: 700, color: "#2d5a3d",
        }}>
          How It Works
        </span>
        <Link href="/app" style={{
          padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600,
          color: "#fff", background: "#2d5a3d", borderRadius: "10px",
          textDecoration: "none",
        }}>
          Try it
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "96px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800,
            color: "#2d5a3d", letterSpacing: "-0.02em", marginBottom: "16px", lineHeight: 1.2,
          }}>
            How Research Match Works
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#6b7280", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
            Three steps from topic to personalized email — in minutes.
          </p>
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
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.65)",
                borderRadius: "22px",
                padding: "36px 28px",
                boxShadow: "0 8px 32px rgba(45,90,61,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "2.8rem", fontWeight: 800,
                color: "#2d5a3d", letterSpacing: "-0.04em", lineHeight: 1,
              }}>
                {step.num}
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.2rem", fontWeight: 700,
                color: "#1a1a1a", margin: 0, lineHeight: 1.35,
              }}>
                {step.title}
              </h2>
              <p style={{
                fontSize: "0.9rem", color: "#6b7280",
                lineHeight: 1.7, margin: 0,
              }}>
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
          <Link href="/app" style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #2d5a3d, #24956A)",
            color: "#fff", padding: "16px 40px", borderRadius: "14px",
            fontWeight: 700, fontSize: "1rem", textDecoration: "none",
            boxShadow: "0 4px 16px rgba(45,90,61,0.3)",
          }}>
            Start searching →
          </Link>
        </div>
      </div>
    </div>
  );
}
