"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type DemoPhase = "idle" | "showing_bad" | "showing_flags" | "flags_done" | "deleting" | "typing" | "complete";

const BAD_EMAIL = `Dear Professor Smith, I am writing to express my sincere interest in your groundbreaking research. I would be honored to work in your prestigious lab. I am a dedicated and hardworking student who is willing to do whatever it takes. I read your paper on machine learning and found it very interesting. Please let me know if you have any available positions. Thank you for your time and consideration.`;

const GOOD_EMAIL = `Hi Professor Smith, I'm a sophomore studying computer science. I've been working on a project using neural networks for image classification and your recent paper on transfer learning caught my attention. I was curious how your approach handles domain shift when the source dataset is small. Would you have any openings for a volunteer this semester? If not, is there someone in your group you'd recommend I reach out to? Thanks, [Name]`;

const RED_FLAGS = [
  "Sycophantic tone",
  "Too generic",
  "No specific question asked",
  "No personal connection to their work",
  "AI-sounding language detected",
];

const GREEN_FLAGS = [
  "Specific research connection",
  "Real question asked",
  "Direct ask with volunteer framing",
  "Redirect line included",
  "Sounds genuine",
];

// Map: when typing progress hits these thresholds (0-1), flip the corresponding red flag to green
const FLAG_THRESHOLDS = [0.15, 0.35, 0.55, 0.75, 0.92];

