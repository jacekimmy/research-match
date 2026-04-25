"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "rm_followup_used";

function formatDate(dateStr: string, addDays: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + addDays);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function FollowUpPage() {
  const { user, profile } = useAuth();
  const [originalEmail, setOriginalEmail] = useState("");
  const [sentDate, setSentDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ followUp1: string; followUp2: string; date1: string; date2: string } | null>(null);
  const [error, setError] = useState("");
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [freeUsed, setFreeUsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setFreeUsed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const isPaid = profile?.plan_type === "weekly" || profile?.plan_type === "semester" || profile?.plan_type === "student_monthly" || profile?.plan_type === "student_annual" || profile?.plan_type === "lifetime";

  async function handleSubmit() {
    if (!originalEmail.trim()) { setError("Paste your original email first."); return; }
    if (!sentDate) { setError("Pick the date you sent it."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: originalEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult({
        followUp1: data.followUp1,
        followUp2: data.followUp2,
        date1: formatDate(sentDate, 7),
        date2: formatDate(sentDate, 14),
      });
      if (!isPaid) {
        localStorage.setItem(STORAGE_KEY, "true");
        setFreeUsed(true);
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, which: 1 | 2) {
    navigator.clipboard.writeText(text);
    if (which === 1) { setCopied1(true); setTimeout(() => setCopied1(false), 2000); }
    else { setCopied2(true); setTimeout(() => setCopied2(false), 2000); }
  }

  const canSubmit = user && (isPaid || !freeUsed);
  const showUpgradeWall = mounted && user && !isPaid && freeUsed && !result;
  const showAuthWall = mounted && !user;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f0ea", position: "relative", overflowX: "hidden" }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 600, height: 600, top: -200, right: -150, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,162,101,0.10) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", width: 500, height: 500, bottom: "10%", left: -100, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,90,61,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "40px 20px 100px" }}>
        {/* Nav */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 52 }}>
          <Link href="/app" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#6b7280", textDecoration: "none", fontWeight: 500, padding: "8px 0", transition: "color 0.2s" }}>
            <span style={{ fontSize: "1rem" }}>←</span> Back to search
          </Link>
          <Link href="/" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2d5a3d", textDecoration: "none", fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Research Match
          </Link>
        </nav>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-block", fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#C4A265", background: "rgba(196,162,101,0.1)", border: "1px solid rgba(196,162,101,0.25)", borderRadius: 999, padding: "5px 16px", marginBottom: 18 }}>
            Follow-Up Timeline
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "#1a2e1f", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16, fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Don&apos;t let a good email<br />go to waste.
          </h1>
          <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            Paste the email you sent. We&apos;ll generate two follow-ups timed perfectly, each one written to feel like it came from you.
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px)", borderRadius: 24, border: "1px solid rgba(45,90,61,0.1)", boxShadow: "0 8px 48px rgba(45,90,61,0.07), inset 0 1px 0 rgba(255,255,255,0.9)", padding: "36px 32px", marginBottom: 36 }}>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2d5a3d", marginBottom: 10 }}>
              Your Original Email
            </label>
            <textarea
              value={originalEmail}
              onChange={e => setOriginalEmail(e.target.value)}
              placeholder="Paste the full email you sent to the professor here..."
              style={{ width: "100%", minHeight: 200, padding: "16px 18px", borderRadius: 14, border: "1.5px solid rgba(45,90,61,0.15)", background: "rgba(244,240,234,0.6)", fontSize: "0.9rem", color: "#1a1a1a", lineHeight: 1.7, resize: "vertical", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = "rgba(45,90,61,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(45,90,61,0.06)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(45,90,61,0.15)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2d5a3d", marginBottom: 10 }}>
              Date You Sent It
            </label>
            <input
              type="date"
              value={sentDate}
              onChange={e => setSentDate(e.target.value)}
              style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: "1.5px solid rgba(45,90,61,0.15)", background: "rgba(244,240,234,0.6)", fontSize: "0.9rem", color: "#1a1a1a", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = "rgba(45,90,61,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(45,90,61,0.06)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(45,90,61,0.15)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.85rem", color: "#b54040", marginBottom: 16, padding: "10px 14px", background: "rgba(181,64,64,0.06)", borderRadius: 10, border: "1px solid rgba(181,64,64,0.15)" }}>
              {error}
            </p>
          )}

          {/* Auth wall */}
          {showAuthWall && (
            <div style={{ textAlign: "center", padding: "20px 0 4px" }}>
              <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: 16 }}>Create a free account to generate your follow-ups.</p>
              <Link href="/app?signup=true" className="fu-btn-gold">
                Create free account
              </Link>
            </div>
          )}

          {/* Upgrade wall */}
          {showUpgradeWall && (
            <div style={{ textAlign: "center", padding: "20px 0 4px" }}>
              <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: 6 }}>You&apos;ve used your free follow-up.</p>
              <p style={{ fontSize: "0.82rem", color: "#9b8040", marginBottom: 16 }}>Upgrade for unlimited use.</p>
              <Link href="/app?upgrade=true" className="fu-btn-gold">
                Upgrade to Semester
              </Link>
            </div>
          )}

          {/* Submit button */}
          {!showAuthWall && !showUpgradeWall && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="fu-btn-gold"
              style={{ width: "100%", opacity: loading ? 0.75 : 1 }}
            >
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span className="fu-spinner" /> Generating your timeline...
                </span>
              ) : (
                "Generate Follow-Up Timeline →"
              )}
            </button>
          )}

          {!isPaid && canSubmit && !freeUsed && (
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", marginTop: 10 }}>
              Free accounts get 1 use. Upgrade for unlimited.
            </p>
          )}
        </div>

        {/* Timeline result */}
        {result && (
          <div ref={resultRef} className="fu-timeline-enter">
            {/* Timeline container */}
            <div style={{ position: "relative", paddingLeft: 40 }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 14, top: 24, bottom: 24, width: 2, background: "linear-gradient(180deg, #C4A265 0%, rgba(196,162,101,0.3) 50%, rgba(45,90,61,0.2) 100%)", borderRadius: 999 }} />

              {/* Follow-Up 1 */}
              <div style={{ position: "relative", marginBottom: 32 }} className="fu-card-enter-1">
                {/* Node */}
                <div style={{ position: "absolute", left: -33, top: 24, width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, #C4A265, #A8893E)", boxShadow: "0 0 0 4px rgba(196,162,101,0.18), 0 2px 8px rgba(196,162,101,0.35)" }} />
                {/* Card */}
                <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(196,162,101,0.2)", boxShadow: "0 4px 32px rgba(45,90,61,0.07), inset 0 1px 0 rgba(255,255,255,0.9)", padding: "28px 28px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#C4A265" }}>Follow-Up #1</span>
                      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#2d5a3d", marginTop: 4 }}>Send on {result.date1}</p>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#C4A265", background: "rgba(196,162,101,0.1)", border: "1px solid rgba(196,162,101,0.2)", borderRadius: 999, padding: "4px 12px" }}>7 days later</span>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.88rem", color: "#374151", lineHeight: 1.75, margin: 0, marginBottom: 20 }}>{result.followUp1}</pre>
                  <button
                    onClick={() => copy(result.followUp1, 1)}
                    className="fu-copy-btn"
                  >
                    {copied1 ? "✓ Copied!" : "Copy email"}
                  </button>
                </div>
              </div>

              {/* Follow-Up 2 */}
              <div style={{ position: "relative", marginBottom: 36 }} className="fu-card-enter-2">
                {/* Node */}
                <div style={{ position: "absolute", left: -33, top: 24, width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, #2d5a3d, #2E9E72)", boxShadow: "0 0 0 4px rgba(45,90,61,0.12), 0 2px 8px rgba(45,90,61,0.25)" }} />
                {/* Card */}
                <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(45,90,61,0.12)", boxShadow: "0 4px 32px rgba(45,90,61,0.07), inset 0 1px 0 rgba(255,255,255,0.9)", padding: "28px 28px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2d5a3d" }}>Follow-Up #2</span>
                      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#2d5a3d", marginTop: 4 }}>Send on {result.date2}</p>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2d5a3d", background: "rgba(45,90,61,0.07)", border: "1px solid rgba(45,90,61,0.15)", borderRadius: 999, padding: "4px 12px" }}>14 days later</span>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.88rem", color: "#374151", lineHeight: 1.75, margin: 0, marginBottom: 20 }}>{result.followUp2}</pre>
                  <button
                    onClick={() => copy(result.followUp2, 2)}
                    className="fu-copy-btn fu-copy-btn-green"
                  >
                    {copied2 ? "✓ Copied!" : "Copy email"}
                  </button>
                </div>
              </div>
            </div>

            {/* Move on message */}
            <div className="fu-card-enter-3" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", borderRadius: 20, border: "1px solid rgba(45,90,61,0.08)", padding: "28px 32px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: 10 }}>🤝</div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2d5a3d", marginBottom: 10 }}>
                After 2 follow-ups, it&apos;s time to move on.
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 420, margin: "0 auto 24px" }}>
                If you haven&apos;t heard back, it&apos;s not about you. Professors are busy, timing is off, or they&apos;re not taking students. Your energy is better spent finding someone who&apos;s excited about you.
              </p>
              <Link href="/app" className="fu-btn-green">
                Search for more professors →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
