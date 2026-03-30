"use client";

import { useState, useEffect, useRef } from "react";

interface StarterKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StarterKitModal({ isOpen, onClose }: StarterKitModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
    // Reset state when modal re-opens
    if (isOpen) {
      setDone(false);
      setError("");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Save email
      const res = await fetch("/api/starter-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to save email");
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = "/api/starter-kit";
      link.download = "Research-Position-Starter-Kit.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(28, 46, 34, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "skModalFadeIn 0.25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "440px",
          margin: "0 20px",
          background: "rgba(245, 240, 230, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          border: "1px solid rgba(28, 122, 86, 0.12)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.12), 0 8px 32px rgba(28,122,86,0.08)",
          padding: "36px 32px 32px",
          animation: "skModalSlideUp 0.3s ease",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.3rem",
            color: "#7A8E80",
            lineHeight: 1,
            padding: "4px 8px",
            borderRadius: "8px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(28,122,86,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "none")
          }
        >
          &times;
        </button>

        {!done ? (
          <>
            {/* Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(28,122,86,0.12), rgba(28,122,86,0.04))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "18px",
                fontSize: "1.4rem",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1C7A56"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="18" />
                <line x1="15" y1="15" x2="12" y2="18" />
              </svg>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#1C7A56",
                marginBottom: "6px",
                fontFamily: "'Playfair Display', Georgia, serif",
                letterSpacing: "-0.02em",
              }}
            >
              Free Starter Kit
            </h2>
            <p
              style={{
                fontSize: "0.92rem",
                color: "#4A5D50",
                lineHeight: 1.6,
                marginBottom: "22px",
              }}
            >
              The exact email format, professor research checklist, and secret
              weapon line used to get responses from Princeton and ASU
              professors.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  fontSize: "0.95rem",
                  borderRadius: "12px",
                  border: "1.5px solid rgba(28,122,86,0.18)",
                  background: "rgba(255,255,255,0.6)",
                  color: "#2C3E34",
                  outline: "none",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                  marginBottom: "12px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1C7A56";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(28,122,86,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(28,122,86,0.18)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              {error && (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#c0392b",
                    marginBottom: "10px",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  borderRadius: "12px",
                  border: "none",
                  background: loading
                    ? "rgba(28,122,86,0.5)"
                    : "linear-gradient(135deg, #1C7A56, #24936A)",
                  color: "#F5F0E6",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  letterSpacing: "-0.01em",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 16px rgba(28,122,86,0.18)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 24px rgba(28,122,86,0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(28,122,86,0.18)";
                }}
              >
                {loading ? "Preparing..." : "Download Starter Kit"}
              </button>
            </form>

            <p
              style={{
                fontSize: "0.75rem",
                color: "#7A8E80",
                textAlign: "center",
                marginTop: "14px",
              }}
            >
              No spam. Just the kit.
            </p>
          </>
        ) : (
          /* ── Success state ── */
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(28,122,86,0.15), rgba(28,122,86,0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1C7A56"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: "#1C7A56",
                marginBottom: "8px",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              You&apos;re all set!
            </h2>
            <p
              style={{
                fontSize: "0.92rem",
                color: "#4A5D50",
                lineHeight: 1.6,
                marginBottom: "22px",
              }}
            >
              Your Starter Kit is downloading. Use it to land that research
              position.
            </p>

            <button
              onClick={onClose}
              style={{
                padding: "12px 32px",
                fontSize: "0.9rem",
                fontWeight: 700,
                borderRadius: "12px",
                border: "1.5px solid rgba(28,122,86,0.2)",
                background: "transparent",
                color: "#1C7A56",
                cursor: "pointer",
                fontFamily: "'Playfair Display', Georgia, serif",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(28,122,86,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes skModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes skModalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
