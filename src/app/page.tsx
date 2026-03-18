"use client";
import { useState, useEffect } from "react";

interface Author {
  id: string;
  display_name: string;
  last_known_institutions: { id: string; display_name: string; country_code: string }[];
  works_count: number;
  cited_by_count: number;
  topics: { display_name: string }[];
}

interface SummaryData {
  summary: string;
  highlights: { paper: string; detail: string }[];
  questions: string[];
}

interface EmailFlag {
  type: string;
  issue: string;
  suggestion: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [university, setUniversity] = useState("");
  const [results, setResults] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resolvedTopic, setResolvedTopic] = useState("");
  const [resolvedInstitution, setResolvedInstitution] = useState("");
  const [summaries, setSummaries] = useState<Record<string, SummaryData>>({});
  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Author[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const [emailTarget, setEmailTarget] = useState<Author | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailFlags, setEmailFlags] = useState<EmailFlag[]>([]);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("research-match-saved");
    if (stored) {
      try { setSaved(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  function toggleSave(author: Author) {
    setSaved((prev) => {
      const exists = prev.some((a) => a.id === author.id);
      const next = exists ? prev.filter((a) => a.id !== author.id) : [...prev, author];
      localStorage.setItem("research-match-saved", JSON.stringify(next));
      return next;
    });
  }

  function isSaved(author: Author) {
    return saved.some((a) => a.id === author.id);
  }

  async function search() {
    if (!query) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSummaries({});
    setResolvedTopic("");
    setResolvedInstitution("");
    setShowSaved(false);

    try {
      const resolveRes = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: query, university }),
      });
      const resolved = await resolveRes.json();

      if (!resolveRes.ok) {
        setError(resolved.error || "Failed to resolve search terms.");
        setLoading(false);
        return;
      }

      const { topicId, topicName, institutionId, institutionName } = resolved;
      setResolvedTopic(topicName);
      if (institutionName) setResolvedInstitution(institutionName);

      const institutionFilter = institutionId
        ? `,last_known_institutions.id:${institutionId}`
        : "";

      const res = await fetch(
        `https://api.openalex.org/authors?filter=topics.id:${topicId}${institutionFilter}&per_page=20&sort=cited_by_count:desc`
      );
      const data = await res.json();
      let authors: Author[] = data.results || [];

      if (institutionId) {
        const fullInstId = `https://openalex.org/${institutionId}`;
        authors = authors.filter((a) =>
          a.last_known_institutions?.[0]?.id === fullInstId
        );
      }

      if (authors.length === 0) {
        setError(
          `No professors found for "${topicName}"${institutionName ? ` at ${institutionName}` : ""}.`
        );
      }

      setResults(authors);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary(author: Author) {
    const id = author.id.split("/").pop()!;
    if (summaries[id] || loadingSummary[id]) return;

    setLoadingSummary((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId: id }),
      });
      const data = await res.json();
      setSummaries((prev) => ({
        ...prev,
        [id]: {
          summary: data.summary || data.error || "Could not generate summary.",
          highlights: data.highlights || [],
          questions: data.questions || [],
        },
      }));
    } catch {
      setSummaries((prev) => ({
        ...prev,
        [id]: { summary: "Could not generate summary.", highlights: [], questions: [] },
      }));
    } finally {
      setLoadingSummary((prev) => ({ ...prev, [id]: false }));
    }
  }

  function openEmailDraft(author: Author) {
    const id = author.id.split("/").pop()!;
    if (!summaries[id]) loadSummary(author);
    setEmailTarget(author);
    setEmailDraft("");
    setEmailFlags([]);
    setHasChecked(false);
  }

  async function checkEmail() {
    if (!emailTarget || !emailDraft.trim()) return;
    const id = emailTarget.id.split("/").pop()!;
    const summary = summaries[id];
    setCheckingEmail(true);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: emailDraft,
          professorName: emailTarget.display_name,
          institution: emailTarget.last_known_institutions?.[0]?.display_name || "",
          topics: emailTarget.topics?.slice(0, 4).map((t) => t.display_name),
          highlights: summary?.highlights || [],
          questions: summary?.questions || [],
        }),
      });
      const data = await res.json();
      setEmailFlags(data.flags ?? []);
      setHasChecked(true);
    } catch {
      setEmailFlags([
        { type: "error", issue: "Check failed", suggestion: "Something went wrong. Try again." },
      ]);
      setHasChecked(true);
    } finally {
      setCheckingEmail(false);
    }
  }

  const profileUrl = (author: Author) =>
    `https://openalex.org/authors/${author.id.split("/").pop()}`;

  const displayList = showSaved ? saved : results;
  const wordCount = emailDraft.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      {/* Background splotches */}
      <div className="splotches">
        <div className="splotch splotch-1" />
        <div className="splotch splotch-2" />
        <div className="splotch splotch-3" />
        <div className="splotch splotch-4" />
        <div className="splotch splotch-5" />
      </div>

      <main style={{ minHeight: "100vh", padding: "60px 80px", maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* ===== HEADER ===== */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "60px" }}>
          <div>
            <h1 style={{ fontSize: "4rem", fontWeight: 800, color: "#3D4127", lineHeight: 1 }}>
              Research Match
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#8A8D72", marginTop: "12px", fontWeight: 400 }}>
              Find professors who match your research interests.
            </p>
          </div>
          {saved.length > 0 && (
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`pill ${showSaved ? "pill-active" : ""}`}
              style={{ padding: "10px 24px", fontSize: "1rem" }}
            >
              Saved ({saved.length})
            </button>
          )}
        </div>

        {/* ===== SEARCH BAR ===== */}
        {!showSaved && (
          <div className="glass-search" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "60px" }}>
            <div style={{ flex: 1, padding: "8px 16px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                Research Interest
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="e.g. machine learning, quantum computing..."
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "1.15rem",
                  color: "#3D4127",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              />
            </div>

            <div style={{ width: "2px", height: "48px", background: "#BAC095", opacity: 0.5, borderRadius: "1px" }} />

            <div style={{ width: "280px", padding: "8px 16px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                University
              </label>
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="optional"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "1.15rem",
                  color: "#3D4127",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              />
            </div>

            <button onClick={search} className="btn-cta" style={{ padding: "18px 48px", fontSize: "1.15rem", flexShrink: 0 }}>
              Search
            </button>
          </div>
        )}

        {/* ===== STATUS ===== */}
        {loading && (
          <p className="shimmer" style={{ textAlign: "center", fontSize: "1.1rem", color: "#8A8D72", marginBottom: "32px" }}>
            Searching...
          </p>
        )}
        {error && (
          <p style={{ textAlign: "center", fontSize: "1.1rem", color: "#9B3322", marginBottom: "32px" }}>
            {error}
          </p>
        )}

        {!showSaved && results.length > 0 && (
          <p style={{ fontSize: "1rem", color: "#8A8D72", marginBottom: "32px" }}>
            Showing results for{" "}
            <span style={{ color: "#2d5a3d", fontWeight: 700 }}>{resolvedTopic}</span>
            {resolvedInstitution && (
              <>
                {" "}at{" "}
                <span style={{ color: "#2d5a3d", fontWeight: 700 }}>{resolvedInstitution}</span>
              </>
            )}
          </p>
        )}

        {showSaved && (
          <p style={{ fontSize: "1rem", color: "#8A8D72", marginBottom: "32px" }}>
            Your saved professors ({saved.length})
          </p>
        )}

        {/* ===== PROFESSOR CARDS ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {displayList.map((author) => {
            const id = author.id.split("/").pop()!;
            const summary = summaries[id];
            const isLoadingSummary = loadingSummary[id];

            return (
              <div key={author.id} className="glass-card card-enter" style={{ padding: "36px 40px" }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <a
                        href={profileUrl(author)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: 700,
                          color: "#3D4127",
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#2d5a3d")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#3D4127")}
                      >
                        {author.display_name}
                      </a>
                      <button
                        onClick={() => toggleSave(author)}
                        style={{
                          fontSize: "1.3rem",
                          color: isSaved(author) ? "#8B6914" : "#BAC095",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          transition: "color 0.2s",
                        }}
                        title={isSaved(author) ? "Remove from saved" : "Save professor"}
                      >
                        {isSaved(author) ? "\u2605" : "\u2606"}
                      </button>
                    </div>
                    <p style={{ fontSize: "1rem", color: "#8A8D72", marginTop: "4px" }}>
                      {author.last_known_institutions?.[0]?.display_name || "Unknown institution"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "1rem", color: "#8A8D72" }}>
                    <p>
                      <span style={{ fontWeight: 700, color: "#3D4127", fontSize: "1.3rem" }}>
                        {author.works_count}
                      </span>{" "}
                      papers
                    </p>
                    <p>
                      <span style={{ fontWeight: 700, color: "#3D4127", fontSize: "1.3rem" }}>
                        {author.cited_by_count.toLocaleString()}
                      </span>{" "}
                      citations
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {author.topics?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                    {author.topics.slice(0, 4).map((t, i) => (
                      <span key={i} className="tag">{t.display_name}</span>
                    ))}
                  </div>
                )}

                {/* Summary content */}
                {summary ? (
                  <div style={{ marginTop: "28px" }}>
                    <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#5A5D45" }}>
                      {summary.summary}
                    </p>

                    {summary.highlights.length > 0 && (
                      <div style={{ marginTop: "24px" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
                          Key Findings
                        </p>
                        {summary.highlights.map((h, i) => (
                          <div key={i} style={{ paddingLeft: "20px", borderLeft: "3px solid #BAC095", marginBottom: "16px" }}>
                            <p style={{ fontSize: "1rem", color: "#5A5D45", lineHeight: 1.6 }}>{h.detail}</p>
                            <p style={{ fontSize: "0.85rem", color: "#A8AB92", fontStyle: "italic", marginTop: "4px" }}>{h.paper}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {summary.questions.length > 0 && (
                      <div style={{ marginTop: "24px" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
                          Questions to Ask
                        </p>
                        {summary.questions.map((q, i) => (
                          <p key={i} style={{ fontSize: "1rem", color: "#8A8D72", paddingLeft: "20px", borderLeft: "3px solid #D4DE95", marginBottom: "12px", lineHeight: 1.6 }}>
                            {q}
                          </p>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => openEmailDraft(author)}
                      className="btn-secondary"
                      style={{ marginTop: "24px", padding: "12px 28px", fontSize: "0.95rem" }}
                    >
                      Draft email to professor &rarr;
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => loadSummary(author)}
                    disabled={isLoadingSummary}
                    className={`btn-secondary ${isLoadingSummary ? "shimmer" : ""}`}
                    style={{
                      marginTop: "24px",
                      padding: "12px 28px",
                      fontSize: "0.95rem",
                      opacity: isLoadingSummary ? 0.5 : 1,
                    }}
                  >
                    {isLoadingSummary ? "Generating summary..." : "Summarize research \u2192"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ===== EMAIL MODAL ===== */}
        {emailTarget &&
          (() => {
            const targetId = emailTarget.id.split("/").pop()!;
            const targetSummary = summaries[targetId];
            const isLoadingTargetSummary = loadingSummary[targetId];

            return (
              <div className="modal-bg" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", zIndex: 50 }}>
                <div className="modal-glass" style={{ width: "100%", maxWidth: "1100px", height: "85vh", display: "flex", overflow: "hidden" }}>

                  {/* Left — writing */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 40px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                      <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#3D4127" }}>
                        Email to {emailTarget.display_name}
                      </h2>
                      <button
                        onClick={() => { setEmailTarget(null); setEmailDraft(""); setEmailFlags([]); setHasChecked(false); }}
                        style={{ fontSize: "1.5rem", color: "#A8AB92", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4127")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#A8AB92")}
                      >
                        &times;
                      </button>
                    </div>

                    <textarea
                      value={emailDraft}
                      onChange={(e) => { setEmailDraft(e.target.value); setHasChecked(false); }}
                      placeholder={`Dear Professor ${emailTarget.display_name},\n\nI'm a [year] [major] student at [your university]...\n\nUse the reference panel on the right to mention specific papers and research.`}
                      className="modal-textarea"
                      style={{ flex: 1, padding: "24px", lineHeight: 1.7 }}
                    />

                    {/* Actions */}
                    <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
                      <button
                        onClick={checkEmail}
                        disabled={checkingEmail || !emailDraft.trim()}
                        className="btn-cta"
                        style={{ padding: "14px 36px", fontSize: "1rem" }}
                      >
                        {checkingEmail ? "Checking..." : "Check my email"}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(emailDraft)}
                        disabled={!emailDraft.trim()}
                        style={{
                          fontSize: "1rem",
                          color: "#8A8D72",
                          background: "none",
                          border: "none",
                          cursor: emailDraft.trim() ? "pointer" : "default",
                          opacity: emailDraft.trim() ? 1 : 0.3,
                          fontFamily: "'Playfair Display', Georgia, serif",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => { if (emailDraft.trim()) e.currentTarget.style.color = "#2d5a3d"; }}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8D72")}
                      >
                        Copy to clipboard
                      </button>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          color: wordCount > 200 ? "#9B3322" : "#8A8D72",
                          background: wordCount > 200 ? "rgba(155, 51, 34, 0.08)" : "transparent",
                          padding: "6px 14px",
                          borderRadius: "999px",
                        }}
                      >
                        {wordCount} words
                      </span>
                    </div>

                    {/* Flags */}
                    {hasChecked && emailFlags.length > 0 && (
                      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {emailFlags.map((flag, i) => (
                          <div
                            key={i}
                            className={`flag-enter ${flag.type === "error" ? "flag-error" : "flag-warning"}`}
                            style={{ padding: "16px 20px" }}
                          >
                            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: flag.type === "error" ? "#9B3322" : "#8B6914" }}>
                              {flag.type === "error" ? "\u26A0" : "\u25CF"} {flag.issue}
                            </span>
                            <p style={{ fontSize: "0.85rem", color: "#8A8D72", marginTop: "4px" }}>{flag.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {hasChecked && emailFlags.length === 0 && (
                      <div
                        className="flag-enter"
                        style={{
                          marginTop: "20px",
                          padding: "16px 20px",
                          background: "rgba(45, 90, 61, 0.08)",
                          border: "1.5px solid rgba(45, 90, 61, 0.2)",
                          borderRadius: "16px",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2d5a3d" }}>
                          &#10003; Looks good! No issues found.
                        </span>
                      </div>
                    )}

                    {!hasChecked && emailDraft.trim().length > 0 && !checkingEmail && (
                      <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "#A8AB92" }}>
                        Hit &quot;Check my email&quot; when you&apos;re ready for feedback.
                      </p>
                    )}
                  </div>

                  {/* Right — reference sidebar */}
                  <div className="modal-sidebar" style={{ width: "340px", padding: "36px 32px", overflowY: "auto", flexShrink: 0 }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>
                      Reference
                    </p>

                    <div style={{ marginBottom: "24px" }}>
                      <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#3D4127" }}>{emailTarget.display_name}</p>
                      <p style={{ fontSize: "0.9rem", color: "#8A8D72", marginTop: "4px" }}>
                        {emailTarget.last_known_institutions?.[0]?.display_name}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                        {emailTarget.topics?.slice(0, 4).map((t, i) => (
                          <span key={i} className="tag" style={{ fontSize: "0.7rem" }}>{t.display_name}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #BAC095, transparent)", opacity: 0.5, marginBottom: "24px" }} />

                    {isLoadingTargetSummary && (
                      <p className="shimmer" style={{ fontSize: "0.9rem", color: "#8A8D72" }}>Loading research info...</p>
                    )}

                    {targetSummary && (
                      <>
                        <div style={{ marginBottom: "24px" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                            Their Research
                          </p>
                          <p style={{ fontSize: "0.9rem", color: "#5A5D45", lineHeight: 1.7 }}>
                            {targetSummary.summary}
                          </p>
                        </div>

                        {targetSummary.highlights.length > 0 && (
                          <div style={{ marginBottom: "24px" }}>
                            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
                              Papers to Mention
                            </p>
                            {targetSummary.highlights.map((h, i) => (
                              <div key={i} style={{ marginBottom: "14px" }}>
                                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2d5a3d" }}>{h.paper}</p>
                                <p style={{ fontSize: "0.8rem", color: "#8A8D72", marginTop: "3px" }}>{h.detail}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {targetSummary.questions.length > 0 && (
                          <div>
                            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
                              Questions to Ask
                            </p>
                            {targetSummary.questions.map((q, i) => (
                              <p key={i} style={{ fontSize: "0.8rem", color: "#8A8D72", paddingLeft: "14px", borderLeft: "2px solid #D4DE95", marginBottom: "12px", lineHeight: 1.6 }}>
                                {q}
                              </p>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </main>
    </>
  );
}
