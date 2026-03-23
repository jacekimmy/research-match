"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const RESEARCH_SUGGESTIONS = [
  // Medicine & Health
  "Cardiology", "Oncology", "Immunology", "Neurology", "Pediatrics", "Surgery",
  "Anesthesiology", "Dermatology", "Psychiatry", "Epidemiology", "Public Health",
  "Clinical Trials", "Pharmacology", "Pathology", "Radiology", "Emergency Medicine",
  "Family Medicine", "Internal Medicine", "Orthopedics", "Ophthalmology",
  "Gastroenterology", "Endocrinology", "Infectious Disease", "Physical Therapy",
  "Occupational Therapy", "Speech Pathology", "Nursing Research", "Nutrition Science",
  "Kinesiology", "Global Health", "Mental Health", "Genetics", "Genomics",
  "Biomedical Engineering",
  // Biology & Life Sciences
  "Molecular Biology", "Cell Biology", "Microbiology", "Biochemistry", "Ecology",
  "Evolutionary Biology", "Marine Biology", "Zoology", "Botany", "Entomology",
  "Neuroscience", "Bioinformatics", "Biotechnology", "Developmental Biology",
  "Structural Biology", "Virology", "Parasitology", "Conservation Biology",
  "Wildlife Biology", "Plant Science", "Toxicology", "Biophysics",
  // Chemistry
  "Organic Chemistry", "Inorganic Chemistry", "Analytical Chemistry",
  "Physical Chemistry", "Medicinal Chemistry", "Computational Chemistry",
  "Materials Chemistry", "Polymer Chemistry", "Environmental Chemistry",
  "Electrochemistry", "Photochemistry",
  // Physics & Astronomy
  "Astrophysics", "Quantum Physics", "Condensed Matter Physics", "Particle Physics",
  "Nuclear Physics", "Optics", "Plasma Physics", "Cosmology", "Planetary Science",
  "Gravitational Physics", "Computational Physics", "Thermodynamics", "Fluid Dynamics",
  // Engineering
  "Mechanical Engineering", "Electrical Engineering", "Chemical Engineering",
  "Civil Engineering", "Aerospace Engineering", "Environmental Engineering",
  "Computer Engineering", "Industrial Engineering", "Nuclear Engineering",
  "Materials Science", "Robotics", "Control Systems", "Signal Processing",
  "VLSI Design", "Nanotechnology", "Renewable Energy",
  // Computer Science & Math
  "Machine Learning", "Artificial Intelligence", "Computer Vision",
  "Natural Language Processing", "Cybersecurity", "Data Science", "Algorithms",
  "Software Engineering", "Human Computer Interaction", "Computer Graphics",
  "Distributed Systems", "Operating Systems", "Database Systems",
  "Quantum Computing", "Mathematics", "Statistics", "Applied Mathematics",
  "Number Theory", "Topology", "Combinatorics", "Cryptography",
  // Social Sciences
  "Psychology", "Sociology", "Political Science", "Economics", "Anthropology",
  "Linguistics", "Geography", "Criminology", "Social Work", "Urban Planning",
  "International Relations", "Public Policy", "Behavioral Economics",
  "Cognitive Science", "Developmental Psychology", "Clinical Psychology",
  "Organizational Psychology",
  // Humanities
  "History", "Philosophy", "English Literature", "Comparative Literature",
  "Religious Studies", "Art History", "Classics", "Ethics", "Cultural Studies",
  "Gender Studies", "African American Studies", "Asian Studies",
  "Latin American Studies", "Film Studies", "Music Theory", "Theater Studies",
  // Business & Law
  "Finance", "Accounting", "Marketing", "Management", "Entrepreneurship",
  "Supply Chain", "Business Analytics", "Health Economics", "Law",
  "Constitutional Law", "International Law", "Environmental Law",
  "Intellectual Property",
  // Education
  "Curriculum Development", "Educational Psychology", "Special Education",
  "STEM Education", "Higher Education", "Literacy Studies", "Educational Technology",
  // Environmental & Earth Sciences
  "Climate Science", "Geology", "Oceanography", "Atmospheric Science", "Hydrology",
  "Seismology", "Soil Science", "Forestry", "Sustainability", "Environmental Policy",
  "Remote Sensing", "GIS",
  // Agriculture & Food
  "Agricultural Science", "Food Science", "Animal Science", "Crop Science",
  "Horticulture", "Aquaculture", "Food Safety", "Agricultural Economics",
  // Interdisciplinary
  "Bioethics", "Science Communication", "Digital Humanities",
  "Computational Social Science", "Neuroeconomics", "Astrobiology",
  "Science Policy", "Health Informatics", "Medical Anthropology",
].sort();

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

