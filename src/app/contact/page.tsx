"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Try emailing us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    fontSize: "0.95rem", color: "#1a1a1a",
    background: "rgba(255,255,255,0.8)",
    border: "1.5px solid rgba(45,90,61,0.2)",
    borderRadius: "10px", outline: "none",
    fontFamily: "DM Sans, Inter, sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f2", fontFamily: "DM Sans, Inter, sans-serif" }}>
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
          textDecoration: "none",
        }}>
          ← Research Match
        </Link>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1rem", fontWeight: 700, color: "#2d5a3d",
        }}>
          Contact
        </span>
        <Link href="/app" style={{
          padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600,
          color: "#fff", background: "#2d5a3d", borderRadius: "10px",
          textDecoration: "none",
        }}>
          Open App
        </Link>
      </nav>

      {/* Content — centered */}
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "80px 24px",
      }}>
        <div style={{
          width: "100%", maxWidth: "520px",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.65)",
          borderRadius: "24px", padding: "48px 44px",
          boxShadow: "0 8px 40px rgba(45,90,61,0.08)",
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2rem", fontWeight: 800,
            color: "#2d5a3d", marginBottom: "10px",
            letterSpacing: "-0.02em",
          }}>
            Get in Touch
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#6b7280", lineHeight: 1.6, marginBottom: "28px" }}>
            Questions, feedback, partnership inquiries, or just want to say hi.
          </p>

          {/* Email link */}
          <a
            href="mailto:thomasjacekim@gmail.com"
            style={{
              display: "inline-block",
              color: "#2d5a3d", fontWeight: 600, fontSize: "0.95rem",
              textDecoration: "none",
              border: "1.5px solid #2d5a3d",
              borderRadius: "10px", padding: "10px 20px",
              marginBottom: "32px",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            thomasjacekim@gmail.com
          </a>

          <div style={{ height: "1px", background: "rgba(45,90,61,0.15)", marginBottom: "28px" }} />

          {submitted ? (
            <div style={{
              textAlign: "center", padding: "32px 20px",
              background: "rgba(45,90,61,0.06)", borderRadius: "14px",
              border: "1px solid rgba(45,90,61,0.15)",
            }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "12px" }}>&#10003;</p>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.1rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "8px",
              }}>
                Thanks! We&apos;ll get back to you soon.
              </p>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                We typically respond within 24–48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>
              {submitError && (
                <p style={{ fontSize: "0.85rem", color: "#c45c5c", marginTop: "4px" }}>{submitError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "linear-gradient(135deg, #2d5a3d, #24956A)",
                  color: "#fff", padding: "14px 24px",
                  borderRadius: "12px", fontWeight: 700,
                  fontSize: "1rem", border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  fontFamily: "DM Sans, Inter, sans-serif",
                  boxShadow: "0 4px 16px rgba(45,90,61,0.25)",
                  marginTop: "4px",
                  transition: "opacity 0.2s",
                }}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
