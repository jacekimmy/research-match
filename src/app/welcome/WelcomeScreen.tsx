"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

const CONFETTI_COLORS = ["#C4A265", "#F5EFE0", "#E8C97B", "#FFF8ED", "#D4B896", "#EDE0C4", "#FAEBD7"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  life: number;
  decay: number;
}

function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Particle[] = [];

  // Two party-popper sources — upper left and upper right
  const sources = [
    { x: canvas.width * 0.22, y: canvas.height * 0.38 },
    { x: canvas.width * 0.78, y: canvas.height * 0.38 },
  ];

  for (const src of sources) {
    for (let i = 0; i < 60; i++) {
      // Spread mostly upward and outward from each source
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const speed = 3.5 + Math.random() * 9;
      particles.push({
        x: src.x,
        y: src.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 7,
        h: 3 + Math.random() * 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.22,
        life: 0.85 + Math.random() * 0.15,
        decay: 0.005 + Math.random() * 0.007,
      });
    }
  }

  let rafId: number;

  function draw() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    let anyAlive = false;

    for (const p of particles) {
      if (p.life <= 0) continue;
      anyAlive = true;
      p.vy += 0.16; // gravity
      p.vx *= 0.988; // light air resistance
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;

      ctx!.save();
      ctx!.globalAlpha = Math.max(0, p.life);
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx!.restore();
    }

    if (anyAlive) {
      rafId = requestAnimationFrame(draw);
    }
  }

  rafId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(rafId);
}

const STATS = [
  "Professor Search",
  "Research Summaries",
  "Email Template",
  "Email Checker",
  "Follow-Up Tool",
  "Emails That Worked",
];

export default function WelcomeScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cancel = launchConfetti(canvasRef.current);

    function handleResize() {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    }
    window.addEventListener("resize", handleResize);
    return () => {
      cancel();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes wc-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes wc-btn-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes wc-glow-pulse {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.22; }
        }

        .wc-sparkle {
          opacity: 0;
          animation: wc-fade-in 0.5s ease 0.05s forwards;
        }
        .wc-headline {
          opacity: 0;
          animation: wc-fade-up 0.75s cubic-bezier(0.22,1,0.36,1) 0.15s forwards;
        }
        .wc-sub {
          opacity: 0;
          animation: wc-fade-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.55s forwards;
        }
        .wc-divider {
          opacity: 0;
          animation: wc-fade-in 0.5s ease 1.15s forwards;
        }
        .wc-stat-1 {
          opacity: 0;
          animation: wc-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) 1.4s forwards;
        }
        .wc-stat-2 {
          opacity: 0;
          animation: wc-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) 1.6s forwards;
        }
        .wc-stat-3 {
          opacity: 0;
          animation: wc-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) 1.8s forwards;
        }
        .wc-stat-4 {
          opacity: 0;
          animation: wc-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) 2.0s forwards;
        }
        .wc-stat-5 {
          opacity: 0;
          animation: wc-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) 2.2s forwards;
        }
        .wc-stat-6 {
          opacity: 0;
          animation: wc-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) 2.4s forwards;
        }
        .wc-cta {
          opacity: 0;
          animation: wc-fade-up 0.65s cubic-bezier(0.22,1,0.36,1) 2.95s forwards;
        }

        .wc-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(
            110deg,
            #b8860b 0%,
            #C4A265 25%,
            #e8c97b 50%,
            #C4A265 75%,
            #b8860b 100%
          );
          background-size: 250% auto;
          color: #1a1209;
          font-size: clamp(0.95rem, 2.5vw, 1.1rem);
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 700;
          padding: 18px 44px;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          letter-spacing: 0.015em;
          box-shadow:
            0 0 0 1px rgba(196,162,101,0.3),
            0 8px 32px rgba(196,162,101,0.45),
            0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
          animation: wc-btn-shimmer 3.5s linear infinite;
          will-change: background-position;
        }
        .wc-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow:
            0 0 0 1px rgba(196,162,101,0.4),
            0 14px 44px rgba(196,162,101,0.6),
            0 4px 16px rgba(0,0,0,0.25);
        }
        .wc-btn:active {
          transform: scale(0.97);
          box-shadow:
            0 0 0 1px rgba(196,162,101,0.3),
            0 4px 16px rgba(196,162,101,0.3);
        }

        @media (prefers-reduced-motion: reduce) {
          .wc-sparkle, .wc-headline, .wc-sub, .wc-divider,
          .wc-stat-1, .wc-stat-2, .wc-stat-3,
          .wc-stat-4, .wc-stat-5, .wc-stat-6, .wc-cta {
            opacity: 1 !important;
            animation: none !important;
          }
          .wc-btn { animation: none !important; }
        }

        @media (max-width: 480px) {
          .wc-btn {
            padding: 16px 32px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#2d5a3d",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          overflow: "hidden",
          padding: "24px 20px",
        }}
      >
        {/* Ambient radial glow — pulses gently */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 60% at 50% 46%, rgba(196,162,101,0.16) 0%, transparent 70%)",
            pointerEvents: "none",
            animation: "wc-glow-pulse 4s ease-in-out infinite",
          }}
        />

        {/* Very subtle vignette edges */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.22) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Confetti canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        />

        {/* Main content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          {/* Gold sparkle icon */}
          <div
            className="wc-sparkle"
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
              color: "#C4A265",
              marginBottom: "18px",
              letterSpacing: "0.3em",
            }}
          >
            ✦ ✦ ✦
          </div>

          {/* Headline */}
          <h1
            className="wc-headline"
            style={{
              fontFamily: "Georgia, 'Playfair Display', 'Times New Roman', serif",
              fontSize: "clamp(3.8rem, 12vw, 6.5rem)",
              fontWeight: 700,
              color: "#FFF8ED",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              margin: "0 0 22px",
              textShadow: "0 2px 40px rgba(196,162,101,0.2)",
            }}
          >
            You&rsquo;re in.
          </h1>

          {/* Subheadline */}
          <p
            className="wc-sub"
            style={{
              fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "clamp(0.98rem, 2.4vw, 1.15rem)",
              color: "rgba(245,239,224,0.76)",
              lineHeight: 1.7,
              margin: "0 auto 38px",
              maxWidth: "500px",
            }}
          >
            While other students are guessing which professors to email, you&rsquo;re
            about to know exactly who to reach out to, and what to say.
          </p>

          {/* Gold divider */}
          <div
            className="wc-divider"
            style={{
              width: "52px",
              height: "1.5px",
              background:
                "linear-gradient(90deg, transparent, rgba(196,162,101,0.65), transparent)",
              margin: "0 auto 30px",
            }}
          />

          {/* Stats */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "13px",
              marginBottom: "48px",
              alignItems: "center",
            }}
          >
            {STATS.map((text, i) => (
              <div
                key={text}
                className={`wc-stat-${i + 1}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: "clamp(0.9rem, 2.2vw, 1rem)",
                  color: "rgba(245,239,224,0.82)",
                  letterSpacing: "0.005em",
                }}
              >
                <span
                  style={{
                    color: "#C4A265",
                    fontSize: "0.7rem",
                    flexShrink: 0,
                  }}
                >
                  ✦
                </span>
                {text}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="wc-cta">
            <Link href="/app" className="wc-btn">
              Start your first search
              <span style={{ fontSize: "1.15rem", marginLeft: "2px" }}>→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