const FREE_SEARCH_LIMIT = 3;
const ANON_SEARCH_LIMIT = 3;
const PAYWALL_ENABLED = false; // Set to true when Supabase + Stripe are configured

export default function AppPage() {
  const { user, profile, isPaid: _isPaid, refreshProfile, signOut } = useAuth();
  const isPaid = PAYWALL_ENABLED ? _isPaid : true; // bypass paywall when disabled

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

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const PLACEHOLDER_EXAMPLES = [
    "e.g. neuroscience", "e.g. organic chemistry", "e.g. political science",
    "e.g. machine learning", "e.g. cardiology", "e.g. astrophysics",
    "e.g. behavioral economics", "e.g. robotics", "e.g. immunology",
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const [emailTarget, setEmailTarget] = useState<Author | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailFlags, setEmailFlags] = useState<EmailFlag[]>([]);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [showPricing, setShowPricing] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [pricingBilling, setPricingBilling] = useState<"monthly" | "annual">("annual");

  const { signUp, signIn } = useAuth();

  // Check URL params for upgrade/waitlist triggers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade")) {
      if (!user) { setShowAuthModal(true); setAuthMode("signup"); }
      else setShowPricing(true);
    }
    if (params.get("waitlist")) {
      if (!user) { setShowAuthModal(true); setAuthMode("signup"); }
      else setShowWaitlist(true);
    }
    if (params.get("success") === "true") {
      refreshProfile();
      window.history.replaceState({}, "", "/app");
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const stored = localStorage.getItem("research-match-saved");
    if (stored) {
      try { setSaved(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search limiting
  function getAnonSearches(): number {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem("research-match-anon-searches") || "0", 10);
  }
  function incrementAnonSearches() {
    if (typeof window === "undefined") return;
    const count = getAnonSearches() + 1;
    localStorage.setItem("research-match-anon-searches", String(count));
  }

  async function canSearch(): Promise<boolean> {
    // Bypass all limits when paywall is disabled
    if (!PAYWALL_ENABLED) return true;
    // Paid users: unlimited
    if (isPaid) return true;

    // Not logged in: check localStorage
    if (!user) {
      if (getAnonSearches() >= ANON_SEARCH_LIMIT) {
        setShowAuthModal(true);
        setAuthMode("signup");
        return false;
      }
      return true;
    }

    // Free logged-in user: check profile
    if (profile) {
      // Check if we need to reset
      const resetAt = new Date(profile.searches_reset_at);
      const now = new Date();
      if (now >= resetAt) {
        // Reset the counter
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        await supabase.from("profiles").update({
          searches_used: 0,
          searches_reset_at: nextMonth.toISOString(),
        }).eq("id", user.id);
        await refreshProfile();
        return true;
      }

      if (profile.searches_used >= FREE_SEARCH_LIMIT) {
        setShowPricing(true);
        return false;
      }
    }
    return true;
  }

  async function trackSearch() {
    if (!PAYWALL_ENABLED || isPaid) return;
    if (!user) {
      incrementAnonSearches();
      return;
    }
    // Increment in Supabase
    if (profile) {
      await supabase.from("profiles").update({
        searches_used: profile.searches_used + 1,
      }).eq("id", user.id);
      await refreshProfile();
    }
  }

  function toggleSave(author: Author) {
    if (!isPaid) {
      setShowPricing(true);
      return;
    }
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
    if (!(await canSearch())) return;
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

      let authors: Author[] = [];

      if (!topicId) {
        // No good topic match — fallback to keyword search on works
        const instFilter = institutionId ? `&filter=authorships.institutions.id:${institutionId}` : "";
        const worksRes = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}${instFilter}&sort=publication_date:desc&per_page=20&select=authorships`);
        const worksData = await worksRes.json();
        const works = worksData.results ?? [];
        // Extract unique authors from works
        const authorMap = new Map<string, Author>();
        for (const work of works) {
          for (const authorship of (work.authorships ?? [])) {
            const authorId = authorship.author?.id;
            if (!authorId || authorMap.has(authorId)) continue;
            const inst = authorship.institutions?.[0];
            // If filtering by institution, only include authors currently there
            if (institutionId && inst?.id !== `https://openalex.org/${institutionId}`) continue;
            // Fetch full author data
            const authorRes = await fetch(`https://api.openalex.org/authors/${authorId.split("/").pop()}?select=id,display_name,last_known_institutions,works_count,cited_by_count,topics`);
            if (authorRes.ok) {
              const authorData = await authorRes.json();
              if (institutionId) {
                const fullInstId = `https://openalex.org/${institutionId}`;
                if (authorData.last_known_institutions?.[0]?.id !== fullInstId) continue;
              }
              authorMap.set(authorId, authorData);
            }
            if (authorMap.size >= 10) break;
          }
          if (authorMap.size >= 10) break;
        }
        authors = Array.from(authorMap.values()).sort((a, b) => b.cited_by_count - a.cited_by_count);
      } else {
        // Normal topic-based search
        const institutionFilter = institutionId ? `,last_known_institutions.id:${institutionId}` : "";
        const res = await fetch(`https://api.openalex.org/authors?filter=topics.id:${topicId}${institutionFilter}&per_page=20&sort=cited_by_count:desc`);
        const data = await res.json();
        authors = data.results || [];
        if (institutionId) {
          const fullInstId = `https://openalex.org/${institutionId}`;
          authors = authors.filter((a) => a.last_known_institutions?.[0]?.id === fullInstId);
        }
        if (authors.length === 0 && institutionId) {
          const broadRes = await fetch(`https://api.openalex.org/topics?search=${encodeURIComponent(query)}&per_page=10`);
          const broadData = await broadRes.json();
          const allTopicIds = (broadData.results ?? []).map((t: { id: string }) => t.id.split("/").pop()).filter((id: string) => id !== topicId);
          for (const altId of allTopicIds.slice(0, 5)) {
            const altRes = await fetch(`https://api.openalex.org/authors?filter=topics.id:${altId},last_known_institutions.id:${institutionId}&per_page=20&sort=cited_by_count:desc`);
            const altData = await altRes.json();
            let altAuthors: Author[] = altData.results || [];
            const fullInstId = `https://openalex.org/${institutionId}`;
            altAuthors = altAuthors.filter((a) => a.last_known_institutions?.[0]?.id === fullInstId);
            if (altAuthors.length > 0) {
              const altTopic = (broadData.results ?? []).find((t: { id: string }) => t.id.split("/").pop() === altId);
              if (altTopic) setResolvedTopic((altTopic as { display_name: string }).display_name);
              authors = altAuthors;
              break;
            }
          }
        }
      }

      if (authors.length === 0) setError(`No professors found for "${topicName}"${institutionName ? ` at ${institutionName}` : ""}. Try a more specific topic like "machine learning" or "quantum computing".`);
      setResults(authors);
      await trackSearch();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function searchByName() {
    if (!profName.trim()) return;
    if (!(await canSearch())) return;
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
      await trackSearch();
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
    if (!isPaid) { setShowPricing(true); return; }
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

  async function handleAuth() {
    setAuthLoading(true);
    setAuthError("");
    const fn = authMode === "signup" ? signUp : signIn;
    const { error } = await fn(authEmail, authPassword);
    if (error) { setAuthError(error); setAuthLoading(false); return; }
    setShowAuthModal(false);
    setAuthEmail("");
    setAuthPassword("");
    setAuthLoading(false);
  }

  async function handleCheckout(plan: string) {
    if (!user) { setShowAuthModal(true); setAuthMode("signup"); return; }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing: pricingBilling, userId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Could not create checkout session.");
    } catch { setError("Could not create checkout session."); }
  }

  async function handleWaitlist() {
    const email = waitlistEmail || user?.email || "";
    if (!email) return;
    await supabase.from("waitlist").insert({ email });
    setWaitlistDone(true);
  }

  const filteredSuggestions = query.trim()
    ? RESEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : RESEARCH_SUGGESTIONS;

  const profileUrl = (author: Author) => `https://openalex.org/authors/${author.id.split("/").pop()}`;
  const displayList = showSaved ? saved : results;
  const wordCount = emailDraft.trim().split(/\s+/).filter(Boolean).length;

  // For free users: truncate summary and limit questions
  function getDisplaySummary(summary: SummaryData) {
    if (isPaid) return summary;
    // Truncate to 2 sentences
    const sentences = summary.summary.split(/(?<=[.!?])\s+/);
    const truncatedSummary = sentences.slice(0, 2).join(" ");
    return {
      ...summary,
      summary: truncatedSummary + (sentences.length > 2 ? "..." : ""),
      questions: summary.questions.slice(0, 1),
      highlights: summary.highlights.slice(0, 1),
    };
  }

  // Remaining searches display
  function getSearchesRemaining(): string | null {
    if (isPaid) return null;
    if (!user) {
      const used = getAnonSearches();
      return `${ANON_SEARCH_LIMIT - used} searches remaining`;
    }
    if (profile) {
      return `${FREE_SEARCH_LIMIT - profile.searches_used} searches remaining this month`;
    }
    return null;
  }

  void handleSearch; // suppress unused warning since it's called from JSX

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
        {/* HEADER / NAV */}
        <div className="rm-header">
          <div>
            <h1 className="rm-title">Research Match</h1>
            <p style={{ fontSize: "1.2rem", color: "#8A8D72", marginTop: "12px", fontWeight: 400 }}>
              Find professors who match your research interests.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {getSearchesRemaining() && (
              <span style={{ fontSize: "0.8rem", color: "#A8AB92", padding: "6px 14px", background: "rgba(186,192,149,0.15)", borderRadius: "999px" }}>
                {getSearchesRemaining()}
              </span>
            )}
            {isPaid && saved.length > 0 && (
              <button onClick={() => setShowSaved(!showSaved)} className={`pill ${showSaved ? "pill-active" : ""}`} style={{ padding: "10px 24px", fontSize: "1rem" }}>
                Saved ({saved.length})
              </button>
            )}
            {!user ? (
              <>
                <button onClick={() => { setAuthMode("login"); setShowAuthModal(true); }} className="pill" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>Log in</button>
                <button onClick={() => { setAuthMode("signup"); setShowAuthModal(true); }} className="btn-cta" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>Sign up</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: "0.85rem", color: "#5A5D45" }}>{user.email}</span>
                {isPaid && (
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2d5a3d", background: "rgba(45,90,61,0.1)", padding: "4px 12px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {profile?.plan_type === "lifetime" ? "Lifetime" : "Student"}
                  </span>
                )}
                {!isPaid && (
                  <button onClick={() => setShowPricing(true)} className="btn-cta" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>Upgrade</button>
                )}
                <button onClick={signOut} style={{ fontSize: "0.85rem", color: "#A8AB92", background: "none", border: "none", cursor: "pointer", fontFamily: "'Playfair Display', Georgia, serif" }}>Sign out</button>
              </>
            )}
          </div>
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
            <div className="rm-search-input-wrap" ref={suggestionsRef} style={{ position: "relative" }}>
              <label className="rm-search-label">Research Interest</label>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => { if (e.key === "Enter") { setShowSuggestions(false); search(); } }}
                placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
                className="rm-search-input"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {filteredSuggestions.slice(0, 8).map((s, i) => (
                    <button key={i} className="suggestion-item" onClick={() => { setQuery(s); setShowSuggestions(false); }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
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
            const rawSummary = summaries[id];
            const summary = rawSummary ? getDisplaySummary(rawSummary) : null;
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

                    {/* Upgrade nudge for free users */}
                    {!isPaid && rawSummary && rawSummary.summary !== summary.summary && (
                      <button onClick={() => setShowPricing(true)} style={{ fontSize: "0.85rem", color: "#2d5a3d", background: "rgba(45,90,61,0.08)", border: "1.5px solid rgba(45,90,61,0.15)", borderRadius: "12px", padding: "10px 18px", cursor: "pointer", marginTop: "12px", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>
                        Upgrade to see full summary, all questions, and email tools
                      </button>
                    )}

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
                    {/* Closing tip — only show if paid and has highlights */}
                    {isPaid && summary.highlights.length > 0 && (
                      <div style={{ marginTop: "24px", padding: "16px 20px", background: "rgba(212,222,149,0.15)", border: "1px solid rgba(186,192,149,0.3)", borderRadius: "14px" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#636B2F", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Closing Tip</p>
                        <p style={{ fontSize: "0.9rem", color: "#5A5D45", lineHeight: 1.6 }}>
                          End your email with: &ldquo;If you&apos;re not currently taking students, is there someone in your group you&apos;d recommend I reach out to?&rdquo;
                        </p>
                      </div>
                    )}
                    <button onClick={() => openEmailDraft(author)} className="btn-secondary" style={{ marginTop: "16px", padding: "12px 28px", fontSize: "0.95rem" }}>
                      {isPaid ? "Draft email to professor \u2192" : "Draft email (upgrade required)"}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 className="rm-modal-title">Email to {emailTarget.display_name}</h2>
                    <button onClick={() => { setEmailTarget(null); setEmailDraft(""); setEmailFlags([]); setHasChecked(false); }} style={{ fontSize: "1.5rem", color: "#A8AB92", background: "none", border: "none", cursor: "pointer" }}>&times;</button>
                  </div>

                  <div style={{ padding: "14px 18px", background: "rgba(45,90,61,0.08)", border: "1.5px solid rgba(45,90,61,0.18)", borderRadius: "14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>&#128161;</span>
                    <p style={{ fontSize: "0.85rem", color: "#2d5a3d", lineHeight: 1.6 }}>
                      <strong>Before emailing</strong>, check the professor&apos;s faculty page for specific contact instructions. Less than 5% of students do this and it instantly sets you apart.
                    </p>
                  </div>

                  <div style={{ padding: "12px 18px", background: "rgba(212,222,149,0.12)", border: "1px solid rgba(186,192,149,0.25)", borderRadius: "14px", marginBottom: "20px" }}>
                    <p style={{ fontSize: "0.82rem", color: "#636B2F", lineHeight: 1.6 }}>
                      <strong>Tip:</strong> Consider saying you&apos;d like to <em>volunteer</em> rather than asking for a position. It lowers the commitment for professors and makes them more likely to say yes.
                    </p>
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

        {/* AUTH MODAL */}
        {showAuthModal && (
          <div className="modal-bg rm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}>
            <div className="modal-glass" style={{ padding: "48px 40px", maxWidth: "440px", width: "100%", borderRadius: "28px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#3D4127", marginBottom: "8px" }}>
                {authMode === "signup" ? "Create account" : "Welcome back"}
              </h2>
              <p style={{ fontSize: "0.95rem", color: "#8A8D72", marginBottom: "32px" }}>
                {authMode === "signup" ? "Start finding professors for free." : "Log in to your account."}
              </p>
              {authError && <p style={{ fontSize: "0.9rem", color: "#9B3322", marginBottom: "16px", padding: "10px 16px", background: "rgba(155,51,34,0.08)", borderRadius: "12px" }}>{authError}</p>}
              <div style={{ marginBottom: "20px" }}>
                <label className="rm-search-label">Email</label>
                <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAuth()} className="rm-search-input" style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(186,192,149,0.35)", borderRadius: "14px", padding: "14px 18px", width: "100%", marginTop: "4px" }} placeholder="you@email.com" />
              </div>
              <div style={{ marginBottom: "28px" }}>
                <label className="rm-search-label">Password</label>
                <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAuth()} className="rm-search-input" style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(186,192,149,0.35)", borderRadius: "14px", padding: "14px 18px", width: "100%", marginTop: "4px" }} placeholder="Min 6 characters" />
              </div>
              <button onClick={handleAuth} disabled={authLoading || !authEmail || !authPassword} className="btn-cta" style={{ width: "100%", padding: "16px", fontSize: "1.1rem" }}>
                {authLoading ? "Loading..." : authMode === "signup" ? "Create account" : "Log in"}
              </button>
              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem", color: "#8A8D72" }}>
                {authMode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
                <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }} style={{ color: "#2d5a3d", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "'Playfair Display', Georgia, serif", textDecoration: "underline" }}>
                  {authMode === "signup" ? "Log in" : "Sign up"}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* PRICING MODAL */}
        {showPricing && (
          <div className="modal-bg rm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPricing(false); }}>
            <div className="modal-glass" style={{ padding: "48px 40px", maxWidth: "900px", width: "100%", borderRadius: "28px", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#3D4127" }}>Upgrade your plan</h2>
                <button onClick={() => setShowPricing(false)} style={{ fontSize: "1.5rem", color: "#A8AB92", background: "none", border: "none", cursor: "pointer" }}>&times;</button>
              </div>
              <p style={{ fontSize: "0.95rem", color: "#8A8D72", marginBottom: "24px" }}>Unlock unlimited searches, full summaries, and the email checker.</p>
              <div className="billing-toggle" style={{ marginBottom: "32px" }}>
                <button onClick={() => setPricingBilling("monthly")} className={`pill ${pricingBilling === "monthly" ? "pill-active" : ""}`} style={{ borderRadius: "999px 0 0 999px", padding: "8px 20px", fontSize: "0.85rem" }}>Monthly</button>
                <button onClick={() => setPricingBilling("annual")} className={`pill ${pricingBilling === "annual" ? "pill-active" : ""}`} style={{ borderRadius: "0 999px 999px 0", padding: "8px 20px", fontSize: "0.85rem" }}>Annual</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
                {/* Student */}
                <div className="glass-card" style={{ padding: "28px 24px", position: "relative", border: "2px solid rgba(45,90,61,0.3)" }}>
                  <div style={{ position: "absolute", top: "-12px", left: "24px", background: "#2d5a3d", color: "#F5F0E6", padding: "4px 16px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Most Popular</div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#3D4127", marginBottom: "8px" }}>Student</h3>
                  <p style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2d5a3d" }}>{pricingBilling === "monthly" ? "$9" : "$39"}</p>
                  <p style={{ fontSize: "0.85rem", color: "#8A8D72", marginBottom: "20px" }}>{pricingBilling === "monthly" ? "/month" : "/year"}</p>
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
                    {["Unlimited searches", "Full paper summaries", "Email checker", "Saved professors", "All tips"].map((f, i) => (
                      <li key={i} style={{ fontSize: "0.9rem", color: "#5A5D45", padding: "6px 0", display: "flex", gap: "8px" }}>
                        <span style={{ color: "#2d5a3d" }}>&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleCheckout(pricingBilling === "monthly" ? "student_monthly" : "student_annual")} className="btn-cta" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>Upgrade to Student</button>
                </div>
                {/* Lifetime */}
                <div className="glass-card" style={{ padding: "28px 24px", position: "relative", border: "2px solid rgba(139,105,20,0.3)" }}>
                  <div style={{ position: "absolute", top: "-12px", left: "24px", background: "#8B6914", color: "#F5F0E6", padding: "4px 16px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Launch Special</div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#3D4127", marginBottom: "8px" }}>Lifetime</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <p style={{ fontSize: "2.2rem", fontWeight: 800, color: "#8B6914" }}>$20</p>
                    <p style={{ textDecoration: "line-through", color: "#A8AB92", fontSize: "1rem" }}>$108/yr</p>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#8A8D72", marginBottom: "20px" }}>one-time</p>
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
                    {["Everything in Student", "Pay once, use forever", "Limited to 200 users"].map((f, i) => (
                      <li key={i} style={{ fontSize: "0.9rem", color: "#5A5D45", padding: "6px 0", display: "flex", gap: "8px" }}>
                        <span style={{ color: "#8B6914" }}>&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleCheckout("lifetime")} className="btn-cta" style={{ width: "100%", padding: "14px", fontSize: "1rem", background: "#8B6914" }}>Claim your spot</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WAITLIST MODAL */}
        {showWaitlist && (
          <div className="modal-bg rm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowWaitlist(false); }}>
            <div className="modal-glass" style={{ padding: "48px 40px", maxWidth: "440px", width: "100%", borderRadius: "28px" }}>
              {!waitlistDone ? (
                <>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#3D4127", marginBottom: "8px" }}>Join the Pro waitlist</h2>
                  <p style={{ fontSize: "0.95rem", color: "#8A8D72", marginBottom: "28px" }}>Enter your email to get notified when Pro launches.</p>
                  <input type="email" value={waitlistEmail || user?.email || ""} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="you@email.com" className="rm-search-input" style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(186,192,149,0.35)", borderRadius: "14px", padding: "14px 18px", width: "100%", marginBottom: "20px" }} />
                  <button onClick={handleWaitlist} className="btn-cta" style={{ width: "100%", padding: "16px", fontSize: "1.1rem" }}>Join waitlist</button>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "12px" }}>You&apos;re on the list!</h2>
                  <p style={{ fontSize: "1rem", color: "#5A5D45", marginBottom: "28px" }}>We&apos;ll email you when Pro launches.</p>
                  <button onClick={() => { setShowWaitlist(false); setWaitlistDone(false); }} className="btn-secondary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>Close</button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
