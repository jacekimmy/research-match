"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "lifetime_spots_claimed")
      .single()
      .then(({ data }) => {
        const claimed = parseInt(data?.value ?? "0", 10);
        setSpotsLeft(200 - claimed);
      });
  }, []);

  return (
    <>
      <div className="splotches">
        <div className="splotch splotch-1" />
        <div className="splotch splotch-2" />
        <div className="splotch splotch-3" />
        <div className="splotch splotch-4" />
        <div className="splotch splotch-5" />
      </div>

      {/* NAV */}
      <nav className="landing-nav">
        <span className="landing-nav-logo">Research Match</span>
        <div className="landing-nav-links">
          <a href="#pricing" className="landing-nav-link">Pricing</a>
          <Link href="/app" className="landing-nav-link">Log in</Link>
          <Link href="/app" className="btn-cta" style={{ padding: "10px 28px", fontSize: "0.95rem" }}>Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1 className="hero-headline">
          What takes 8 hours of professor research, done in 5 minutes.
        </h1>
        <p className="hero-sub">
          Find professors who match your research interests. See their recent papers in plain English. Write emails that actually get responses.
        </p>
        <p className="hero-proof">
          A Princeton professor responded to a high school freshman within 24 hours using this tool.
        </p>
        <div className="hero-ctas">
          <Link href="/app" className="btn-cta hero-cta-primary">Start searching for free</Link>
          <a href="#pricing" className="btn-secondary hero-cta-secondary">See pricing</a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <h2 className="section-title">How it works</h2>
        <div className="steps-grid">
          <div className="glass-card step-card">
            <div className="step-num">1</div>
            <h3 className="step-title">Search by interest or professor name</h3>
            <p className="step-desc">Enter a research topic like &ldquo;machine learning&rdquo; and a university. Or just search a professor&apos;s name directly.</p>
          </div>
          <div className="glass-card step-card">
            <div className="step-num">2</div>
            <h3 className="step-title">Get plain-English summaries of their recent papers</h3>
            <p className="step-desc">See what they actually work on, their key findings, and which papers they led &mdash; no jargon, no guessing.</p>
          </div>
          <div className="glass-card step-card">
            <div className="step-num">3</div>
            <h3 className="step-title">Write your email with built-in guidance</h3>
            <p className="step-desc">Draft your cold email with a reference panel, suggested questions, and a red-flag checker that catches common mistakes.</p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="proof-section">
        <h2 className="section-title">What people are saying</h2>
        <div className="proof-grid">
          <div className="glass-card proof-card">
            <p className="proof-quote">&ldquo;This is actually good.&rdquo;</p>
            <p className="proof-author">Professor, r/AskAcademia</p>
          </div>
          <div className="glass-card proof-card">
            <p className="proof-quote">&ldquo;Endorse this advice 100%. If an email smells of AI I will not answer it.&rdquo;</p>
            <p className="proof-author">Research Professor</p>
          </div>
          <div className="glass-card proof-card">
            <p className="proof-quote">&ldquo;The grad student point is underrated. Most people skip it entirely.&rdquo;</p>
            <p className="proof-author">Admitted MD Student</p>
          </div>
          <div className="glass-card proof-card">
            <p className="proof-quote">&ldquo;Your website has made my task very easy and simple.&rdquo;</p>
            <p className="proof-author">Student user</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <h2 className="section-title">Simple pricing</h2>
        <p className="pricing-subtitle">Start free. Upgrade when you need more.</p>

        {/* Billing toggle */}
        <div className="billing-toggle">
          <button
            onClick={() => setBilling("monthly")}
            className={`pill ${billing === "monthly" ? "pill-active" : ""}`}
            style={{ borderRadius: "999px 0 0 999px", padding: "10px 24px" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`pill ${billing === "annual" ? "pill-active" : ""}`}
            style={{ borderRadius: "0 999px 999px 0", padding: "10px 24px" }}
          >
            Annual <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>(save 64%)</span>
          </button>
        </div>

        <div className="pricing-grid">
          {/* FREE */}
          <div className="glass-card pricing-card">
            <h3 className="pricing-tier">Free</h3>
            <p className="pricing-price">$0</p>
            <p className="pricing-period">forever</p>
            <ul className="pricing-features">
              <li>3 searches per month</li>
              <li>Basic paper summaries</li>
              <li>Get started and see if it&apos;s right for you</li>
            </ul>
            <Link href="/app" className="btn-secondary pricing-btn">Start for free</Link>
          </div>

          {/* STUDENT */}
          <div className="glass-card pricing-card pricing-card-popular">
            <div className="pricing-badge">Most Popular</div>
            <h3 className="pricing-tier">Student</h3>
            <p className="pricing-price">{billing === "monthly" ? "$9" : "$39"}</p>
            <p className="pricing-period">{billing === "monthly" ? "/month" : "/year"}</p>
            <ul className="pricing-features">
              <li>Unlimited searches</li>
              <li>Full paper summaries with author position labels</li>
              <li>Email checker with sycophantic tone detection</li>
              <li>Saved professors</li>
              <li>All tips and closing suggestions</li>
            </ul>
            <Link href="/app?upgrade=student" className="btn-cta pricing-btn">Upgrade to Student</Link>
          </div>

          {/* LIFETIME */}
          <div className="glass-card pricing-card pricing-card-lifetime">
            <div className="pricing-badge pricing-badge-special">Launch Special</div>
            <h3 className="pricing-tier">Lifetime</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <p className="pricing-price">$20</p>
              <p style={{ textDecoration: "line-through", color: "#A8AB92", fontSize: "1.1rem" }}>$108/year</p>
            </div>
            <p className="pricing-period">one-time payment</p>
            {spotsLeft !== null && spotsLeft > 0 && (
              <p className="pricing-spots">{spotsLeft} of 200 spots remaining</p>
            )}
            {spotsLeft !== null && spotsLeft <= 0 && (
              <p className="pricing-spots" style={{ color: "#9B3322" }}>Sold out</p>
            )}
            <ul className="pricing-features">
              <li>Everything in Student, forever</li>
              <li>Limited to first 200 users</li>
              <li>No recurring charges</li>
            </ul>
            {spotsLeft !== null && spotsLeft > 0 ? (
              <Link href="/app?upgrade=lifetime" className="btn-cta pricing-btn">Claim your spot</Link>
            ) : (
              <button disabled className="btn-cta pricing-btn" style={{ opacity: 0.4 }}>Sold out</button>
            )}
          </div>

          {/* PRO */}
          <div className="glass-card pricing-card pricing-card-pro">
            <div className="pricing-badge pricing-badge-coming">Coming Soon</div>
            <h3 className="pricing-tier">Pro</h3>
            <p className="pricing-price">$74.99</p>
            <p className="pricing-period">one-time</p>
            <ul className="pricing-features">
              <li>Lab Intelligence Suite</li>
              <li>Funding radar</li>
              <li>Undergrad hiring signal</li>
              <li>Smart pivot engine</li>
              <li>Grad student gateway</li>
            </ul>
            <Link href="/app?waitlist=true" className="btn-secondary pricing-btn">Join waitlist</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <span className="footer-logo">Research Match</span>
          <div className="footer-links">
            <Link href="/app">App</Link>
            <a href="#pricing">Pricing</a>
            <a href="mailto:support@researchmatch.app">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
