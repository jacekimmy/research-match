"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function AppPageWrapper() {
  return <Suspense><AppPageInner /></Suspense>;
}

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
  highlights: { paper: string; detail: string; authorPosition?: string; doi?: string | null }[];
  questions: string[];
}

interface EmailFlag {
  type: string;
  issue: string;
  suggestion: string;
}

function AppPageInner() {
  const { user, profile, loading: authLoading2, signUp, signIn, signOut, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [starBounce, setStarBounce] = useState<string | null>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const btnInterestRef = useRef<HTMLButtonElement>(null);
  const btnNameRef = useRef<HTMLButtonElement>(null);

  // Auth modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeBilling, setUpgradeBilling] = useState<"monthly" | "annual">("monthly");

  const PLACEHOLDER_EXAMPLES = [
    "e.g. neuroscience", "e.g. organic chemistry", "e.g. political science",
    "e.g. machine learning", "e.g. cardiology", "e.g. astrophysics",
    "e.g. behavioral economics", "e.g. robotics", "e.g. immunology",
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [emailTarget, setEmailTarget] = useState<Author | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailFlags, setEmailFlags] = useState<EmailFlag[]>([]);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Nearby professors
  const [nearbyProfs, setNearbyProfs] = useState<Author[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Plan helpers
  const isPaid = profile?.plan_type === "student_monthly" || profile?.plan_type === "student_annual";
  const isFree = !isPaid;

  // Force re-render after mount so toggle slider refs are measured
  const [, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Handle ?upgrade=true from landing page
  useEffect(() => {
    if (authLoading2) return;
    if (searchParams.get("upgrade") === "true") {
      if (!user) {
        setShowAuthModal(true);
        setAuthMode("signup");
        setAuthError("");
      } else {
        setShowUpgradeModal(true);
      }
    }
  }, [authLoading2, user, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-search from landing page URL params
  const [autoSearched, setAutoSearched] = useState(false);
  useEffect(() => {
    if (autoSearched) return;
    const q = searchParams.get("q");
    const u = searchParams.get("u");
    if (q) {
      setQuery(q);
      if (u) setUniversity(u);
      setAutoSearched(true);
      // Delay to let state settle
      setTimeout(() => {
        const btn = document.querySelector("[data-search-btn]") as HTMLButtonElement;
        if (btn) btn.click();
      }, 100);
    }
  }, [searchParams, autoSearched]);

  // Welcome moment on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem("research-match-visited");
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem("research-match-visited", "true");
      setTimeout(() => setShowWelcome(false), 3200);
    }
  }, []);

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

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  function toggleSave(author: Author) {
    const id = author.id.split("/").pop()!;
    setStarBounce(id);
    setTimeout(() => setStarBounce(null), 500);
    setSaved((prev) => {
      const exists = prev.some((a) => a.id === author.id);
      const next = exists ? prev.filter((a) => a.id !== author.id) : [...prev, author];
      localStorage.setItem("research-match-saved", JSON.stringify(next));
      if (!exists) showToast("Professor saved!");
      return next;
    });
  }

  function isSaved(author: Author) {
    return saved.some((a) => a.id === author.id);
  }

  function canSummarize(): boolean {
    if (isPaid) return true;
    // Check localStorage for anonymous summaries
    const anonSummaries = parseInt(localStorage.getItem("research-match-summaries") || "0", 10);
    if (!user) {
      if (anonSummaries >= 3) {
        setShowAuthModal(true);
        setAuthMode("signup");
        setAuthError("Create a free account for 3 more summaries this month.");
        return false;
      }
      return true;
    }
    // Free account: 3 summaries per month
    if (profile && profile.searches_used >= 3) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  }

  async function incrementSummary() {
    if (isPaid) return;
    if (!user) {
      const current = parseInt(localStorage.getItem("research-match-summaries") || "0", 10);
      localStorage.setItem("research-match-summaries", String(current + 1));
      return;
    }
    try {
      const { supabase } = await import("@/lib/supabase");
      if (profile?.searches_reset_at && new Date() > new Date(profile.searches_reset_at)) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        await supabase.from("profiles").update({
          searches_used: 1,
          searches_reset_at: nextMonth.toISOString(),
        }).eq("id", user.id);
      } else {
        await supabase.from("profiles").update({
          searches_used: (profile?.searches_used ?? 0) + 1,
        }).eq("id", user.id);
      }
      refreshProfile();
    } catch { /* ignore */ }
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

      let authors: Author[] = [];

      if (!topicId) {
        const instFilter = institutionId ? `&filter=authorships.institutions.id:${institutionId}` : "";
        const worksRes = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}${instFilter}&sort=publication_date:desc&per_page=20&select=authorships`);
        const worksData = await worksRes.json();
        const works = worksData.results ?? [];
        const authorMap = new Map<string, Author>();
        for (const work of works) {
          for (const authorship of (work.authorships ?? [])) {
            const authorId = authorship.author?.id;
            if (!authorId || authorMap.has(authorId)) continue;
            if (institutionId && authorship.institutions?.[0]?.id !== `https://openalex.org/${institutionId}`) continue;
            const authorRes = await fetch(`https://api.openalex.org/authors/${authorId.split("/").pop()}?select=id,display_name,last_known_institutions,works_count,cited_by_count,topics`);
            if (authorRes.ok) {
              const authorData = await authorRes.json();
              if (institutionId && authorData.last_known_institutions?.[0]?.id !== `https://openalex.org/${institutionId}`) continue;
              authorMap.set(authorId, authorData);
            }
            if (authorMap.size >= 10) break;
          }
          if (authorMap.size >= 10) break;
        }
        authors = Array.from(authorMap.values()).sort((a, b) => b.cited_by_count - a.cited_by_count);
      } else {
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
      }
      // Score authors to filter out non-professors
      if (authors.length > 0) {
        try {
          const scoreRes = await fetch("/api/score-authors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authors: authors.map((a) => ({
                id: a.id,
                works_count: a.works_count,
                cited_by_count: a.cited_by_count,
                has_institution: !!(a.last_known_institutions?.length > 0),
              })),
            }),
          });
          const scoreData = await scoreRes.json();
          const scoreMap = new Map<string, number>();
          for (const s of scoreData.scored ?? []) scoreMap.set(s.id, s.score);
          authors = authors
            .filter((a) => (scoreMap.get(a.id) ?? 0) >= 3)
            .sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
        } catch {
          // Fallback: simple filter if scoring fails
          authors = authors.filter((a) => a.works_count >= 10);
        }
      }
      if (authors.length === 0) setError(`No professors found for "${topicName}"${institutionName ? ` at ${institutionName}` : ""}. Try a more specific topic like "machine learning" or "quantum computing".`);
      // searches are now unlimited
      setResults(authors);
      // Fetch nearby professors (different universities, same topic) in background
      if (authors.length > 0 && topicId && institutionId) {
        setNearbyProfs([]);
        setNearbyLoading(true);
        fetchNearby(topicId, institutionId, authors.map(a => a.id));
      } else {
        setNearbyProfs([]);
      }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function fetchNearby(topicId: string, institutionId: string, excludeIds: string[]) {
    try {
      const res = await fetch(`https://api.openalex.org/authors?filter=topics.id:${topicId}&per_page=25&sort=cited_by_count:desc`);
      const data = await res.json();
      let candidates: Author[] = data.results ?? [];
      // Filter out: same university, already in results, no institution
      const fullInstId = `https://openalex.org/${institutionId}`;
      candidates = candidates.filter((a) =>
        !excludeIds.includes(a.id) &&
        a.last_known_institutions?.length > 0 &&
        a.last_known_institutions[0]?.id !== fullInstId &&
        a.works_count >= 15
      );
      // Score and pick top 3
      try {
        const scoreRes = await fetch("/api/score-authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authors: candidates.map((a) => ({
              id: a.id,
              works_count: a.works_count,
              cited_by_count: a.cited_by_count,
              has_institution: true,
            })),
          }),
        });
        const scoreData = await scoreRes.json();
        const scoreMap = new Map<string, number>();
        for (const s of scoreData.scored ?? []) scoreMap.set(s.id, s.score);
        candidates = candidates
          .filter((a) => (scoreMap.get(a.id) ?? 0) >= 3)
          .sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
      } catch {
        candidates = candidates.sort((a, b) => b.cited_by_count - a.cited_by_count);
      }
      setNearbyProfs(candidates.slice(0, 3));
    } catch { /* ignore nearby failures */ }
    finally { setNearbyLoading(false); }
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
      // searches are now unlimited
      setResults(authors);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  function handleSearch() {
    if (searchMode === "name") searchByName();
    else search();
  }

  async function loadSummary(author: Author, retry = false) {
    const id = author.id.split("/").pop()!;
    if (!retry && (summaries[id] || loadingSummary[id])) return;
    // Check if user can view summaries
    if (!canSummarize()) return;
    if (retry) setSummaries((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setLoadingSummary((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authorId: id }) });
      const data = await res.json();
      setSummaries((prev) => ({ ...prev, [id]: { summary: data.summary || data.error || "Summary unavailable. Try again or visit their faculty page.", highlights: data.highlights || [], questions: data.questions || [] } }));
      // Increment summary count after successful load
      incrementSummary();
    } catch { setSummaries((prev) => ({ ...prev, [id]: { summary: "Summary unavailable. Try again or visit their faculty page.", highlights: [], questions: [] } })); }
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
      const flags = data.flags ?? [];
      setEmailFlags(flags);
      setHasChecked(true);

      // Perfect email celebration!
      if (flags.length === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2d5a3d", "#BAC095", "#D4DE95", "#636B2F", "#F5F0E6"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#2d5a3d", "#BAC095", "#D4DE95"],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#2d5a3d", "#BAC095", "#D4DE95"],
          });
        }, 300);
      }
    } catch { setEmailFlags([{ type: "error", issue: "Check failed", suggestion: "Something went wrong. Try again." }]); setHasChecked(true); }
    finally { setCheckingEmail(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(emailDraft);
    showToast("Copied to clipboard!");
  }

  const filteredSuggestions = query.trim()
    ? RESEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : RESEARCH_SUGGESTIONS;

  const profileUrl = (author: Author) => `https://openalex.org/authors/${author.id.split("/").pop()}`;

  function getEmailInfo(author: Author): { emails: string[]; domain: string | null; searchUrl: string } | null {
    const inst = author.last_known_institutions?.[0];
    if (!inst?.display_name) return null;
    const nameParts = author.display_name.toLowerCase().replace(/[^a-z\s.-]/g, "").split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) return null;
    const first = nameParts[0];
    const last = nameParts[nameParts.length - 1];
    const firstInitial = first[0];

    const domainMap: Record<string, { domain: string; formats: string[] }> = {
      "massachusetts institute of technology": { domain: "mit.edu", formats: ["{last}@", "{first}{last}@"] },
      "stanford university": { domain: "stanford.edu", formats: ["{first}.{last}@", "{last}@"] },
      "harvard university": { domain: "harvard.edu", formats: ["{first}_{last}@", "{last}@fas."] },
      "princeton university": { domain: "princeton.edu", formats: ["{first}.{last}@", "{last}@"] },
      "yale university": { domain: "yale.edu", formats: ["{first}.{last}@", "{last}@"] },
      "columbia university": { domain: "columbia.edu", formats: ["{fi}{last}@", "{first}.{last}@"] },
      "university of california, berkeley": { domain: "berkeley.edu", formats: ["{last}@", "{first}.{last}@"] },
      "cornell university": { domain: "cornell.edu", formats: ["{fi}{last}@", "{first}.{last}@"] },
      "university of chicago": { domain: "uchicago.edu", formats: ["{last}@", "{first}.{last}@"] },
      "university of pennsylvania": { domain: "upenn.edu", formats: ["{last}@", "{first}.{last}@"] },
      "duke university": { domain: "duke.edu", formats: ["{first}.{last}@", "{last}@"] },
      "university of michigan": { domain: "umich.edu", formats: ["{last}@", "{first}{last}@"] },
      "university of oxford": { domain: "ox.ac.uk", formats: ["{first}.{last}@", "{last}@"] },
      "university of cambridge": { domain: "cam.ac.uk", formats: ["{fi}{last}@", "{first}.{last}@"] },
      "california institute of technology": { domain: "caltech.edu", formats: ["{last}@", "{first}@"] },
      "carnegie mellon university": { domain: "cmu.edu", formats: ["{first}{last}@", "{last}@cs."] },
      "georgia institute of technology": { domain: "gatech.edu", formats: ["{first}.{last}@", "{last}@"] },
      "university of california, los angeles": { domain: "ucla.edu", formats: ["{last}@", "{first}.{last}@"] },
      "university of california, san diego": { domain: "ucsd.edu", formats: ["{fi}{last}@", "{last}@"] },
      "university of washington": { domain: "uw.edu", formats: ["{last}@", "{first}@"] },
      "northwestern university": { domain: "northwestern.edu", formats: ["{first}.{last}@", "{fi}-{last}@"] },
      "johns hopkins university": { domain: "jhu.edu", formats: ["{last}@", "{first}.{last}@"] },
      "new york university": { domain: "nyu.edu", formats: ["{fi}{last}@", "{first}.{last}@"] },
      "university of texas at austin": { domain: "utexas.edu", formats: ["{first}.{last}@", "{last}@"] },
      "university of illinois urbana-champaign": { domain: "illinois.edu", formats: ["{last}@", "{first}@"] },
      "brown university": { domain: "brown.edu", formats: ["{first}_{last}@", "{last}@"] },
      "rice university": { domain: "rice.edu", formats: ["{last}@", "{first}.{last}@"] },
      "vanderbilt university": { domain: "vanderbilt.edu", formats: ["{first}.{last}@", "{last}@"] },
      "emory university": { domain: "emory.edu", formats: ["{first}.{last}@", "{last}@"] },
      "university of southern california": { domain: "usc.edu", formats: ["{last}@", "{first}.{last}@"] },
      "boston university": { domain: "bu.edu", formats: ["{last}@", "{first}@"] },
      "university of virginia": { domain: "virginia.edu", formats: ["{fi}{last}@", "{last}@"] },
      "purdue university": { domain: "purdue.edu", formats: ["{last}@", "{first}.{last}@"] },
      "ohio state university": { domain: "osu.edu", formats: ["{last}.1@", "{first}.{last}@"] },
      "penn state university": { domain: "psu.edu", formats: ["{fi}{last}@", "{last}@"] },
      "university of florida": { domain: "ufl.edu", formats: ["{last}@", "{first}.{last}@"] },
      "eth zurich": { domain: "ethz.ch", formats: ["{first}.{last}@", "{last}@"] },
      "university of toronto": { domain: "utoronto.ca", formats: ["{first}.{last}@", "{last}@"] },
      "university of british columbia": { domain: "ubc.ca", formats: ["{first}.{last}@", "{last}@"] },
      "mcgill university": { domain: "mcgill.ca", formats: ["{first}.{last}@", "{last}@"] },
      "imperial college london": { domain: "imperial.ac.uk", formats: ["{fi}.{last}@", "{first}.{last}@"] },
      "university college london": { domain: "ucl.ac.uk", formats: ["{fi}.{last}@", "{first}.{last}@"] },
      "national university of singapore": { domain: "nus.edu.sg", formats: ["{last}@", "{first}.{last}@"] },
      "university of tokyo": { domain: "u-tokyo.ac.jp", formats: ["{last}@", "{first}.{last}@"] },
    };

    const instName = inst.display_name.toLowerCase();
    const mapped = domainMap[instName];
    let domain: string | null = null;
    let emails: string[] = [];

    if (mapped) {
      domain = mapped.domain;
      emails = mapped.formats.map(fmt =>
        fmt.replace("{first}", first).replace("{last}", last).replace("{fi}", firstInitial) + (fmt.includes("@") && !fmt.endsWith("@") ? domain! : domain!)
      );
    } else {
      // Fallback: try to extract domain
      const words = instName.replace(/university of |the /gi, "").replace(/university|college|institute|school/gi, "").trim().split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        domain = words[0].replace(/[^a-z]/g, "") + ".edu";
        emails = [
          `${first}.${last}@${domain}`,
          `${firstInitial}${last}@${domain}`,
          `${last}@${domain}`,
        ];
      }
    }

    // Fix: the format strings already include @, so we need to handle this properly
    if (mapped) {
      emails = mapped.formats.map(fmt => {
        const parts = fmt.split("@");
        const localPart = parts[0].replace("{first}", first).replace("{last}", last).replace("{fi}", firstInitial);
        const domainSuffix = parts[1] || "";
        return `${localPart}@${domainSuffix}${domainSuffix ? "" : ""}${mapped.domain}`;
      });
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${author.display_name}" email ${inst.display_name}`)}`;

    return emails.length > 0 ? { emails: [...new Set(emails)].slice(0, 3), domain, searchUrl } : null;
  }
  const displayList = showSaved ? saved : results;
  const wordCount = emailDraft.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      {/* Welcome moment */}
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <span className="welcome-leaf">&#127807;</span>
            <p className="welcome-text">Welcome to Research Match</p>
            <p className="welcome-subtext">Let&apos;s find your perfect research mentor.</p>
          </div>
        </div>
      )}

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
            <Link href="/" style={{ textDecoration: "none" }}>
              <h1 className="rm-title">Research Match</h1>
            </Link>
            <p style={{ fontSize: "1.2rem", color: "#8A8D72", marginTop: "12px", fontWeight: 400 }}>
              Find professors who match your research interests.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/feedback" className="btn-cta" style={{ padding: "10px 24px", fontSize: "0.9rem", textDecoration: "none" }}>
              Feedback
            </Link>
            {saved.length > 0 && (
              <button onClick={() => setShowSaved(!showSaved)} className={`pill ${showSaved ? "pill-active" : ""}`} style={{ padding: "10px 24px", fontSize: "1rem" }}>
                Saved ({saved.length})
              </button>
            )}
            {!user ? (
              <>
                <button onClick={() => { setShowAuthModal(true); setAuthMode("login"); setAuthError(""); }} className="btn-secondary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>Log in</button>
                <button onClick={() => { setShowAuthModal(true); setAuthMode("signup"); setAuthError(""); }} className="btn-cta rm-search-btn" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>Sign up</button>
              </>
            ) : (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {isFree && <button onClick={() => setShowUpgradeModal(true)} style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2d5a3d", background: "rgba(45,90,61,0.1)", padding: "6px 14px", borderRadius: "999px", border: "none", cursor: "pointer", transition: "all 0.2s" }}>Upgrade</button>}
                {isPaid && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#F5F0E6", background: "#2d5a3d", padding: "4px 12px", borderRadius: "999px" }}>Student</span>}
                <Link href="/profile" style={{
                  width: "38px", height: "38px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #2d5a3d, #4a7c5c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#F5F0E6", fontSize: "0.85rem", fontWeight: 700,
                  textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 2px 8px rgba(45,90,61,0.2)",
                  border: "2px solid rgba(255,255,255,0.4)",
                }} className="profile-avatar">
                  {user.email?.charAt(0).toUpperCase()}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* SEARCH MODE TOGGLE */}
        {!showSaved && (
          <div className="mode-toggle" ref={toggleRef}>
            <div
              className="mode-toggle-slider"
              style={{
                left: searchMode === "interest"
                  ? (btnInterestRef.current?.offsetLeft ?? 4) + "px"
                  : (btnNameRef.current?.offsetLeft ?? 100) + "px",
                width: searchMode === "interest"
                  ? (btnInterestRef.current?.offsetWidth ?? 110) + "px"
                  : (btnNameRef.current?.offsetWidth ?? 95) + "px",
              }}
            />
            <button
              ref={btnInterestRef}
              onClick={() => setSearchMode("interest")}
              className={`mode-toggle-btn ${searchMode === "interest" ? "mode-toggle-btn-active" : ""}`}
            >
              By Interest
            </button>
            <button
              ref={btnNameRef}
              onClick={() => setSearchMode("name")}
              className={`mode-toggle-btn ${searchMode === "name" ? "mode-toggle-btn-active" : ""}`}
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
                    <button
                      key={i}
                      className="suggestion-item"
                      onClick={() => { setQuery(s); setShowSuggestions(false); }}
                    >
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
            <button data-search-btn onClick={search} className="btn-cta rm-search-btn">Search</button>
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
        {loading && (
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <span className="loading-spinner">&#127807;</span>
            <p style={{ fontSize: "1.1rem", color: "#8A8D72", marginTop: "12px" }}>Searching...</p>
          </div>
        )}
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
                      <button
                        onClick={() => toggleSave(author)}
                        className={starBounce === id ? "star-bounce" : ""}
                        style={{ fontSize: "1.4rem", color: isSaved(author) ? "#8B6914" : "#BAC095", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s, transform 0.2s" }}
                        title={isSaved(author) ? "Remove from saved" : "Save professor"}
                      >
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

                {/* Professor Email Finder */}
                {isPaid ? (() => {
                  const info = getEmailInfo(author);
                  return info ? (
                    <div style={{ marginTop: "16px", padding: "14px 18px", background: "rgba(45,90,61,0.03)", borderRadius: "12px", border: "1px solid rgba(186,192,149,0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em" }}>Possible emails</span>
                        <a href={info.searchUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "#636B2F", textDecoration: "underline", marginLeft: "auto" }}>
                          Find verified email →
                        </a>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {info.emails.map((email, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {i === 0 && <span style={{ fontSize: "0.6rem", color: "#636B2F", background: "rgba(99,107,47,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>most likely</span>}
                            <span style={{ fontSize: "0.85rem", color: "#2d5a3d", fontWeight: i === 0 ? 600 : 400, fontFamily: "monospace" }}>{email}</span>
                            <button onClick={() => { navigator.clipboard.writeText(email); showToast("Email copied!"); }} style={{ fontSize: "0.65rem", color: "#F5F0E6", background: "#2d5a3d", border: "none", borderRadius: "6px", padding: "3px 10px", cursor: "pointer" }}>
                              Copy
                            </button>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: "0.7rem", color: "#BAC095", fontStyle: "italic", marginTop: "8px" }}>
                        Click &quot;Find verified email&quot; to search for their real address on Google
                      </p>
                    </div>
                  ) : null;
                })() : (
                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#8A8D72" }}>🔒 Professor email</span>
                    <button onClick={() => {
                      if (!user) { setShowAuthModal(true); setAuthMode("signup"); setAuthError(""); }
                      else { setShowUpgradeModal(true); }
                    }} style={{ fontSize: "0.75rem", color: "#2d5a3d", background: "rgba(45,90,61,0.08)", border: "none", borderRadius: "8px", padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>
                      {!user ? "Sign up free" : "Upgrade to Student ($9/mo)"}
                    </button>
                  </div>
                )}

                {summary ? (
                  <div className="summary-enter" style={{ marginTop: "28px" }}>
                    <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#5A5D45" }}>{summary.summary}</p>
                    {summary.highlights.length === 0 && summary.summary.includes("unavailable") && (
                      <button
                        onClick={() => loadSummary(author, true)}
                        className="btn-secondary"
                        style={{ marginTop: "12px", padding: "8px 20px", fontSize: "0.85rem" }}
                      >
                        Retry summary
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
                            style={{ fontSize: "0.7rem", fontWeight: 700, color: "#A8AB92", cursor: "pointer", background: "rgba(186,192,149,0.15)", border: "1px solid #BAC095", borderRadius: "999px", width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', Georgia, serif", transition: "all 0.2s ease" }}
                          >?</button>
                          <div style={{ display: "none", padding: "14px 18px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(186,192,149,0.3)", borderRadius: "12px", fontSize: "0.85rem", color: "#5A5D45", lineHeight: 1.6, marginTop: "4px", marginBottom: "8px" }}>
                            In most lab sciences (biology, chemistry, medicine, etc.), <strong>1st author</strong> did the hands-on work and <strong>last author</strong> runs the lab. In many other fields (math, CS, economics, humanities), author order is often alphabetical and doesn&apos;t indicate contribution level. When in doubt, check if the professor lists the paper prominently on their own website — that usually means it&apos;s important to them.
                          </div>
                        </div>
                        {summary.highlights.map((h, i) => (
                          <div key={i} className="finding-border" style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                            <p style={{ fontSize: "1rem", color: "#5A5D45", lineHeight: 1.6 }}>{h.detail}</p>
                            <p style={{ fontSize: "0.85rem", color: "#A8AB92", fontStyle: "italic", marginTop: "4px" }}>
                              {h.paper}
                              {h.authorPosition && h.authorPosition !== "unknown" && (
                                <span style={{ fontStyle: "normal", fontSize: "0.75rem", marginLeft: "8px", padding: "2px 8px", borderRadius: "999px", background: h.authorPosition === "first" ? "rgba(45,90,61,0.1)" : h.authorPosition === "last" ? "rgba(139,105,20,0.1)" : "rgba(138,141,114,0.1)", color: h.authorPosition === "first" ? "#2d5a3d" : h.authorPosition === "last" ? "#8B6914" : "#8A8D72" }}>
                                  {h.authorPosition === "first" ? "1st author" : h.authorPosition === "last" ? "last author" : "middle author"}
                                </span>
                              )}
                              {h.doi && (
                                <a href={h.doi} target="_blank" rel="noopener noreferrer" style={{ fontStyle: "normal", fontSize: "0.8rem", marginLeft: "10px", color: "#2d5a3d", textDecoration: "none", borderBottom: "1px solid transparent", transition: "border-color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#2d5a3d")} onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}>
                                  Read paper →
                                </a>
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
                    {/* Closing tip — only if highlights exist */}
                    {summary.highlights.length > 0 && (
                      <div style={{ marginTop: "24px", padding: "16px 20px", background: "rgba(212,222,149,0.15)", border: "1px solid rgba(186,192,149,0.3)", borderRadius: "14px" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#636B2F", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Closing Tip</p>
                        <p style={{ fontSize: "0.9rem", color: "#5A5D45", lineHeight: 1.6 }}>
                          End your email with: &ldquo;If you&apos;re not currently taking students, is there someone in your group you&apos;d recommend I reach out to?&rdquo;
                        </p>
                      </div>
                    )}
                    {isPaid ? (
                      <button onClick={() => openEmailDraft(author)} className="btn-secondary" style={{ marginTop: "16px", padding: "12px 28px", fontSize: "0.95rem" }}>
                        Draft email to professor &rarr;
                      </button>
                    ) : (
                      <button onClick={() => {
                        if (!user) { setShowAuthModal(true); setAuthMode("signup"); setAuthError("Create a free account to unlock email checking."); }
                        else { setShowUpgradeModal(true); }
                      }} className="btn-secondary" style={{ marginTop: "16px", padding: "12px 28px", fontSize: "0.95rem", opacity: 0.7 }}>
                        🔒 Email checker — {!user ? "Sign up free" : "Upgrade to Student ($9/mo)"}
                      </button>
                    )}
                  </div>
                ) : (
                  <button onClick={() => loadSummary(author)} disabled={isLoadingSummary} className={`btn-secondary`} style={{ marginTop: "24px", padding: "12px 28px", fontSize: "0.95rem", opacity: isLoadingSummary ? 0.5 : 1 }}>
                    {isLoadingSummary ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span className="loading-spinner" style={{ fontSize: "1rem" }}>&#127807;</span>
                        Generating summary...
                      </span>
                    ) : "Summarize research \u2192"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* NEARBY PROFESSORS */}
        {!showSaved && results.length > 0 && (nearbyLoading || nearbyProfs.length > 0) && (
          <div style={{ marginTop: "60px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(186,192,149,0.5), transparent)" }} />
              <h2 style={{
                fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d",
                whiteSpace: "nowrap", letterSpacing: "-0.01em",
              }}>
                Similar researchers at nearby universities
              </h2>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(186,192,149,0.5), transparent)" }} />
            </div>

            {nearbyLoading && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <span className="loading-spinner">🍃</span>
                <p style={{ color: "#8A8D72", marginTop: "10px", fontSize: "0.9rem" }}>Finding similar researchers...</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
              {nearbyProfs.map((author, i) => (
                <div key={author.id} className="glass-card card-enter" style={{
                  padding: "28px",
                  position: "relative",
                  overflow: "hidden",
                  animationDelay: `${i * 0.12}s`,
                }}>
                  {/* Lock overlay for free users */}
                  {isFree && (
                    <div style={{
                      position: "absolute", inset: 0, zIndex: 2,
                      background: "rgba(245,240,230,0.7)",
                      backdropFilter: "blur(6px)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      borderRadius: "inherit", padding: "24px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (!user) { setShowAuthModal(true); setAuthMode("signup"); setAuthError(""); }
                      else { setShowUpgradeModal(true); }
                    }}
                    >
                      <span style={{ fontSize: "2rem", marginBottom: "12px" }}>🔒</span>
                      <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#2d5a3d", textAlign: "center", marginBottom: "6px" }}>
                        Unlock nearby professors
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "#8A8D72", textAlign: "center" }}>
                        Upgrade to Student to explore researchers at other universities
                      </p>
                    </div>
                  )}

                  {/* Card content (visible but blurred for free) */}
                  <a href={profileUrl(author)} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: "1.2rem", fontWeight: 700, color: "#2d5a3d",
                    textDecoration: "none", display: "block", marginBottom: "4px",
                    transition: "color 0.2s",
                  }}>
                    {author.display_name}
                  </a>
                  <p style={{ fontSize: "0.9rem", color: "#8A8D72", marginBottom: "12px" }}>
                    {author.last_known_institutions?.[0]?.display_name || ""}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {author.topics?.slice(0, 3).map((t, j) => (
                      <span key={j} className="tag" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>{t.display_name}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "#5A5D45" }}>
                    <span><strong>{author.works_count}</strong> papers</span>
                    <span><strong>{author.cited_by_count.toLocaleString()}</strong> citations</span>
                  </div>

                  {/* For paid users: show summarize button */}
                  {isPaid && (
                    <button
                      onClick={() => loadSummary(author)}
                      className="btn-secondary"
                      style={{ marginTop: "16px", padding: "8px 20px", fontSize: "0.8rem", width: "100%" }}
                    >
                      {loadingSummary[author.id.split("/").pop()!] ? (
                        <><span className="loading-spinner" style={{ fontSize: "0.9rem" }}>🍃</span> Summarizing...</>
                      ) : summaries[author.id.split("/").pop()!] ? "View summary ↓" : "Summarize research →"}
                    </button>
                  )}

                  {/* Show summary if loaded (paid only) */}
                  {isPaid && summaries[author.id.split("/").pop()!] && (
                    <div className="summary-enter" style={{ marginTop: "16px" }}>
                      <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "#5A5D45" }}>
                        {summaries[author.id.split("/").pop()!].summary}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <button onClick={() => { setEmailTarget(null); setEmailDraft(""); setEmailFlags([]); setHasChecked(false); }} style={{ fontSize: "1.5rem", color: "#A8AB92", background: "none", border: "none", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => (e.currentTarget.style.transform = "rotate(90deg)")} onMouseLeave={e => (e.currentTarget.style.transform = "rotate(0deg)")}>&times;</button>
                  </div>

                  {/* Check their website banner */}
                  <div style={{ padding: "14px 18px", background: "rgba(45,90,61,0.08)", border: "1.5px solid rgba(45,90,61,0.18)", borderRadius: "14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>&#128161;</span>
                    <p style={{ fontSize: "0.85rem", color: "#2d5a3d", lineHeight: 1.6 }}>
                      <strong>Before emailing</strong>, check the professor&apos;s faculty page for specific contact instructions. Less than 5% of students do this and it instantly sets you apart.
                    </p>
                  </div>

                  {/* Volunteer framing tip */}
                  <div style={{ padding: "12px 18px", background: "rgba(212,222,149,0.12)", border: "1px solid rgba(186,192,149,0.25)", borderRadius: "14px", marginBottom: "20px" }}>
                    <p style={{ fontSize: "0.82rem", color: "#636B2F", lineHeight: 1.6 }}>
                      <strong>Tip:</strong> Consider saying you&apos;d like to <em>volunteer</em> rather than asking for a position. It lowers the commitment for professors and makes them more likely to say yes.
                    </p>
                  </div>

                  <textarea value={emailDraft} onChange={(e) => { setEmailDraft(e.target.value); setHasChecked(false); }} placeholder={`Dear Professor ${emailTarget.display_name},\n\nI'm a [year] [major] student at [your university]...\n\nUse the reference panel to mention specific papers and research.`} className="modal-textarea" style={{ flex: 1, padding: "24px", lineHeight: 1.7 }} />
                  <div className="rm-modal-actions">
                    <button onClick={checkEmail} disabled={checkingEmail || !emailDraft.trim()} className="btn-cta" style={{ padding: "14px 36px", fontSize: "1rem" }}>
                      {checkingEmail ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <span className="loading-spinner" style={{ fontSize: "0.9rem" }}>&#127807;</span>
                          Checking...
                        </span>
                      ) : "Check my email"}
                    </button>
                    <button onClick={handleCopy} disabled={!emailDraft.trim()} style={{ fontSize: "1rem", color: "#8A8D72", background: "none", border: "none", cursor: emailDraft.trim() ? "pointer" : "default", opacity: emailDraft.trim() ? 1 : 0.3, fontFamily: "'Playfair Display', Georgia, serif", transition: "color 0.2s" }}
                      onMouseEnter={e => { if (emailDraft.trim()) e.currentTarget.style.color = "#2d5a3d"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#8A8D72"; }}
                    >
                      Copy to clipboard
                    </button>
                    <span style={{ marginLeft: "auto", fontSize: "0.9rem", fontWeight: 700, color: wordCount > 200 ? "#9B3322" : "#8A8D72", background: wordCount > 200 ? "rgba(155,51,34,0.08)" : "transparent", padding: "6px 14px", borderRadius: "999px", transition: "all 0.3s ease" }}>
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
                    <div className="email-pass" style={{ marginTop: "20px", padding: "20px 24px", textAlign: "center" }}>
                      <p style={{ fontSize: "1.4rem", marginBottom: "6px" }}>&#127881;</p>
                      <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#2d5a3d" }}>Perfect email! No issues found.</p>
                      <p style={{ fontSize: "0.85rem", color: "#8A8D72", marginTop: "6px" }}>Copy it and send it with confidence.</p>
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
                  {isLoadingTargetSummary && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <span className="loading-spinner">&#127807;</span>
                      <p style={{ fontSize: "0.9rem", color: "#8A8D72", marginTop: "8px" }}>Loading research info...</p>
                    </div>
                  )}
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
                              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2d5a3d" }}>
                                {h.paper}
                                {h.doi && (
                                  <a href={h.doi} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 400, fontSize: "0.75rem", marginLeft: "8px", color: "#636B2F" }}>
                                    Read →
                                  </a>
                                )}
                              </p>
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

        {/* TOAST */}
        {toast && <div className="toast">{toast}</div>}
      </main>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,240,230,0.85)", backdropFilter: "blur(12px)" }} onClick={() => setShowAuthModal(false)}>
          <div className="glass-card" style={{ padding: "40px", maxWidth: "400px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "8px" }}>
              {authMode === "signup" ? "Create your account" : "Welcome back"}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#8A8D72", marginBottom: "24px" }}>
              {authMode === "signup" ? "Get 3 free searches per month." : "Log in to your account."}
            </p>
            {authError && <p style={{ fontSize: "0.85rem", color: "#9B3322", marginBottom: "16px", background: "rgba(155,51,34,0.08)", padding: "10px 14px", borderRadius: "10px" }}>{authError}</p>}
            <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: "1rem", border: "1.5px solid rgba(186,192,149,0.4)", borderRadius: "12px", background: "rgba(255,255,255,0.5)", color: "#3D4127", fontFamily: "inherit", marginBottom: "12px", outline: "none" }} />
            <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: "1rem", border: "1.5px solid rgba(186,192,149,0.4)", borderRadius: "12px", background: "rgba(255,255,255,0.5)", color: "#3D4127", fontFamily: "inherit", marginBottom: "20px", outline: "none" }} />
            <button disabled={authLoading} onClick={async () => {
              setAuthLoading(true); setAuthError("");
              try {
                if (authMode === "signup") {
                  const { error } = await signUp(authEmail, authPassword);
                  if (error) { setAuthError(error.message); } else { setShowAuthModal(false); showToast("Account created! Check your email to confirm."); }
                } else {
                  const { error } = await signIn(authEmail, authPassword);
                  if (error) { setAuthError(error.message); } else { setShowAuthModal(false); showToast("Welcome back!"); }
                }
              } catch (err: unknown) { setAuthError(err instanceof Error ? err.message : "Something went wrong"); }
              finally { setAuthLoading(false); }
            }} className="btn-cta rm-search-btn" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>
              {authLoading ? "Loading..." : authMode === "signup" ? "Sign up" : "Log in"}
            </button>
            <p style={{ fontSize: "0.85rem", color: "#8A8D72", textAlign: "center", marginTop: "16px" }}>
              {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }} style={{ color: "#2d5a3d", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}>
                {authMode === "signup" ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,240,230,0.85)", backdropFilter: "blur(12px)" }} onClick={() => setShowUpgradeModal(false)}>
          <div className="glass-card" style={{ padding: "40px", maxWidth: "420px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "8px" }}>Upgrade to Student</h3>
            <p style={{ fontSize: "0.9rem", color: "#8A8D72", marginBottom: "24px" }}>Unlimited summaries, email checker, and professor email finder.</p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <div style={{
                display: "inline-flex", background: "rgba(45,90,61,0.08)",
                border: "2px solid rgba(45,90,61,0.2)", borderRadius: "999px",
                padding: "4px", gap: "4px",
              }}>
                <button onClick={() => setUpgradeBilling("monthly")} style={{
                  padding: "10px 24px", fontSize: "0.9rem", fontWeight: 700,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  border: "none", borderRadius: "999px", cursor: "pointer",
                  transition: "all 0.3s ease",
                  background: upgradeBilling === "monthly" ? "#2d5a3d" : "transparent",
                  color: upgradeBilling === "monthly" ? "#F5F0E6" : "#3D4127",
                }}>$9/mo</button>
                <button onClick={() => setUpgradeBilling("annual")} style={{
                  padding: "10px 24px", fontSize: "0.9rem", fontWeight: 700,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  border: "none", borderRadius: "999px", cursor: "pointer",
                  transition: "all 0.3s ease",
                  background: upgradeBilling === "annual" ? "#2d5a3d" : "transparent",
                  color: upgradeBilling === "annual" ? "#F5F0E6" : "#3D4127",
                }}>$79/yr <span style={{ fontSize: "0.75rem", color: upgradeBilling === "annual" ? "#D4DE95" : "#636B2F" }}>(save $29)</span></button>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "24px" }}>
              {["Unlimited research summaries", "Email checker with red-flag detection", "Professor email finder", "Everything in Free"].map((f) => (
                <li key={f} style={{ fontSize: "0.9rem", color: "#5A5D45", padding: "5px 0", display: "flex", gap: "8px" }}>
                  <span style={{ color: "#2d5a3d" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={async () => {
              if (!user) { setShowUpgradeModal(false); setShowAuthModal(true); setAuthMode("signup"); return; }
              try {
                const priceId = upgradeBilling === "monthly"
                  ? (process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDENT_MONTHLY || "price_1TF4pEFINW44xCyF0nDRsX8l")
                  : (process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDENT_ANNUAL || "price_1TF4paFINW44xCyFydayukDG");
                const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId, userId: user.id }) });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              } catch { showToast("Something went wrong. Try again."); }
            }} className="btn-cta rm-search-btn" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>
              Upgrade now
            </button>
            <p style={{ fontSize: "0.75rem", color: "#8A8D72", textAlign: "center", marginTop: "12px" }}>Cancel anytime. Powered by Stripe.</p>
          </div>
        </div>
      )}
    </>
  );
}
