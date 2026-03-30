"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface EmailParagraph {
  text: string;
  annotation: string;
}

interface EmailExample {
  label: string;
  result: string;
  paragraphs: EmailParagraph[];
}

const emails: EmailExample[] = [
  {
    label: "Email 1 -- Princeton Response (24 hours)",
    result:
      'Professor responded within 24 hours. Said I was "way ahead of the curve." Offered to ask around the department for opportunities.',
    paragraphs: [
      {
        text: "Hi Professor [redacted], I\u2019m a high school freshman planning to major in astronomy. I\u2019ve been teaching myself Python to work with public datasets from the Sloan Digital Sky Survey, and your work on [redacted topic] caught my attention because I\u2019m trying to understand how [redacted connection to student interest].",
        annotation:
          "Led with MY interest and skills first. Mentioned Python which shows I have something to offer. Connected my interest to their work naturally.",
      },
      {
        text: "Your paper on [redacted specific paper topic] made me wonder: [redacted specific question]?",
        annotation:
          "Asked a specific question that came from actually reading the paper. Not a generic \u2018tell me more about your research\u2019 question.",
      },
      {
        text: "I\u2019d love to get involved in research in any way, even just volunteering. If you\u2019re not taking students, is there someone in your group you\u2019d recommend I reach out to?",
        annotation:
          "Direct ask with volunteer framing. The redirect line at the end turns a rejection into a lead.",
      },
    ],
  },
  {
    label: "Email 2 -- ASU Response (lab position offered)",
    result:
      "Professor responded within 3 days. Invited them to visit the lab. Eventually offered a paid summer position.",
    paragraphs: [
      {
        text: "Hi Professor [redacted], I\u2019m a junior studying biomedical engineering at [redacted university]. I\u2019ve been working on a side project analyzing EEG signal data, and your recent paper on [redacted topic] caught my eye because of how you approached [redacted specific method].",
        annotation:
          "Showed a real project they\u2019re working on. Not just \u2018I\u2019m interested in your field\u2019 but proof of hands-on work.",
      },
      {
        text: "I was particularly curious about [redacted specific technical question from the paper]. Has your lab explored [redacted follow-up idea]?",
        annotation:
          "Technical depth. This question shows they actually understood the paper, not just skimmed the abstract.",
      },
      {
        text: "I\u2019d love to contribute to your lab\u2019s work this summer, even in a volunteer capacity. If your lab is full, would you recommend anyone else in the department working on similar problems?",
        annotation:
          "Summer framing gives a timeline. Volunteer offer lowers the bar. Redirect line opens another door.",
      },
    ],
  },
];

const keyPatterns = [
  "Led with the student\u2019s own interests, not the professor\u2019s papers",
  "Asked a specific question from reading the paper",
  "Used the volunteer framing",
  "Included the redirect line",
  "Kept it under 150 words",
  "Wrote it themselves, no AI",
];

/* ------------------------------------------------------------------ */
/*  Fade-in-on-scroll hook                                             */
/* ------------------------------------------------------------------ */

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Annotation({ text }: { text: string }) {
  return (
    <div
      style={{
        borderLeft: "4px solid #2d5a3d",
        background: "rgba(45, 90, 61, 0.07)",
        padding: "14px 18px",
        borderRadius: "0 10px 10px 0",
        fontSize: "0.9rem",
        lineHeight: 1.65,
        color: "#1a1a1a",
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  );
}

function ResultBox({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(45, 90, 61, 0.12) 0%, rgba(45, 90, 61, 0.06) 100%)",
        border: "1px solid rgba(45, 90, 61, 0.25)",
        borderRadius: "12px",
        padding: "20px 24px",
        marginTop: "12px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "#2d5a3d",
          color: "#fff",
          fontSize: "0.85rem",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        &#10003;
      </span>
      <p style={{ margin: 0, lineHeight: 1.7, fontWeight: 500, color: "#2d5a3d" }}>{text}</p>
    </div>
  );
}

function EmailCard({ email, index }: { email: EmailExample; index: number }) {
  return (
    <FadeIn delay={index * 120}>
      <div style={{ marginBottom: "56px" }}>
        {/* Email header */}
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.25rem, 3vw, 1.6rem)",
            fontWeight: 700,
            color: "#2d5a3d",
            marginBottom: "28px",
            letterSpacing: "-0.01em",
          }}
        >
          {email.label}
        </h2>

        {/* Paragraphs + annotations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {email.paragraphs.map((p, i) => (
            <FadeIn key={i} delay={index * 120 + (i + 1) * 100}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "12px",
                }}
                className="email-row"
              >
                {/* Email paragraph card */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.85)",
                    border: "1px solid rgba(44, 62, 52, 0.1)",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    lineHeight: 1.75,
                    fontSize: "0.95rem",
                    color: "#1a1a1a",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  {p.text}
                </div>

                {/* Annotation */}
                <Annotation text={p.annotation} />
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Result */}
        <FadeIn delay={index * 120 + 400}>
          <ResultBox text={email.result} />
        </FadeIn>
      </div>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  Gated overlay for free users                                       */
