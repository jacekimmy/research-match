"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMobile } from "@/lib/use-mobile";
import MobileLanding from "./mobile-landing";

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
  const isMobile = useMobile();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [heroQuery, setHeroQuery] = useState("");
  const [heroUni, setHeroUni] = useState("");
  const [heroFocused, setHeroFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [priceAnimating, setPriceAnimating] = useState(false);
  const billingToggleRef = useRef<HTMLDivElement>(null);
  const btnMonthlyRef = useRef<HTMLButtonElement>(null);
  const btnAnnualRef = useRef<HTMLButtonElement>(null);
  const [, setBillingMounted] = useState(false);
  useEffect(() => { setBillingMounted(true); }, []);

  const [priceKey, setPriceKey] = useState(0);
  function switchBilling(cycle: "monthly" | "annual") {
    if (cycle === billingCycle) return;
    setPriceAnimating(true);
    setTimeout(() => {
      setBillingCycle(cycle);
      setPriceKey(k => k + 1);
      setPriceAnimating(false);
    }, 250);
  }
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistTier, setWaitlistTier] = useState<"research_pro" | "pro" | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [inlineWaitlistEmail, setInlineWaitlistEmail] = useState("");
  const [inlineWaitlistDone, setInlineWaitlistDone] = useState(false);
  const [lifetimeSpotsRemaining, setLifetimeSpotsRemaining] = useState<number | null>(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % HERO_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/lifetime-spots")
      .then((r) => r.json())
      .then((d) => setLifetimeSpotsRemaining(d.remaining ?? 200))
      .catch(() => setLifetimeSpotsRemaining(200));
  }, []);

  // Parallax removed for performance — splotches are static

  function heroSearch() {
    if (!heroQuery.trim()) return;
    const params = new URLSearchParams();
    params.set("q", heroQuery.trim());
    if (heroUni.trim()) params.set("u", heroUni.trim());
    router.push(`/app?${params.toString()}`);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".landing-step, .landing-quote, .cold-email-item").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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

  if (isMobile) return <MobileLanding />;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Background splotches — reduced to 4 for performance */}
      <div className="splotches">
        <div className="splotch splotch-1" />
        <div className="splotch splotch-2" />
        <div className="splotch splotch-3" />
        <div className="splotch splotch-4" />
      </div>

      {/* Nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: scrolled ? "rgba(245,240,230,0.85)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", WebkitBackdropFilter: scrolled ? "blur(12px)" : "none", boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none", transition: "all 0.3s ease" }}>
        <nav className="landing-nav" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: scrolled ? "14px 40px" : "24px 40px", maxWidth: "1200px", margin: "0 auto",
          transition: "padding 0.3s ease",
        }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1C7A56", letterSpacing: "-0.02em" }}>
            Research Match
          </span>
          <div className="nav-links-desktop" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link href="/blog" style={{ fontSize: "0.9rem", color: "#7A8E80", textDecoration: "none", transition: "color 0.2s" }}>Blog</Link>
            <Link href="/feedback" style={{ fontSize: "0.9rem", color: "#7A8E80", textDecoration: "none", transition: "color 0.2s" }}>Feedback</Link>
            <Link href="/app" className="btn-cta landing-cta-primary rm-search-btn" style={{ padding: "11px 28px", fontSize: "0.9rem", textDecoration: "none" }}>
              Start Searching
            </Link>
          </div>
          <div className="nav-links-mobile" style={{ display: "none", gap: "12px", alignItems: "center" }}>
            <Link href="/app" className="btn-cta landing-cta-primary rm-search-btn" style={{ padding: "10px 22px", fontSize: "0.85rem", textDecoration: "none" }}>
              Start Searching
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <section className="landing-hero landing-section" style={{
        maxWidth: "900px", margin: "0 auto", padding: "80px 40px 60px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "clamp(2.4rem, 5.5vw, 4rem)", fontWeight: 800,
          color: "#1C7A56", lineHeight: 1.1, marginBottom: "28px",
          letterSpacing: "-0.03em",
        }}>
          Land Your Next Research Position.
        </h1>
        <p style={{
          fontSize: "clamp(1.05rem, 2vw, 1.3rem)", color: "#4A5D50",
          lineHeight: 1.7, maxWidth: "640px", margin: "0 auto 28px",
        }}>
          Find professors, understand their papers, and write emails that don&apos;t get deleted.
        </p>
        {/* Hero Search Bar */}
        <div
          className={`hero-search-bar ${heroFocused ? "hero-search-focused" : ""}`}
          style={{
            maxWidth: "820px", margin: "0 auto 28px",
            padding: "10px 14px",
            borderRadius: "999px",
            display: "flex", alignItems: "center", gap: "0",
            position: "relative",
          }}
        >
          <div className="hero-search-glow" />
          <div style={{ flex: 2, position: "relative" }}>
            <label style={{
              display: "block", fontSize: "0.6rem", fontWeight: 700,
              color: "#1C7A56", textTransform: "uppercase", letterSpacing: "0.12em",
              padding: "8px 20px 0", textAlign: "left",
            }}>Research Interest</label>
            <input
              type="text"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              onFocus={() => setHeroFocused(true)}
              onBlur={() => setHeroFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && heroSearch()}
              placeholder={HERO_PLACEHOLDERS[placeholderIdx]}
              style={{
                width: "100%", padding: "6px 20px 12px", fontSize: "1.1rem",
                border: "none", background: "transparent", color: "#2C3E34",
                fontFamily: "'Playfair Display', Georgia, serif", outline: "none",
              }}
            />
          </div>
          <div style={{
            width: "1px", height: "36px", background: "rgba(168,196,178,0.4)",
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, position: "relative" }}>
            <label style={{
              display: "block", fontSize: "0.6rem", fontWeight: 700,
              color: "#1C7A56", textTransform: "uppercase", letterSpacing: "0.12em",
              padding: "8px 20px 0", textAlign: "left",
            }}>University</label>
            <input
              type="text"
              value={heroUni}
              onChange={(e) => setHeroUni(e.target.value)}
              onFocus={() => setHeroFocused(true)}
              onBlur={() => setHeroFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && heroSearch()}
              placeholder="e.g. MIT, Stanford..."
              style={{
                width: "100%", padding: "6px 20px 12px", fontSize: "1.1rem",
                border: "none", background: "transparent", color: "#2C3E34",
                fontFamily: "'Playfair Display', Georgia, serif", outline: "none",
              }}
            />
          </div>
          <button
            onClick={heroSearch}
            className="hero-search-btn"
            style={{
              padding: "18px 40px", fontSize: "1.1rem", fontWeight: 700,
              fontFamily: "'Playfair Display', Georgia, serif",
              border: "none", borderRadius: "999px", cursor: "pointer",
              color: "#F5F0E6", background: "#C4981A",
              flexShrink: 0, position: "relative", overflow: "hidden",
            }}
          >
            <span style={{ position: "relative", zIndex: 1 }}>Search</span>
          </button>
        </div>

        <p className="hero-social" style={{
          fontSize: "0.95rem", color: "#7A8E80", fontStyle: "italic", marginBottom: "16px",
        }}>
          {/* Princeton social proof moved to testimonials */}
        </p>
        <a href="#pricing" style={{
          fontSize: "0.85rem", color: "#7A8E80", textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}>
          See pricing
        </a>
        <div className="scroll-indicator">
          <span>Scroll to learn more</span>
          <span className="scroll-indicator-arrow">↓</span>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{
        background: "#ede8df", padding: "24px 40px",
        borderTop: "1px solid rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: "40px", maxWidth: "900px", margin: "0 auto",
          flexWrap: "wrap",
        }}>
          {[
            { num: "250M+", label: "papers indexed" },
            { num: "1,000+", label: "universities" },
            { num: "400+", label: "students served" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1C7A56", fontFamily: "'Playfair Display', Georgia, serif" }}>{stat.num}</span>
              <span style={{ fontSize: "0.9rem", color: "#7A8E80" }}>{stat.label}</span>
              {i < 2 && <span style={{ color: "#A8C4B2", marginLeft: "32px", fontSize: "0.5rem" }}>●</span>}
            </div>
          ))}
        </div>
      </section>

      {/* University Logos */}
      <section style={{
        maxWidth: "1000px", margin: "0 auto", padding: "40px 40px 20px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "0.8rem", color: "#95AD9D", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px", fontWeight: 600 }}>
          Search professors at 1,000+ universities including
        </p>
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px",
        }}>
          {["MIT", "Harvard", "Stanford", "Johns Hopkins", "Yale", "Princeton", "Columbia", "UC Berkeley", "UCLA", "Duke", "Michigan", "Georgia Tech"].map((uni) => (
            <span key={uni} style={{
              fontSize: "0.8rem", color: "#7A8E80", fontWeight: 600,
              padding: "6px 16px", borderRadius: "999px",
              background: "rgba(255,255,255,0.6)", border: "1px solid rgba(168,196,178,0.3)",
              fontFamily: "'Inter', sans-serif",
            }}>
              {uni}
            </span>
          ))}
        </div>
      </section>

      {/* How it works — interactive */}
      <section className="landing-section" style={{
        maxWidth: "1100px", margin: "0 auto", padding: "60px 40px 80px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1C7A56",
          textAlign: "center", marginBottom: "12px",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          How it works
        </h2>
        <div className="section-divider" />
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1.4fr",
          gap: "48px", alignItems: "center",
        }}>
          {/* Left: Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { title: "Search by interest or professor name", desc: "Type in your interest and university, or search directly by name." },
              { title: "Read plain-English summaries", desc: "See their key findings and papers, summarized for easy reading." },
              { title: "Write emails with built-in guidance", desc: "Get suggested questions and an email checker built from real professor feedback, so your email gets read." },
            ].map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                style={{
                  textAlign: "left", padding: "20px 24px",
                  borderRadius: "16px", border: "none", cursor: "pointer",
                  background: activeStep === i ? "rgba(28,122,86,0.08)" : "transparent",
                  borderLeft: activeStep === i ? "3px solid #1C7A56" : "3px solid transparent",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, color: activeStep === i ? "#1C7A56" : "#95AD9D",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>Step {i + 1}</span>
                </div>
                <p style={{
                  fontSize: "1.05rem", fontWeight: 700,
                  color: activeStep === i ? "#1C7A56" : "#7A8E80",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  marginBottom: "4px", transition: "color 0.3s ease",
                }}>
                  {step.title}
                </p>
                {activeStep === i && (
                  <p style={{
                    fontSize: "0.85rem", color: "#7A8E80", lineHeight: 1.6,
                    animation: "fadeSlideIn 0.3s ease",
                  }}>
                    {step.desc}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Right: Animated mockup */}
          <div style={{
            background: "#2C3E34", borderRadius: "16px", overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            minHeight: "380px",
          }}>
            {/* Browser chrome */}
            <div style={{
              padding: "12px 16px", background: "#232e28",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
              </div>
              <div style={{
                flex: 1, textAlign: "center", fontSize: "0.7rem", color: "#7A8E80",
                fontFamily: "'Inter', sans-serif",
              }}>
                researchmatch.net
              </div>
            </div>

            {/* Content area */}
            <div style={{ padding: "24px", background: "#F5F0E6", minHeight: "340px", position: "relative", overflow: "hidden" }}>
              {/* Step 1: Search animation */}
              <div style={{
                opacity: activeStep === 0 ? 1 : 0,
                transform: activeStep === 0 ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.4s ease",
                position: activeStep === 0 ? "relative" : "absolute", top: activeStep !== 0 ? "24px" : undefined, left: activeStep !== 0 ? "24px" : undefined, right: activeStep !== 0 ? "24px" : undefined,
                pointerEvents: activeStep === 0 ? "auto" : "none",
              }}>
                <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: "14px", padding: "14px 20px", marginBottom: "16px", border: "1px solid rgba(168,196,178,0.3)" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1C7A56", textTransform: "uppercase", letterSpacing: "0.08em" }}>Research Interest</span>
                  <p style={{ fontSize: "0.95rem", color: "#2C3E34", fontFamily: "'Playfair Display', Georgia, serif", marginTop: "4px" }}>neuroscience</p>
                </div>
                {[
                  { name: "Dr. Emily Nakamura", uni: "Harvard Medical School", topics: ["Cognitive Neuroscience", "Memory"] },
                  { name: "Prof. James Miller", uni: "Stanford University", topics: ["Neural Circuits", "Optogenetics"] },
                  { name: "Dr. Aisha Patel", uni: "MIT", topics: ["Computational Neuroscience", "Brain-Computer Interfaces"] },
                ].map((prof, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.7)", borderRadius: "12px", padding: "14px 16px", marginBottom: "8px",
                    border: "1px solid rgba(168,196,178,0.2)",
                    animation: `fadeSlideIn 0.4s ease ${i * 0.15}s both`,
                  }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C7A56" }}>{prof.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#7A8E80" }}>{prof.uni}</p>
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      {prof.topics.map((t, j) => (
                        <span key={j} style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: "999px", background: "rgba(28,122,86,0.08)", color: "#1C7A56" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 2: Summary animation */}
              <div style={{
                opacity: activeStep === 1 ? 1 : 0,
                transform: activeStep === 1 ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.4s ease",
                position: activeStep === 1 ? "relative" : "absolute", top: activeStep !== 1 ? "24px" : undefined, left: activeStep !== 1 ? "24px" : undefined, right: activeStep !== 1 ? "24px" : undefined,
                pointerEvents: activeStep === 1 ? "auto" : "none",
              }}>
                <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: "14px", padding: "18px 20px", border: "1px solid rgba(168,196,178,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1C7A56" }}>Dr. Emily Nakamura</p>
                    <span style={{ fontSize: "0.6rem", padding: "2px 8px", borderRadius: "999px", background: "rgba(28,122,86,0.1)", color: "#1C7A56", fontWeight: 600 }}>Harvard</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#4A5D50", lineHeight: 1.65, marginBottom: "14px", animation: "fadeSlideIn 0.5s ease 0.1s both" }}>
                    Studies how memories form and consolidate during sleep using fMRI imaging. Recent work shows specific neural oscillation patterns predict next-day recall accuracy in elderly patients with early cognitive decline.
                  </p>
                  <div style={{ animation: "fadeSlideIn 0.5s ease 0.3s both" }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1C7A56", textTransform: "uppercase", marginBottom: "8px" }}>Key Findings</p>
                    <div style={{ paddingLeft: "14px", borderLeft: "3px solid #B8D8C4", marginBottom: "10px" }}>
                      <p style={{ fontSize: "0.78rem", color: "#4A5D50", lineHeight: 1.5 }}>Theta oscillations during REM sleep increased memory consolidation by 34% in elderly patients</p>
                      <p style={{ fontSize: "0.68rem", color: "#95AD9D", fontStyle: "italic", marginTop: "2px" }}>Sleep & Memory Consolidation (2024) <span style={{ padding: "1px 6px", borderRadius: "999px", background: "rgba(28,122,86,0.1)", color: "#1C7A56", fontStyle: "normal", fontSize: "0.6rem" }}>1st author</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Email checker animation */}
              <div style={{
                opacity: activeStep === 2 ? 1 : 0,
                transform: activeStep === 2 ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.4s ease",
                position: activeStep === 2 ? "relative" : "absolute", top: activeStep !== 2 ? "24px" : undefined, left: activeStep !== 2 ? "24px" : undefined, right: activeStep !== 2 ? "24px" : undefined,
                pointerEvents: activeStep === 2 ? "auto" : "none",
              }}>
                <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: "14px", padding: "18px 20px", border: "1px solid rgba(168,196,178,0.2)" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1C7A56", textTransform: "uppercase", marginBottom: "10px" }}>Email Draft</p>
                  <div style={{ fontSize: "0.82rem", color: "#4A5D50", lineHeight: 1.7 }}>
                    <p>Dear Professor Chen,</p>
                    <p style={{ marginTop: "8px" }}>
                      <span style={{ background: "rgba(155,51,34,0.1)", padding: "1px 4px", borderRadius: "4px", textDecoration: "line-through", color: "#9B3322", animation: "fadeSlideIn 0.4s ease 0.3s both" }}>I found your work fascinating and groundbreaking.</span>
                    </p>
                    <p style={{ marginTop: "8px", animation: "fadeSlideIn 0.4s ease 0.6s both" }}>
                      <span style={{ background: "rgba(28,122,86,0.1)", padding: "1px 4px", borderRadius: "4px", color: "#1C7A56" }}>I read your 2024 paper on theta oscillations during REM sleep. The 34% improvement in memory consolidation was surprising.</span>
                    </p>
                  </div>
                  <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(155,51,34,0.06)", border: "1px solid rgba(155,51,34,0.12)", animation: "fadeSlideIn 0.4s ease 0.3s both" }}>
                      <span style={{ color: "#9B3322", fontSize: "0.8rem" }}>&#9888;</span>
                      <span style={{ fontSize: "0.75rem", color: "#9B3322", fontWeight: 600 }}>Sycophantic tone</span>
                      <span style={{ fontSize: "0.7rem", color: "#7A8E80", marginLeft: "auto" }}>Remove flattery</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(28,122,86,0.06)", border: "1px solid rgba(28,122,86,0.12)", animation: "fadeSlideIn 0.4s ease 0.8s both" }}>
                      <span style={{ color: "#1C7A56", fontSize: "0.8rem" }}>&#10003;</span>
                      <span style={{ fontSize: "0.75rem", color: "#1C7A56", fontWeight: 600 }}>Specific reference</span>
                      <span style={{ fontSize: "0.7rem", color: "#7A8E80", marginLeft: "auto" }}>Good, cites real data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile fallback: show carousel hint */}
        <div className="carousel-hint">
          <span>Swipe</span>
          <span className="carousel-hint-arrow">&#8594;</span>
        </div>
      </section>

      {/* Email checker callout */}
      <section className="landing-section" style={{
        maxWidth: "700px", margin: "0 auto", padding: "0 40px 80px",
      }}>
        <div className="glass-card" style={{
          padding: "40px 36px", textAlign: "center",
          border: "2px solid rgba(28,122,86,0.2)",
          background: "rgba(28,122,86,0.04)",
        }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1C7A56", marginBottom: "16px" }}>
            Sound like yourself, not a chatbot
          </h3>
          <p style={{ fontSize: "1rem", color: "#4A5D50", lineHeight: 1.7 }}>
            The WORST thing you can do is use AI to write the email. The SECOND worst thing you can do is show no real interest. Our email checker scans your draft for generic tones, a proper intro and ask, specific papers, and more.
          </p>
        </div>
      </section>

      {/* Why cold emails fail */}
      <section className="landing-section" style={{
        maxWidth: "800px", margin: "0 auto", padding: "0 40px 80px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1C7A56",
          textAlign: "center", marginBottom: "12px",
        }}>
          Most cold emails to professors get ignored. Here&apos;s why.
        </h2>
        <div className="section-divider" />
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[
            "Professors can spot AI-written emails instantly, and delete them.",
            "Generic emails that could be sent to anyone get ignored.",
            "Name-dropping papers without understanding them backfires.",
          ].map((point, i) => (
            <div key={i} className="cold-email-item" style={{
              display: "flex", gap: "16px", alignItems: "flex-start",
              padding: "20px 24px", borderRadius: "14px",
              background: "rgba(155,51,34,0.04)", border: "1px solid rgba(155,51,34,0.1)",
            }}>
              <span style={{ color: "#9B3322", fontSize: "1.2rem", flexShrink: 0 }}>✕</span>
              <p style={{ fontSize: "1rem", color: "#4A5D50", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
        <p style={{
          fontSize: "1rem", color: "#1C7A56", textAlign: "center",
          marginTop: "28px", lineHeight: 1.7, fontWeight: 500,
        }}>
          Research Match helps you avoid all three. Our email checker catches generic and AI-sounding language before you hit send, so your message sounds like you, not a chatbot.
        </p>
      </section>

      {/* Social proof */}
      <section className="landing-section" style={{
        maxWidth: "1000px", margin: "0 auto", padding: "0 40px 40px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1C7A56",
          textAlign: "center", marginBottom: "12px",
        }}>
          What people are saying
        </h2>
        <div className="section-divider" />
        <div className="landing-quotes" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}>
          {[
            { quote: "A Princeton professor responded to a high school freshman within 24 hours.", author: "Founder experience" },
            { quote: "First time I've gotten real advice on my emails. I've sent 10 emails so far using this.", author: "Student user" },
            { quote: "Endorse this advice 💯. If an email smells of AI I will not answer it.", author: "Research Professor" },
            { quote: "This website is goated. I'm saving this for future use.", author: "Student user" },
          ].map((item, i) => (
            <div key={i} className="glass-card landing-quote" style={{ padding: "30px 26px" }}>
              <div className="quote-mark">&ldquo;</div>
              <p style={{ fontSize: "1.05rem", color: "#2C3E34", lineHeight: 1.65, marginBottom: "16px" }}>
                {item.quote}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#7A8E80", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                - {item.author}
              </p>
            </div>
          ))}
        </div>
        <div className="carousel-hint">
          <span>Swipe</span>
          <span className="carousel-hint-arrow">→</span>
        </div>
      </section>

      {/* Founder note */}
      <section className="landing-section" style={{
        maxWidth: "700px", margin: "0 auto", padding: "20px 40px 80px",
      }}>
        <div style={{
          padding: "32px 36px", borderLeft: "4px solid #1C7A56",
          background: "rgba(28,122,86,0.03)", borderRadius: "0 14px 14px 0",
        }}>
          <p style={{
            fontSize: "1.05rem", color: "#4A5D50", lineHeight: 1.75,
            fontStyle: "italic",
          }}>
            &ldquo;When I was a high school freshman, I used this approach to cold email 5 professors. A Princeton astrophysics professor responded within 24 hours and said I was &lsquo;way ahead of the curve.&rsquo; That&apos;s why I built Research Match.&rdquo;
          </p>
          <p style={{ fontSize: "0.85rem", color: "#1C7A56", fontWeight: 700, marginTop: "16px" }}>
            - Jace, Founder
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section" style={{
        maxWidth: "1140px", margin: "0 auto", padding: "40px 40px 40px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1C7A56",
          textAlign: "center", marginBottom: "12px",
        }}>
          Simple pricing
        </h2>
        <p style={{
          fontSize: "1rem", color: "#7A8E80", textAlign: "center", marginBottom: "4px",
        }}>
          Free to start because we know what it&apos;s like searching for research with zero budget.
        </p>
        <p style={{
          fontSize: "0.95rem", color: "#4A5D50", textAlign: "center", marginBottom: "8px",
        }}>
          If you&apos;re emailing professors regularly, the Student plan pays for itself with one response.
        </p>
        <div className="section-divider" />

        {/* Billing toggle — slider style */}
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

        <div className="landing-pricing" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "28px", alignItems: "start", maxWidth: "1080px", margin: "0 auto",
        }}>
          {/* Free */}
          <div className="glass-card landing-pricing-card" style={{ padding: "36px 30px" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#7A8E80", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Free</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#1C7A56", marginBottom: "24px", letterSpacing: "-0.02em" }}>$0</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              {["Unlimited professor searches", "3 research summaries", "Author position labels", "Save professors", "Paper links"].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#4A5D50", padding: "7px 0", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ color: "#1C7A56", fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="btn-secondary" style={{ display: "block", textAlign: "center", padding: "14px", textDecoration: "none", fontSize: "0.95rem" }}>
              Find a professor now, free
            </Link>
          </div>

          {/* Student */}
          <div id="student-card" className="glass-card landing-pricing-card" style={{
            padding: "36px 30px", position: "relative",
            background: "#2C3E34",
            border: "2px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#B8D8C4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Student</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginBottom: "4px" }}>
              <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "#F5F0E6", letterSpacing: "-0.02em" }}>$</span>
              <div className="price-roller-wrap">
                {priceAnimating ? (
                  <div className="price-roller price-roller-exit">
                    <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "#F5F0E6", letterSpacing: "-0.02em" }}>
                      {billingCycle === "monthly" ? "5" : "49"}
                    </span>
                  </div>
                ) : (
                  <div key={priceKey} className="price-roller price-roller-enter">
                    <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "#F5F0E6", letterSpacing: "-0.02em" }}>
                      {billingCycle === "monthly" ? "5" : "49"}
                    </span>
                  </div>
                )}
              </div>
              <div className="price-roller-wrap" style={{ marginLeft: "4px" }}>
                {priceAnimating ? (
                  <div className="price-roller price-roller-exit">
                    <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(245,240,230,0.6)" }}>
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                ) : (
                  <div key={`suffix-${priceKey}`} className="price-roller price-roller-enter">
                    <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(245,240,230,0.6)" }}>
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="price-roller-wrap" style={{ height: "20px" }}>
              {priceAnimating ? (
                <div className="price-roller price-roller-exit">
                  <div style={{ height: "20px" }} />
                </div>
              ) : (
                <div key={`save-${priceKey}`} className="price-roller price-roller-enter" style={{ animationDelay: "0.08s" }}>
                  {billingCycle === "annual" ? (
                    <p style={{ fontSize: "0.8rem", color: "#B8D8C4", fontWeight: 600 }}>Save $11 vs monthly</p>
                  ) : (
                    <div style={{ height: "20px" }} />
                  )}
                </div>
              )}
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li style={{ fontSize: "0.9rem", color: "#F5F0E6", padding: "7px 0", fontWeight: 700 }}>Everything in Free, plus:</li>
              {[
                "Unlimited research summaries",
                "Email checker, catches generic & AI language",
                "Professor email finder",
                "Professor responsiveness indicator",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "rgba(245,240,230,0.8)", padding: "7px 0", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#B8D8C4", flexShrink: 0, fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app?upgrade=true" style={{ display: "block", textAlign: "center", padding: "14px", textDecoration: "none", fontSize: "0.95rem", width: "100%", background: "#F5F0E6", color: "#1C7A56", borderRadius: "14px", fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", transition: "all 0.3s ease" }}>
              Upgrade to Student
            </Link>
          </div>

          {/* Lifetime — Gold Premium */}
          <div className="glass-card landing-pricing-card lifetime-card" style={{
            padding: "40px 30px", position: "relative",
            border: "2px solid rgba(180, 155, 80, 0.5)",
            background: "linear-gradient(165deg, rgba(255,250,235,0.85) 0%, rgba(255,245,220,0.6) 50%, rgba(245,235,200,0.4) 100%)",
            boxShadow: "0 0 40px rgba(180, 155, 80, 0.15), 0 8px 40px rgba(180, 155, 80, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}>
            <span style={{
              position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #8B6914, #C4981A, #8B6914)",
              color: "#FFF8E7",
              fontSize: "0.6rem", fontWeight: 700,
              padding: "6px 16px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 12px rgba(180, 155, 80, 0.3)",
            }}>Limited. First 200 users only</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8B6914", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Lifetime</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
              <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#6B5210", letterSpacing: "-0.02em" }}>$25</p>
              <p style={{ fontSize: "1.1rem", color: "#8B6914", textDecoration: "line-through", fontWeight: 600 }}>$60</p>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#8B6914", marginBottom: "8px", fontWeight: 600 }}>one-time</p>
            {lifetimeSpotsRemaining !== null && lifetimeSpotsRemaining > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{
                  fontSize: "0.8rem", color: "#8B6914", fontWeight: 700,
                  background: "rgba(180,155,80,0.1)",
                  padding: "4px 12px", borderRadius: "8px", display: "inline-block",
                }}>
                  Limited to first 200 users
                </p>
                <p style={{ fontSize: "0.75rem", color: "#BAA870", fontStyle: "italic", marginTop: "6px" }}>
                  This deal won&apos;t last forever.
                </p>
              </div>
            )}
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li style={{ fontSize: "0.9rem", color: "#5A4A1A", padding: "7px 0", fontWeight: 700 }}>Everything in Student, forever:</li>
              {[
                "Unlimited searches",
                "Unlimited research summaries",
                "Email checker",
                "Professor email finder",
                "Nearby professor access",
                "One payment, lifetime access",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#6B5A2A", padding: "7px 0", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#8B6914", flexShrink: 0, fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {lifetimeSpotsRemaining === 0 ? (
              <button disabled style={{
                display: "block", textAlign: "center", padding: "14px", fontSize: "0.95rem",
                width: "100%", background: "#BAA870", color: "#FFF8E7", border: "none",
                borderRadius: "14px", cursor: "not-allowed", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                Sold out
              </button>
            ) : (
              <Link href="/app?upgrade=lifetime" style={{
                display: "block", textAlign: "center", padding: "14px",
                textDecoration: "none", fontSize: "0.95rem", width: "100%",
                background: "linear-gradient(135deg, #8B6914, #C4981A)",
                color: "#FFF8E7", borderRadius: "14px", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                boxShadow: "0 4px 16px rgba(180, 155, 80, 0.3)",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}>
                Claim your spot
              </Link>
            )}
          </div>
        </div>
        <div className="carousel-hint">
          <span>Swipe</span>
          <span className="carousel-hint-arrow">→</span>
        </div>

        {/* Inline waitlist */}
        <div style={{ textAlign: "center", marginTop: "44px" }}>
          <p style={{ fontSize: "0.95rem", color: "#7A8E80", marginBottom: "16px" }}>
            More plans coming soon. Want early access?
          </p>
          {inlineWaitlistDone ? (
            <p style={{ fontSize: "0.95rem", color: "#1C7A56", fontWeight: 600 }}>
              You&apos;re on the list! We&apos;ll email you when new plans launch.
            </p>
          ) : (
            <div style={{ display: "inline-flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={inlineWaitlistEmail}
                onChange={(e) => setInlineWaitlistEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinInlineWaitlist()}
                style={{
                  padding: "12px 18px", fontSize: "0.9rem",
                  border: "1.5px solid rgba(168,196,178,0.4)", borderRadius: "14px",
                  background: "rgba(255,255,255,0.5)", color: "#2C3E34",
                  fontFamily: "inherit", outline: "none", width: "260px",
                  transition: "border-color 0.2s",
                }}
              />
              <button
                onClick={joinInlineWaitlist}
                className="btn-cta rm-search-btn"
                style={{ padding: "12px 24px", fontSize: "0.9rem" }}
              >
                Join waitlist
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" style={{
        maxWidth: "1200px", margin: "0 auto", padding: "40px",
        borderTop: "1px solid rgba(168,196,178,0.3)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px",
      }}>
        <span style={{ fontSize: "0.9rem", color: "#7A8E80", fontWeight: 600 }}>Research Match</span>
        <div style={{ display: "flex", gap: "28px" }}>
          <Link href="/app" style={{ fontSize: "0.85rem", color: "#7A8E80", textDecoration: "none", transition: "color 0.2s" }}>Tool</Link>
          <Link href="/blog" style={{ fontSize: "0.85rem", color: "#7A8E80", textDecoration: "none", transition: "color 0.2s" }}>Blog</Link>
          <a href="#pricing" style={{ fontSize: "0.85rem", color: "#7A8E80", textDecoration: "none", transition: "color 0.2s" }}>Pricing</a>
          <Link href="/feedback" style={{ fontSize: "0.85rem", color: "#7A8E80", textDecoration: "none", transition: "color 0.2s" }}>Feedback</Link>
        </div>
      </footer>

      {/* Waitlist modal (kept for any future use) */}
      {waitlistTier && (
        <div className="modal-overlay" style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(245,240,230,0.85)", backdropFilter: "blur(12px)",
        }} onClick={() => setWaitlistTier(null)}>
          <div className="glass-card modal-card" style={{
            padding: "44px", maxWidth: "420px", width: "90%",
          }} onClick={(e) => e.stopPropagation()}>
            {waitlistDone ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🎉</p>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1C7A56", marginBottom: "10px" }}>
                  You&apos;re on the list!
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#7A8E80", lineHeight: 1.6 }}>
                  We&apos;ll email you when {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} launches.
                </p>
                <button onClick={() => setWaitlistTier(null)} className="btn-secondary" style={{ marginTop: "24px", padding: "12px 28px" }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1C7A56", marginBottom: "10px" }}>
                  Join the {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} waitlist
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#7A8E80", marginBottom: "24px", lineHeight: 1.6 }}>
                  Enter your email to get notified when it launches.
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinWaitlist()}
                  style={{
                    width: "100%", padding: "14px 18px", fontSize: "1rem",
                    border: "1.5px solid rgba(168,196,178,0.4)", borderRadius: "14px",
                    background: "rgba(255,255,255,0.5)", color: "#2C3E34",
                    fontFamily: "inherit", marginBottom: "16px", outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                <button
                  onClick={joinWaitlist}
                  disabled={waitlistLoading || !waitlistEmail}
                  className="btn-cta landing-cta-primary rm-search-btn"
                  style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                >
                  {waitlistLoading ? "Joining..." : "Join Waitlist"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
