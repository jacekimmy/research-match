"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StarterKitModal from "./components/StarterKitModal";

const HERO_PLACEHOLDERS = [
  "e.g. machine learning",
  "e.g. neuroscience",
  "e.g. organic chemistry",
  "e.g. political science",
  "e.g. cardiology",
  "e.g. astrophysics",
  "e.g. behavioral economics",
];

export default function LandingPage() {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");
  const [heroUni, setHeroUni] = useState("");
  const [heroFocused, setHeroFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [priceAnimating, setPriceAnimating] = useState(false);
  const [priceKey, setPriceKey] = useState(0);
  const billingToggleRef = useRef<HTMLDivElement>(null);
  const btnMonthlyRef = useRef<HTMLButtonElement>(null);
  const btnAnnualRef = useRef<HTMLButtonElement>(null);
  const [, setBillingMounted] = useState(false);
  const [inlineWaitlistEmail, setInlineWaitlistEmail] = useState("");
  const [inlineWaitlistDone, setInlineWaitlistDone] = useState(false);
  const [lifetimeSpotsRemaining, setLifetimeSpotsRemaining] = useState<number | null>(null);
  const [showStarterKit, setShowStarterKit] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistTier, setWaitlistTier] = useState<"research_pro" | "pro" | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => { setBillingMounted(true); }, []);
  useEffect(() => { setTimeout(() => setHeroVisible(true), 80); }, []);

  function switchBilling(cycle: "monthly" | "annual") {
    if (cycle === billingCycle) return;
    setPriceAnimating(true);
    setTimeout(() => {
      setBillingCycle(cycle);
      setPriceKey(k => k + 1);
      setPriceAnimating(false);
    }, 220);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % HERO_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/lifetime-spots")
      .then((r) => r.json())
      .then((d) => setLifetimeSpotsRemaining(d.remaining ?? 200))
      .catch(() => setLifetimeSpotsRemaining(200));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function heroSearch() {
    if (!heroQuery.trim()) return;
    const params = new URLSearchParams();
    params.set("q", heroQuery.trim());
    if (heroUni.trim()) params.set("u", heroUni.trim());
    router.push(`/app?${params.toString()}`);
  }

  async function joinInlineWaitlist() {
    if (!inlineWaitlistEmail) return;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inlineWaitlistEmail, tier: "general" }),
      });
      setInlineWaitlistDone(true);
    } catch { /* ignore */ }
  }

  async function joinWaitlist() {
    if (!waitlistEmail || !waitlistTier) return;
    setWaitlistLoading(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, tier: waitlistTier }),
      });
      setWaitlistDone(true);
    } catch { /* ignore */ }
    finally { setWaitlistLoading(false); }
  }

  return (
    <div className="lp-root">
      {/* ── Animated background orbs ── */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* ── Floating pill nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-pill">
          <Link href="/" className="lp-nav-logo">
            <span className="lp-nav-logo-mark">&#128300;</span>
            Research Match
          </Link>
          <div className="lp-nav-spacer" />
          <div className="lp-nav-links">
            <a href="#how" className="lp-nav-link">How it works</a>
            <Link href="/blog" className="lp-nav-link">Blog</Link>
            <a href="#pricing" className="lp-nav-link">Pricing</a>
            <Link href="/feedback" className="lp-nav-link">Feedback</Link>
          </div>
          <Link href="/app" className="lp-nav-cta">
            Start free
            <span className="lp-nav-cta-arrow">→</span>
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className={`lp-hero ${heroVisible ? "lp-hero-visible" : ""}`}>
        <div className="lp-hero-inner">
          <div className="lp-hero-eyebrow">
            <span className="lp-eyebrow-dot" />
            250M+ papers indexed · 1,000+ universities
          </div>

          <h1 className="lp-hero-title">
            Find the professor<br />
            <em className="lp-hero-title-em">who changes your life.</em>
          </h1>

          <p className="lp-hero-sub">
            Find the right professor, understand their research, and craft an email built on advice from real professors, in under 10 minutes.
          </p>

          {/* Hero search */}
          <div
            className={`lp-search-bar ${heroFocused ? "lp-search-focused" : ""}`}
          >
            <div className="lp-search-field">
              <label className="lp-search-label">Research Interest</label>
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                onFocus={() => setHeroFocused(true)}
                onBlur={() => setHeroFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && heroSearch()}
                placeholder={HERO_PLACEHOLDERS[placeholderIdx]}
                className="lp-search-input"
              />
            </div>
            <div className="lp-search-divider" />
            <div className="lp-search-field" style={{ flex: "0.75" }}>
              <label className="lp-search-label">University</label>
              <input
                type="text"
                value={heroUni}
                onChange={(e) => setHeroUni(e.target.value)}
                onFocus={() => setHeroFocused(true)}
                onBlur={() => setHeroFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && heroSearch()}
                placeholder="e.g. MIT, Stanford…"
                className="lp-search-input"
              />
            </div>
            <button onClick={heroSearch} className="lp-search-btn">
              <span>Search</span>
            </button>
          </div>

          <div className="lp-hero-sub-actions">
            <Link href="/app" className="lp-ghost-btn">
              Browse without searching
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="lp-scroll-cue">
          <div className="lp-scroll-line" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SOCIAL PROOF STRIP
      ══════════════════════════════════════════ */}
      <div className="lp-proof-strip" data-reveal>
        {[
          { num: "250M+", label: "papers indexed" },
          { num: "1,000+", label: "universities" },
          { num: "400+", label: "students served" },
          { num: "< 24h", label: "first professor response" },
        ].map((s, i) => (
          <div key={i} className="lp-proof-item">
            <span className="lp-proof-num">{s.num}</span>
            <span className="lp-proof-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="how" className="lp-features-section">
        <div className="lp-features-label" data-reveal>How it works</div>

        {/* Feature 1 */}
        <div className="lp-feature" data-reveal>
          <div className="lp-feature-text">
            <div className="lp-feature-num">01</div>
            <h2 className="lp-feature-title">Search any research interest.</h2>
            <p className="lp-feature-desc">
              Type what you care about — quantum computing, cognitive neuroscience, climate policy.
              We surface the top professors publishing in that exact space, ranked by impact.
            </p>
            <Link href="/app" className="lp-feature-link">Try a search →</Link>
          </div>
          <div className="lp-feature-visual">
            <div className="lp-mockup">
              <div className="lp-mockup-bar">
                <div className="lp-dot" style={{ background: "#ff5f57" }} />
                <div className="lp-dot" style={{ background: "#febc2e" }} />
                <div className="lp-dot" style={{ background: "#28c840" }} />
                <span className="lp-mockup-url">researchmatch.net/app</span>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mock-search">
                  <span className="lp-mock-pill">neuroscience</span>
                  <span className="lp-mock-pill lp-mock-pill-uni">Harvard</span>
                </div>
                {[
                  { name: "Dr. Emily Nakamura", uni: "Harvard Medical School", topics: ["Memory", "fMRI"] },
                  { name: "Prof. James Miller", uni: "MIT", topics: ["Neural Circuits", "AI"] },
                  { name: "Dr. Aisha Patel", uni: "Stanford", topics: ["Computational", "BCI"] },
                ].map((p, i) => (
                  <div key={i} className="lp-mock-card" style={{ animationDelay: `${i * 0.12}s` }}>
                    <div className="lp-mock-card-name">{p.name}</div>
                    <div className="lp-mock-card-uni">{p.uni}</div>
                    <div className="lp-mock-card-tags">
                      {p.topics.map((t, j) => <span key={j} className="lp-mock-tag">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 — reversed */}
        <div className="lp-feature lp-feature-rev" data-reveal>
          <div className="lp-feature-text">
            <div className="lp-feature-num">02</div>
            <h2 className="lp-feature-title">Understand their research in plain English.</h2>
            <p className="lp-feature-desc">
              Every professor gets an AI summary of their key findings — written so a high schooler
              can understand it and use it in their email. No more pretending to read papers.
            </p>
            <Link href="/app" className="lp-feature-link">See an example →</Link>
          </div>
          <div className="lp-feature-visual">
            <div className="lp-mockup">
              <div className="lp-mockup-bar">
                <div className="lp-dot" style={{ background: "#ff5f57" }} />
                <div className="lp-dot" style={{ background: "#febc2e" }} />
                <div className="lp-dot" style={{ background: "#28c840" }} />
                <span className="lp-mockup-url">researchmatch.net/app</span>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mock-summary-header">
                  <div className="lp-mock-summary-name">Dr. Emily Nakamura</div>
                  <span className="lp-mock-tag" style={{ fontSize: "0.6rem" }}>Harvard</span>
                </div>
                <p className="lp-mock-summary-text">
                  Studies how memories form and consolidate during sleep using fMRI.
                  Recent work shows neural oscillation patterns predict next-day recall accuracy
                  in elderly patients with early cognitive decline.
                </p>
                <div className="lp-mock-finding">
                  <div className="lp-mock-finding-label">Key Finding</div>
                  <p className="lp-mock-finding-text">
                    Theta oscillations during REM sleep increased memory consolidation by 34% —
                    published 2024, first-author.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="lp-feature" data-reveal>
          <div className="lp-feature-text">
            <div className="lp-feature-num">03</div>
            <h2 className="lp-feature-title">Write emails that get read.</h2>
            <p className="lp-feature-desc">
              Our email checker — built from real professor feedback — catches every mistake
              before you hit send. Generic tone, AI language, vague ask. Fixed before it costs you.
            </p>
            <Link href="/app" className="lp-feature-link">Check your email →</Link>
          </div>
          <div className="lp-feature-visual">
            <div className="lp-mockup">
              <div className="lp-mockup-bar">
                <div className="lp-dot" style={{ background: "#ff5f57" }} />
                <div className="lp-dot" style={{ background: "#febc2e" }} />
                <div className="lp-dot" style={{ background: "#28c840" }} />
                <span className="lp-mockup-url">researchmatch.net/app</span>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mock-email">
                  <div className="lp-mock-email-line">
                    <span className="lp-mock-strike">I found your work fascinating and groundbreaking.</span>
                  </div>
                  <div className="lp-mock-email-line" style={{ marginTop: "8px" }}>
                    <span className="lp-mock-good">I read your 2024 paper on theta oscillations. The 34% improvement in memory consolidation surprised me because...</span>
                  </div>
                </div>
                <div className="lp-mock-flags">
                  <div className="lp-mock-flag lp-mock-flag-bad">
                    <span>⚠</span>
                    <span>Sycophantic tone</span>
                    <span className="lp-mock-flag-action">Remove flattery</span>
                  </div>
                  <div className="lp-mock-flag lp-mock-flag-good">
                    <span>✓</span>
                    <span>Specific reference</span>
                    <span className="lp-mock-flag-action">Cites real data</span>
                  </div>
                  <div className="lp-mock-flag lp-mock-flag-good">
                    <span>✓</span>
                    <span>Original voice</span>
                    <span className="lp-mock-flag-action">No AI detected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DARK CALLOUT
      ══════════════════════════════════════════ */}
      <section className="lp-dark-callout" data-reveal>
        <div className="lp-dark-callout-inner">
          <p className="lp-dark-callout-eyebrow">The truth about cold emails</p>
          <h2 className="lp-dark-callout-title">
            Professors delete 90% of student emails<br />
            <span className="lp-dark-callout-em">before finishing the first line.</span>
          </h2>
          <div className="lp-dark-reasons">
            {[
              "Professors can spot AI-written emails instantly.",
              "Generic emails that could be sent to anyone get ignored.",
              "Name-dropping papers without understanding them backfires.",
            ].map((r, i) => (
              <div key={i} className="lp-dark-reason">
                <span className="lp-dark-reason-x">✕</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
          <Link href="/app" className="lp-dark-cta">
            Write one that gets read →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOUNDER NOTE
      ══════════════════════════════════════════ */}
      <section className="lp-founder-section" data-reveal>
        <div className="lp-founder-inner">
          <div className="lp-founder-quote-mark">"</div>
          <blockquote className="lp-founder-quote">
            When I was a high school freshman, I used this approach to cold email 5 professors.
            A Princeton astrophysics professor responded within 24 hours and said I was
            &lsquo;way ahead of the curve.&rsquo; That&apos;s why I built Research Match.
          </blockquote>
          <div className="lp-founder-sig">
            <div className="lp-founder-avatar">J</div>
            <div>
              <div className="lp-founder-name">Jace</div>
              <div className="lp-founder-role">Founder, Research Match</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS (directly above pricing)
      ══════════════════════════════════════════ */}
      <section className="lp-social-section" data-reveal>
        <div className="lp-social-label">What students say</div>
        <div className="lp-quotes-grid">
          {[
            { quote: "I got a reply in 3 days. Never happened before.", author: "Undergraduate student" },
            { quote: "A Princeton professor responded to a high school freshman within 24 hours.", author: "Founder experience" },
            { quote: "Endorse this advice 💯. If an email smells of AI I will not answer it.", author: "Research Professor" },
            { quote: "First time I've gotten real advice on my emails. I've sent 10 emails so far using this.", author: "Student user" },
            { quote: "This website is goated. I'm saving this for future use.", author: "Student user" },
          ].map((item, i) => (
            <div key={i} className="lp-quote-card">
              <div className="lp-quote-mark">"</div>
              <p className="lp-quote-text">{item.quote}</p>
              <p className="lp-quote-author">— {item.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section id="pricing" className="lp-pricing-section" data-reveal>
        {/* Urgency banner */}
        <div className="lp-urgency-banner">
          Most students start professor outreach 60 days before application deadlines.
        </div>

        <div className="lp-pricing-header">
          <p className="lp-risk-reversal-top">Try it risk-free. Full refund if it doesn&apos;t work.</p>
          <h2 className="lp-pricing-title">Simple, honest pricing.</h2>
          <p className="lp-pricing-sub">One research position can change your entire career. We charge $15.</p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "44px" }}>
          <div className="mode-toggle" ref={billingToggleRef} style={{ marginBottom: 0 }}>
            <div
              className="mode-toggle-slider"
              style={{
                left: billingCycle === "monthly"
                  ? (btnMonthlyRef.current?.offsetLeft ?? 4) + "px"
                  : (btnAnnualRef.current?.offsetLeft ?? 100) + "px",
                width: billingCycle === "monthly"
                  ? (btnMonthlyRef.current?.offsetWidth ?? 110) + "px"
                  : (btnAnnualRef.current?.offsetWidth ?? 95) + "px",
              }}
            />
            <button
              ref={btnMonthlyRef}
              onClick={() => switchBilling("monthly")}
              className={`mode-toggle-btn ${billingCycle === "monthly" ? "mode-toggle-btn-active" : ""}`}
            >
              Monthly
            </button>
            <button
              ref={btnAnnualRef}
              onClick={() => switchBilling("annual")}
              className={`mode-toggle-btn ${billingCycle === "annual" ? "mode-toggle-btn-active" : ""}`}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="lp-pricing-grid">
          {/* Lifetime — featured, most prominent */}
          <div className="lp-price-card lp-price-card-lifetime lp-price-card-lifetime-hero">
            <div className="lp-best-value-badge">Best Value</div>
            <div className="lp-price-tier" style={{ color: "#A8893E" }}>Lifetime</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <div className="lp-price-amount" style={{ color: "#A8893E" }}>$25</div>
              <div className="lp-price-amount" style={{ color: "#A8893E", opacity: 0.4, textDecoration: "line-through", fontSize: "1.4rem" }}>$60</div>
            </div>
            <div className="lp-price-period" style={{ color: "#A8893E", opacity: 0.7 }}>one-time payment</div>
            <p className="lp-lifetime-tagline">Less than 2 months of monthly. Yours forever.</p>
            <ul className="lp-price-features">
              <li style={{ fontWeight: 700 }}><span className="lp-check" style={{ color: "#A8893E" }}>✓</span>Everything in Student, forever:</li>
              {["Unlimited searches", "Unlimited summaries", "Email checker", "Professor email finder", "Nearby professor access"].map((f) => (
                <li key={f}><span className="lp-check" style={{ color: "#A8893E" }}>✓</span>{f}</li>
              ))}
            </ul>
            {lifetimeSpotsRemaining === 0 ? (
              <button disabled className="lp-price-btn" style={{ background: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }}>Sold out</button>
            ) : (
              <Link href="/app?upgrade=lifetime" className="lp-price-btn lp-price-btn-gold">
                Claim your spot
              </Link>
            )}
            <p className="lp-refund-note">Not satisfied in 30 days? Full refund.</p>
          </div>

          {/* Student — monthly/annual */}
          <div className="lp-price-card lp-price-card-featured">
            <div className="lp-price-tier" style={{ color: "#9dbfaa" }}>Student</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span className="lp-price-dollar">$</span>
              <div className="price-roller-wrap">
                {priceAnimating ? (
                  <div className="price-roller price-roller-exit">
                    <span className="lp-price-amount" style={{ color: "#fff" }}>{billingCycle === "monthly" ? "15" : "108"}</span>
                  </div>
                ) : (
                  <div key={priceKey} className="price-roller price-roller-enter">
                    <span className="lp-price-amount" style={{ color: "#fff" }}>{billingCycle === "monthly" ? "15" : "108"}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="price-roller-wrap" style={{ minHeight: "20px", marginBottom: billingCycle === "annual" ? "12px" : "24px" }}>
              {!priceAnimating && (
                <div key={`period-${priceKey}`} className="price-roller price-roller-enter">
                  <div className="lp-price-period" style={{ color: "rgba(255,255,255,0.5)" }}>
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </div>
                </div>
              )}
            </div>
            {billingCycle === "annual" && (
              <div style={{ marginBottom: "20px" }}>
                <span style={{
                  display: "inline-block", background: "rgba(157,191,170,0.2)", border: "1px solid rgba(157,191,170,0.4)",
                  borderRadius: "10px", padding: "6px 14px",
                  fontSize: "0.78rem", fontWeight: 700, color: "#9dbfaa", letterSpacing: "0.02em",
                }}>
                  Save $72/year vs monthly
                </span>
              </div>
            )}
            <ul className="lp-price-features" style={{ color: "rgba(255,255,255,0.8)" }}>
              <li style={{ color: "#fff", fontWeight: 700 }}><span className="lp-check" style={{ color: "#9dbfaa" }}>✓</span>Everything in Free, plus:</li>
              {["Unlimited research summaries", "Email checker", "Professor email finder", "Responsiveness indicator"].map((f) => (
                <li key={f}><span className="lp-check" style={{ color: "#9dbfaa" }}>✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/app?upgrade=true" className="lp-price-btn lp-price-btn-white">
              Upgrade to Student
            </Link>
            <p className="lp-refund-note" style={{ color: "rgba(255,255,255,0.5)" }}>Not satisfied in 30 days? Full refund.</p>
          </div>

          {/* Free — smallest, least prominent */}
          <div className="lp-price-card lp-price-card-free">
            <div className="lp-price-tier">Free</div>
            <div className="lp-price-amount">$0</div>
            <div className="lp-price-period">forever</div>
            <ul className="lp-price-features">
              {["Unlimited professor searches", "2 research summaries", "Author position labels", "Save professors", "Paper links"].map((f) => (
                <li key={f}><span className="lp-check">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/app" className="lp-price-btn lp-price-btn-ghost">
              Start free
            </Link>
          </div>
        </div>

        {/* Inline waitlist */}
        <div className="lp-waitlist" data-reveal>
          <p className="lp-waitlist-text">More plans coming. Want early access?</p>
          {inlineWaitlistDone ? (
            <p style={{ color: "#2d5a3d", fontWeight: 600 }}>You&apos;re on the list.</p>
          ) : (
            <div className="lp-waitlist-form">
              <input
                type="email"
                placeholder="your@email.com"
                value={inlineWaitlistEmail}
                onChange={(e) => setInlineWaitlistEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinInlineWaitlist()}
                className="lp-waitlist-input"
              />
              <button onClick={joinInlineWaitlist} className="btn-cta rm-search-btn" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
                Join waitlist
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="lp-final-cta" data-reveal>
        <div className="lp-final-cta-inner">
          <div className="lp-final-cta-eyebrow">Ready?</div>
          <h2 className="lp-final-cta-title">
            Your research position<br />is one email away.
          </h2>
          <p className="lp-final-cta-sub">
            Start searching free. No credit card required.
          </p>
          <div className="lp-final-cta-actions">
            <Link href="/app" className="lp-final-btn">
              Start searching free
              <span className="lp-final-btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <span>&#128300;</span> Research Match
          </div>
          <div className="lp-footer-links">
            <Link href="/app">Tool</Link>
            <Link href="/examples">Examples</Link>
            <Link href="/blog">Blog</Link>
            <a href="#pricing">Pricing</a>
            <Link href="/feedback">Feedback</Link>
          </div>
          <div className="lp-footer-copy">
            Built for the student who reaches out.
          </div>
        </div>
      </footer>


      {waitlistTier && (
        <div className="modal-overlay" style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(245,240,230,0.85)", backdropFilter: "blur(12px)",
        }} onClick={() => setWaitlistTier(null)}>
          <div className="glass-card modal-card" style={{ padding: "44px", maxWidth: "420px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            {waitlistDone ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🎉</p>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "10px" }}>You&apos;re on the list!</h3>
                <p style={{ fontSize: "0.95rem", color: "#6b7280", lineHeight: 1.6 }}>We&apos;ll email you when it launches.</p>
                <button onClick={() => setWaitlistTier(null)} className="btn-secondary" style={{ marginTop: "24px", padding: "12px 28px" }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "10px" }}>Join the waitlist</h3>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "24px", lineHeight: 1.6 }}>Enter your email to get notified when it launches.</p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinWaitlist()}
                  style={{ width: "100%", padding: "14px 18px", fontSize: "1rem", border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "14px", background: "rgba(255,255,255,0.5)", color: "#1a1a1a", fontFamily: "inherit", marginBottom: "16px", outline: "none" }}
                />
                <button onClick={joinWaitlist} disabled={waitlistLoading || !waitlistEmail} className="btn-cta landing-cta-primary rm-search-btn" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>
                  {waitlistLoading ? "Joining…" : "Join Waitlist"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