/* ------------------------------------------------------------------ */

function GatedOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        top: "140px", // allow first couple lines to show
        background: "linear-gradient(to bottom, rgba(245, 240, 230, 0) 0%, rgba(245, 240, 230, 0.92) 15%, rgba(245, 240, 230, 0.98) 30%)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(45, 90, 61,0.2)",
          borderRadius: "20px",
          padding: "48px 40px",
          maxWidth: "500px",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #2d5a3d, #24956A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "1.5rem",
            color: "#fff",
          }}
        >
          &#128274;
        </div>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "#2d5a3d",
            marginBottom: "14px",
            lineHeight: 1.35,
          }}
        >
          Premium Content
        </h3>
        <p
          style={{
            fontSize: "1rem",
            lineHeight: 1.7,
            color: "#5A6E60",
            marginBottom: "28px",
          }}
        >
          Upgrade to see full annotated emails that got responses from Princeton
          and ASU professors.
        </p>
        <Link
          href="/app?upgrade=true"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #2d5a3d, #24956A)",
            color: "#fff",
            padding: "14px 36px",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "1rem",
            textDecoration: "none",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 4px 16px rgba(45, 90, 61,0.3)",
          }}
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ExamplesPage() {
  const { profile, loading } = useAuth();
  const isPaid = profile?.plan_type !== "free" && profile?.plan_type != null;

  return (
    <>
      {/* Inline responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .email-row {
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
            align-items: start;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", padding: "40px 20px", position: "relative" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* ---- Nav ---- */}
          <nav
            style={{
              marginBottom: "48px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              href="/"
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: "#2d5a3d",
                textDecoration: "none",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Research Match
            </Link>
            <Link
              href="/app"
              style={{
                padding: "10px 24px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#2d5a3d",
                border: "1.5px solid #2d5a3d",
                borderRadius: "10px",
                textDecoration: "none",
                transition: "background 0.2s ease, color 0.2s ease",
                background: "transparent",
              }}
            >
              Back to Search
            </Link>
          </nav>

          {/* ---- Header ---- */}
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  fontWeight: 800,
                  color: "#2d5a3d",
                  letterSpacing: "-0.02em",
                  marginBottom: "16px",
                  lineHeight: 1.2,
                }}
              >
                Emails That Got Responses
              </h1>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#6b7280",
                  lineHeight: 1.7,
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                Real cold emails, annotated line by line, that landed replies
                from professors at Princeton and ASU.
              </p>
            </div>
          </FadeIn>

          {/* ---- Email content (gated or full) ---- */}
          <div style={{ position: "relative" }}>
            {/* Always render email content, but clip for free users */}
            <div
              style={{
                ...((!isPaid && !loading)
                  ? { maxHeight: "420px", overflow: "hidden" }
                  : {}),
              }}
            >
              {emails.map((email, i) => (
                <EmailCard key={i} email={email} index={i} />
              ))}

              {/* ---- Key Patterns Section ---- */}
              {(isPaid || loading) && (
                <FadeIn delay={300}>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.45)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: "1px solid rgba(45, 90, 61, 0.15)",
                      borderRadius: "20px",
                      padding: "40px 36px",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
                      marginBottom: "40px",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                        fontWeight: 700,
                        color: "#2d5a3d",
                        marginBottom: "24px",
                      }}
                    >
                      Key Patterns in Both Emails
                    </h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                      {keyPatterns.map((pattern, i) => (
                        <li
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "14px",
                            fontSize: "1rem",
                            lineHeight: 1.65,
                            color: "#1a1a1a",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: "rgba(45, 90, 61, 0.12)",
                              color: "#2d5a3d",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              flexShrink: 0,
                              marginTop: "3px",
                            }}
                          >
                            &#10003;
                          </span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}
            </div>

            {/* Gated overlay for free / unauthenticated users */}
            {!isPaid && !loading && <GatedOverlay />}
          </div>
        </div>
      </div>
    </>
  );
}