export default function EmailCheckerDemo() {
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [visibleRedFlags, setVisibleRedFlags] = useState(0);
  const [displayedText, setDisplayedText] = useState(BAD_EMAIL);
  // -1 = red, 0+ = index into GREEN_FLAGS that this flag has been "fixed" to
  const [flagStates, setFlagStates] = useState<("red" | "green")[]>(RED_FLAGS.map(() => "red"));
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const addTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const startDemo = useCallback(() => {
    clearAll();
    setVisibleRedFlags(0);
    setDisplayedText(BAD_EMAIL);
    setFlagStates(RED_FLAGS.map(() => "red"));
    setPhase("showing_bad");

    addTimeout(() => {
      setPhase("showing_flags");
      RED_FLAGS.forEach((_, i) => {
        addTimeout(() => {
          setVisibleRedFlags(i + 1);
          if (i === RED_FLAGS.length - 1) {
            addTimeout(() => setPhase("flags_done"), 200);
          }
        }, i * 250);
      });
    }, 600);
  }, [addTimeout, clearAll]);

  // Live delete then retype
  const handleFix = useCallback(() => {
    if (phase !== "flags_done") return;
    setPhase("deleting");

    let current = BAD_EMAIL;
    const deleteSpeed = 8; // ms per character deleted
    const typeSpeed = 18; // ms per character typed

    // Phase 1: delete the bad email
    function deleteStep() {
      if (current.length <= 0) {
        // Done deleting, start typing
        setDisplayedText("");
        setPhase("typing");
        let typed = 0;
        function typeStep() {
          if (typed >= GOOD_EMAIL.length) {
            setDisplayedText(GOOD_EMAIL);
            setPhase("complete");
            return;
          }
          // Type a chunk for speed
          const chunk = Math.min(2, GOOD_EMAIL.length - typed);
          typed += chunk;
          setDisplayedText(GOOD_EMAIL.slice(0, typed));

          // Check if we should flip a flag
          const progress = typed / GOOD_EMAIL.length;
          FLAG_THRESHOLDS.forEach((threshold, i) => {
            if (progress >= threshold) {
              setFlagStates(prev => {
                if (prev[i] === "green") return prev;
                const next = [...prev];
                next[i] = "green";
                return next;
              });
            }
          });

          animFrameRef.current = requestAnimationFrame(() => {
            addTimeout(typeStep, typeSpeed);
          });
        }
        addTimeout(typeStep, 200);
        return;
      }
      // Delete a chunk for speed
      const chunk = Math.min(4, current.length);
      current = current.slice(0, current.length - chunk);
      setDisplayedText(current);
      animFrameRef.current = requestAnimationFrame(() => {
        addTimeout(deleteStep, deleteSpeed);
      });
    }
    deleteStep();
  }, [phase, addTimeout]);

  const handleReplay = useCallback(() => {
    clearAll();
    setPhase("idle");
    setVisibleRedFlags(0);
    setDisplayedText(BAD_EMAIL);
    setFlagStates(RED_FLAGS.map(() => "red"));
    addTimeout(() => startDemo(), 200);
  }, [clearAll, addTimeout, startDemo]);

  // IntersectionObserver to auto-start
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted.current) {
            hasStarted.current = true;
            startDemo();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearAll();
    };
  }, [startDemo, clearAll]);

  const isGoodPhase = phase === "typing" || phase === "complete";
  const showFixButton = phase === "flags_done";
  const showReplayButton = phase === "complete";
  const showCursor = phase === "deleting" || phase === "typing";

  return (
    <section
      ref={containerRef}
      style={{
        maxWidth: "880px",
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      {/* Section header */}
      <h2
        style={{
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
          fontWeight: 800,
          color: "#1C7A56",
          textAlign: "center",
          marginBottom: "40px",
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
        }}
      >
        See the email checker in action
      </h2>

      {/* Glassmorphism card */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.8) inset",
          overflow: "hidden",
        }}
      >
        {/* Mock email editor toolbar */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.35)",
          }}
        >
          <div style={{ display: "flex", gap: "6px", marginRight: "8px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27CA40" }} />
          </div>
          <div style={{ display: "flex", gap: "16px", flex: 1 }}>
            {["B", "I", "U"].map((label) => (
              <span
                key={label}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: label === "B" ? 700 : 400,
                  fontStyle: label === "I" ? "italic" : "normal",
                  textDecoration: label === "U" ? "underline" : "none",
                  color: "#8A9A8E",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  background: "rgba(0,0,0,0.03)",
                  userSelect: "none",
                }}
              >
                {label}
              </span>
            ))}
          </div>
          {/* Status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: isGoodPhase ? "#1C7A56" : phase === "idle" ? "#8A9A8E" : "#9B3322",
              transition: "color 0.4s ease",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isGoodPhase ? "#1C7A56" : phase === "idle" ? "#8A9A8E" : "#9B3322",
                transition: "background 0.4s ease",
                boxShadow: isGoodPhase
                  ? "0 0 6px rgba(28, 122, 86, 0.5)"
                  : phase !== "idle"
                  ? "0 0 6px rgba(155, 51, 34, 0.4)"
                  : "none",
              }}
            />
            {isGoodPhase ? "Looking good" : phase === "idle" ? "Analyzing..." : "Issues found"}
          </div>
        </div>

        {/* To / Subject mock fields */}
        <div
          style={{
            padding: "12px 24px 0",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#8A9A8E", minWidth: "52px" }}>To:</span>
            <span style={{ fontSize: "0.85rem", color: "#4A5D50" }}>professor.smith@university.edu</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#8A9A8E", minWidth: "52px" }}>Subject:</span>
            <span style={{ fontSize: "0.85rem", color: "#4A5D50", transition: "opacity 0.3s ease" }}>
              {isGoodPhase
                ? "Question about your transfer learning paper"
                : "Research Opportunity Inquiry"}
            </span>
          </div>
          <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", marginTop: "4px" }} />
        </div>

        {/* Email body */}
        <div style={{ padding: "20px 24px 24px", position: "relative" }}>
          <div
            style={{
              fontSize: "clamp(0.88rem, 1.3vw, 0.95rem)",
              lineHeight: 1.75,
              color: "#2C3E34",
              minHeight: "180px",
              whiteSpace: "pre-wrap",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {displayedText}
            {showCursor && (
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "1.1em",
                  background: "#1C7A56",
                  marginLeft: "1px",
                  verticalAlign: "text-bottom",
                  animation: "cursorBlink 0.6s step-end infinite",
                }}
              />
            )}
          </div>
        </div>

        {/* Flags area */}
        <div
          style={{
            padding: "0 24px 24px",
            minHeight: "60px",
          }}
        >
          {visibleRedFlags > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {RED_FLAGS.slice(0, visibleRedFlags).map((flag, i) => {
                const isGreen = flagStates[i] === "green";
                const greenLabel = GREEN_FLAGS[i];
                return (
                  <span
                    key={`flag-${i}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      background: isGreen ? "rgba(28, 122, 86, 0.08)" : "rgba(155, 51, 34, 0.08)",
                      color: isGreen ? "#1C7A56" : "#9B3322",
                      border: `1px solid ${isGreen ? "rgba(28, 122, 86, 0.18)" : "rgba(155, 51, 34, 0.18)"}`,
                      transition: "all 0.4s ease",
                      animation: isGreen ? "none" : "fadeSlideIn 0.3s ease both",
                    }}
                  >
                    {isGreen ? (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="6.5" stroke="#1C7A56" strokeWidth="1.5" />
                        <path d="M5.5 8L7.2 9.8L10.5 6.2" stroke="#1C7A56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#9B3322" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M8 6.5V9" stroke="#9B3322" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="8" cy="11" r="0.75" fill="#9B3322" />
                      </svg>
                    )}
                    {isGreen ? greenLabel : flag}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Action button bar */}
        <div
          style={{
            padding: "0 24px 24px",
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            minHeight: "48px",
          }}
        >
          {showFixButton && (
            <button
              onClick={handleFix}
              className="btn-cta"
              style={{
                padding: "12px 36px",
                fontSize: "0.95rem",
                fontWeight: 700,
                borderRadius: "999px",
                cursor: "pointer",
                animation: "fadeSlideIn 0.4s ease both",
              }}
            >
              Fix it
            </button>
          )}

          {showReplayButton && (
            <button
              onClick={handleReplay}
              style={{
                padding: "10px 28px",
                fontSize: "0.85rem",
                fontWeight: 600,
                borderRadius: "999px",
                cursor: "pointer",
                background: "rgba(28, 122, 86, 0.08)",
                color: "#1C7A56",
                border: "1px solid rgba(28, 122, 86, 0.2)",
                transition: "all 0.2s ease",
                animation: "fadeSlideIn 0.4s ease both",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(28, 122, 86, 0.14)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(28, 122, 86, 0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Replay demo
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
