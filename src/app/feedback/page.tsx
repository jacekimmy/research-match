"use client";
import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

interface FeedbackItem {
  id: string;
  content: string;
  category: string;
  author_name: string;
  upvotes: number;
  created_at: string;
}

const CATEGORIES = ["Feature Request", "Bug Report", "General Feedback"];

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"upvotes" | "newest">("upvotes");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Feature Request");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [voteBounce, setVoteBounce] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("research-match-votes");
    if (stored) {
      try { setVoted(new Set(JSON.parse(stored))); } catch { /* ignore */ }
    }
    fetchFeedback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchFeedback() {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback?sort=${sort}`);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchFeedback(); }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, category, author_name: authorName }),
      });
      if (res.ok) {
        setContent("");
        setAuthorName("");
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        fetchFeedback();
        showToast("Feedback posted!");
        // Mini celebration
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#2d5a3d", "#BAC095", "#D4DE95"],
          gravity: 1.2,
        });
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  async function handleUpvote(id: string) {
    if (voted.has(id)) return;
    const newVoted = new Set(voted);
    newVoted.add(id);
    setVoted(newVoted);
    localStorage.setItem("research-match-votes", JSON.stringify([...newVoted]));

    // Bounce animation
    setVoteBounce(id);
    setTimeout(() => setVoteBounce(null), 500);

    setItems((prev) => prev.map((item) => item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item));

    try {
      await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { /* ignore */ }
  }

  const categoryStyle = (cat: string) => {
    if (cat === "Feature Request") return { background: "rgba(45,90,61,0.1)", color: "#2d5a3d", border: "1px solid rgba(45,90,61,0.2)" };
    if (cat === "Bug Report") return { background: "rgba(155,51,34,0.1)", color: "#9B3322", border: "1px solid rgba(155,51,34,0.2)" };
    return { background: "rgba(138,141,114,0.1)", color: "#8A8D72", border: "1px solid rgba(138,141,114,0.2)" };
  };

  return (
    <>
      <div className="splotches">
        <div className="splotch splotch-1" />
        <div className="splotch splotch-2" />
        <div className="splotch splotch-3" />
        <div className="splotch splotch-4" />
        <div className="splotch splotch-5" />
      </div>

      <main className="rm-page" style={{ maxWidth: "800px" }}>
        <div className="rm-header" style={{ marginBottom: "40px" }}>
          <div>
            <a href="/" style={{ textDecoration: "none" }}>
              <h1 className="rm-title" style={{ fontSize: "2.4rem" }}>Feedback Board</h1>
            </a>
            <p style={{ fontSize: "1.05rem", color: "#8A8D72", marginTop: "8px" }}>
              Help shape Research Match. Suggest features, report bugs, or share your thoughts.
            </p>
          </div>
          <a href="/" className="pill" style={{ padding: "10px 24px", fontSize: "0.9rem", textDecoration: "none", color: "#3D4127" }}>
            &larr; Back to tool
          </a>
        </div>

        {/* SUBMIT FORM */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "28px 32px", marginBottom: "40px" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What would make Research Match better?"
            className="modal-textarea"
            style={{
              width: "100%", minHeight: "100px",
              padding: "16px 20px", fontSize: "1rem",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: "10px 16px", fontSize: "0.9rem", borderRadius: "12px",
                border: "1.5px solid rgba(186,192,149,0.35)", background: "rgba(255,255,255,0.5)",
                color: "#3D4127", fontFamily: "'Playfair Display', Georgia, serif",
                cursor: "pointer", outline: "none", transition: "all 0.3s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2d5a3d"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(45,90,61,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(186,192,149,0.35)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              style={{
                padding: "10px 16px", fontSize: "0.9rem", borderRadius: "12px",
                border: "1.5px solid rgba(186,192,149,0.35)", background: "rgba(255,255,255,0.5)",
                color: "#3D4127", fontFamily: "'Playfair Display', Georgia, serif",
                outline: "none", flex: 1, minWidth: "150px", transition: "all 0.3s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#2d5a3d"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(45,90,61,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(186,192,149,0.35)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button type="submit" disabled={!content.trim() || submitting} className="btn-cta" style={{ padding: "12px 32px", fontSize: "0.95rem" }}>
              {submitting ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span className="loading-spinner" style={{ fontSize: "0.9rem" }}>&#127807;</span>
                  Posting...
                </span>
              ) : "Post"}
            </button>
          </div>
          {submitted && (
            <div className="email-pass" style={{ marginTop: "16px", padding: "12px 18px", textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2d5a3d" }}>&#10003; Thanks for your feedback!</p>
            </div>
          )}
        </form>

        {/* SORT TOGGLE */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "0.85rem", color: "#8A8D72" }}>{items.length} suggestion{items.length !== 1 ? "s" : ""}</p>
          <div className="mode-toggle">
            <button onClick={() => setSort("upvotes")} className={`mode-toggle-btn ${sort === "upvotes" ? "mode-toggle-btn-active" : ""}`} style={{ padding: "8px 20px", fontSize: "0.8rem" }}>
              Most voted
            </button>
            <button onClick={() => setSort("newest")} className={`mode-toggle-btn ${sort === "newest" ? "mode-toggle-btn-active" : ""}`} style={{ padding: "8px 20px", fontSize: "0.8rem" }}>
              Newest
            </button>
          </div>
        </div>

        {/* FEEDBACK LIST */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <span className="loading-spinner">&#127807;</span>
            <p style={{ fontSize: "1rem", color: "#8A8D72", marginTop: "12px" }}>Loading feedback...</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {items.map((item, idx) => {
            const hasVoted = voted.has(item.id);
            const isBouncing = voteBounce === item.id;
            return (
              <div key={item.id} className="glass-card card-enter" style={{ padding: "24px 28px", display: "flex", gap: "20px", alignItems: "flex-start", animationDelay: `${idx * 0.06}s` }}>
                {/* Upvote */}
                <button
                  onClick={() => handleUpvote(item.id)}
                  disabled={hasVoted}
                  className={isBouncing ? "star-bounce" : ""}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                    background: hasVoted ? "rgba(45,90,61,0.12)" : "rgba(186,192,149,0.12)",
                    border: `1.5px solid ${hasVoted ? "rgba(45,90,61,0.3)" : "rgba(186,192,149,0.3)"}`,
                    borderRadius: "14px", padding: "12px 16px", cursor: hasVoted ? "default" : "pointer",
                    transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)", minWidth: "56px",
                    boxShadow: hasVoted ? "inset 0 1px 3px rgba(45,90,61,0.08)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!hasVoted) {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(45,90,61,0.12)";
                      e.currentTarget.style.background = "rgba(45,90,61,0.08)";
                      e.currentTarget.style.borderColor = "rgba(45,90,61,0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasVoted) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = "rgba(186,192,149,0.12)";
                      e.currentTarget.style.borderColor = "rgba(186,192,149,0.3)";
                    }
                  }}
                >
                  <span style={{
                    fontSize: "1.1rem",
                    color: hasVoted ? "#2d5a3d" : "#8A8D72",
                    transition: "all 0.3s ease",
                    transform: hasVoted ? "scale(1.1)" : "scale(1)",
                    display: "inline-block",
                  }}>&#9650;</span>
                  <span style={{
                    fontSize: "1rem", fontWeight: 700,
                    color: hasVoted ? "#2d5a3d" : "#3D4127",
                    fontFamily: "'Playfair Display', Georgia, serif",
                    transition: "all 0.3s ease",
                  }}>{item.upvotes}</span>
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "1rem", color: "#3D4127", lineHeight: 1.7 }}>{item.content}</p>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px", flexWrap: "wrap" }}>
                    <span className="tag" style={{
                      fontSize: "0.72rem", fontWeight: 700, padding: "4px 12px",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      animation: "none", opacity: 1,
                      ...categoryStyle(item.category),
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#A8AB92" }}>{item.author_name}</span>
                    <span style={{ fontSize: "0.8rem", color: "#BAC095" }}>&middot;</span>
                    <span style={{ fontSize: "0.8rem", color: "#A8AB92" }}>{timeAgo(item.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && items.length === 0 && (
          <div className="glass-card card-enter" style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>&#127793;</p>
            <p style={{ fontSize: "1.2rem", color: "#3D4127", fontWeight: 600 }}>No feedback yet</p>
            <p style={{ fontSize: "0.95rem", color: "#8A8D72", marginTop: "8px" }}>Be the first to share your thoughts!</p>
          </div>
        )}
      </main>

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
