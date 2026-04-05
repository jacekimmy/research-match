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
      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(244,240,234,0.92)", backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(45,90,61,0.1)",
        padding: "0 24px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/app" style={{
          fontSize: "0.95rem", fontWeight: 600, color: "#2d5a3d",
          textDecoration: "none", display: "flex", alignItems: "center", gap: "6px",
        }}>
          ← Research Match
        </Link>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1rem", fontWeight: 700, color: "#2d5a3d",
        }}>
          Email Framework
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
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "96px 24px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800,
            color: "#2d5a3d", letterSpacing: "-0.02em", marginBottom: "16px", lineHeight: 1.2,
          }}>
            The Cold Email Framework
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#6b7280", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
            A fill-in-the-blank template built on what actually gets professors to respond. Click each bracket for guidance.
          </p>
        </div>

        {/* Template card */}
        <div style={{
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.65)", borderRadius: "24px",
          padding: "40px 40px 32px", marginBottom: "40px",
          boxShadow: "0 8px 32px rgba(45,90,61,0.08)",
        }}>
          <p style={{
            fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d",
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px",
          }}>
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
                  style={{
                    display: "inline",
                    background: openHint === part.key
                      ? "rgba(45,90,61,0.18)"
                      : "rgba(45,90,61,0.1)",
                    color: "#2d5a3d",
                    padding: "2px 8px", borderRadius: "6px",
                    fontWeight: 700, fontSize: "inherit",
                    border: "1.5px solid rgba(45,90,61,0.25)",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.2s",
                    lineHeight: "inherit",
                    verticalAlign: "baseline",
                  }}
                >
                  {part.content}
                </button>
              );
            })}
          </div>

          {/* Hints */}
          {Object.entries(HINTS).map(([key, hint]) => (
            openHint === key && (
              <div key={key} style={{
                background: "rgba(45,90,61,0.06)",
                border: "1px solid rgba(45,90,61,0.2)",
                borderRadius: "14px", padding: "20px 24px",
                marginBottom: "12px",
                borderLeft: "4px solid #2d5a3d",
              }}>
                <p style={{
                  fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px",
                }}>
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
        <div style={{
          background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.65)", borderRadius: "24px",
          padding: "40px", marginBottom: "48px",
          boxShadow: "0 8px 32px rgba(45,90,61,0.08)",
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem", fontWeight: 700,
            color: "#2d5a3d", marginBottom: "8px",
          }}>
            Red Flag Phrases
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "28px", lineHeight: 1.6 }}>
            These phrases signal to professors that you haven't done your homework. Avoid them.
          </p>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px",
          }}>
            {RED_FLAGS.map((item, i) => (
              <div key={i} style={{
                background: "rgba(196,92,92,0.05)",
                border: "1px solid rgba(196,92,92,0.15)",
                borderRadius: "14px", padding: "18px 20px",
                borderLeft: "3px solid rgba(196,92,92,0.4)",
              }}>
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
          <p style={{ fontSize: "1rem", color: "#6b7280", marginBottom: "20px" }}>
            Ready to put this into practice?
          </p>
          <Link href="/app" style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #2d5a3d, #24956A)",
            color: "#fff", padding: "16px 40px", borderRadius: "14px",
            fontWeight: 700, fontSize: "1rem", textDecoration: "none",
            boxShadow: "0 4px 16px rgba(45,90,61,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}>
            Try it with a real professor →
          </Link>
        </div>
      </div>
    </div>
  );
}
