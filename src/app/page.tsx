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
  highlights: { paper: string; detail: string; authorPosition?: string }[];
  questions: string[];
}

interface EmailFlag {
  type: string;
  issue: string;
  suggestion: string;
}

export default function Home() {
  const [searchMode, setSearchMode] = useState<"interest" | "name">("interest");
  const [query, setQuery] = useState("");
  const [university, setUniversity] = useState("");
  const [profName, setProfName] = useState("");
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
      if (!resolveRes.ok) { setError(resolved.error || "Failed to resolve search terms."); setLoading(false); return; }
      const { topicId, topicName, institutionId, institutionName } = resolved;
      setResolvedTopic(topicName);
      if (institutionName) setResolvedInstitution(institutionName);
      const institutionFilter = institutionId ? `,last_known_institutions.id:${institutionId}` : "";
      const res = await fetch(`https://api.openalex.org/authors?filter=topics.id:${topicId}${institutionFilter}&per_page=20&sort=cited_by_count:desc`);
      const data = await res.json();
      let authors: Author[] = data.results || [];
      if (institutionId) {
        const fullInstId = `https://openalex.org/${institutionId}`;
        authors = authors.filter((a) => a.last_known_institutions?.[0]?.id === fullInstId);
      }
      // If no results, try a broader keyword-based search on OpenAlex topics
      if (authors.length === 0 && institutionId) {
        const broadRes = await fetch(`https://api.openalex.org/topics?search=${encodeURIComponent(query)}&per_page=10`);
        const broadData = await broadRes.json();
        const allTopicIds = (broadData.results ?? []).map((t: any) => t.id.split("/").pop()).filter((id: string) => id !== topicId);
        for (const altId of allTopicIds.slice(0, 5)) {
          const altRes = await fetch(`https://api.openalex.org/authors?filter=topics.id:${altId},last_known_institutions.id:${institutionId}&per_page=20&sort=cited_by_count:desc`);
          const altData = await altRes.json();
          let altAuthors: Author[] = altData.results || [];
          const fullInstId = `https://openalex.org/${institutionId}`;
          altAuthors = altAuthors.filter((a) => a.last_known_institutions?.[0]?.id === fullInstId);
          if (altAuthors.length > 0) {
            const altTopic = (broadData.results ?? []).find((t: any) => t.id.split("/").pop() === altId);
            if (altTopic) setResolvedTopic(altTopic.display_name);
            authors = altAuthors;
            break;
          }
        }
      }
      if (authors.length === 0) setError(`No professors found for "${topicName}"${institutionName ? ` at ${institutionName}` : ""}. Try a more specific topic like "machine learning" or "quantum computing".`);
      setResults(authors);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function searchByName() {
    if (!profName.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSummaries({});
    setResolvedTopic("");
    setResolvedInstitution("");
    setShowSaved(false);
    try {
      const res = await fetch(`https://api.openalex.org/authors?search=${encodeURIComponent(profName.trim())}&per_page=10&sort=cited_by_count:desc`);
      const data = await res.json();
      const authors: Author[] = data.results || [];
      if (authors.length === 0) setError(`No professors found matching "${profName}".`);
      setResults(authors);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  function handleSearch() {
    if (searchMode === "name") searchByName();
    else search();
  }

  async function loadSummary(author: Author) {
    const id = author.id.split("/").pop()!;
    if (summaries[id] || loadingSummary[id]) return;
    setLoadingSummary((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authorId: id }) });
      const data = await res.json();
      setSummaries((prev) => ({ ...prev, [id]: { summary: data.summary || data.error || "Could not generate summary.", highlights: data.highlights || [], questions: data.questions || [] } }));
    } catch { setSummaries((prev) => ({ ...prev, [id]: { summary: "Could not generate summary.", highlights: [], questions: [] } })); }
    finally { setLoadingSummary((prev) => ({ ...prev, [id]: false })); }
  }

  function openEmailDraft(author: Author) {
    const id = author.id.split("/").pop()!;
    if (!summaries[id]) loadSummary(author);
    setEmailTarget(author); setEmailDraft(""); setEmailFlags([]); setHasChecked(false);
  }

  async function checkEmail() {
    if (!emailTarget || !emailDraft.trim()) return;
    const id = emailTarget.id.split("/").pop()!;
    const summary = summaries[id];
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: emailDraft, professorName: emailTarget.display_name, institution: emailTarget.last_known_institutions?.[0]?.display_name || "", topics: emailTarget.topics?.slice(0, 4).map((t) => t.display_name), highlights: summary?.highlights || [], questions: summary?.questions || [] }) });
      const data = await res.json();
      setEmailFlags(data.flags ?? []); setHasChecked(true);
    } catch { setEmailFlags([{ type: "error", issue: "Check failed", suggestion: "Something went wrong. Try again." }]); setHasChecked(true); }
    finally { setCheckingEmail(false); }
  }

  const profileUrl = (author: Author) => `https://openalex.org/authors/${author.id.split("/").pop()}`;
  const displayList = showSaved ? saved : results;
  const wordCount = emailDraft.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <div className="splotches">
        <div className="splotch splotch-1" />
        <div className="splotch splotch-2" />
        <div className="splotch splotch-3" />
        <div className="splotch splotch-4" />
        <div className="splotch splotch-5" />
      </div>

      <main className="rm-page">
        {/* HEADER */}
        <div className="rm-header">
          <div>
            <h1 className="rm-title">Research Match</h1>
            <p style={{ fontSize: "1.2rem", color: "#8A8D72", marginTop: "12px", fontWeight: 400 }}>
              Find professors who match your research interests.
            </p>
          </div>
          {saved.length > 0 && (
            <button onClick={() => setShowSaved(!showSaved)} className={`pill ${showSaved ? "pill-active" : ""}`} style={{ padding: "10px 24px", fontSize: "1rem" }}>
              Saved ({saved.length})
            </button>
          )}
        </div>

        {/* SEARCH MODE TOGGLE */}
        {!showSaved && (
          <div style={{ display: "flex", gap: "0", marginBottom: "20px" }}>
            <button
              onClick={() => setSearchMode("interest")}
              style={{
                padding: "10px 24px", fontSize: "0.9rem", fontWeight: 600,
                fontFamily: "'Playfair Display', Georgia, serif",
                border: "1.5px solid rgba(99,107,47,0.2)",
                borderRight: "none",
                borderRadius: "999px 0 0 999px",
                background: searchMode === "interest" ? "#2d5a3d" : "rgba(255,255,255,0.5)",
                color: searchMode === "interest" ? "#fff" : "#636B2F",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              By Interest
            </button>
            <button
              onClick={() => setSearchMode("name")}
              style={{
                padding: "10px 24px", fontSize: "0.9rem", fontWeight: 600,
                fontFamily: "'Playfair Display', Georgia, serif",
                border: "1.5px solid rgba(99,107,47,0.2)",
                borderLeft: "none",
                borderRadius: "0 999px 999px 0",
                background: searchMode === "name" ? "#2d5a3d" : "rgba(255,255,255,0.5)",
                color: searchMode === "name" ? "#fff" : "#636B2F",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              By Name
            </button>
          </div>
        )}

        {/* SEARCH */}
        {!showSaved && searchMode === "interest" && (
          <div className="glass-search rm-search">
            <div className="rm-search-input-wrap">
              <label className="rm-search-label">Research Interest</label>
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="e.g. machine learning, quantum computing..." className="rm-search-input" />
            </div>
            <div className="rm-search-divider" />
            <div className="rm-uni-field">
              <label className="rm-search-label">University</label>
              <input value={university} onChange={(e) => setUniversity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="e.g. MIT, Stanford..." className="rm-search-input" />
            </div>
            <button onClick={search} className="btn-cta rm-search-btn">Search</button>
          </div>
        )}
        {!showSaved && searchMode === "name" && (
          <div className="glass-search rm-search">
            <div className="rm-search-input-wrap" style={{ flex: 1 }}>
              <label className="rm-search-label">Professor Name</label>
              <input value={profName} onChange={(e) => setProfName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchByName()} placeholder="e.g. Geoffrey Hinton, Fei-Fei Li..." className="rm-search-input" />
            </div>
            <button onClick={searchByName} className="btn-cta rm-search-btn">Search</button>
          </div>
        )}

        {/* STATUS */}
        {loading && <p className="shimmer" style={{ textAlign: "center", fontSize: "1.1rem", color: "#8A8D72", marginBottom: "32px" }}>Searching...</p>}
        {error && <p style={{ textAlign: "center", fontSize: "1.1rem", color: "#9B3322", marginBottom: "32px" }}>{error}</p>}

        {!showSaved && results.length > 0 && (
          <p style={{ fontSize: "1rem", color: "#8A8D72", marginBottom: "32px" }}>
            Showing results for <span style={{ color: "#2d5a3d", fontWeight: 700 }}>{resolvedTopic}</span>
            {resolvedInstitution && <> at <span style={{ color: "#2d5a3d", fontWeight: 700 }}>{resolvedInstitution}</span></>}
          </p>
        )}
        {showSaved && <p style={{ fontSize: "1rem", color: "#8A8D72", marginBottom: "32px" }}>Your saved professors ({saved.length})</p>}

        {/* CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {displayList.map((author) => {
            const id = author.id.split("/").pop()!;
            const summary = summaries[id];
            const isLoadingSummary = loadingSummary[id];
            return (
              <div key={author.id} className="glass-card card-enter rm-card">
                <div className="rm-card-top">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                      <a href={profileUrl(author)} target="_blank" rel="noopener noreferrer" className="rm-card-name">
                        {author.display_name}
                      </a>
                      <button onClick={() => toggleSave(author)} style={{ fontSize: "1.3rem", color: isSaved(author) ? "#8B6914" : "#BAC095", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }} title={isSaved(author) ? "Remove from saved" : "Save professor"}>
                        {isSaved(author) ? "\u2605" : "\u2606"}
                      </button>
                    </div>
                    <p style={{ fontSize: "1rem", color: "#8A8D72", marginTop: "4px" }}>
                      {author.last_known_institutions?.[0]?.display_name || "Unknown institution"}
                    </p>
                  </div>
                  <div className="rm-card-stats">
                    <p><span className="rm-card-stat-num">{author.works_count}</span> papers</p>
                    <p><span className="rm-card-stat-num">{author.cited_by_count.toLocaleString()}</span> citations</p>
                  </div>
                </div>

                {author.topics?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                    {author.topics.slice(0, 4).map((t, i) => <span key={i} className="tag">{t.display_name}</span>)}
                  </div>
                )}

                {summary ? (
                  <div style={{ marginTop: "28px" }}>
                    <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#5A5D45" }}>{summary.summary}</p>
                    {summary.highlights.length > 0 && (
                      <div style={{ marginTop: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em" }}>Key Findings</p>
                          <button
                            onClick={(e) => {
                              const el = e.currentTarget.nextElementSibling as HTMLElement;
                              if (el) el.style.display = el.style.display === "none" ? "block" : "none";
                            }}
                            style={{ fontSize: "0.7rem", fontWeight: 700, color: "#A8AB92", cursor: "pointer", background: "rgba(186,192,149,0.15)", border: "1px solid #BAC095", borderRadius: "999px", width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', Georgia, serif" }}
                          >?</button>
                          <div style={{ display: "none", padding: "14px 18px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(186,192,149,0.3)", borderRadius: "12px", fontSize: "0.85rem", color: "#5A5D45", lineHeight: 1.6, marginTop: "4px", marginBottom: "8px" }}>
                            In most lab sciences (biology, chemistry, medicine, etc.), <strong>1st author</strong> did the hands-on work and <strong>last author</strong> runs the lab. In many other fields (math, CS, economics, humanities), author order is often alphabetical and doesn&apos;t indicate contribution level. When in doubt, check if the professor lists the paper prominently on their own website — that usually means it&apos;s important to them.
                          </div>
                        </div>
                        {summary.highlights.map((h, i) => (
                          <div key={i} style={{ paddingLeft: "20px", borderLeft: "3px solid #BAC095", marginBottom: "16px" }}>
                            <p style={{ fontSize: "1rem", color: "#5A5D45", lineHeight: 1.6 }}>{h.detail}</p>
                            <p style={{ fontSize: "0.85rem", color: "#A8AB92", fontStyle: "italic", marginTop: "4px" }}>
                              {h.paper}
                              {h.authorPosition && h.authorPosition !== "unknown" && (
                                <span style={{ fontStyle: "normal", fontSize: "0.75rem", marginLeft: "8px", padding: "2px 8px", borderRadius: "999px", background: h.authorPosition === "first" ? "rgba(45,90,61,0.1)" : h.authorPosition === "last" ? "rgba(139,105,20,0.1)" : "rgba(138,141,114,0.1)", color: h.authorPosition === "first" ? "#2d5a3d" : h.authorPosition === "last" ? "#8B6914" : "#8A8D72" }}>
                                  {h.authorPosition === "first" ? "1st author" : h.authorPosition === "last" ? "last author" : "middle author"}
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {summary.questions.length > 0 && (
                      <div style={{ marginTop: "24px" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Questions to Ask</p>
                        {summary.questions.map((q, i) => (
                          <p key={i} style={{ fontSize: "1rem", color: "#8A8D72", paddingLeft: "20px", borderLeft: "3px solid #D4DE95", marginBottom: "12px", lineHeight: 1.6 }}>{q}</p>
                        ))}
                      </div>
                    )}
                    <button onClick={() => openEmailDraft(author)} className="btn-secondary" style={{ marginTop: "24px", padding: "12px 28px", fontSize: "0.95rem" }}>
                      Draft email to professor &rarr;
                    </button>
                  </div>
                ) : (
                  <button onClick={() => loadSummary(author)} disabled={isLoadingSummary} className={`btn-secondary ${isLoadingSummary ? "shimmer" : ""}`} style={{ marginTop: "24px", padding: "12px 28px", fontSize: "0.95rem", opacity: isLoadingSummary ? 0.5 : 1 }}>
                    {isLoadingSummary ? "Generating summary..." : "Summarize research \u2192"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* EMAIL MODAL */}
        {emailTarget && (() => {
          const targetId = emailTarget.id.split("/").pop()!;
          const targetSummary = summaries[targetId];
          const isLoadingTargetSummary = loadingSummary[targetId];
          return (
            <div className="modal-bg rm-modal-overlay">
              <div className="modal-glass rm-modal">
                <div className="rm-modal-left">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <h2 className="rm-modal-title">Email to {emailTarget.display_name}</h2>
                    <button onClick={() => { setEmailTarget(null); setEmailDraft(""); setEmailFlags([]); setHasChecked(false); }} style={{ fontSize: "1.5rem", color: "#A8AB92", background: "none", border: "none", cursor: "pointer" }}>&times;</button>
                  </div>
                  <textarea value={emailDraft} onChange={(e) => { setEmailDraft(e.target.value); setHasChecked(false); }} placeholder={`Dear Professor ${emailTarget.display_name},\n\nI'm a [year] [major] student at [your university]...\n\nUse the reference panel to mention specific papers and research.`} className="modal-textarea" style={{ flex: 1, padding: "24px", lineHeight: 1.7 }} />
                  <div className="rm-modal-actions">
                    <button onClick={checkEmail} disabled={checkingEmail || !emailDraft.trim()} className="btn-cta" style={{ padding: "14px 36px", fontSize: "1rem" }}>
                      {checkingEmail ? "Checking..." : "Check my email"}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(emailDraft)} disabled={!emailDraft.trim()} style={{ fontSize: "1rem", color: "#8A8D72", background: "none", border: "none", cursor: emailDraft.trim() ? "pointer" : "default", opacity: emailDraft.trim() ? 1 : 0.3, fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Copy to clipboard
                    </button>
                    <span style={{ marginLeft: "auto", fontSize: "0.9rem", fontWeight: 700, color: wordCount > 200 ? "#9B3322" : "#8A8D72", background: wordCount > 200 ? "rgba(155,51,34,0.08)" : "transparent", padding: "6px 14px", borderRadius: "999px" }}>
                      {wordCount} words
                    </span>
                  </div>
                  {hasChecked && emailFlags.length > 0 && (
                    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {emailFlags.map((flag, i) => (
                        <div key={i} className={`flag-enter ${flag.type === "error" ? "flag-error" : "flag-warning"}`} style={{ padding: "16px 20px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: flag.type === "error" ? "#9B3322" : "#8B6914" }}>{flag.type === "error" ? "\u26A0" : "\u25CF"} {flag.issue}</span>
                          <p style={{ fontSize: "0.85rem", color: "#8A8D72", marginTop: "4px" }}>{flag.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasChecked && emailFlags.length === 0 && (
                    <div className="flag-enter" style={{ marginTop: "20px", padding: "16px 20px", background: "rgba(45,90,61,0.08)", border: "1.5px solid rgba(45,90,61,0.2)", borderRadius: "16px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2d5a3d" }}>&#10003; Looks good! No issues found.</span>
                    </div>
                  )}
                  {!hasChecked && emailDraft.trim().length > 0 && !checkingEmail && (
                    <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "#A8AB92" }}>Hit &quot;Check my email&quot; when you&apos;re ready for feedback.</p>
                  )}
                </div>
                <div className="modal-sidebar rm-modal-right">
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>Reference</p>
                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#3D4127" }}>{emailTarget.display_name}</p>
                    <p style={{ fontSize: "0.9rem", color: "#8A8D72", marginTop: "4px" }}>{emailTarget.last_known_institutions?.[0]?.display_name}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                      {emailTarget.topics?.slice(0, 4).map((t, i) => <span key={i} className="tag" style={{ fontSize: "0.7rem" }}>{t.display_name}</span>)}
                    </div>
                  </div>
                  <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #BAC095, transparent)", opacity: 0.5, marginBottom: "24px" }} />
                  {isLoadingTargetSummary && <p className="shimmer" style={{ fontSize: "0.9rem", color: "#8A8D72" }}>Loading research info...</p>}
                  {targetSummary && (
                    <>
                      <div style={{ marginBottom: "24px" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Their Research</p>
                        <p style={{ fontSize: "0.9rem", color: "#5A5D45", lineHeight: 1.7 }}>{targetSummary.summary}</p>
                      </div>
                      {targetSummary.highlights.length > 0 && (
                        <div style={{ marginBottom: "24px" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Papers to Mention</p>
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
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Questions to Ask</p>
                          {targetSummary.questions.map((q, i) => (
                            <p key={i} style={{ fontSize: "0.8rem", color: "#8A8D72", paddingLeft: "14px", borderLeft: "2px solid #D4DE95", marginBottom: "12px", lineHeight: 1.6 }}>{q}</p>
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
