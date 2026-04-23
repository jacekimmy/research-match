"use client";
import { useState, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const StarterKitModal = dynamic(() => import("./components/StarterKitModal"), { ssr: false });

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
  const [searchCount, setSearchCount] = useState<number | null>(null);
  const [activePricingIndex, setActivePricingIndex] = useState(0);
  const [activePricingTab, setActivePricingTab] = useState<string>("free");
  const pricingOptions = ["free", "weekly", "semester", "lifetime"] as const;

  const setPricingItem = (index: number) => {
    setActivePricingIndex(index);
    setActivePricingTab(pricingOptions[index]);
  };

  // Swipe handling
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activePricingIndex < pricingOptions.length - 1) {
      setPricingItem(activePricingIndex + 1);
    }
    if (isRightSwipe && activePricingIndex > 0) {
      setPricingItem(activePricingIndex - 1);
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  useEffect(() => { setBillingMounted(true); }, []);
  useEffect(() => { setHeroVisible(true); }, []);
  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => {
      startTransition(() => setSearchCount(d.searches));
    }).catch(() => { });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => setPlaceholderIdx((i) => (i + 1) % HERO_PLACEHOLDERS.length));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/lifetime-spots")
      .then((r) => r.json())
      .then((d) => { startTransition(() => setLifetimeSpotsRemaining(d.remaining ?? 200)); })
      .catch(() => { startTransition(() => setLifetimeSpotsRemaining(200)); });
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
    <div className="lp-root" style={{ overflowX: 'hidden' }}>
      <style>{`
        /* ── Universal Enforcements ── */
        .lp-pricing-slider-viewport {
          width: 100% !important;
          position: relative !important;
        }
        .lp-pricing-slider-track {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          width: 100% !important;
          transition: transform 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) !important;
          will-change: transform !important;
          align-items: stretch !important;
        }
        .lp-pricing-slider-slide {
          flex: 0 0 100% !important;
          width: 100% !important;
          padding: 0 24px !important;
          box-sizing: border-box !important;
        }
        .lp-price-card {
          height: 100% !important;
          min-height: 540px !important;
        }
        
        .lp-pricing-tabs {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
        }
        .lp-pricing-tab {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: clamp(0.65rem, 2.8vw, 0.85rem) !important;
          flex: 1 1 0% !important;
        }
        .lp-pricing-tab.lp-pricing-tab-active {
          background: transparent !important;
          transform: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        .lp-pricing-dots {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 14px !important;
          margin-top: 24px !important;
          margin-bottom: 40px !important;
        }
        .lp-pricing-dot {
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          background: rgba(45, 90, 61, 0.15) !important;
          cursor: pointer !important;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        .lp-pricing-dot.active {
          background: #2d5a3d !important;
          transform: scale(1.6) !important;
          box-shadow: 0 0 12px rgba(45, 90, 61, 0.25) !important;
        }

        /* ── Mobile Layout (<= 900px) ── */
        @media (max-width: 900px) {
          .lp-pricing-slider-viewport {
            max-width: 500px !important;
            margin: 0 auto !important;
            overflow: hidden !important;
            padding-top: 24px !important;
            padding-bottom: 40px !important;
          }
        }

        /* ── Desktop Layout (> 900px) ── */
        @media (min-width: 901px) {
          body .lp-root .lp-pricing-slider-viewport {
            max-width: none !important;
            overflow: visible !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          body .lp-root .lp-pricing-slider-track {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 24px !important;
            transform: none !important;
            width: auto !important;
          }
          body .lp-root .lp-pricing-slider-slide {
            flex: none !important;
            width: auto !important;
            padding: 0 !important;
          }
          body .lp-root .lp-pricing-tabs {
            display: none !important;
          }
          body .lp-root .lp-pricing-dots {
            display: none !important;
          }
        }
      `}</style>


      {/* ── Animated background orbs ── */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* ── Floating pill nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-pill">
          <Link href="/" className="lp-nav-logo">
            <svg width="180" height="32" viewBox="0 0 280 50" xmlns="http://www.w3.org/2000/svg" aria-label="Research Match">
              <circle cx="22" cy="22" r="15" fill="none" stroke="#2d5a3d" strokeWidth="4" />
              <path d="M33 33 L43 43" fill="none" stroke="#2d5a3d" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="16" y1="16" x2="28" y2="16" stroke="#C4A265" strokeWidth="3" strokeLinecap="round" />
              <line x1="16" y1="22" x2="28" y2="22" stroke="#C4A265" strokeWidth="3" strokeLinecap="round" />
              <line x1="16" y1="28" x2="28" y2="28" stroke="#C4A265" strokeWidth="3" strokeLinecap="round" />
              <text x="52" y="30" fontFamily="Georgia, 'Times New Roman', serif" fontSize="22" fontWeight="700" fill="#2d5a3d">Research Match</text>
            </svg>
          </Link>
          <div className="lp-nav-spacer" />
          <div className="lp-nav-links">
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
            Search 250M+ papers, find a professor who matches, and send an email worth replying to
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
          SOCIAL PROOF STRIP
      ══════════════════════════════════════════ */}
      <div className="lp-proof-strip" data-reveal>
        {[
          { num: "250M+", label: "papers indexed" },
          { num: "1,000+", label: "universities" },
          { num: searchCount !== null ? searchCount.toLocaleString() : "—", label: "students served" },
          { num: "< 24h", label: "first professor response" },
        ].map((s, i) => (
          <div key={i} className="lp-proof-item">
            <span className="lp-proof-num">{s.num}</span>
            <span className="lp-proof-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          WHY NOT CHATGPT
      ══════════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(to bottom, #ffffff, rgba(255,255,255,0))", padding: "100px 24px", margin: "0 0 100px 0", borderTop: "1px solid rgba(45,90,61,0.06)", borderBottom: "1px solid rgba(45,90,61,0.06)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }} data-reveal>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 700, color: "#2d5a3d", textAlign: "center", marginBottom: "64px", letterSpacing: "-0.02em" }}>
            Why not just use ChatGPT?
          </h2>

          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "40px 48px", boxShadow: "0 20px 60px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.05)" }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", marginBottom: "0", paddingBottom: "0" }} className="lp-vs-header">
              <div style={{ padding: "0 28px 20px 0", borderBottom: "2px solid #e5e7eb" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9ca3af" }}>ChatGPT</span>
              </div>
              <div style={{ padding: "0 0 20px 28px", borderBottom: "2px solid #2d5a3d", borderLeft: "none" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2d5a3d" }}>Research Match</span>
              </div>
            </div>

            {/* Rows */}
            {[
              {
                bad: "Hallucinates professors, fake papers, and wrong citation counts.",
                good: "Every professor and paper is pulled from 250M+ verified academic works. All real.",
              },
              {
                bad: "Writes your email for you; professors delete those instantly.",
                good: "Gives you the research so you write the email yourself; that's why it gets replies.",
              },
              {
                bad: "Takes 20 back-and-forth prompts to find professors and read their work.",
                good: "One search; professors, summaries, and email checker all in front of you.",
              },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }} className="lp-vs-row">
                <div style={{ padding: "32px 28px 32px 0", borderBottom: i === 2 ? "none" : "1px solid #f3f4f6", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, marginTop: "3px", fontSize: "0.85rem", color: "#d1d5db", fontWeight: 700 }}>✕</span>
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#9ca3af", lineHeight: 1.7 }}>{row.bad}</p>
                </div>
                <div style={{ padding: "32px 0 32px 28px", borderBottom: i === 2 ? "none" : "1px solid rgba(45,90,61,0.08)", borderLeft: "1px solid rgba(45,90,61,0.08)", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, marginTop: "3px", fontSize: "0.85rem", color: "#2d5a3d", fontWeight: 700 }}>✓</span>
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "#1a1a1a", lineHeight: 1.7, fontWeight: 500 }}>{row.good}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section className="lp-features-section">
        <div className="lp-features-label" data-reveal>The Platform</div>

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
            { quote: "Research Match saved me time for cold emailing professors. The paper summaries meant I didn't have to waste time finding key findings myself.", author: "Jedrek N., College Student" },
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
          <p className="lp-pricing-sub">One research position can change your entire career. One semester is all it takes.</p>
        </div>

        {/* Mobile: Tab toggle */}
        <div 
          className="lp-pricing-tabs" 
          data-reveal
          style={{
            display: 'flex',
            position: 'relative',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'nowrap',
            background: 'rgba(45, 90, 61, 0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(45, 90, 61, 0.1)',
            borderRadius: '100px',
            padding: '0',
            margin: '0 auto 40px',
            maxWidth: '440px',
            width: 'calc(100% - 40px)',
            overflow: 'hidden',
            height: '52px'
          }}
        >
          <div 
            className="lp-pricing-tabs-highlight" 
            style={{ 
              position: 'absolute',
              top: 0, bottom: 0, left: 0,
              width: `${100 / pricingOptions.length}%`,
              transform: `translateX(${activePricingIndex * 100}%)`,
              transition: 'transform 0.5s cubic-bezier(0.2, 1.6, 0.4, 1)',
              zIndex: 1,
              pointerEvents: 'none',
              padding: '4px',
              boxSizing: 'border-box'
            }} 
          >
            <div style={{
              width: '100%',
              height: '100%',
              background: '#2d5a3d',
              borderRadius: '100px',
              boxShadow: '0 4px 12px rgba(45, 90, 61, 0.3)'
            }} />
          </div>
          {pricingOptions.map((tab, idx) => (
            <button
              key={tab}
              className={`lp-pricing-tab${activePricingTab === tab ? " lp-pricing-tab-active" : ""}`}
              onClick={() => setPricingItem(idx)}
              style={{
                flex: '1',
                position: 'relative',
                zIndex: 2,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: activePricingTab === tab ? '#ffffff' : '#4b5563',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'color 0.4s ease',
                WebkitTapHighlightColor: 'transparent',
                margin: 0,
                boxShadow: 'none'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Desktop: 4-column grid | Mobile: single active card */}
        <div className="lp-pricing-slider-viewport" data-reveal>
          <div 
            className="lp-pricing-slider-track"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ 
              transform: `translateX(-${activePricingIndex * 100}%)`,
            }}
          >
            {/* Free */}
            <div className="lp-pricing-slider-slide">
              <div className="lp-price-card lp-price-card-free">
                <div className="lp-price-tier">Free</div>
                <div className="lp-price-amount">$0</div>
                <div className="lp-price-period">forever</div>
                <ul className="lp-price-features">
                  {["Unlimited professor searches", "1 full summary after signup", "Author position labels", "Save professors", "Paper links"].map((f) => (
                    <li key={f}><span className="lp-check">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/app" className="lp-price-btn lp-price-btn-ghost">
                  Start free
                </Link>
              </div>
            </div>

            {/* Weekly Sprint */}
            <div className="lp-pricing-slider-slide">
              <div className="lp-price-card">
                <div className="lp-price-tier">Weekly Sprint</div>
                <div className="lp-price-amount" style={{ color: "#2d5a3d" }}>$9</div>
                <div className="lp-price-period" style={{ opacity: 0.7 }}>1 week access</div>
                <ul className="lp-price-features">
                  <li style={{ fontWeight: 700 }}><span className="lp-check">✓</span>Software access:</li>
                  {["Unlimited research summaries", "Email checker", "Professor email finder", "Responsiveness indicator"].map((f) => (
                    <li key={f}><span className="lp-check">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/app?upgrade=weekly" className="lp-price-btn" style={{ background: "rgba(45, 90, 61, 0.08)", color: "#2d5a3d", border: "1px solid rgba(45, 90, 61, 0.2)" }}>
                  Start 1-Week Sprint — $9
                </Link>
              </div>
            </div>

            {/* Semester */}
            <div className="lp-pricing-slider-slide">
              <div className="lp-price-card">
                <div className="lp-price-tier">Semester</div>
                <div className="lp-price-amount" style={{ color: "#2d5a3d" }}>$29</div>
                <div className="lp-price-period" style={{ opacity: 0.7 }}>4 months access</div>
                <ul className="lp-price-features">
                  <li style={{ fontWeight: 700 }}><span className="lp-check">✓</span>Everything in Free, plus:</li>
                  {["Unlimited research summaries", "Email checker", "Professor email finder", "Responsiveness indicator"].map((f) => (
                    <li key={f}><span className="lp-check">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/app?upgrade=true" className="lp-price-btn" style={{ background: "rgba(45, 90, 61, 0.08)", color: "#2d5a3d", border: "1px solid rgba(45, 90, 61, 0.2)" }}>
                  Get Semester Access — $29
                </Link>
              </div>
            </div>

            {/* Lifetime */}
            <div className="lp-pricing-slider-slide">
              <div className="lp-price-card lp-price-card-lifetime lp-price-card-lifetime-hero">
                <div className="lp-best-value-badge">Best Value</div>
                <div className="lp-price-tier" style={{ color: "#A8893E" }}>Lifetime</div>
                <div className="lp-price-amount" style={{ color: "#A8893E" }}>$59</div>
                <div className="lp-price-period" style={{ color: "#A8893E", opacity: 0.7 }}>Yours forever.</div>
                <ul className="lp-price-features">
                  <li style={{ fontWeight: 700 }}><span className="lp-check" style={{ color: "#A8893E" }}>✓</span>Everything in Semester, plus:</li>
                  {["Never pay again", "Unlimited searches & summaries", "Email checker", "Professor email finder", "Nearby professor access", "Responsiveness indicator"].map((f) => (
                    <li key={f}><span className="lp-check" style={{ color: "#A8893E" }}>✓</span>{f}</li>
                  ))}
                </ul>
                {lifetimeSpotsRemaining === 0 ? (
                  <button disabled className="lp-price-btn" style={{ background: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }}>Sold out</button>
                ) : (
                  <Link href="/app?upgrade=lifetime" className="lp-price-btn lp-price-btn-gold">
                    Claim your spot — $59
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="lp-pricing-dots">
          {pricingOptions.map((_, idx) => (
            <div 
              key={idx} 
              className={`lp-pricing-dot ${activePricingIndex === idx ? 'active' : ''}`}
              onClick={() => setPricingItem(idx)}
            />
          ))}
        </div>

        {/* Global Bonus Strip (Moved out of cards for a cleaner UI) */}
        <div style={{ maxWidth: "800px", margin: "40px auto 30px", padding: "20px 24px", background: "rgba(45, 90, 61, 0.03)", borderRadius: "16px", border: "1px solid rgba(45, 90, 61, 0.1)", textAlign: "center" }} data-reveal>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2d5a3d", marginBottom: "8px" }}>🎁 Included with Paid Plans</p>
          <p style={{ fontSize: "1.05rem", color: "#1a1a1a", fontWeight: 500, margin: 0 }}>
            The <strong>Cold Email Playbook</strong>: Annotated winning emails, a proven paragraph template, and the follow-up guide.
          </p>
        </div>

        {/* Inline waitlist */}
        <div className="lp-waitlist" data-reveal>
          <p className="lp-waitlist-text">Guaranteed response plan coming soon, join the waitlist</p>
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
