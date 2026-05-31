"use client";
import { useState } from "react";
import Link from "next/link";

const TEMPLATE_PARTS = [
  { type: "text", content: '"I came across your recent work on ' },
  { type: "bracket", key: "SPECIFIC TOPIC", content: "[SPECIFIC TOPIC]" },
  { type: "text", content: " and was particularly struck by " },
  { type: "bracket", key: "SPECIFIC FINDING OR QUOTE FROM PAPER", content: "[SPECIFIC FINDING OR QUOTE FROM PAPER]" },
  { type: "text", content: ". This connects directly to my own interest in " },
  { type: "bracket", key: "YOUR RESEARCH ANGLE", content: "[YOUR RESEARCH ANGLE]" },
  { type: "text", content: " because " },
  { type: "bracket", key: "ONE GENUINE PERSONAL REASON", content: "[ONE GENUINE PERSONAL REASON]" },
  { type: "text", content: ". I'm especially curious whether " },
  { type: "bracket", key: "INTELLIGENT QUESTION", content: "[INTELLIGENT QUESTION THAT SHOWS YOU READ IT]" },
  { type: "text", content: '."' },
];

const HINTS: Record<string, string> = {
  "SPECIFIC TOPIC": "Name the actual subject they study, not just their field. Good: 'memory consolidation during REM sleep in elderly patients'. Bad: 'your neuroscience research'.",
  "SPECIFIC FINDING OR QUOTE FROM PAPER": "Pick one concrete result from their work — a number, a comparison, a technique. Good: 'your finding that theta oscillations increased recall by 34%'. Bad: 'your interesting results'.",
  "YOUR RESEARCH ANGLE": "State your specific angle or question, not just your major. Good: 'the role of oscillatory dynamics in memory disorders'. Bad: 'neuroscience'.",
  "ONE GENUINE PERSONAL REASON": "Connect it to something you've actually done or experienced. Good: 'I've been analyzing EEG datasets from the OpenNeuro repository'. Bad: 'I have always been passionate about this field'.",
  "INTELLIGENT QUESTION": "Ask something that shows you read the paper. Good: 'whether the same oscillatory patterns appear in younger populations with sleep disorders'. Bad: 'what projects you're working on'.",
};

const RED_FLAGS = [
  {
    phrase: "I found your work fascinating and groundbreaking",
    reason: "Professors hear this daily. Instead, name the specific finding that caught your attention.",
  },
  {
    phrase: "I am a highly motivated student",
    reason: "This tells them nothing. Instead, show motivation through what you've done.",
  },
  {
    phrase: "Your research aligns perfectly with my interests",
    reason: "Too vague. Instead, explain the specific connection.",
  },
  {
    phrase: "I would love to learn from you",
    reason: "Makes it about you, not their work. Instead, ask about a specific aspect of their research.",
  },
  {
    phrase: "I am passionate about this field",
    reason: "Everyone says this. Instead, describe what you've actually done in the field.",
  },
];

export default function FrameworkPage() {
  const [openHint, setOpenHint] = useState<string | null>(null);

  function toggleHint(key: string) {
    setOpenHint(prev => (prev === key ? null : key));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f0ea", fontFamily: "DM Sans, Inter, sans-serif" }}>
      <nav className="sp-nav">
        <Link href="/app" className="sp-nav-back">← Research Match</Link>
        <span className="sp-nav-title">Email Framework</span>
        <Link href="/app" className="sp-nav-cta">Try it</Link>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "96px 24px 80px" }}>
        <div className="sp-hero">
          <h1 className="sp-heading"><em>The Cold Email</em> Framework</h1>
          <p className="sp-subheading">A fill-in-the-blank template built on what actually gets professors to respond. Click each bracket for guidance.</p>
        </div>

        {/* Template card */}
        <div className="sp-card" style={{ padding: "40px 40px 32px", marginBottom: "40px" }}>
          <p className="sp-label" style={{ marginBottom: "24px" }}>
            Template
          </p>

          {/* Template text */}
          <div style={{ fontSize: "1.05rem", lineHeight: 1.9, color: "#1a1a1a", marginBottom: "32px" }}>
            {TEMPLATE_PARTS.map((part, i) => {
              if (part.type === "text") {
                return <span key={i}>{part.content}</span>;
              }
              return (
                <button
                  key={i}
                  onClick={() => toggleHint(part.key!)}
                  className={`fw-bracket-btn${openHint === part.key ? " fw-bracket-btn-active" : ""}`}
                >
                  {part.content}
                </button>
              );
            })}
          </div>

          {/* Hints */}
          {Object.entries(HINTS).map(([key, hint]) => (
            openHint === key && (
              <div key={key} className="fw-hint-box">
                <p className="fw-hint-label">
                  {key}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.7, margin: 0 }}>
                  {hint}
                </p>
              </div>
            )
          ))}

          <p style={{ fontSize: "0.82rem", color: "#9ca3af", marginTop: "8px" }}>
            Click any <span style={{ color: "#2d5a3d", fontWeight: 700 }}>[bracket]</span> to see guidance on how to fill it in.
          </p>
        </div>

        {/* Red Flag Phrases */}
        <div className="sp-card" style={{ padding: "40px", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "1.5rem", fontWeight: 500, color: "#111", marginBottom: "8px" }}>
            Red Flag Phrases
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "28px", lineHeight: 1.6 }}>
            These phrases signal to professors that you haven&apos;t done your homework. Avoid them.
          </p>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px",
          }}>
            {RED_FLAGS.map((item, i) => (
              <div key={i} className="fw-red-flag-card">
                <p style={{
                  fontSize: "0.9rem", fontWeight: 600, color: "#9b2c2c",
                  marginBottom: "8px", lineHeight: 1.5, fontStyle: "italic",
                }}>
                  &ldquo;{item.phrase}&rdquo;
                </p>
                <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link href="/app" className="sp-cta-link">Try it with a real professor →</Link>
        </div>
      </div>
    </div>
  );
}
