"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistTier, setWaitlistTier] = useState<"research_pro" | "pro" | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [paperCount, setPaperCount] = useState(0);

  // Animate the paper count on mount
  useEffect(() => {
    let frame = 0;
    const target = 250;
    const duration = 40;
    const interval = setInterval(() => {
      frame++;
      setPaperCount(Math.min(Math.round((frame / duration) * target), target));
      if (frame >= duration) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

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
    <div style={{ minHeight: "100vh" }}>
      {/* Background splotches */}
      <div className="splotches">
        <div className="splotch splotch-1" />
        <div className="splotch splotch-2" />
        <div className="splotch splotch-3" />
        <div className="splotch splotch-4" />
        <div className="splotch splotch-5" />
      </div>

      {/* Nav */}
      <nav className="landing-nav" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 40px", maxWidth: "1200px", margin: "0 auto",
      }}>
        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2d5a3d", letterSpacing: "-0.02em" }}>
          Research Match
        </span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/feedback" style={{ fontSize: "0.9rem", color: "#8A8D72", textDecoration: "none", transition: "color 0.2s" }}>Feedback</Link>
          <Link href="/app" className="btn-cta landing-cta-primary rm-search-btn" style={{ padding: "11px 28px", fontSize: "0.9rem", textDecoration: "none" }}>
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
          color: "#2d5a3d", lineHeight: 1.1, marginBottom: "28px",
          letterSpacing: "-0.03em",
        }}>
          Find the right research professor in 5 minutes, not 8 hours.
        </h1>
        <p style={{
          fontSize: "clamp(1.05rem, 2vw, 1.3rem)", color: "#5A5D45",
          lineHeight: 1.7, maxWidth: "640px", margin: "0 auto 20px",
        }}>
          Search <span className="stat-number">{paperCount}M+</span> academic papers.
          Understand their work instantly.
          Write emails that actually get responses.
        </p>
        <p className="hero-social" style={{
          fontSize: "0.95rem", color: "#8A8D72", fontStyle: "italic", marginBottom: "44px",
        }}>
          A Princeton professor responded to a high school freshman within 24 hours.
        </p>
        <div className="hero-buttons" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/app" className="btn-cta landing-cta-primary rm-search-btn" style={{
            padding: "18px 40px", fontSize: "1.15rem", textDecoration: "none",
          }}>
            Start searching for free
          </Link>
          <a href="#pricing" className="btn-secondary" style={{
            padding: "18px 40px", fontSize: "1.15rem", textDecoration: "none",
          }}>
            See pricing
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section" style={{
        maxWidth: "1000px", margin: "0 auto", padding: "60px 40px 80px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#2d5a3d",
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
                fontSize: "2.8rem", marginBottom: "18px",
                display: "inline-block",
              }}>
                {item.icon}
              </div>
              <div style={{
                display: "inline-block", fontSize: "0.65rem", fontWeight: 700,
                color: "#2d5a3d", background: "rgba(45,90,61,0.08)",
                padding: "4px 12px", borderRadius: "999px", marginBottom: "14px",
                textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                Step {item.step}
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#3D4127", marginBottom: "12px" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "0.95rem", color: "#8A8D72", lineHeight: 1.65 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="landing-section" style={{
        maxWidth: "1000px", margin: "0 auto", padding: "40px 40px 80px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#2d5a3d",
          textAlign: "center", marginBottom: "12px",
        }}>
          What people are saying
        </h2>
        <div className="section-divider" />
        <div className="landing-quotes" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
        }}>
          {[
            { quote: "This is actually good.", author: "Professor, r/AskAcademia" },
            { quote: "Endorse this advice 💯. If an email smells of AI I will not answer it.", author: "Research Professor" },
            { quote: "Your website has made my task very easy and simple.", author: "Student user" },
            { quote: "A Princeton professor responded within 24 hours using this tool.", author: "Tool creator" },
          ].map((item, i) => (
            <div key={i} className="glass-card landing-quote" style={{ padding: "30px 26px" }}>
              <div className="quote-mark">&ldquo;</div>
              <p style={{ fontSize: "1.05rem", color: "#3D4127", lineHeight: 1.65, marginBottom: "16px" }}>
                {item.quote}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#8A8D72", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                — {item.author}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section" style={{
        maxWidth: "1200px", margin: "0 auto", padding: "40px 40px 100px",
      }}>
        <h2 style={{
          fontSize: "1.8rem", fontWeight: 700, color: "#2d5a3d",
          textAlign: "center", marginBottom: "12px",
        }}>
          Simple pricing
        </h2>
        <p style={{
          fontSize: "1.05rem", color: "#8A8D72", textAlign: "center", marginBottom: "8px",
        }}>
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="section-divider" />

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "44px" }}>
          <div style={{
            display: "inline-flex", background: "rgba(45,90,61,0.08)",
            border: "2px solid rgba(45,90,61,0.2)", borderRadius: "999px",
            padding: "4px", gap: "4px",
          }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              style={{
                padding: "12px 32px", fontSize: "0.95rem", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                border: "none", borderRadius: "999px", cursor: "pointer",
                transition: "all 0.3s ease",
                background: billingCycle === "monthly" ? "#2d5a3d" : "transparent",
                color: billingCycle === "monthly" ? "#F5F0E6" : "#3D4127",
              }}
            >Monthly</button>
            <button
              onClick={() => setBillingCycle("annual")}
              style={{
                padding: "12px 32px", fontSize: "0.95rem", fontWeight: 700,
                fontFamily: "'Playfair Display', Georgia, serif",
                border: "none", borderRadius: "999px", cursor: "pointer",
                transition: "all 0.3s ease",
                background: billingCycle === "annual" ? "#2d5a3d" : "transparent",
                color: billingCycle === "annual" ? "#F5F0E6" : "#3D4127",
              }}
            >Annual</button>
          </div>
        </div>

        <div className="landing-pricing" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px", alignItems: "start",
        }}>
          {/* Free */}
          <div className="glass-card landing-pricing-card" style={{ padding: "36px 30px" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8A8D72", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Free</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#2d5a3d", marginBottom: "24px", letterSpacing: "-0.02em" }}>$0</p>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              {["3 searches per month", "Full research summaries", "Suggested questions", "Author position labels", "Save professors", "Paper links"].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#5A5D45", padding: "7px 0", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ color: "#2d5a3d", fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app" className="btn-secondary" style={{ display: "block", textAlign: "center", padding: "14px", textDecoration: "none", fontSize: "0.95rem" }}>
              Get started
            </Link>
          </div>

          {/* Student */}
          <div id="student-card" className="glass-card landing-pricing-card" style={{
            padding: "36px 30px", position: "relative",
            border: "2px solid rgba(45,90,61,0.35)",
            boxShadow: "0 8px 40px rgba(45,90,61,0.15)",
            display: "block",
          }}>
            <span style={{
              position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
              background: "#2d5a3d", color: "#F5F0E6", fontSize: "0.65rem", fontWeight: 700,
              padding: "5px 16px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}>Most Popular</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Student</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#2d5a3d", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              {billingCycle === "monthly" ? "$9" : "$79"}
              <span style={{ fontSize: "1rem", fontWeight: 400, color: "#8A8D72" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
            </p>
            {billingCycle === "annual" ? (
              <p style={{ fontSize: "0.8rem", color: "#636B2F", marginBottom: "20px", fontWeight: 600 }}>Save $29 vs monthly</p>
            ) : (
              <div style={{ height: "20px" }} />
            )}
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li style={{ fontSize: "0.9rem", color: "#3D4127", padding: "7px 0", fontWeight: 700 }}>Everything in Free, plus:</li>
              {[
                "Unlimited searches",
                "Email checker — catches generic & AI language",
                "Professor email finder",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#5A5D45", padding: "7px 0", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#2d5a3d", flexShrink: 0, fontSize: "0.85rem" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/app?upgrade=true" className="btn-cta landing-cta-primary rm-search-btn" style={{ display: "block", textAlign: "center", padding: "14px", textDecoration: "none", fontSize: "0.95rem", width: "100%" }}>
              Upgrade to Student
            </Link>
          </div>

          {/* Research Pro */}
          <div className="glass-card landing-pricing-card" style={{ padding: "36px 30px", opacity: 0.65, position: "relative" }}>
            <span style={{
              position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
              background: "#8A8D72", color: "#F5F0E6", fontSize: "0.65rem", fontWeight: 700,
              padding: "5px 16px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}>Coming Soon</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8A8D72", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Research Pro</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#3D4127", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              {billingCycle === "monthly" ? "$19" : "$149"}
              <span style={{ fontSize: "1rem", fontWeight: 400, color: "#8A8D72" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
            </p>
            {billingCycle === "annual" ? (
              <p style={{ fontSize: "0.8rem", color: "#636B2F", marginBottom: "20px", fontWeight: 600 }}>Save $79 vs monthly</p>
            ) : (
              <div style={{ height: "20px" }} />
            )}
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li style={{ fontSize: "0.9rem", color: "#3D4127", padding: "7px 0", fontWeight: 700 }}>Everything in Student, plus:</li>
              {[
                "Lab activity signals",
                "Grad student & postdoc lookup",
                "Smart professor ranking",
                "Email tone analyzer",
                "Follow-up email suggestions",
                "Side-by-side comparison",
                "Export research briefs as PDF",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#8A8D72", padding: "7px 0", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ color: "#BAC095", fontSize: "0.85rem" }}>○</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => { setWaitlistTier("research_pro"); setWaitlistDone(false); setWaitlistEmail(""); }} className="btn-secondary" style={{ width: "100%", padding: "14px", fontSize: "0.95rem" }}>
              Join Waitlist
            </button>
          </div>

          {/* Pro */}
          <div className="glass-card landing-pricing-card" style={{ padding: "36px 30px", opacity: 0.65, position: "relative" }}>
            <span style={{
              position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
              background: "#8A8D72", color: "#F5F0E6", fontSize: "0.65rem", fontWeight: 700,
              padding: "5px 16px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}>Coming Soon</span>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8A8D72", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Pro</p>
            <p style={{ fontSize: "2.6rem", fontWeight: 800, color: "#3D4127", marginBottom: "4px", letterSpacing: "-0.02em" }}>
              {billingCycle === "monthly" ? "$59" : "$319"}
              <span style={{ fontSize: "1rem", fontWeight: 400, color: "#8A8D72" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
            </p>
            {billingCycle === "annual" ? (
              <p style={{ fontSize: "0.8rem", color: "#636B2F", marginBottom: "20px", fontWeight: 600 }}>Save $389 vs monthly</p>
            ) : (
              <div style={{ height: "20px" }} />
            )}
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li style={{ fontSize: "0.9rem", color: "#3D4127", padding: "7px 0", fontWeight: 700 }}>Everything in Research Pro, plus:</li>
              {[
                "Funding radar — NIH/NSF grants",
                "Undergrad hiring signal",
                "Smart pivot engine",
                "Full grad student gateway",
              ].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#8A8D72", padding: "7px 0", display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ color: "#BAC095", fontSize: "0.85rem" }}>○</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => { setWaitlistTier("pro"); setWaitlistDone(false); setWaitlistEmail(""); }} className="btn-secondary" style={{ width: "100%", padding: "14px", fontSize: "0.95rem" }}>
              Join Waitlist
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" style={{
        maxWidth: "1200px", margin: "0 auto", padding: "40px",
        borderTop: "1px solid rgba(186,192,149,0.3)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px",
      }}>
        <span style={{ fontSize: "0.9rem", color: "#8A8D72", fontWeight: 600 }}>Research Match</span>
        <div style={{ display: "flex", gap: "28px" }}>
          <Link href="/app" style={{ fontSize: "0.85rem", color: "#8A8D72", textDecoration: "none", transition: "color 0.2s" }}>Tool</Link>
          <a href="#pricing" style={{ fontSize: "0.85rem", color: "#8A8D72", textDecoration: "none", transition: "color 0.2s" }}>Pricing</a>
          <Link href="/feedback" style={{ fontSize: "0.85rem", color: "#8A8D72", textDecoration: "none", transition: "color 0.2s" }}>Feedback</Link>
        </div>
      </footer>

      {/* Waitlist modal */}
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
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "10px" }}>
                  You&apos;re on the list!
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#8A8D72", lineHeight: 1.6 }}>
                  We&apos;ll email you when {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} launches.
                </p>
                <button onClick={() => setWaitlistTier(null)} className="btn-secondary" style={{ marginTop: "24px", padding: "12px 28px" }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "10px" }}>
                  Join the {waitlistTier === "research_pro" ? "Research Pro" : "Pro"} waitlist
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#8A8D72", marginBottom: "24px", lineHeight: 1.6 }}>
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
                    border: "1.5px solid rgba(186,192,149,0.4)", borderRadius: "14px",
                    background: "rgba(255,255,255,0.5)", color: "#3D4127",
                    fontFamily: "inherit", marginBottom: "16px", outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(45,90,61,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,90,61,0.08)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(186,192,149,0.4)"; e.currentTarget.style.boxShadow = "none"; }}
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
