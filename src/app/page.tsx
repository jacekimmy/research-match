"use client";
import { useState, useEffect } from "react";
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
  const [heroQuery, setHeroQuery] = useState("");
  const [heroUni, setHeroUni] = useState("");
  const [heroFocused, setHeroFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
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
    fetch("/api/lifetime-spots")
      .then((r) => r.json())
      .then((d) => setLifetimeSpotsRemaining(d.remaining ?? 200))
      .catch(() => setLifetimeSpotsRemaining(200));
  }, []);

  // Parallax scroll — disabled on mobile for performance
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const speeds = [0.15, -0.1, 0.2, -0.12, 0.08, -0.18, 0.14, -0.06, 0.1, -0.15, 0.12, -0.08, 0.18, -0.14, 0.1, -0.16];
    function handleScroll() {
      const scrollY = window.scrollY;
      document.querySelectorAll(".splotch").forEach((s, i) => {
        const speed = speeds[i % speeds.length];
        (s as HTMLElement).style.marginTop = `${scrollY * speed}px`;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Background splotches — scattered throughout the full page */}
      <div className="splotches">
        {/* Hero area */}
        <div className="splotch splotch-1" />
        <div className="splotch splotch-9" />
        <div className="splotch splotch-5" />
        {/* How it works area */}
        <div className="splotch splotch-2" />
        <div className="splotch splotch-8" />
        <div className="splotch splotch-11" />
        {/* Cold email / testimonials area */}
        <div className="splotch splotch-3" />
        <div className="splotch splotch-6" />
        <div className="splotch splotch-10" />
        {/* Pricing / footer area */}
        <div className="splotch splotch-4" />
        <div className="splotch splotch-7" />
        <div className="splotch splotch-12" />
        {/* Extra deep-page splotches */}
        <div className="splotch splotch-13" />
        <div className="splotch splotch-14" />
        <div className="splotch splotch-15" />
        <div className="splotch splotch-16" />
      </div>

      {/* Nav */}
      <nav className="landing-nav" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 40px", maxWidth: "1200px", margin: "0 auto",
      }}>
        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A6B5A", letterSpacing: "-0.02em" }}>
          Research Match
        </span>
        <div className="nav-links-desktop" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/blog" style={{ fontSize: "0.9rem", color: "#7A8E88", textDecoration: "none", transition: "color 0.2s" }}>Blog</Link>
          <Link href="/feedback" style={{ fontSize: "0.9rem", color: "#7A8E88", textDecoration: "none", transition: "color 0.2s" }}>Feedback</Link>
          <Link href="/app" className="btn-cta landing-cta-primary rm-search-btn" style={{ padding: "11px 28px", fontSize: "0.9rem", textDecoration: "none" }}>
            Open Tool
          </Link>
        </div>
        <div className="nav-links-mobile" style={{ display: "none", gap: "12px", alignItems: "center" }}>
          <Link href="/app" className="btn-cta landing-cta-primary rm-search-btn" style={{ padding: "10px 22px", fontSize: "0.85rem", textDecoration: "none" }}>
            Open Tool
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero landing-section" style={{
        maxWidth: "900px", margin: "0 auto", padding: "80px 40px 60px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "clamp(2.4rem, 5.5vw, 4rem)", fontWeight: 800,
          color: "#1A6B5A", lineHeight: 1.1, marginBottom: "28px",
          letterSpacing: "-0.03em",
        }}>
          Find the right research professor in 5 minutes, not 8 hours.
        </h1>
        <p style={{
          fontSize: "clamp(1.05rem, 2vw, 1.3rem)", color: "#4A5D56",
          lineHeight: 1.7, maxWidth: "640px", margin: "0 auto 28px",
        }}>
          Search 250M+ papers, understand their work, and write emails professors actually read.
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
              color: "#1A6B5A", textTransform: "uppercase", letterSpacing: "0.12em",
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
                border: "none", background: "transparent", color: "#2C3E38",
                fontFamily: "'Playfair Display', Georgia, serif", outline: "none",
              }}
            />
          </div>
          <div style={{
            width: "1px", height: "36px", background: "rgba(168,196,188,0.4)",
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, position: "relative" }}>
            <label style={{
              display: "block", fontSize: "0.6rem", fontWeight: 700,
              color: "#1A6B5A", textTransform: "uppercase", letterSpacing: "0.12em",
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
                border: "none", background: "transparent", color: "#2C3E38",
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
          fontSize: "0.95rem", color: "#7A8E88", fontStyle: "italic", marginBottom: "16px",
        }}>
          A Princeton professor responded to a high school freshman within 24 hours.
        </p>
        <a href="#pricing" style={{
          fontSize: "0.85rem", color: "#7A8E88", textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}>
          See pricing
        </a>
        <div className="scroll-indicator">
          <span>Scroll to learn more</span>
          <span className="scroll-indicator-arrow">↓</span>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" style={{
        maxWidth: "1000px", margin: "0 auto", padding: "60px 40px 80px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1A6B5A",
          textAlign: "center", marginBottom: "12px",
        }}>
          How it works
        </h2>
        <div className="section-divider" />
        <div className="landing-steps" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "28px",
        }}>
          {[
            { step: "1", icon: "🔍", title: "Search by interest or name", desc: "Enter a research topic like \"machine learning\" and a university. Or search a professor directly by name." },
            { step: "2", icon: "📄", title: "Read plain-English summaries", desc: "See what each professor works on, their key findings, and which papers they led — explained simply." },
            { step: "3", icon: "✉️", title: "Write emails with guidance", desc: "Get suggested questions, a red-flag checker that catches generic language, and tips that actually work." },
          ].map((item) => (
            <div key={item.step} className="glass-card landing-step" style={{
              padding: "36px 30px", textAlign: "center",
            }}>
              <div className="step-icon" style={{
                fontSize: "2.8rem", marginBottom: "24px",
                display: "inline-block",
              }}>
                {item.icon}
              </div>
              <div style={{
                display: "inline-block", fontSize: "0.65rem", fontWeight: 700,
                color: "#1A6B5A", background: "rgba(26,107,90,0.08)",
                padding: "4px 12px", borderRadius: "999px", marginBottom: "14px",
                textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                Step {item.step}
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C3E38", marginBottom: "12px" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "0.95rem", color: "#7A8E88", lineHeight: 1.65 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="carousel-hint">
          <span>Swipe</span>
          <span className="carousel-hint-arrow">→</span>
        </div>
      </section>

      {/* Email checker callout */}
      <section className="landing-section" style={{
        maxWidth: "700px", margin: "0 auto", padding: "0 40px 80px",
      }}>
        <div className="glass-card" style={{
          padding: "40px 36px", textAlign: "center",
          border: "2px solid rgba(26,107,90,0.2)",
          background: "rgba(26,107,90,0.04)",
        }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1A6B5A", marginBottom: "16px" }}>
            Sound like yourself, not a chatbot
          </h3>
          <p style={{ fontSize: "1rem", color: "#4A5D56", lineHeight: 1.7 }}>
            Our email checker scans your draft for generic phrasing, sycophantic tone, and AI-sounding language — the exact things professors told us make them hit delete. Fix the red flags before you hit send.
          </p>
        </div>
      </section>

      {/* Why cold emails fail */}
      <section className="landing-section" style={{
        maxWidth: "800px", margin: "0 auto", padding: "0 40px 80px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1A6B5A",
          textAlign: "center", marginBottom: "12px",
        }}>
          Most cold emails to professors get ignored. Here&apos;s why.
        </h2>
        <div className="section-divider" />
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[
            "Professors can spot AI-written emails instantly — and delete them.",
            "Generic emails that could be sent to anyone get ignored.",
            "Name-dropping papers without understanding them backfires.",
          ].map((point, i) => (
            <div key={i} className="cold-email-item" style={{
              display: "flex", gap: "16px", alignItems: "flex-start",
              padding: "20px 24px", borderRadius: "14px",
              background: "rgba(155,51,34,0.04)", border: "1px solid rgba(155,51,34,0.1)",
            }}>
              <span style={{ color: "#9B3322", fontSize: "1.2rem", flexShrink: 0 }}>✕</span>
              <p style={{ fontSize: "1rem", color: "#4A5D56", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
        <p style={{
          fontSize: "1rem", color: "#1A6B5A", textAlign: "center",
          marginTop: "28px", lineHeight: 1.7, fontWeight: 500,
        }}>
          Research Match helps you avoid all three. Our email checker catches generic and AI-sounding language before you hit send — so your message sounds like you, not a chatbot.
        </p>
      </section>

      {/* Social proof */}
      <section className="landing-section" style={{
        maxWidth: "1000px", margin: "0 auto", padding: "0 40px 40px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1A6B5A",
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
            { quote: "First time I've gotten real advice on my emails. I've sent 10 emails so far using this.", author: "Student user" },
            { quote: "Endorse this advice 💯. If an email smells of AI I will not answer it.", author: "Research Professor" },
            { quote: "This website is goated. I'm saving this for future use.", author: "Student user" },
          ].map((item, i) => (
            <div key={i} className="glass-card landing-quote" style={{ padding: "30px 26px" }}>
              <div className="quote-mark">&ldquo;</div>
              <p style={{ fontSize: "1.05rem", color: "#2C3E38", lineHeight: 1.65, marginBottom: "16px" }}>
                {item.quote}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#7A8E88", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                — {item.author}
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
          padding: "32px 36px", borderLeft: "4px solid #1A6B5A",
          background: "rgba(26,107,90,0.03)", borderRadius: "0 14px 14px 0",
        }}>
          <p style={{
            fontSize: "1.05rem", color: "#4A5D56", lineHeight: 1.75,
            fontStyle: "italic",
          }}>
            &ldquo;When I was a high school freshman, I used this approach to cold email 5 professors. A Princeton astrophysics professor responded within 24 hours and said I was &lsquo;way ahead of the curve.&rsquo; That&apos;s why I built Research Match.&rdquo;
          </p>
          <p style={{ fontSize: "0.85rem", color: "#1A6B5A", fontWeight: 700, marginTop: "16px" }}>
            — Jace, Founder
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section" style={{
        maxWidth: "1140px", margin: "0 auto", padding: "40px 40px 40px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#1A6B5A",
          textAlign: "center", marginBottom: "12px",
        }}>
          Simple pricing
        </h2>
        <p style={{
          fontSize: "1rem", color: "#7A8E88", textAlign: "center", marginBottom: "4px",
        }}>
          Free to start because we know what it&apos;s like searching for research with zero budget.
        </p>
        <p style={{
          fontSize: "0.95rem", color: "#4A5D56", textAlign: "center", marginBottom: "8px",
        }}>
          If you&apos;re emailing professors regularly, the Student plan pays for itself with one response.
        </p>
        <div className="section-divider" />

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "44px" }}>
          <div style={{
            display: "inline-flex", background: "rgba(26,107,90,0.08)",
            border: "2px solid rgba(26,107,90,0.2)", borderRadius: "999px",
            padding: "4px", gap: "4px",
          }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              style={{
                padding: "12px 32px", fontSize: "0.95rem", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                border: "none", borderRadius: "999px", cursor: "pointer",
                transition: "all 0.3s ease",
                background: billingCycle === "monthly" ? "#1A6B5A" : "transparent",
                color: billingCycle === "monthly" ? "#F5F0E6" : "#2C3E38",
              }}
            >Monthly</button>
            <button
              onClick={() => setBillingCycle("annual")}
              style={{
                padding: "12px 32px", fontSize: "0.95rem", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                border: "none", borderRadius: "999px", cursor: "pointer",
                transition: "all 0.3s ease",
                background: billingCycle === "annual" ? "#1A6B5A" : "transparent",
                color: billingCycle === "annual" ? "#F5F0E6" : "#2C3E38",
              }}
            >Annual</button>
          </div>
        </div>

        <div className="landing-pricing" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "28px", alignItems: "start", maxWidth: "1080px", margin: "0 auto",
        }}>
          {/* Free */}
          <div className="glass-card landing-pricing-card" style={{ padding: "36px 30px" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#7A8E88", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Free</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#1A6B5A", marginBottom: "24px", letterSpacing: "-0.02em" }}>$0</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              {["Unlimited professor searches", "1 research summary per month", "Author position labels", "Save professors", "Paper links"].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#4A5D56", padding: "7px 0", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ color: "#1A6B5A", fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="btn-secondary" style={{ display: "block", textAlign: "center", padding: "14px", textDecoration: "none", fontSize: "0.95rem" }}>
              Find a professor now — free
            </Link>
          </div>

          {/* Student */}
          <div id="student-card" className="glass-card landing-pricing-card" style={{
            padding: "36px 30px", position: "relative",
            border: "2px solid rgba(26,107,90,0.35)",
            boxShadow: "0 8px 40px rgba(26,107,90,0.15)",
          }}>
            <span style={{
              position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
              background: "#1A6B5A", color: "#F5F0E6", fontSize: "0.65rem", fontWeight: 700,
              padding: "5px 16px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}>Most Popular</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1A6B5A", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Student</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#1A6B5A", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              {billingCycle === "monthly" ? "$9" : "$79"}
              <span style={{ fontSize: "1rem", fontWeight: 400, color: "#7A8E88" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
            </p>
            {billingCycle === "annual" ? (
              <p style={{ fontSize: "0.8rem", color: "#3D7A6A", marginBottom: "20px", fontWeight: 600 }}>Save $29 vs monthly</p>
            ) : (
              <div style={{ height: "20px" }} />
            )}
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li style={{ fontSize: "0.9rem", color: "#2C3E38", padding: "7px 0", fontWeight: 700 }}>Everything in Free, plus:</li>
              {[
                "Unlimited research summaries",
                "Email checker — catches generic & AI language",
                "Professor email finder",
                "Professor responsiveness indicator",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#4A5D56", padding: "7px 0", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#1A6B5A", flexShrink: 0, fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app?upgrade=true" className="btn-cta landing-cta-primary rm-search-btn" style={{ display: "block", textAlign: "center", padding: "14px", textDecoration: "none", fontSize: "0.95rem", width: "100%" }}>
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
            }}>Limited — First 200 users only</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8B6914", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Lifetime</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
              <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#6B5210", letterSpacing: "-0.02em" }}>$29</p>
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
          <p style={{ fontSize: "0.95rem", color: "#7A8E88", marginBottom: "16px" }}>
            More plans coming soon. Want early access?
          </p>
          {inlineWaitlistDone ? (
            <p style={{ fontSize: "0.95rem", color: "#1A6B5A", fontWeight: 600 }}>
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
                  border: "1.5px solid rgba(168,196,188,0.4)", borderRadius: "14px",
                  background: "rgba(255,255,255,0.5)", color: "#2C3E38",
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
        borderTop: "1px solid rgba(168,196,188,0.3)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px",
      }}>
        <span style={{ fontSize: "0.9rem", color: "#7A8E88", fontWeight: 600 }}>Research Match</span>
        <div style={{ display: "flex", gap: "28px" }}>
          <Link href="/app" style={{ fontSize: "0.85rem", color: "#7A8E88", textDecoration: "none", transition: "color 0.2s" }}>Tool</Link>
          <Link href="/blog" style={{ fontSize: "0.85rem", color: "#7A8E88", textDecoration: "none", transition: "color 0.2s" }}>Blog</Link>
          <a href="#pricing" style={{ fontSize: "0.85rem", color: "#7A8E88", textDecoration: "none", transition: "color 0.2s" }}>Pricing</a>
          <Link href="/feedback" style={{ fontSize: "0.85rem", color: "#7A8E88", textDecoration: "none", transition: "color 0.2s" }}>Feedback</Link>
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
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1A6B5A", marginBottom: "10px" }}>
                  You&apos;re on the list!
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#7A8E88", lineHeight: 1.6 }}>
                  We&apos;ll email you when {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} launches.
                </p>
                <button onClick={() => setWaitlistTier(null)} className="btn-secondary" style={{ marginTop: "24px", padding: "12px 28px" }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1A6B5A", marginBottom: "10px" }}>
                  Join the {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} waitlist
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#7A8E88", marginBottom: "24px", lineHeight: 1.6 }}>
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
                    border: "1.5px solid rgba(168,196,188,0.4)", borderRadius: "14px",
                    background: "rgba(255,255,255,0.5)", color: "#2C3E38",
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
