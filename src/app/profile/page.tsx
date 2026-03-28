"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [searchesThisSession, setSearchesThisSession] = useState(0);
  const [memberSince, setMemberSince] = useState("");
  const [daysActive, setDaysActive] = useState(0);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
    if (profile?.created_at) {
      const created = new Date(profile.created_at);
      setMemberSince(created.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
      setDaysActive(Math.max(1, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))));
    }
    // Get session searches from localStorage
    const s = parseInt(localStorage.getItem("research-match-searches") || "0", 10);
    setSearchesThisSession(s);
  }, [profile]);

  useEffect(() => {
    refreshProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glass-card" style={{ padding: "48px", textAlign: "center", maxWidth: "400px" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔒</p>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1C7A56", marginBottom: "12px" }}>Sign in to view your profile</h2>
          <Link href="/app" className="btn-cta rm-search-btn" style={{ display: "inline-block", padding: "12px 28px", textDecoration: "none", marginTop: "8px" }}>
            Go to app
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = profile?.plan_type === "student_monthly" || profile?.plan_type === "student_annual" || profile?.plan_type === "lifetime";
  const planLabel = profile?.plan_type === "lifetime"
    ? "Lifetime"
    : isPaid
      ? profile?.plan_type === "student_annual" ? "Student (Annual)" : "Student (Monthly)"
      : "Free";
  const summariesUsed = profile?.searches_used ?? 0;
  const summariesLeft = isPaid ? "Unlimited" : `${Math.max(0, 3 - summariesUsed)} of 3`;
  const resetDate = profile?.searches_reset_at
    ? new Date(profile.searches_reset_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";
  const initial = user.email?.charAt(0).toUpperCase() || "?";

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>
      {/* Background splotches */}
      <div className="splotches">
        <div className="splotch splotch-1" />
        <div className="splotch splotch-2" />
        <div className="splotch splotch-3" />
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {/* Back nav */}
        <Link href="/app" className="btn-cta" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "10px 22px", fontSize: "0.85rem", textDecoration: "none", marginBottom: "40px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Back to search
        </Link>

        {/* Profile header */}
        <div className={`glass-card ${animateIn ? "card-enter" : ""}`} style={{
          padding: "48px 40px", textAlign: "center", marginBottom: "24px",
          background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.35))",
        }}>
          {/* Big avatar */}
          <div style={{
            width: "90px", height: "90px", borderRadius: "50%",
            background: "linear-gradient(135deg, #1C7A56, #2E9E72)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            color: "#F5F0E6", fontSize: "2.2rem", fontWeight: 700,
            boxShadow: "0 8px 32px rgba(28,122,86,0.25)",
            border: "3px solid rgba(255,255,255,0.5)",
            animation: "profilePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}>
            {initial}
          </div>

          <h1 style={{
            fontSize: "1.6rem", fontWeight: 700, color: "#1C7A56",
            marginBottom: "6px", letterSpacing: "-0.01em",
          }}>
            {user.email}
          </h1>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              padding: "5px 16px", borderRadius: "999px",
              background: isPaid ? "#1C7A56" : "rgba(28,122,86,0.1)",
              color: isPaid ? "#F5F0E6" : "#1C7A56",
            }}>
              {planLabel}
            </span>
            <span style={{
              fontSize: "0.75rem", fontWeight: 600, color: "#7A8E80",
              padding: "5px 16px", borderRadius: "999px",
              background: "rgba(168,196,178,0.15)",
            }}>
              Member since {memberSince}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px", marginBottom: "24px",
        }}>
          {[
            { label: "Summaries left", value: summariesLeft, icon: "📄", sub: isPaid ? "No limits" : `Resets ${resetDate}` },
            { label: "Days active", value: daysActive.toString(), icon: "📅", sub: "Keep going!" },
            { label: "Professors saved", value: (JSON.parse(localStorage.getItem("research-match-saved") || "[]")).length.toString(), icon: "⭐", sub: "Your picks" },
          ].map((stat, i) => (
            <div key={stat.label} className={`glass-card ${animateIn ? "card-enter" : ""}`} style={{
              padding: "28px 20px", textAlign: "center",
              animationDelay: `${0.1 + i * 0.08}s`,
            }}>
              <span style={{ fontSize: "1.6rem", display: "block", marginBottom: "10px" }}>{stat.icon}</span>
              <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1C7A56", letterSpacing: "-0.02em" }}>{stat.value}</p>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4A5D50", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "4px" }}>{stat.label}</p>
              <p style={{ fontSize: "0.7rem", color: "#A8C4B2", marginTop: "6px" }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Plan details */}
        <div className={`glass-card ${animateIn ? "card-enter" : ""}`} style={{
          padding: "32px", marginBottom: "24px",
          animationDelay: "0.35s",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1C7A56", marginBottom: "20px" }}>Your Plan</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { feature: "Full research summaries", included: true },
              { feature: "Suggested questions", included: true },
              { feature: "Author position labels", included: true },
              { feature: "Save professors", included: true },
              { feature: "Paper links", included: true },
              { feature: "Unlimited summaries", included: isPaid },
              { feature: "Email checker", included: isPaid },
              { feature: "Professor email finder", included: isPaid },
              { feature: "Nearby professor access", included: isPaid },
            ].map((item) => (
              <div key={item.feature} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "8px 0",
                opacity: item.included ? 1 : 0.45,
              }}>
                <span style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem",
                  background: item.included ? "rgba(28,122,86,0.12)" : "rgba(149,173,157,0.1)",
                  color: item.included ? "#1C7A56" : "#A8C4B2",
                }}>
                  {item.included ? "✓" : "—"}
                </span>
                <span style={{ fontSize: "0.9rem", color: item.included ? "#2C3E34" : "#7A8E80" }}>
                  {item.feature}
                </span>
                {!item.included && (
                  <span style={{ fontSize: "0.65rem", color: "#A8C4B2", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Student</span>
                )}
              </div>
            ))}
          </div>

          {!isPaid && profile?.plan_type !== "lifetime" && (
            <button
              onClick={async () => {
                const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDENT_MONTHLY || "price_1TF4pEFINW44xCyF0nDRsX8l";
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ priceId, userId: user?.id }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              className="btn-cta rm-search-btn"
              style={{
                display: "block", width: "100%", textAlign: "center", padding: "14px",
                marginTop: "24px", fontSize: "0.95rem", border: "none", cursor: "pointer",
              }}
            >
              Upgrade to Student — $5/mo
            </button>
          )}
        </div>

        {/* Actions */}
        <div className={`glass-card ${animateIn ? "card-enter" : ""}`} style={{
          padding: "32px", marginBottom: "40px",
          animationDelay: "0.45s",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1C7A56", marginBottom: "20px" }}>Account</h2>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/feedback" className="btn-secondary" style={{
              padding: "10px 22px", fontSize: "0.85rem", textDecoration: "none",
            }}>
              Give feedback
            </Link>
            <button
              onClick={async () => { await signOut(); window.location.href = "/"; }}
              className="btn-secondary"
              style={{ padding: "10px 22px", fontSize: "0.85rem", color: "#9B3322" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
