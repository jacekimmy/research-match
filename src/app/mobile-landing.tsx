"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmailCheckerDemo from "./components/EmailCheckerDemo";
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

export default function MobileLanding() {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");
  const [heroUni, setHeroUni] = useState("");
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
  const [glowingCard, setGlowingCard] = useState<string | null>(null);
  const [showStarterKit, setShowStarterKit] = useState(false);
  const splotchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const testimonialRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pricingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coldEmailRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Mobile parallax on splotches
  useEffect(() => {
    const speeds = [0.06, -0.04, 0.08, -0.05, 0.03, -0.07];
    function handleScroll() {
      const scrollY = window.scrollY;
      splotchRefs.current.forEach((el, i) => {
        if (!el) return;
        const speed = speeds[i % speeds.length];
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("mobile-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    timelineRefs.current.forEach((el) => el && observer.observe(el));
    testimonialRefs.current.forEach((el) => el && observer.observe(el));
    pricingRefs.current.forEach((el) => el && observer.observe(el));
    coldEmailRefs.current.forEach((el) => el && observer.observe(el));
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

  const handlePricingTap = useCallback((cardName: string) => {
    setGlowingCard(cardName);
    setTimeout(() => setGlowingCard(null), 600);
  }, []);

  const handleTilt = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((touch.clientY - rect.top) / rect.height - 0.5) * 8;
    el.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg) scale(1.02)`;
  }, []);

  const handleTiltEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
  }, []);

  const steps = [
    { step: "1", icon: "\u{1F50D}", title: "Search by interest or name", desc: "Type in your interest and university, or search directly by name." },
    { step: "2", icon: "\u{1F4C4}", title: "Read plain-English summaries", desc: "See their key findings and papers, summarized for easy reading." },
    { step: "3", icon: "\u2709\uFE0F", title: "Write emails with guidance", desc: "Get suggested questions and an email checker built from real professor feedback, so your email gets read." },
  ];

  const testimonials = [
    { quote: "A Princeton professor responded to a high school freshman within 24 hours.", author: "Founder experience" },
    { quote: "First time I\u2019ve gotten real advice on my emails. I\u2019ve sent 10 emails so far using this.", author: "Student user" },
    { quote: "Endorse this advice \u{1F4AF}. If an email smells of AI I will not answer it.", author: "Research Professor" },
    { quote: "This website is goated. I\u2019m saving this for future use.", author: "Student user" },
  ];

  const coldEmailPoints = [
    "Professors can spot AI-written emails instantly, and delete them.",
    "Generic emails that could be sent to anyone get ignored.",
    "Name-dropping papers without understanding them backfires.",
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Background splotches with parallax */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", pointerEvents: "none", zIndex: -1, overflow: "hidden", maxWidth: "100vw" }}>
        <div ref={(el) => { splotchRefs.current[0] = el; }} style={{ position: "absolute", top: "5%", right: "-10%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(ellipse at 35% 40%, rgba(45, 90, 61,0.35) 0%, transparent 70%)", filter: "blur(50px)", willChange: "transform" }} />
        <div ref={(el) => { splotchRefs.current[1] = el; }} style={{ position: "absolute", top: "25%", left: "-5%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(ellipse at 60% 30%, rgba(45, 90, 61,0.5) 0%, transparent 70%)", filter: "blur(50px)", willChange: "transform" }} />
        <div ref={(el) => { splotchRefs.current[2] = el; }} style={{ position: "absolute", top: "45%", right: "5%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(ellipse at 40% 60%, rgba(45, 90, 61,0.45) 0%, transparent 70%)", filter: "blur(50px)", willChange: "transform" }} />
        <div ref={(el) => { splotchRefs.current[3] = el; }} style={{ position: "absolute", top: "60%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 50%, rgba(45, 90, 61,0.2) 0%, transparent 70%)", filter: "blur(60px)", willChange: "transform" }} />
        <div ref={(el) => { splotchRefs.current[4] = el; }} style={{ position: "absolute", top: "78%", right: "15%", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(ellipse at 55% 40%, rgba(45, 90, 61,0.25) 0%, transparent 70%)", filter: "blur(50px)", willChange: "transform" }} />
        <div ref={(el) => { splotchRefs.current[5] = el; }} style={{ position: "absolute", top: "92%", left: "30%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(ellipse at 45% 55%, rgba(61, 120, 80,0.28) 0%, transparent 70%)", filter: "blur(50px)", willChange: "transform" }} />
      </div>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px",
      }}>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2d5a3d", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
          Research Match
        </span>
        <Link href="/app" style={{
          padding: "8px 18px", fontSize: "0.8rem", textDecoration: "none",
          whiteSpace: "nowrap", flexShrink: 0,
          background: "#C4A265", color: "#ffffff", borderRadius: "999px",
          fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          Start Searching
        </Link>
      </nav>

      <div style={{ height: "24px" }} />

      {/* Hero */}
      <section style={{ padding: "32px 20px 72px", textAlign: "center" }}>
        <h1 style={{
          fontSize: "1.9rem", fontWeight: 800,
          color: "#2d5a3d", lineHeight: 1.12, marginBottom: "20px",
          letterSpacing: "-0.03em",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          Land Your Next Research Position.
        </h1>
        <p style={{
          fontSize: "1.05rem", color: "#6b7280",
          lineHeight: 1.7, marginBottom: "24px",
        }}>
          Find professors, understand their papers, and write emails that don&apos;t get deleted.
        </p>

        {/* Hero Search Bar — stacked vertically */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{
              display: "block", fontSize: "0.65rem", fontWeight: 700,
              color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.12em",
              marginBottom: "6px", textAlign: "left", paddingLeft: "4px",
            }}>Research Interest</label>
            <input
              type="text"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && heroSearch()}
              placeholder={HERO_PLACEHOLDERS[placeholderIdx]}
              className="mobile-input"
              style={{
                width: "100%", padding: "14px 16px", fontSize: "1rem",
                border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "14px",
                background: "rgba(255,255,255,0.5)", color: "#1a1a1a",
                fontFamily: "'Playfair Display', Georgia, serif", outline: "none",
                minHeight: "48px",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{
              display: "block", fontSize: "0.65rem", fontWeight: 700,
              color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.12em",
              marginBottom: "6px", textAlign: "left", paddingLeft: "4px",
            }}>University</label>
            <input
              type="text"
              value={heroUni}
              onChange={(e) => setHeroUni(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && heroSearch()}
              placeholder="e.g. MIT, Stanford..."
              className="mobile-input"
              style={{
                width: "100%", padding: "14px 16px", fontSize: "1rem",
                border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "14px",
                background: "rgba(255,255,255,0.5)", color: "#1a1a1a",
                fontFamily: "'Playfair Display', Georgia, serif", outline: "none",
                minHeight: "48px",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            />
          </div>
          <button
            onClick={heroSearch}
            className="mobile-btn btn-cta"
            style={{
              width: "100%", padding: "16px", fontSize: "1.1rem", fontWeight: 700,
              fontFamily: "'Playfair Display', Georgia, serif",
              border: "none", borderRadius: "14px", cursor: "pointer",
              color: "#ffffff", background: "#C4A265",
              minHeight: "48px",
            }}
          >
            Search
          </button>
        </div>

        <a href="#pricing" style={{
          fontSize: "0.85rem", color: "#6b7280", textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}>
          See pricing
        </a>
      </section>

      {/* Stats bar */}
      <section style={{
        background: "#ede8df", padding: "52px 20px",
        display: "flex", flexDirection: "column", gap: "32px",
        borderTop: "1px solid rgba(45, 90, 61,0.3)",
        borderBottom: "1px solid rgba(45, 90, 61,0.3)",
        margin: "0 0 0 0",
      }}>
        {[
          { num: "250M+", label: "papers indexed" },
          { num: "20K+", label: "professors discovered" },
          { num: "Free", label: "to start, always" },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "1.8rem", fontWeight: 800, color: "#2d5a3d",
              letterSpacing: "-0.03em",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>{stat.num}</div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "2px" }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* University badges */}
      <section style={{ padding: "72px 20px 36px" }}>
        <p style={{
          fontSize: "0.7rem", fontWeight: 700, color: "#6b7280",
          textTransform: "uppercase", letterSpacing: "0.12em",
          textAlign: "center", marginBottom: "14px",
        }}>Students from these schools have used Research Match</p>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center",
        }}>
          {["MIT", "Stanford", "Harvard", "Princeton", "Berkeley", "Yale", "Columbia", "Cornell", "CMU", "UCLA", "NYU", "UMich"].map((uni) => (
            <span key={uni} style={{
              padding: "5px 14px", borderRadius: "999px", fontSize: "0.78rem",
              background: "rgba(45, 90, 61,0.07)",
              border: "1px solid rgba(45, 90, 61,0.15)",
              color: "#1a1a1a", fontWeight: 500,
            }}>{uni}</span>
          ))}
        </div>
      </section>

      {/* How it works — vertical timeline */}
      <section style={{ padding: "72px 20px 84px" }}>
        <h2 style={{
          fontSize: "1.6rem", fontWeight: 700, color: "#2d5a3d",
          textAlign: "center", marginBottom: "12px",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          How it works
        </h2>
        <div style={{
          width: 60, height: 3, margin: "0 auto 36px",
          background: "linear-gradient(90deg, transparent, #8aaa96, transparent)",
          borderRadius: 2,
        }} />

        <div className="mobile-timeline">
          {steps.map((item, i) => (
            <div
              key={item.step}
              ref={(el) => { timelineRefs.current[i] = el; }}
              className="mobile-timeline-step mobile-card-enter"
              style={{
                position: "relative",
                paddingLeft: "48px",
                paddingBottom: i < steps.length - 1 ? "52px" : "0",
              }}
            >
              {/* Timeline line */}
              {i < steps.length - 1 && (
                <div className="mobile-timeline-line" style={{
                  position: "absolute",
                  left: "17px",
                  top: "44px",
                  bottom: "0",
                  width: "2px",
                  background: "linear-gradient(to bottom, #8aaa96, rgba(45, 90, 61,0.2))",
                }} />
              )}
              {/* Step circle */}
              <div style={{
                position: "absolute",
                left: "4px",
                top: "2px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#2d5a3d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(45, 90, 61,0.3)",
                zIndex: 1,
              }}>
                {item.step}
              </div>
              {/* Content */}
              <div style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(16px) saturate(1.2)",
                WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                border: "1px solid rgba(255,255,255,0.6)",
                borderRadius: "16px",
                padding: "24px 20px",
                boxShadow: "0 4px 24px rgba(45, 90, 61,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{item.icon}</div>
                <div style={{
                  display: "inline-block", fontSize: "0.6rem", fontWeight: 700,
                  color: "#2d5a3d", background: "rgba(45, 90, 61,0.08)",
                  padding: "4px 12px", borderRadius: "999px", marginBottom: "10px",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                }}>
                  Step {item.step}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#6b7280", lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Email checker callout */}
      <section style={{ padding: "20px 20px 100px" }}>
        <div style={{
          padding: "36px 24px", textAlign: "center",
          border: "2px solid rgba(45, 90, 61,0.2)",
          background: "rgba(45, 90, 61,0.04)",
          borderRadius: "20px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "14px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Sound like yourself, not a chatbot
          </h3>
          <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7 }}>
            The WORST thing you can do is use AI to write the email. The SECOND worst thing you can do is show no real interest. Our email checker scans your draft for generic tones, a proper intro and ask, specific papers, and more.
          </p>
        </div>
      </section>

      {/* Why cold emails fail */}
      <section style={{ padding: "20px 20px 100px" }}>
        <h2 style={{
          fontSize: "1.5rem", fontWeight: 700, color: "#2d5a3d",
          textAlign: "center", marginBottom: "12px",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          Most cold emails to professors get ignored. Here&apos;s why.
        </h2>
        <div style={{
          width: 60, height: 3, margin: "0 auto 28px",
          background: "linear-gradient(90deg, transparent, #8aaa96, transparent)",
          borderRadius: 2,
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {coldEmailPoints.map((point, i) => (
            <div
              key={i}
              ref={(el) => { coldEmailRefs.current[i] = el; }}
              className="mobile-card-enter"
              style={{
                display: "flex", gap: "14px", alignItems: "flex-start",
                padding: "18px 20px", borderRadius: "14px",
                background: "rgba(196, 92, 92,0.04)", border: "1px solid rgba(196, 92, 92,0.1)",
              }}
            >
              <span style={{ color: "#c45c5c", fontSize: "1.1rem", flexShrink: 0, marginTop: "2px" }}>{"\u2715"}</span>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
        <p style={{
          fontSize: "1rem", color: "#2d5a3d", textAlign: "center",
          marginTop: "24px", lineHeight: 1.7, fontWeight: 500,
        }}>
          Research Match helps you avoid all three. Our email checker catches generic and AI-sounding language before you hit send, so your message sounds like you, not a chatbot.
        </p>
      </section>

      {/* Email Checker Demo */}
      <section style={{ padding: "20px 20px 100px" }}>
        <EmailCheckerDemo />
      </section>

      {/* Free Starter Kit CTA */}
      <section style={{ padding: "20px 20px 100px" }}>
        <div style={{
          padding: "32px 24px", textAlign: "center",
          border: "2px solid rgba(45, 90, 61,0.15)",
          background: "linear-gradient(135deg, rgba(45, 90, 61,0.04), rgba(45, 90, 61,0.08))",
          borderRadius: "20px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "10px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Free: The Research Position Starter Kit
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.7, marginBottom: "18px" }}>
            The exact email format, what to avoid, and the secret weapon line. Based on advice from 30+ real professors.
          </p>
          <button
            onClick={() => setShowStarterKit(true)}
            style={{
              padding: "14px 32px", fontSize: "0.95rem", fontWeight: 700,
              fontFamily: "'Playfair Display', Georgia, serif",
              border: "none", borderRadius: "14px", cursor: "pointer",
              color: "#ffffff", background: "#2d5a3d",
              width: "100%", minHeight: "48px",
            }}
          >
            Download Free Starter Kit
          </button>
        </div>
      </section>

      {/* Social proof — stacked testimonials */}
      <section style={{ padding: "20px 20px 100px" }}>
        <h2 style={{
          fontSize: "1.5rem", fontWeight: 700, color: "#2d5a3d",
          textAlign: "center", marginBottom: "12px",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          What people are saying
        </h2>
        <div style={{
          width: 60, height: 3, margin: "0 auto 28px",
          background: "linear-gradient(90deg, transparent, #8aaa96, transparent)",
          borderRadius: 2,
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {testimonials.map((item, i) => (
            <div
              key={i}
              ref={(el) => { testimonialRefs.current[i] = el; }}
              className="mobile-card-enter mobile-tilt"
              onTouchMove={handleTilt}
              onTouchEnd={handleTiltEnd}
              onTouchCancel={handleTiltEnd}
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(16px) saturate(1.2)",
                WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                border: "1px solid rgba(255,255,255,0.6)",
                borderRadius: "20px",
                padding: "26px 22px",
                boxShadow: "0 4px 24px rgba(45, 90, 61,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
                willChange: "transform",
              }}
            >
              <div style={{
                fontSize: "2.5rem", lineHeight: 1, color: "rgba(45, 90, 61,0.12)",
                fontFamily: "Georgia, serif", marginBottom: "-8px",
              }}>&ldquo;</div>
              <p style={{ fontSize: "1.02rem", color: "#1a1a1a", lineHeight: 1.65, marginBottom: "14px" }}>
                {item.quote}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                - {item.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder note */}
      <section style={{ padding: "20px 20px 100px" }}>
        <div style={{
          padding: "28px 24px", borderLeft: "4px solid #2d5a3d",
          background: "rgba(45, 90, 61,0.03)", borderRadius: "0 14px 14px 0",
        }}>
          <p style={{
            fontSize: "1rem", color: "#6b7280", lineHeight: 1.75,
            fontStyle: "italic",
          }}>
            &ldquo;When I was a high school freshman, I used this approach to cold email 5 professors. A Princeton astrophysics professor responded within 24 hours and said I was &lsquo;way ahead of the curve.&rsquo; That&apos;s why I built Research Match.&rdquo;
          </p>
          <p style={{ fontSize: "0.85rem", color: "#2d5a3d", fontWeight: 700, marginTop: "14px" }}>
            - Jace, Founder
          </p>
        </div>
      </section>

      {/* Pricing — stacked vertically, Lifetime first */}
      <section id="pricing" style={{ padding: "40px 20px 60px" }}>
        <h2 style={{
          fontSize: "1.6rem", fontWeight: 700, color: "#2d5a3d",
          textAlign: "center", marginBottom: "12px",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          Simple pricing
        </h2>
        <p style={{
          fontSize: "0.95rem", color: "#6b7280", textAlign: "center", marginBottom: "4px",
        }}>
          Free to start because we know what it&apos;s like searching for research with zero budget.
        </p>
        <p style={{
          fontSize: "0.9rem", color: "#6b7280", textAlign: "center", marginBottom: "8px",
        }}>
          If you&apos;re emailing professors regularly, the Student plan pays for itself with one response.
        </p>
        <div style={{
          width: 60, height: 3, margin: "0 auto 32px",
          background: "linear-gradient(90deg, transparent, #8aaa96, transparent)",
          borderRadius: 2,
        }} />

        {/* Billing toggle — slider style */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Lifetime — Gold Premium (first on mobile) */}
          <div
            ref={(el) => { pricingRefs.current[0] = el; }}
            className={`mobile-card-enter `}
            style={{
              padding: "36px 24px", position: "relative",
              border: "2px solid rgba(196, 162, 101, 0.5)",
              background: "linear-gradient(165deg, rgba(255,250,235,0.85) 0%, rgba(255,245,220,0.6) 50%, rgba(245,235,200,0.4) 100%)",
              boxShadow: "0 0 40px rgba(196, 162, 101, 0.15), 0 8px 40px rgba(196, 162, 101, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              borderRadius: "20px",
              overflow: "visible",
            }}
          >
            <span style={{
              position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #A8893E, #C4A265, #A8893E)",
              color: "#ffffff",
              fontSize: "0.6rem", fontWeight: 700,
              padding: "6px 16px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 12px rgba(196, 162, 101, 0.3)",
            }}>Limited. First 200 users only</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#A8893E", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Lifetime</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
              <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#A8893E", letterSpacing: "-0.02em" }}>$25</p>
              <p style={{ fontSize: "1.1rem", color: "#A8893E", textDecoration: "line-through", fontWeight: 600 }}>$60</p>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#A8893E", marginBottom: "8px", fontWeight: 600 }}>one-time</p>
            {lifetimeSpotsRemaining !== null && lifetimeSpotsRemaining > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{
                  fontSize: "0.8rem", color: "#A8893E", fontWeight: 700,
                  background: "rgba(196, 162, 101,0.1)",
                  padding: "4px 12px", borderRadius: "8px", display: "inline-block",
                }}>
                  Limited to first 200 users
                </p>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic", marginTop: "6px" }}>
                  This deal won&apos;t last forever.
                </p>
              </div>
            )}
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
              <li style={{ fontSize: "0.9rem", color: "#1a1a1a", padding: "7px 0", fontWeight: 700 }}>Everything in Student, forever:</li>
              {[
                "Unlimited searches",
                "Unlimited research summaries",
                "Email checker",
                "Professor email finder",
                "Nearby professor access",
                "One payment, lifetime access",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#6b7280", padding: "7px 0", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#A8893E", flexShrink: 0, fontSize: "0.85rem" }}>{"\u2713"}</span> {f}
                </li>
              ))}
            </ul>
            {lifetimeSpotsRemaining === 0 ? (
              <button disabled className="mobile-btn" style={{
                display: "block", textAlign: "center", padding: "16px", fontSize: "1rem",
                width: "100%", background: "#6b7280", color: "#ffffff", border: "none",
                borderRadius: "14px", cursor: "not-allowed", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif", minHeight: "48px",
              }}>
                Sold out
              </button>
            ) : (
              <Link href="/app?upgrade=lifetime" className="mobile-btn" style={{
                display: "block", textAlign: "center", padding: "16px",
                textDecoration: "none", fontSize: "1rem", width: "100%",
                background: "linear-gradient(135deg, #A8893E, #C4A265)",
                color: "#ffffff", borderRadius: "14px", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                boxShadow: "0 4px 16px rgba(196, 162, 101, 0.3)",
                minHeight: "48px", lineHeight: "48px", paddingTop: 0, paddingBottom: 0,
              }}>
                Claim your spot
              </Link>
            )}
          </div>

          {/* Student — dark card */}
          <div
            ref={(el) => { pricingRefs.current[1] = el; }}
            className={`mobile-card-enter `}
            style={{
              padding: "36px 24px", position: "relative",
              background: "#2d5a3d",
              boxShadow: "0 12px 40px rgba(45, 90, 61,0.3)",
              borderRadius: "20px",
              overflow: "visible",
            }}
          >
            <span style={{
              position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
              background: "#f4f0ea", color: "#2d5a3d", fontSize: "0.65rem", fontWeight: 700,
              padding: "5px 16px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}>Most Popular</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(245,240,230,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Student</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginBottom: "4px" }}>
              <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>$</span>
              <div className="price-roller-wrap">
                {priceAnimating ? (
                  <div className="price-roller price-roller-exit">
                    <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                      {billingCycle === "monthly" ? "5" : "49"}
                    </span>
                  </div>
                ) : (
                  <div key={priceKey} className="price-roller price-roller-enter">
                    <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                      {billingCycle === "monthly" ? "5" : "49"}
                    </span>
                  </div>
                )}
              </div>
              <div className="price-roller-wrap" style={{ marginLeft: "4px" }}>
                {priceAnimating ? (
                  <div className="price-roller price-roller-exit">
                    <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(245,240,230,0.5)" }}>
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                ) : (
                  <div key={`suffix-${priceKey}`} className="price-roller price-roller-enter">
                    <span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(245,240,230,0.5)" }}>
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
                    <p style={{ fontSize: "0.8rem", color: "#9dbfaa", fontWeight: 600 }}>Save $11 vs monthly</p>
                  ) : (
                    <div style={{ height: "20px" }} />
                  )}
                </div>
              )}
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
              <li style={{ fontSize: "0.9rem", color: "rgba(245,240,230,0.7)", padding: "7px 0", fontWeight: 700 }}>Everything in Free, plus:</li>
              {[
                "Unlimited research summaries",
                "Email checker, catches generic & AI language",
                "Professor email finder",
                "Professor responsiveness indicator",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "rgba(245,240,230,0.85)", padding: "7px 0", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#9dbfaa", flexShrink: 0, fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app?upgrade=true" className="mobile-btn" style={{
              display: "block", textAlign: "center", padding: "16px", textDecoration: "none", fontSize: "1rem", width: "100%", minHeight: "48px",
              background: "#f4f0ea", color: "#2d5a3d", borderRadius: "14px", fontWeight: 700,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>
              Upgrade to Student, $5/mo
            </Link>
          </div>

          {/* Free */}
          <div
            ref={(el) => { pricingRefs.current[2] = el; }}
            className={`mobile-card-enter `}
            style={{
              padding: "32px 24px",
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(16px) saturate(1.2)",
              WebkitBackdropFilter: "blur(16px) saturate(1.2)",
              border: "1px solid rgba(255,255,255,0.6)",
              borderRadius: "20px",
              boxShadow: "0 4px 24px rgba(45, 90, 61,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Free</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#2d5a3d", marginBottom: "24px", letterSpacing: "-0.02em" }}>$0</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
              {["Unlimited professor searches", "3 research summaries", "Author position labels", "Save professors", "Paper links"].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#6b7280", padding: "7px 0", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ color: "#2d5a3d", fontSize: "0.85rem" }}>{"\u2713"}</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="btn-secondary mobile-btn" style={{ display: "block", textAlign: "center", padding: "16px", textDecoration: "none", fontSize: "1rem", width: "100%", minHeight: "48px" }}>
              Find a professor now, free
            </Link>
          </div>
        </div>

        {/* Inline waitlist */}
        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <p style={{ fontSize: "0.95rem", color: "#6b7280", marginBottom: "14px" }}>
            More plans coming soon. Want early access?
          </p>
          {inlineWaitlistDone ? (
            <p style={{ fontSize: "0.95rem", color: "#2d5a3d", fontWeight: 600 }}>
              You&apos;re on the list! We&apos;ll email you when new plans launch.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={inlineWaitlistEmail}
                onChange={(e) => setInlineWaitlistEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinInlineWaitlist()}
                className="mobile-input"
                style={{
                  padding: "14px 18px", fontSize: "1rem",
                  border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "14px",
                  background: "rgba(255,255,255,0.5)", color: "#1a1a1a",
                  fontFamily: "inherit", outline: "none", width: "100%",
                  minHeight: "48px",
                  transition: "border-color 0.2s",
                }}
              />
              <button
                onClick={joinInlineWaitlist}
                className="btn-cta mobile-btn"
                style={{ padding: "14px 24px", fontSize: "1rem", width: "100%", minHeight: "48px" }}
              >
                Join waitlist
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "28px 20px",
        borderTop: "1px solid rgba(45, 90, 61,0.3)",
        textAlign: "center",
      }}>
        <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "14px" }}>Research Match</span>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/app" style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>Tool</Link>
          <Link href="/blog" style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>Blog</Link>
          <a href="#pricing" style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>Pricing</a>
          <Link href="/feedback" style={{ fontSize: "0.85rem", color: "#6b7280", textDecoration: "none" }}>Feedback</Link>
        </div>
      </footer>

      {/* Starter Kit Modal */}
      <StarterKitModal isOpen={showStarterKit} onClose={() => setShowStarterKit(false)} />

      {/* Waitlist modal */}
      {waitlistTier && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(245,240,230,0.85)", backdropFilter: "blur(12px)",
          padding: "20px",
        }} onClick={() => setWaitlistTier(null)}>
          <div style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(40px) saturate(1.5)",
            WebkitBackdropFilter: "blur(40px) saturate(1.5)",
            border: "1.5px solid rgba(255,255,255,0.7)",
            borderRadius: "24px",
            boxShadow: "0 32px 80px rgba(45, 90, 61,0.12)",
            padding: "36px 28px", maxWidth: "380px", width: "100%",
          }} onClick={(e) => e.stopPropagation()}>
            {waitlistDone ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{"\u{1F389}"}</p>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "10px" }}>
                  You&apos;re on the list!
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#6b7280", lineHeight: 1.6 }}>
                  We&apos;ll email you when {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} launches.
                </p>
                <button onClick={() => setWaitlistTier(null)} className="btn-secondary mobile-btn" style={{ marginTop: "24px", padding: "14px 28px", width: "100%", minHeight: "48px" }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "10px" }}>
                  Join the {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} waitlist
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "20px", lineHeight: 1.6 }}>
                  Enter your email to get notified when it launches.
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinWaitlist()}
                  className="mobile-input"
                  style={{
                    width: "100%", padding: "14px 18px", fontSize: "1rem",
                    border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "14px",
                    background: "rgba(255,255,255,0.5)", color: "#1a1a1a",
                    fontFamily: "inherit", marginBottom: "14px", outline: "none",
                    minHeight: "48px",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                <button
                  onClick={joinWaitlist}
                  disabled={waitlistLoading || !waitlistEmail}
                  className="btn-cta landing-cta-primary mobile-btn"
                  style={{ width: "100%", padding: "16px", fontSize: "1rem", minHeight: "48px" }}
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
