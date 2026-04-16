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
  // Physical Sciences — Astronomy & Astrophysics
  "Astronomy", "Astrophysics", "Cosmology", "Gravitational Physics", "Planetary Science",
  "Radio Astronomy", "Solar Physics", "Space Physics", "Stellar Astrophysics",
  "Exoplanets", "Black Holes", "Dark Matter", "Dark Energy", "Galactic Astronomy",
  // Physical Sciences — Physics
  "Acoustics", "Applied Physics", "Atomic Physics", "Biophysics", "Classical Mechanics",
  "Computational Physics", "Condensed Matter Physics", "Fluid Dynamics",
  "High Energy Physics", "Mathematical Physics", "Nuclear Physics", "Optics",
  "Particle Physics", "Photonics", "Plasma Physics", "Quantum Information",
  "Quantum Mechanics", "Quantum Optics", "Quantum Physics", "Semiconductors",
  "Statistical Mechanics", "Thermodynamics",
  // Physical Sciences — Chemistry
  "Analytical Chemistry", "Astrochemistry", "Atmospheric Chemistry",
  "Catalysis", "Chemical Biology", "Computational Chemistry", "Electrochemistry",
  "Environmental Chemistry", "Food Chemistry", "Geochemistry", "Green Chemistry",
  "Inorganic Chemistry", "Materials Chemistry", "Medicinal Chemistry",
  "Nuclear Chemistry", "Organic Chemistry", "Organometallic Chemistry",
  "Photochemistry", "Physical Chemistry", "Polymer Chemistry", "Supramolecular Chemistry",
  "Surface Chemistry", "Theoretical Chemistry",
  // Physical Sciences — Materials Science
  "Biomaterials", "Ceramics", "Composite Materials", "Electronic Materials",
  "Metamaterials", "Nanomaterials", "Nanoscience", "Nanotechnology",
  "Polymers", "Semiconductor Materials", "Smart Materials", "Soft Matter",
  "Thin Films", "Two-Dimensional Materials",
  // Physical Sciences — Mathematics
  "Algebra", "Algebraic Geometry", "Algebraic Topology", "Analysis",
  "Applied Mathematics", "Category Theory", "Combinatorics", "Complex Analysis",
  "Computational Mathematics", "Differential Equations", "Differential Geometry",
  "Discrete Mathematics", "Dynamical Systems", "Functional Analysis",
  "Game Theory", "Geometry", "Graph Theory", "Logic", "Mathematics",
  "Number Theory", "Numerical Analysis", "Operations Research",
  "Optimization", "Probability Theory", "Real Analysis", "Set Theory",
  "Statistics", "Stochastic Processes", "Topology",
  // Physical Sciences — Computer Science
  "Algorithms", "Artificial Intelligence", "Augmented Reality",
  "Bioinformatics", "Blockchain", "Cloud Computing", "Computer Architecture",
  "Computer Engineering", "Computer Graphics", "Computer Networks",
  "Computer Science", "Computer Security", "Computer Vision", "Cryptography",
  "Cybersecurity", "Data Mining", "Data Science", "Database Systems",
  "Deep Learning", "Distributed Computing", "Edge Computing",
  "Formal Methods", "Human-Computer Interaction", "Information Retrieval",
  "Information Theory", "Internet of Things", "Machine Learning",
  "Natural Language Processing", "Operating Systems", "Parallel Computing",
  "Privacy", "Programming Languages", "Quantum Computing",
  "Reinforcement Learning", "Robotics", "Software Engineering",
  "Speech Recognition", "Systems Biology", "Theoretical Computer Science",
  "Virtual Reality", "Visualization",
  // Physical Sciences — Engineering
  "Aerospace Engineering", "Biomedical Engineering", "Chemical Engineering",
  "Civil Engineering", "Control Engineering", "Control Systems",
  "Electrical Engineering", "Environmental Engineering",
  "Geotechnical Engineering", "Industrial Engineering",
  "Manufacturing Engineering", "Mechanical Engineering",
  "Mechatronics", "Nuclear Engineering", "Petroleum Engineering",
  "Power Systems", "Process Engineering", "Signal Processing",
  "Structural Engineering", "Systems Engineering",
  "Transportation Engineering", "VLSI Design", "Wireless Communications",
  // Physical Sciences — Earth & Planetary Sciences
  "Atmospheric Science", "Climate Science", "Earth Science",
  "Economic Geology", "Geodesy", "Geography", "Geology",
  "Geomorphology", "Geophysics", "Glaciology", "Hydrology",
  "Mineralogy", "Oceanography", "Paleoclimatology", "Paleontology",
  "Petrology", "Seismology", "Soil Science", "Volcanology",
  // Physical Sciences — Energy
  "Battery Technology", "Bioenergy", "Energy Engineering",
  "Energy Policy", "Energy Storage", "Fuel Cells",
  "Nuclear Energy", "Renewable Energy", "Solar Energy",
  "Thermoelectrics", "Wind Energy",
  // Physical Sciences — Environmental Science
  "Air Quality", "Biodiversity", "Climate Change", "Conservation Biology",
  "Ecology", "Ecotoxicology", "Environmental Policy", "Environmental Science",
  "Forest Ecology", "GIS", "Landscape Ecology", "Marine Conservation",
  "Pollution", "Remote Sensing", "Sustainability", "Waste Management",
  "Water Quality",
  // Life Sciences — Agricultural & Biological Sciences
  "Agricultural Economics", "Agricultural Engineering", "Agricultural Science",
  "Agronomy", "Animal Behavior", "Animal Breeding", "Animal Science",
  "Aquaculture", "Botany", "Crop Science", "Entomology",
  "Evolutionary Biology", "Food Science", "Food Safety",
  "Forestry", "Horticulture", "Limnology", "Marine Biology",
  "Mycology", "Ornithology", "Plant Biology", "Plant Breeding",
  "Plant Ecology", "Plant Pathology", "Plant Science",
  "Soil Biology", "Veterinary Science", "Wildlife Biology", "Zoology",
  // Life Sciences — Biochemistry, Genetics & Molecular Biology
  "Biochemistry", "Biotechnology", "Cell Biology",
  "Cell Signaling", "Chemical Biology", "Chromatin Biology",
  "Computational Biology", "Developmental Biology", "Epigenetics",
  "Evolutionary Genetics", "Gene Editing", "Gene Expression",
  "Gene Therapy", "Genetics", "Genomics", "Metabolomics",
  "Molecular Biology", "Molecular Genetics", "Plant Genetics",
  "Population Genetics", "Proteomics", "RNA Biology",
  "Single Cell Biology", "Stem Cell Biology", "Structural Biology",
  "Synthetic Biology", "Systems Biology",
  // Life Sciences — Immunology & Microbiology
  "Bacteriology", "Clinical Microbiology", "Immunology",
  "Medical Microbiology", "Microbiology", "Microbiome",
  "Mycology", "Parasitology", "Virology",
  // Life Sciences — Neuroscience
  "Behavioral Neuroscience", "Clinical Neuroscience",
  "Cognitive Neuroscience", "Computational Neuroscience",
  "Developmental Neuroscience", "Molecular Neuroscience",
  "Neural Engineering", "Neurochemistry", "Neuroimaging",
  "Neurology", "Neurophysiology", "Neuroscience",
  "Psychophysics", "Systems Neuroscience",
  // Life Sciences — Pharmacology & Toxicology
  "Clinical Pharmacology", "Drug Delivery", "Drug Design",
  "Drug Discovery", "Pharmacokinetics", "Pharmacology",
  "Pharmacy", "Toxicology",
  // Social Sciences — Arts & Humanities
  "African American Studies", "Anthropology", "Archaeology",
  "Art History", "Asian Studies", "Classical Studies",
  "Classics", "Comparative Literature", "Cultural Anthropology",
  "Cultural Studies", "Digital Humanities", "Ethics",
  "Film Studies", "Gender Studies", "History",
  "Indigenous Studies", "Language and Linguistics", "Latin American Studies",
  "Literary Theory", "Media Studies", "Medieval Studies",
  "Music Theory", "Philosophy", "Religious Studies",
  "Rhetoric", "Theater Studies", "Visual Arts",
  // Social Sciences — Business, Management & Accounting
  "Accounting", "Business Analytics", "Business Ethics",
  "Corporate Finance", "Entrepreneurship", "Finance",
  "Human Resource Management", "Innovation Management",
  "International Business", "Logistics", "Management",
  "Marketing", "Nonprofit Management", "Operations Management",
  "Organizational Behavior", "Risk Management",
  "Strategic Management", "Supply Chain Management",
  // Social Sciences — Decision Sciences & Economics
  "Behavioral Economics", "Decision Theory", "Development Economics",
  "Econometrics", "Economic History", "Economic Theory",
  "Economics", "Financial Economics", "Health Economics",
  "Industrial Organization", "International Economics",
  "Labor Economics", "Macroeconomics", "Microeconomics",
  "Political Economy", "Public Economics", "Urban Economics",
  // Social Sciences — Psychology
  "Behavioral Psychology", "Child Psychology", "Clinical Psychology",
  "Cognitive Psychology", "Community Psychology", "Counseling Psychology",
  "Developmental Psychology", "Educational Psychology",
  "Environmental Psychology", "Experimental Psychology",
  "Forensic Psychology", "Health Psychology",
  "Neuropsychology", "Organizational Psychology",
  "Personality Psychology", "Positive Psychology",
  "Psycholinguistics", "Psychology", "School Psychology",
  "Social Psychology", "Sports Psychology",
  // Social Sciences — Social Sciences & Law
  "Communication Studies", "Criminology", "Demography",
  "Geography", "Human Geography", "International Relations",
  "Law", "Constitutional Law", "Criminal Law", "Environmental Law",
  "Family Law", "Health Law", "Intellectual Property",
  "International Law", "Labor Law", "Legal Theory",
  "Library Science", "Political Science", "Public Administration",
  "Public Policy", "Science Policy", "Social Work",
  "Sociology", "Urban Planning", "Women's Studies",
  // Health Sciences — Medicine
  "Addiction Medicine", "Allergy and Immunology", "Anesthesiology",
  "Cardiology", "Cardiovascular Medicine", "Clinical Medicine",
  "Clinical Trials", "Critical Care", "Dermatology",
  "Emergency Medicine", "Endocrinology", "Epidemiology",
  "Family Medicine", "Gastroenterology", "General Surgery",
  "Geriatrics", "Global Health", "Hematology",
  "Hospital Medicine", "Infectious Disease", "Internal Medicine",
  "Medical Genetics", "Medical Imaging", "Medical Oncology",
  "Mental Health", "Nephrology", "Neurosurgery",
  "Obstetrics and Gynecology", "Oncology", "Ophthalmology",
  "Orthopedics", "Otolaryngology", "Palliative Care",
  "Pathology", "Pediatrics", "Physical Medicine",
  "Plastic Surgery", "Preventive Medicine", "Primary Care",
  "Psychiatry", "Public Health", "Pulmonology",
  "Radiation Oncology", "Radiology", "Reproductive Medicine",
  "Rheumatology", "Sleep Medicine", "Sports Medicine",
  "Surgery", "Transplantation", "Urology", "Vascular Surgery",
  // Health Sciences — Nursing & Health Professions
  "Community Health", "Community Health Nursing",
  "Critical Care Nursing", "Dental Public Health",
  "Dentistry", "Dietetics", "Emergency Nursing",
  "Geriatric Nursing", "Health Informatics", "Health Policy",
  "Health Professions", "Health Services Research",
  "Kinesiology", "Midwifery", "Nursing",
  "Nutrition Science", "Occupational Therapy",
  "Oral Health", "Orthodontics", "Pediatric Dentistry",
  "Pediatric Nursing", "Pharmacy", "Physical Therapy",
  "Public Health Nutrition", "Radiography",
  "Respiratory Therapy", "Speech Pathology",
  // Interdisciplinary
  "Astrobiology", "Bioethics", "Cognitive Science",
  "Computational Social Science", "Digital Health",
  "Environmental Justice", "Global Studies", "Health Equity",
  "Human Factors", "Medical Anthropology", "Medical Ethics",
  "Neuroeconomics", "Science Communication",
  "Science and Technology Studies", "Social Epidemiology",
].sort();

interface Author {
  id: string;
  display_name: string;
  last_known_institutions: { id: string; display_name: string; country_code: string; geo?: { city?: string; region?: string; country?: string } }[];
  works_count: number;
  cited_by_count: number;
  topics: { display_name: string }[];
}

const US_STATE_CODES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH",
  "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN",
  Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

function formatInstitutionLocation(inst: Author["last_known_institutions"][0] | undefined): string {
  if (!inst) return "";
  const name = inst.display_name;
  const city = inst.geo?.city;
  const region = inst.geo?.region;
  const country = inst.geo?.country;
  const isUS = inst.country_code === "US";
  if (!city && !region) return name;
  if (isUS) {
    const stateCode = region ? (US_STATE_CODES[region] ?? region) : "";
    return city ? `${name}, ${city}${stateCode ? `, ${stateCode}` : ""}` : name;
  }
  return city && country ? `${name}, ${city}, ${country}` : name;
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
  const [queryTags, setQueryTags] = useState<string[]>([]);
  const [university, setUniversity] = useState("");
  const [uniTags, setUniTags] = useState<string[]>([]);
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
  const [authPromoCode, setAuthPromoCode] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTitle, setUpgradeModalTitle] = useState("");
  const [upgradeModalSubtitle, setUpgradeModalSubtitle] = useState("");
  const [authModalCopy, setAuthModalCopy] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showEmailPlaybookMenu, setShowEmailPlaybookMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
  const [showFramework, setShowFramework] = useState(false);

  // Email finder
  const [emailLookup, setEmailLookup] = useState<Record<string, { emails: { email: string; source: string; confidence: string }[]; searchUrls: { google: string; scholar: string; directory: string | null }; homepageUrl: string | null; orcidUrl: string | null } | null>>({});
  const [emailLookupLoading, setEmailLookupLoading] = useState<Record<string, boolean>>({});

  // Nearby professors
  const [nearbyProfs, setNearbyProfs] = useState<Author[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Professor responsiveness badges
  const [responsiveness, setResponsiveness] = useState<Record<string, { level: "green" | "yellow" | "red"; label: string; tooltip: string }>>({});

  // Funding Pulse — cached statuses keyed by short OpenAlex ID
  const [fundingStatus, setFundingStatus] = useState<Record<string, "ACTIVE" | "NOT_RECENT" | "UNKNOWN">>({});

  // Plan helpers
  const isPaid = profile?.plan_type === "semester" || profile?.plan_type === "student_monthly" || profile?.plan_type === "student_annual" || profile?.plan_type === "lifetime";
  const isFree = !isPaid;

  // Tag helpers
  function addQueryTag() {
    const val = query.trim();
    if (val && !queryTags.includes(val)) setQueryTags(prev => [...prev, val]);
    setQuery("");
  }
  function addUniTag() {
    const val = university.trim();
    if (val && !uniTags.includes(val)) setUniTags(prev => [...prev, val]);
    setUniversity("");
  }
  function removeQueryTag(idx: number) { setQueryTags(prev => prev.filter((_, i) => i !== idx)); }
  function removeUniTag(idx: number) { setUniTags(prev => prev.filter((_, i) => i !== idx)); }

  // Force re-render after mount so toggle slider refs are measured
  const [, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Handle ?upgrade=true or ?upgrade=lifetime from landing page
  useEffect(() => {
    if (authLoading2) return;
    const upgradeParam = searchParams.get("upgrade");
    if (upgradeParam === "true" || upgradeParam === "lifetime") {
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

  // Close hamburger menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) setShowEmailPlaybookMenu(false);
  }, [showMenu]);

  // Grand reveal / welcome back
  const [revealPhase, setRevealPhase] = useState<"curtain" | "content" | "done">("curtain");
  useEffect(() => {
    const visitCount = parseInt(localStorage.getItem("research-match-visits") || "0", 10);
    localStorage.setItem("research-match-visits", String(visitCount + 1));
    localStorage.setItem("research-match-last-visit", new Date().toISOString());

    if (visitCount === 0) {
      // First visit — grand reveal
      setShowWelcome(true);
      setTimeout(() => setRevealPhase("content"), 2200);
      setTimeout(() => { setShowWelcome(false); setRevealPhase("done"); }, 3600);
    } else {
      // Returning user — quick welcome back
      setShowWelcome(true);
      setRevealPhase("content");
      setTimeout(() => { setShowWelcome(false); setRevealPhase("done"); }, 1800);
    }
  }, []);

  // Exit intent — subtle goodbye on mouse leave (desktop only)
  useEffect(() => {
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY < 5 && !document.querySelector(".exit-hint-active")) {
        document.body.classList.add("exit-hint-active");
        setTimeout(() => document.body.classList.remove("exit-hint-active"), 2000);
      }
    }
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
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

  // After signup: clear any pending summarize flag (don't auto-fire — let user click manually so it properly deducts their credit)
  useEffect(() => {
    if (!user) return;
    sessionStorage.removeItem("rm-pending-summarize");
  }, [user]);

  // Reset modal copy state when modals close
  useEffect(() => { if (!showAuthModal) setAuthModalCopy(""); }, [showAuthModal]);
  useEffect(() => { if (!showUpgradeModal) { setUpgradeModalTitle(""); setUpgradeModalSubtitle(""); } }, [showUpgradeModal]);

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

  // Summary limit:
  //   Anon: 1 free summary tracked via hasViewedFreeSummary localStorage flag
  //   Free account: 1 summary total before upgrade paywall
  //   Paid: unlimited
  function getSummariesRemaining(): number {
    if (isPaid) return Infinity;
    if (!user) {
      const hasViewed = localStorage.getItem("hasViewedFreeSummary") === "true";
      return hasViewed ? 0 : 1;
    }
    // Free account: 1 use total
    if (profile?.summaries_reset_at && new Date() > new Date(profile.summaries_reset_at)) {
      return 1; // will reset on next use
    }
    return Math.max(0, 1 - (profile?.summaries_used ?? 0));
  }

  function canSummarize(): boolean {
    if (isPaid) return true;
    if (!user) {
      const hasViewed = localStorage.getItem("hasViewedFreeSummary") === "true";
      if (hasViewed) {
        // Returning anon who already viewed their free summary — gate behind signup
        setAuthModalCopy("Your summary is ready. Create a free account to check your email before you send it.");
        setShowAuthModal(true);
        setAuthMode("signup");
        setAuthError("");
        return false;
      }
      return true;
    }
    // Free accounts can always summarize — paywall is at email checker
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
      if (profile?.summaries_reset_at && new Date() > new Date(profile.summaries_reset_at)) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        await supabase.from("profiles").update({
          summaries_used: 1,
          summaries_reset_at: nextMonth.toISOString(),
        }).eq("id", user.id);
      } else {
        await supabase.from("profiles").update({
          summaries_used: (profile?.summaries_used ?? 0) + 1,
        }).eq("id", user.id);
      }
      refreshProfile();
    } catch { /* ignore */ }
  }

  async function search() {
    // Collect all topics and universities (tags + current input)
    // Split by comma so "UCI, UCLA, Caltech" works even without tagging each one
    const allTopics = [...queryTags, ...query.split(",").map(s => s.trim()).filter(Boolean)];
    const allUnis = [...uniTags, ...university.split(",").map(s => s.trim()).filter(Boolean)];
    if (allTopics.length === 0) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSummaries({});
    setResolvedTopic("");
    setResolvedInstitution("");
    setShowSaved(false);
    // Log search (fire and forget)
    fetch("/api/log-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ research_interest: allTopics.join(", "), university: allUnis.join(", "), is_authenticated: !!user }) }).catch(() => {});
    try {
      const resolveRes = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: allTopics, universities: allUnis }),
      });
      const resolved = await resolveRes.json();
      if (!resolveRes.ok) { setError(resolved.error || "Failed to resolve search terms."); setLoading(false); return; }
      const { topicIds, topicNames, institutionIds, institutionNames } = resolved;
      setResolvedTopic(topicNames.join(", ") || allTopics.join(", "));
      if (institutionNames.length > 0) setResolvedInstitution(institutionNames.join(", "));
      // If universities were typed but none resolved, note it in the institution display
      if (allUnis.length > 0 && institutionIds.length === 0) {
        setResolvedInstitution(`"${allUnis.join(", ")}" not found — searching all universities`);
      }

      let authors: Author[] = [];

      if (topicIds.length === 0) {
        // Text search fallback — use first topic
        const instFilter = institutionIds.length > 0 ? `&filter=authorships.institutions.id:${institutionIds[0]}` : "";
        const worksRes = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(allTopics[0])}${instFilter}&sort=publication_date:desc&per_page=20&select=authorships`);
        const worksData = await worksRes.json();
        const works = worksData.results ?? [];
        const authorMap = new Map<string, Author>();
        for (const work of works) {
          for (const authorship of (work.authorships ?? [])) {
            const authorId = authorship.author?.id;
            if (!authorId || authorMap.has(authorId)) continue;
            if (institutionIds.length > 0 && !institutionIds.some((id: string) => authorship.institutions?.[0]?.id === `https://openalex.org/${id}`)) continue;
            const authorRes = await fetch(`https://api.openalex.org/authors/${authorId.split("/").pop()}?select=id,display_name,last_known_institutions,works_count,cited_by_count,topics,geo`);
            if (authorRes.ok) {
              const authorData = await authorRes.json();
              if (institutionIds.length > 0 && !institutionIds.some((id: string) => authorData.last_known_institutions?.[0]?.id === `https://openalex.org/${id}`)) continue;
              authorMap.set(authorId, authorData);
            }
            if (authorMap.size >= 10) break;
          }
          if (authorMap.size >= 10) break;
        }
        authors = Array.from(authorMap.values()).sort((a, b) => b.cited_by_count - a.cited_by_count);
      } else {
        // OR filter across all resolved topic IDs (now up to 4 per query = broad synonym coverage)
        const topicFilter = topicIds.join("|");
        const fullInstIds = institutionIds.map((id: string) => `https://openalex.org/${id}`);

        if (institutionIds.length > 0) {
          // Search WITH institution filter first
          const instFilter = `last_known_institutions.id:${institutionIds.join("|")}`;
          const res = await fetch(`https://api.openalex.org/authors?filter=topics.id:${topicFilter},${instFilter}&per_page=50&sort=cited_by_count:desc`);
          const data = await res.json();
          authors = (data.results || []).filter((a: Author) => fullInstIds.includes(a.last_known_institutions?.[0]?.id));

          // If still no results, try a text-based works search at that institution
          if (authors.length === 0) {
            const worksRes = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(allTopics[0])}&filter=authorships.institutions.id:${institutionIds.join("|")}&sort=cited_by_count:desc&per_page=50&select=authorships`);
            const worksData = await worksRes.json();
            const authorMap = new Map<string, Author>();
            for (const work of (worksData.results ?? [])) {
              for (const authorship of (work.authorships ?? [])) {
                const authorId = authorship.author?.id;
                if (!authorId || authorMap.has(authorId)) continue;
                if (!authorship.institutions?.some((inst: any) => fullInstIds.includes(inst.id))) continue;
                const authorRes = await fetch(`https://api.openalex.org/authors/${authorId.split("/").pop()}?select=id,display_name,last_known_institutions,works_count,cited_by_count,topics,geo`);
                if (authorRes.ok) {
                  const authorData = await authorRes.json();
                  if (fullInstIds.includes(authorData.last_known_institutions?.[0]?.id)) {
                    authorMap.set(authorId, authorData);
                  }
                }
                if (authorMap.size >= 15) break;
              }
              if (authorMap.size >= 15) break;
            }
            authors = Array.from(authorMap.values()).sort((a, b) => b.cited_by_count - a.cited_by_count);
          }

          // If still nothing, fall back to global results with a note
          if (authors.length === 0) {
            const globalRes = await fetch(`https://api.openalex.org/authors?filter=topics.id:${topicFilter}&per_page=20&sort=cited_by_count:desc`);
            const globalData = await globalRes.json();
            authors = globalData.results || [];
            if (authors.length > 0) {
              setResolvedInstitution(`No professors found at ${institutionNames.join(", ")} for this topic — showing top professors at other universities`);
            }
          }
        } else {
          // No institution filter — global search
          const res = await fetch(`https://api.openalex.org/authors?filter=topics.id:${topicFilter}&per_page=50&sort=cited_by_count:desc`);
          const data = await res.json();
          authors = data.results || [];
        }
      }
      // Specificity filter: keep professors where the searched topic appears in their top topics.
      // Be more lenient when searching a specific university (smaller faculty pool).
      // With multiple topic IDs (synonyms), this is already much broader than before.
      if (topicIds.length > 0 && authors.length > 0) {
        const filterByTopN = (n: number) =>
          authors.filter((a) => {
            const topIds = (a.topics ?? []).slice(0, n).map((t: any) => t.id?.split("/").pop());
            return topicIds.some((id: string) => topIds.includes(id));
          });
        // When searching a university, use a wider window since faculty at smaller
        // schools may have the topic further down their list
        const topNStrict = institutionIds.length > 0 ? 5 : 3;
        const topNMedium = institutionIds.length > 0 ? 10 : 5;
        const minStrict = institutionIds.length > 0 ? 2 : 3;
        const strict = filterByTopN(topNStrict);
        if (strict.length >= minStrict) {
          authors = strict;
        } else {
          const medium = filterByTopN(topNMedium);
          if (medium.length >= 1) {
            authors = medium;
          }
          // else keep all — topic too niche to enforce
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
            .filter((a) => (scoreMap.get(a.id) ?? 0) >= 1)
            .sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
        } catch {
          // Fallback: simple filter if scoring fails
          authors = authors.filter((a) => a.works_count >= 10);
        }
      }
      if (authors.length === 0) setError(`No professors found for "${topicNames.join(", ") || allTopics.join(", ")}"${institutionNames.length > 0 ? ` at ${institutionNames.join(", ")}` : ""}. Try a more specific topic like "machine learning" or "quantum computing".`);
      setResults(authors);
      // Fetch responsiveness and funding badges in background
      if (authors.length > 0) { fetchResponsiveness(authors); fetchFundingStatus(authors); }
      // Fetch nearby professors — only when searching a single institution
      if (authors.length > 0 && institutionIds.length === 1 && institutionNames.length === 1) {
        setNearbyProfs([]);
        setNearbyLoading(true);
        const resolveTopicId = topicIds[0] ?? await fetch(`https://api.openalex.org/topics?search=${encodeURIComponent(allTopics[0])}&per_page=1`)
          .then(r => r.json()).then(d => d.results?.[0]?.id?.split("/").pop() ?? null).catch(() => null);
        if (resolveTopicId) {
          fetchNearby(resolveTopicId, institutionNames[0], authors.map(a => a.id));
        } else {
          setNearbyLoading(false);
          setNearbyProfs([]);
        }
      } else {
        setNearbyProfs([]);
      }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function fetchNearby(topicId: string, institutionName: string, excludeIds: string[]) {
    try {
      const res = await fetch("/api/nearby-authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionName, topicId, excludeIds }),
      });
      const data = await res.json();
      setNearbyProfs(data.authors ?? []);
    } catch { /* ignore nearby failures */ }
    finally { setNearbyLoading(false); }
  }

  // Fetch funding status for a batch of professors from our cached DB
  async function fetchFundingStatus(authors: Author[]) {
    try {
      const professors = authors.map((a) => ({
        id: a.id.split("/").pop()!,
        name: a.display_name,
        institution: a.last_known_institutions?.[0]?.display_name ?? "",
      }));
      const res = await fetch("/api/funding-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professors }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setFundingStatus((prev) => ({ ...prev, ...(data.statuses ?? {}) }));
    } catch { /* silent — funding badge just won't appear */ }
  }

  async function fetchResponsiveness(authors: Author[]) {
    for (const author of authors) {
      const authorId = author.id.split("/").pop()!;
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const threeYearsAgo = currentYear - 3;
        const twoYearsAgo = currentYear - 2;

        const worksRes = await fetch(
          `https://api.openalex.org/works?filter=author.id:${authorId},publication_year:>${threeYearsAgo}&per_page=50&select=authorships,publication_year`
        );
        const worksData = await worksRes.json();
        const works = worksData.results ?? [];

        if (works.length === 0) {
          setResponsiveness(prev => ({ ...prev, [authorId]: { level: "red", label: "Inactive lab", tooltip: "No papers found in the last 3 years — this lab may be inactive or retired" } }));
          continue;
        }

        // Check if published in last 12 months
        const recentWorks = works.filter((w: any) => w.publication_year >= currentYear - 1);
        const publishedRecently = recentWorks.length > 0;

        // Check for no publications in last 2 years
        const last2YearWorks = works.filter((w: any) => w.publication_year >= twoYearsAgo);
        if (last2YearWorks.length === 0) {
          const lastYear = Math.max(...works.map((w: any) => w.publication_year as number));
          const yearsAgo = currentYear - lastYear;
          setResponsiveness(prev => ({ ...prev, [authorId]: { level: "red", label: "Inactive lab", tooltip: `Last published in ${lastYear} (${yearsAgo} year${yearsAgo !== 1 ? "s" : ""} ago) — lab appears to be winding down` } }));
          continue;
        }

        // Count unique co-authors and identify likely students (low publication count at same institution)
        const coAuthorIds = new Set<string>();
        const newStudentCoAuthors = new Set<string>();
        const profInstId = author.last_known_institutions?.[0]?.id;

        for (const w of works) {
          for (const a of (w.authorships ?? [])) {
            const coId = a.author?.id;
            if (!coId || coId === `https://openalex.org/${authorId}`) continue;
            coAuthorIds.add(coId);

            // Check if co-author is at same institution and likely a student
            const coInst = a.institutions?.[0]?.id;
            if (profInstId && coInst === profInstId) {
              // We'll check works_count via a simple heuristic: new co-authors appearing in recent papers
              newStudentCoAuthors.add(coId);
            }
          }
        }

        // Estimate student co-authors: sample up to 5 unique co-authors from same institution
        let studentCount = 0;
        const samplesToCheck = Array.from(newStudentCoAuthors).slice(0, 5);
        await Promise.all(samplesToCheck.map(async (coId) => {
          try {
            const cId = coId.split("/").pop();
            const r = await fetch(`https://api.openalex.org/authors/${cId}?select=works_count`, { signal: AbortSignal.timeout(3000) });
            const d = await r.json();
            if (d.works_count < 5) studentCount++;
          } catch { /* skip */ }
        }));

        let level: "green" | "yellow" | "red";
        let label: string;
        let tooltip: string;

        if (studentCount >= 2 && publishedRecently) {
          level = "green";
          label = "Likely takes students";
          tooltip = `Published ${recentWorks.length} paper${recentWorks.length !== 1 ? "s" : ""} in the last year with ${studentCount} likely student co-author${studentCount !== 1 ? "s" : ""} at their institution`;
        } else if (studentCount === 1 && publishedRecently) {
          // Close to threshold — probably still recruiting
          level = "green";
          label = "Probably takes students";
          tooltip = `Published recently but only 1 apparent student co-author found — likely still has capacity, worth reaching out`;
        } else if (!publishedRecently) {
          level = "yellow";
          label = "May not take students";
          const lastYear = Math.max(...works.map((w: any) => w.publication_year as number));
          const yearsAgo = currentYear - lastYear;
          tooltip = yearsAgo >= 2
            ? `Last published ${yearsAgo} years ago — lab may not be actively recruiting`
            : `Hasn't published in the last year — may not be actively recruiting right now`;
        } else {
          level = "yellow";
          label = "May not take students";
          tooltip = `No apparent student co-authors found in recent papers — lab may not have open positions`;
        }

        setResponsiveness(prev => ({ ...prev, [authorId]: { level, label, tooltip } }));
      } catch {
        // Skip on error — don't show badge
      }
    }
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
    fetch("/api/log-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ research_interest: profName, university: null, is_authenticated: !!user }) }).catch(() => {});
    try {
      const res = await fetch(`https://api.openalex.org/authors?search=${encodeURIComponent(profName.trim())}&per_page=10&sort=cited_by_count:desc`);
      const data = await res.json();
      const authors: Author[] = data.results || [];
      if (authors.length === 0) setError(`No professors found matching "${profName}".`);
      // searches are now unlimited
      setResults(authors);
      if (authors.length > 0) { fetchResponsiveness(authors); fetchFundingStatus(authors); }
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
    // Quick client-side UX check (server is the real gate)
    if (!canSummarize()) return;
    if (retry) setSummaries((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setLoadingSummary((prev) => ({ ...prev, [id]: true }));
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/summarize", { method: "POST", headers, body: JSON.stringify({ authorId: id }) });
      if (res.status === 403) {
        setShowUpgradeModal(true);
        return;
      }
      const data = await res.json();
      const summaryText = data.summary || data.error || "Summary unavailable. Try again or visit their faculty page.";
      const highlights = data.highlights || [];
      setSummaries((prev) => ({ ...prev, [id]: { summary: summaryText, highlights, questions: data.questions || [] } }));
      // Mark that anon has viewed their free summary
      if (!user) localStorage.setItem("hasViewedFreeSummary", "true");
      // Refresh profile so client UI reflects updated count
      if (highlights.length > 0 && !data.error) refreshProfile();
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
    // Email checker is a paid feature — free users see upgrade modal
    if (!isPaid) {
      setUpgradeModalTitle("Unlock Email Checker");
      setUpgradeModalSubtitle("Get instant feedback on your cold email — red flags, AI-sounding language, and exactly what to fix.");
      setShowUpgradeModal(true);
      return;
    }
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
          colors: ["#2d5a3d", "#8aaa96", "#9dbfaa", "#2d5a3d", "#f4f0ea"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#2d5a3d", "#8aaa96", "#9dbfaa"],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#2d5a3d", "#8aaa96", "#9dbfaa"],
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

  async function lookupEmail(author: Author) {
    const id = author.id.split("/").pop()!;
    if (emailLookup[id] || emailLookupLoading[id]) return;
    setEmailLookupLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: id,
          authorName: author.display_name,
          institution: author.last_known_institutions?.[0]?.display_name || "",
        }),
      });
      const data = await res.json();
      setEmailLookup(prev => ({ ...prev, [id]: data }));
    } catch {
      setEmailLookup(prev => ({ ...prev, [id]: { emails: [], searchUrls: { google: "", scholar: "", directory: null }, homepageUrl: null, orcidUrl: null } }));
    } finally {
      setEmailLookupLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  const filteredSuggestions = (query.trim()
    ? RESEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : RESEARCH_SUGGESTIONS
  ).slice().sort((a, b) => a.localeCompare(b));

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

  // ── Hero transition ──────────────────────────────────────────────────────
  const [heroExiting, setHeroExiting] = useState(false);

  // SVG melt filter refs
  const meltTurbulenceRef = useRef<SVGFETurbulenceElement | null>(null);
  const meltDisplacementRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const meltRafRef = useRef<number | null>(null);

  // Animate the SVG displacement filter while hero is exiting
  useEffect(() => {
    if (heroExiting) {
      const startTime = performance.now();
      const duration = 460;
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        // Accelerate: starts slow, ends fast
        const eased = t * t * (3 - 2 * t);
        const scale = eased * 130;
        const freq = 0.015 + eased * 0.055;
        if (meltTurbulenceRef.current) {
          meltTurbulenceRef.current.setAttribute("baseFrequency", `${freq.toFixed(4)} ${(freq * 1.8).toFixed(4)}`);
        }
        if (meltDisplacementRef.current) {
          meltDisplacementRef.current.setAttribute("scale", `${scale.toFixed(1)}`);
        }
        if (t < 1) {
          meltRafRef.current = requestAnimationFrame(animate);
        }
      };
      meltRafRef.current = requestAnimationFrame(animate);
    } else {
      if (meltRafRef.current) {
        cancelAnimationFrame(meltRafRef.current);
        meltRafRef.current = null;
      }
      if (meltTurbulenceRef.current) {
        meltTurbulenceRef.current.setAttribute("baseFrequency", "0.015 0.027");
      }
      if (meltDisplacementRef.current) {
        meltDisplacementRef.current.setAttribute("scale", "0");
      }
    }
    return () => {
      if (meltRafRef.current) cancelAnimationFrame(meltRafRef.current);
    };
  }, [heroExiting]);

  const triggerSearch = () => {
    if (results.length === 0 && !loading && !heroExiting) {
      setHeroExiting(true);
      setTimeout(() => { setHeroExiting(false); search(); }, 480);
    } else {
      search();
    }
  };

  const triggerSearchByName = () => {
    if (results.length === 0 && !loading && !heroExiting) {
      setHeroExiting(true);
      setTimeout(() => { setHeroExiting(false); searchByName(); }, 480);
    } else {
      searchByName();
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Grand reveal / welcome back */}
      {showWelcome && (
        <div className={`grand-reveal ${revealPhase === "content" ? "grand-reveal-lifting" : ""}`}>
          <div className="grand-reveal-inner">
            <div className="grand-reveal-logo">
              <span className="grand-reveal-icon">&#127807;</span>
              <h2 className="grand-reveal-title">Research Match</h2>
            </div>
            <div className="grand-reveal-line" />
            <p className="grand-reveal-subtitle">
              {parseInt(localStorage.getItem("research-match-visits") || "1", 10) <= 1
                ? "Your research journey starts here."
                : "Welcome back. Let\u2019s keep going."}
            </p>
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

      {/* ====== SVG FILTER DEFS (melt effect) ====== */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <defs>
          <filter id="meltFilter" x="-40%" y="-40%" width="180%" height="220%">
            <feTurbulence
              ref={meltTurbulenceRef}
              type="turbulence"
              baseFrequency="0.015 0.027"
              numOctaves="3"
              seed="5"
              result="noise"
            />
            <feDisplacementMap
              ref={meltDisplacementRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ====== FLOATING PILL NAV ====== */}
      <nav className="rm-floating-nav">
        <div className="rm-nav-pill" ref={menuRef}>

          {/* Hamburger */}
          <button
            className={`rm-hamburger${showMenu ? " rm-hamburger-open" : ""}`}
            onClick={() => setShowMenu(v => !v)}
            aria-label="Menu"
          >
            <span className="rm-hamburger-line" />
            <span className="rm-hamburger-line" />
            <span className="rm-hamburger-line" />
          </button>

          <Link href="/" className="rm-nav-logo">
            <svg width="180" height="32" viewBox="0 0 280 50" xmlns="http://www.w3.org/2000/svg" aria-label="Research Match">
              <circle cx="22" cy="22" r="15" fill="none" stroke="#2d5a3d" strokeWidth="4"/>
              <path d="M33 33 L43 43" fill="none" stroke="#2d5a3d" strokeWidth="4.5" strokeLinecap="round"/>
              <line x1="16" y1="16" x2="28" y2="16" stroke="#C4A265" strokeWidth="3" strokeLinecap="round"/>
              <line x1="16" y1="22" x2="28" y2="22" stroke="#C4A265" strokeWidth="3" strokeLinecap="round"/>
              <line x1="16" y1="28" x2="28" y2="28" stroke="#C4A265" strokeWidth="3" strokeLinecap="round"/>
              <text x="52" y="30" fontFamily="Georgia, 'Times New Roman', serif" fontSize="22" fontWeight="700" fill="#2d5a3d">Research Match</text>
            </svg>
          </Link>
          <div className="rm-nav-spacer" />

          {saved.length > 0 && (
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`rm-nav-saved${showSaved ? " rm-nav-saved-active" : ""}`}
            >
              Saved ({saved.length})
            </button>
          )}

          {!user ? (
            <>
              <button onClick={() => { setShowAuthModal(true); setAuthMode("login"); setAuthError(""); }} className="rm-nav-btn">
                Log in
              </button>
              <button onClick={() => { setShowAuthModal(true); setAuthMode("signup"); setAuthError(""); }} className="btn-cta rm-nav-cta">
                Sign up
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {isFree && (
                <button onClick={() => setShowUpgradeModal(true)} style={{ fontSize: "0.78rem", fontWeight: 700, color: "#A8893E", background: "rgba(196, 162, 101, 0.12)", padding: "7px 14px", borderRadius: "999px", border: "1px solid rgba(196, 162, 101, 0.25)", cursor: "pointer", transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)", fontFamily: "var(--font-playfair), Georgia, serif", whiteSpace: "nowrap" }}>
                  Upgrade
                </button>
              )}
              {isPaid && profile?.plan_type === "lifetime" && (
                <span className="rm-nav-badge" style={{ color: "#fff", background: "linear-gradient(135deg, #2d5a3d, #2E9E72)" }}>Lifetime</span>
              )}
              {isPaid && profile?.plan_type !== "lifetime" && (
                <span className="rm-nav-badge" style={{ color: "#fff", background: "#2d5a3d" }}>Semester</span>
              )}
              <Link href="/profile" style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #2d5a3d, #2E9E72)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.82rem", fontWeight: 700,
                textDecoration: "none", transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
                boxShadow: "0 2px 8px rgba(45, 90, 61, 0.25)",
                border: "2px solid rgba(255,255,255,0.45)",
                flexShrink: 0,
              }} className="profile-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </Link>
            </div>
          )}

          {/* Dropdown menu */}
          <div className={`rm-nav-dropdown${showMenu ? " rm-nav-dropdown-open" : ""}`}>
            <div className="rm-nav-dropdown-inner">
              <Link href="/how-it-works" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                <span className="rm-nav-dropdown-icon">◎</span>
                How It Works
              </Link>
              <button
                type="button"
                className="rm-nav-dropdown-item"
                onClick={() => setShowEmailPlaybookMenu((v) => !v)}
              >
                <span className="rm-nav-dropdown-icon">✉</span>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span>Email Playbook</span>
                  <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{showEmailPlaybookMenu ? "▾" : "▸"}</span>
                </span>
              </button>

              {showEmailPlaybookMenu && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "4px 0 6px 34px" }}>
                  <Link href="/examples" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                    <span className="rm-nav-dropdown-icon">✦</span>
                    Emails That Worked
                  </Link>
                  <Link href="/framework" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                    <span className="rm-nav-dropdown-icon">◇</span>
                    Email Framework
                  </Link>
                  <Link href="/follow-up" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                    <span className="rm-nav-dropdown-icon">↩</span>
                    Follow-Up Tool
                  </Link>
                </div>
              )}
              <Link href="/feedback" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                <span className="rm-nav-dropdown-icon">↗</span>
                Feedback
              </Link>
              <Link href="/blog" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                <span className="rm-nav-dropdown-icon">✒</span>
                Blog
              </Link>
              <Link href="/?#pricing" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                <span className="rm-nav-dropdown-icon">◈</span>
                Pricing
              </Link>
              <Link href="/contact" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                <span className="rm-nav-dropdown-icon">◇</span>
                Contact
              </Link>
              <Link href="/profile" className="rm-nav-dropdown-item" onClick={() => setShowMenu(false)}>
                <span className="rm-nav-dropdown-icon">⚙</span>
                Account Settings
              </Link>
              {user && (
                <>
                  <div className="rm-nav-dropdown-divider" />
                  <button
                    className="rm-nav-dropdown-item rm-nav-dropdown-logout"
                    onClick={() => { signOut(); setShowMenu(false); }}
                  >
                    <span className="rm-nav-dropdown-icon">↩</span>
                    Log Out
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </nav>

      <main className={`rm-page rm-app-body ${revealPhase === "done" ? "rm-page-revealed" : revealPhase === "content" ? "rm-page-revealing" : "rm-page-hidden"}`}>

        {/* ====== HERO (empty / initial state) ====== */}
        {(!showSaved && results.length === 0 && !loading) || heroExiting ? (
          <div className={`rm-hero${heroExiting ? " rm-hero-exit" : ""}`}>
            <h1
              className="rm-hero-title"
              style={heroExiting ? { filter: "url(#meltFilter)" } : {}}
            >
              Find your research<br />professor.
            </h1>
            {/* Mode toggle */}
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
              <button ref={btnInterestRef} onClick={() => setSearchMode("interest")} className={`mode-toggle-btn ${searchMode === "interest" ? "mode-toggle-btn-active" : ""}`}>By Interest</button>
              <button ref={btnNameRef} onClick={() => setSearchMode("name")} className={`mode-toggle-btn ${searchMode === "name" ? "mode-toggle-btn-active" : ""}`}>By Name</button>
            </div>

            {/* Hero search */}
            {searchMode === "interest" ? (
              <div className="glass-search rm-search rm-hero-search">
                <div className="rm-search-input-wrap" ref={suggestionsRef} style={{ position: "relative" }}>
                  <label className="rm-search-label">Research Interest</label>
                  <div className="rm-tag-input-row">
                    {queryTags.map((tag, i) => (
                      <span key={i} className="rm-tag-chip">{tag}<button onClick={() => removeQueryTag(i)} className="rm-tag-chip-x">×</button></span>
                    ))}
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { setShowSuggestions(false); if (query.trim()) addQueryTag(); else triggerSearch(); }
                        else if (e.key === ",") { e.preventDefault(); addQueryTag(); }
                        else if (e.key === "Backspace" && !query && queryTags.length > 0) removeQueryTag(queryTags.length - 1);
                      }}
                      placeholder={queryTags.length === 0 ? PLACEHOLDER_EXAMPLES[placeholderIdx] : "Add another..."}
                      className="rm-search-input rm-tag-input"
                    />
                  </div>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {filteredSuggestions.map((s, i) => (
                        <button key={i} className="suggestion-item" onClick={() => { setQuery(s); setShowSuggestions(false); }}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rm-search-divider" />
                <div className="rm-uni-field">
                  <label className="rm-search-label">University</label>
                  <div className="rm-tag-input-row">
                    {uniTags.map((tag, i) => (
                      <span key={i} className="rm-tag-chip">{tag}<button onClick={() => removeUniTag(i)} className="rm-tag-chip-x">×</button></span>
                    ))}
                    <input value={university} onChange={(e) => setUniversity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { if (university.trim()) addUniTag(); else triggerSearch(); }
                        else if (e.key === ",") { e.preventDefault(); addUniTag(); }
                        else if (e.key === "Backspace" && !university && uniTags.length > 0) removeUniTag(uniTags.length - 1);
                      }}
                      placeholder={uniTags.length === 0 ? "e.g. MIT, Stanford..." : "Add another..."}
                      className="rm-search-input rm-tag-input" />
                  </div>
                </div>
                <button data-search-btn onClick={triggerSearch} className="btn-cta rm-search-btn">Search</button>
              </div>
            ) : (
              <div className="glass-search rm-search rm-hero-search">
                <div className="rm-search-input-wrap" style={{ flex: 1 }}>
                  <label className="rm-search-label">Professor Name</label>
                  <input value={profName} onChange={(e) => setProfName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && triggerSearchByName()} placeholder="e.g. Geoffrey Hinton, Fei-Fei Li..." className="rm-search-input" />
                </div>
                <button onClick={triggerSearchByName} className="btn-cta rm-search-btn">Search</button>
              </div>
            )}

            {error && <p style={{ textAlign: "center", fontSize: "1rem", color: "#c45c5c", marginTop: "20px" }}>{error}</p>}
          </div>

        ) : (
          /* ====== COMPACT SEARCH + RESULTS ====== */
          <>
            <div className="rm-compact-header">
              {!showSaved && (
                <>
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
                    <button ref={btnInterestRef} onClick={() => setSearchMode("interest")} className={`mode-toggle-btn ${searchMode === "interest" ? "mode-toggle-btn-active" : ""}`}>By Interest</button>
                    <button ref={btnNameRef} onClick={() => setSearchMode("name")} className={`mode-toggle-btn ${searchMode === "name" ? "mode-toggle-btn-active" : ""}`}>By Name</button>
                  </div>
                  {searchMode === "interest" ? (
                    <div className="glass-search rm-search">
                      <svg width="24" height="24" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginLeft: "4px", opacity: 0.85 }} aria-hidden="true">
                        <circle cx="80" cy="80" r="52" fill="none" stroke="#2d5a3d" strokeWidth="7"/>
                        <path d="M118 118 L155 155" fill="none" stroke="#2d5a3d" strokeWidth="8" strokeLinecap="round"/>
                        <line x1="64" y1="64" x2="96" y2="64" stroke="#C4A265" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="64" y1="80" x2="96" y2="80" stroke="#C4A265" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="64" y1="96" x2="96" y2="96" stroke="#C4A265" strokeWidth="5" strokeLinecap="round"/>
                      </svg>
                      <div className="rm-search-input-wrap" ref={suggestionsRef} style={{ position: "relative" }}>
                        <label className="rm-search-label">Research Interest</label>
                        <div className="rm-tag-input-row">
                          {queryTags.map((tag, i) => (
                            <span key={i} className="rm-tag-chip">{tag}<button onClick={() => removeQueryTag(i)} className="rm-tag-chip-x">×</button></span>
                          ))}
                          <input
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { setShowSuggestions(false); if (query.trim()) addQueryTag(); else search(); }
                              else if (e.key === ",") { e.preventDefault(); addQueryTag(); }
                              else if (e.key === "Backspace" && !query && queryTags.length > 0) removeQueryTag(queryTags.length - 1);
                            }}
                            placeholder={queryTags.length === 0 ? PLACEHOLDER_EXAMPLES[placeholderIdx] : "Add another..."}
                            className="rm-search-input rm-tag-input"
                          />
                        </div>
                        {showSuggestions && filteredSuggestions.length > 0 && (
                          <div className="suggestions-dropdown">
                            {filteredSuggestions.map((s, i) => (
                              <button key={i} className="suggestion-item" onClick={() => { setQuery(s); setShowSuggestions(false); }}>{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="rm-search-divider" />
                      <div className="rm-uni-field">
                        <label className="rm-search-label">University</label>
                        <div className="rm-tag-input-row">
                          {uniTags.map((tag, i) => (
                            <span key={i} className="rm-tag-chip">{tag}<button onClick={() => removeUniTag(i)} className="rm-tag-chip-x">×</button></span>
                          ))}
                          <input value={university} onChange={(e) => setUniversity(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { if (university.trim()) addUniTag(); else search(); }
                              else if (e.key === ",") { e.preventDefault(); addUniTag(); }
                              else if (e.key === "Backspace" && !university && uniTags.length > 0) removeUniTag(uniTags.length - 1);
                            }}
                            placeholder={uniTags.length === 0 ? "e.g. MIT, Stanford..." : "Add another..."}
                            className="rm-search-input rm-tag-input" />
                        </div>
                      </div>
                      <button data-search-btn onClick={search} className="btn-cta rm-search-btn">Search</button>
                    </div>
                  ) : (
                    <div className="glass-search rm-search">
                      <svg width="24" height="24" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginLeft: "4px", opacity: 0.85 }} aria-hidden="true">
                        <circle cx="80" cy="80" r="52" fill="none" stroke="#2d5a3d" strokeWidth="7"/>
                        <path d="M118 118 L155 155" fill="none" stroke="#2d5a3d" strokeWidth="8" strokeLinecap="round"/>
                        <line x1="64" y1="64" x2="96" y2="64" stroke="#C4A265" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="64" y1="80" x2="96" y2="80" stroke="#C4A265" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="64" y1="96" x2="96" y2="96" stroke="#C4A265" strokeWidth="5" strokeLinecap="round"/>
                      </svg>
                      <div className="rm-search-input-wrap" style={{ flex: 1 }}>
                        <label className="rm-search-label">Professor Name</label>
                        <input value={profName} onChange={(e) => setProfName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchByName()} placeholder="e.g. Geoffrey Hinton, Fei-Fei Li..." className="rm-search-input" />
                      </div>
                      <button onClick={searchByName} className="btn-cta rm-search-btn">Search</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* STATUS */}
            {loading && (
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <span className="loading-spinner">&#127807;</span>
                <p style={{ fontSize: "1.1rem", color: "#6b7280", marginTop: "12px" }}>Searching...</p>
              </div>
            )}
            {error && <p style={{ textAlign: "center", fontSize: "1.1rem", color: "#c45c5c", marginBottom: "32px" }}>{error}</p>}

            {!showSaved && results.length > 0 && (
              <p style={{ fontSize: "1rem", color: "#6b7280", marginBottom: "32px" }}>
                Showing results for <span style={{ color: "#2d5a3d", fontWeight: 700 }}>{resolvedTopic}</span>
                {resolvedInstitution && <> at <span style={{ color: "#2d5a3d", fontWeight: 700 }}>{resolvedInstitution}</span></>}
              </p>
            )}
            {showSaved && <p style={{ fontSize: "1rem", color: "#6b7280", marginBottom: "32px" }}>Your saved professors ({saved.length})</p>}


        {/* CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {displayList.map((author, authorIndex) => {
            const id = author.id.split("/").pop()!;
            const summary = summaries[id];
            const isLoadingSummary = loadingSummary[id];
            const resp = responsiveness[id];
            const summaryLocked = !isPaid && summary && getSummariesRemaining() <= 0 && !summaries[id];

            // Non-paid users: professor 4+ gets restricted
            // Anon users: completely hidden (show exactly 3, no friction)
            // Free account: locked stub with upgrade prompt
            const isLockedStub = !isPaid && !showSaved && authorIndex >= 3;
            if (isLockedStub) {
              return (
                <div key={author.id} className="glass-card card-enter rm-card" style={{ position: "relative", overflow: "hidden" }}>
                  {/* Blurred content behind */}
                  <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none", opacity: 0.5 }}>
                    <div className="rm-card-top">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="rm-card-name" style={{ cursor: "default" }}>{author.display_name}</span>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "6px" }}>
                          {formatInstitutionLocation(author.last_known_institutions?.[0]) || "Unknown institution"}
                        </p>
                      </div>
                      <div className="rm-card-stats">
                        <div className="rm-stat-pill">
                          <span className="rm-stat-num">{author.works_count.toLocaleString()}</span>
                          <span className="rm-stat-label">papers</span>
                        </div>
                      </div>
                    </div>
                    {author.topics?.length > 0 && (
                      <>
                        <hr className="rm-card-divider" />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {author.topics.slice(0, 4).map((t: any, i: number) => <span key={i} className="tag">{t.display_name}</span>)}
                        </div>
                      </>
                    )}
                    <div style={{ marginTop: "28px", height: "60px", background: "rgba(45,90,61,0.06)", borderRadius: "12px" }} />
                  </div>
                  {/* Lock overlay */}
                  <div
                    onClick={() => setShowUpgradeModal(true)}
                    style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to bottom, rgba(245,240,230,0.55) 0%, rgba(245,240,230,0.97) 50%)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: "20px",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem", marginBottom: "12px" }}>🔒</span>
                    <span
                      style={{
                        background: "#2d5a3d", color: "#fff", fontSize: "0.8rem", fontWeight: 700,
                        padding: "8px 20px", borderRadius: "10px",
                      }}
                    >
                      Upgrade to unlock →
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={author.id} className="glass-card card-enter rm-card">
                <div className="rm-card-top">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <a href={profileUrl(author)} target="_blank" rel="noopener noreferrer" className="rm-card-name">
                        {author.display_name}
                      </a>
                      {/* Responsiveness Badge */}
                      {resp && (
                        (isPaid || !!summaries[id]) ? (
                          <span className="resp-badge" title={resp.tooltip} style={{
                            fontSize: "0.7rem", fontWeight: 700, padding: "4px 12px", borderRadius: "999px",
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            background: resp.level === "green" ? "rgba(45, 90, 61,0.1)" : resp.level === "yellow" ? "rgba(196, 162, 101,0.12)" : "rgba(196, 92, 92,0.08)",
                            color: resp.level === "green" ? "#2d5a3d" : resp.level === "yellow" ? "#A8893E" : "#c45c5c",
                            border: `1px solid ${resp.level === "green" ? "rgba(45, 90, 61,0.2)" : resp.level === "yellow" ? "rgba(196, 162, 101,0.25)" : "rgba(196, 92, 92,0.15)"}`,
                            transition: "all 0.3s ease",
                          }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: resp.level === "green" ? "#2d5a3d" : resp.level === "yellow" ? "#C4A265" : "#c45c5c" }} />
                            {resp.label}
                          </span>
                        ) : (
                          <span className="locked-badge-wrap" style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                            <span style={{
                              fontSize: "0.7rem", fontWeight: 700, padding: "4px 12px", borderRadius: "999px",
                              background: "rgba(149,173,157,0.08)", color: "transparent", border: "1px solid rgba(45, 90, 61,0.2)",
                              filter: "blur(4px)", userSelect: "none",
                            }}>
                              Likely takes students
                            </span>
                            <span style={{
                              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.65rem", fontWeight: 600, color: "#6b7280", background: "rgba(245,240,230,0.6)",
                              backdropFilter: "blur(2px)", border: "1px solid rgba(45, 90, 61,0.3)", borderRadius: "999px",
                              whiteSpace: "nowrap", padding: "4px 10px",
                            }}>
                              <span style={{ fontSize: "0.6rem", marginRight: "3px" }}>&#128274;</span> Summarize to unlock
                            </span>
                          </span>
                        )
                      )}
                      <button
                        onClick={() => toggleSave(author)}
                        className={starBounce === id ? "star-bounce" : ""}
                        style={{ fontSize: "1.4rem", color: isSaved(author) ? "#A8893E" : "#8aaa96", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s, transform 0.2s" }}
                        title={isSaved(author) ? "Remove from saved" : "Save professor"}
                      >
                        {isSaved(author) ? "\u2605" : "\u2606"}
                      </button>
                    </div>
                    <p style={{ fontSize: "1rem", color: "#6b7280", marginTop: "4px" }}>
                      {formatInstitutionLocation(author.last_known_institutions?.[0]) || "Unknown institution"}
                    </p>
                  </div>
                  {/* Stats + Funding Pulse — stacked right-aligned column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", flexShrink: 0 }}>
                    <div className="rm-card-stats">
                      <div className="rm-stat-pill">
                        <span className="rm-stat-num">{author.works_count.toLocaleString()}</span>
                        <span className="rm-stat-label">papers</span>
                      </div>
                      <div className="rm-stat-pill">
                        <span className="rm-stat-num">{author.cited_by_count.toLocaleString()}</span>
                        <span className="rm-stat-label">citations</span>
                      </div>
                    </div>

                    {/* Funding Pulse badge */}
                    {isFree ? (
                      <button
                        onClick={() => {
                          setUpgradeModalTitle("Unlock Funding Pulse");
                          setUpgradeModalSubtitle("See whether this professor has active NIH or NSF grants — updated automatically.");
                          setShowUpgradeModal(true);
                        }}
                        className="funding-badge funding-badge-locked"
                      >
                        <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                          <rect x="1" y="4.5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.1" />
                          <path d="M2.5 4.5V3C2.5 1.9 5.5 1.9 5.5 3V4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                        </svg>
                        <span>Funding Status</span>
                        <span className="funding-badge-upgrade">Upgrade</span>
                      </button>
                    ) : fundingStatus[id] ? (
                      <span className={`funding-badge ${fundingStatus[id] === "ACTIVE" ? "funding-badge-active" : fundingStatus[id] === "NOT_RECENT" ? "funding-badge-not-recent" : "funding-badge-unknown"}`}>
                        {fundingStatus[id] === "ACTIVE" && <span className="funding-dot-active" />}
                        {fundingStatus[id] === "ACTIVE" ? "Actively Funded" : fundingStatus[id] === "NOT_RECENT" ? "Not Recently Funded" : "Funding Unknown"}
                      </span>
                    ) : null}
                  </div>
                </div>

                {author.topics?.length > 0 && (
                  <>
                    <hr className="rm-card-divider" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {author.topics.slice(0, 4).map((t, i) => <span key={i} className="tag">{t.display_name}</span>)}
                    </div>
                  </>
                )}

                {/* Professor Email Finder — unlocked for paid or after summarizing */}
                {(isPaid || !!summaries[id]) ? (() => {
                  const lookup = emailLookup[id];
                  const isLookingUp = emailLookupLoading[id];
                  return (
                    <div style={{ marginTop: "16px" }}>
                      {!lookup && !isLookingUp && (
                        <button onClick={() => lookupEmail(author)} className="btn-secondary" style={{ padding: "10px 22px", fontSize: "0.85rem" }}>
                          Find professor email →
                        </button>
                      )}
                      {isLookingUp && (
                        <div style={{ padding: "14px 18px", background: "rgba(45, 90, 61,0.03)", borderRadius: "12px", border: "1px solid rgba(45, 90, 61,0.2)", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="loading-spinner" style={{ fontSize: "0.9rem" }}>&#127807;</span>
                          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Searching ORCID, OpenAlex, and faculty pages...</span>
                        </div>
                      )}
                      {lookup && (
                        <div style={{ padding: "14px 18px", background: "rgba(45, 90, 61,0.03)", borderRadius: "12px", border: "1px solid rgba(45, 90, 61,0.2)" }}>
                          {lookup.emails.length > 0 ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email results</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {lookup.emails.map((e, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <span style={{
                                      fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px", borderRadius: "4px",
                                      color: e.confidence === "verified" ? "#2d5a3d" : e.confidence === "likely" ? "#C4A265" : "#6b7280",
                                      background: e.confidence === "verified" ? "rgba(45, 90, 61,0.1)" : e.confidence === "likely" ? "rgba(196, 162, 101,0.1)" : "rgba(122,142,136,0.1)",
                                    }}>
                                      {e.confidence === "verified" ? "verified" : e.confidence === "likely" ? "likely" : "guess"} &middot; {e.source}
                                    </span>
                                    <span style={{ fontSize: "0.85rem", color: "#2d5a3d", fontWeight: e.confidence === "verified" ? 600 : 400, fontFamily: "monospace" }}>{e.email}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(e.email); showToast("Email copied!"); }} style={{ fontSize: "0.65rem", color: "#ffffff", background: "#2d5a3d", border: "none", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", transition: "all 0.2s" }}>
                                      Copy
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "8px" }}>No verified emails found in public databases.</p>
                          )}
                          {/* Search links */}
                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(45, 90, 61,0.2)" }}>
                            {lookup.searchUrls.google && (
                              <a href={lookup.searchUrls.google} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "#2d5a3d", textDecoration: "underline" }}>
                                Search Google →
                              </a>
                            )}
                            {lookup.searchUrls.directory && (
                              <a href={lookup.searchUrls.directory} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "#2d5a3d", textDecoration: "underline" }}>
                                University directory →
                              </a>
                            )}
                            {lookup.homepageUrl && (
                              <a href={lookup.homepageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "#2d5a3d", textDecoration: "underline" }}>
                                Faculty page →
                              </a>
                            )}
                            {lookup.orcidUrl && (
                              <a href={lookup.orcidUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "#2d5a3d", textDecoration: "underline" }}>
                                ORCID profile →
                              </a>
                            )}
                          </div>
                          <p style={{ fontSize: "0.65rem", color: "#8aaa96", fontStyle: "italic", marginTop: "8px" }}>
                            Sources: ORCID, OpenAlex, faculty pages. Pattern guesses marked accordingly.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="rm-locked-row" style={{ marginTop: "18px" }}>
                    <span style={{ fontSize: "0.9rem", opacity: 0.6 }}>&#128274;</span>
                    <span style={{ fontSize: "0.85rem", color: "#6b7280", flex: 1 }}>Professor email finder</span>
                    <span style={{ fontSize: "0.72rem", color: "#8aaa96", fontStyle: "italic", letterSpacing: "0.02em" }}>Summarize to unlock</span>
                  </div>
                )}

                {/* Summary section */}
                {summary ? (
                  <div className="summary-enter" style={{ marginTop: "28px" }}>
                    <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#6b7280" }}>{summary.summary}</p>
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
                            style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", cursor: "pointer", background: "rgba(45, 90, 61,0.15)", border: "1px solid #8aaa96", borderRadius: "999px", width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-playfair), Georgia, serif", transition: "all 0.2s ease" }}
                          >?</button>
                          <div style={{ display: "none", padding: "14px 18px", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(45, 90, 61,0.3)", borderRadius: "12px", fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.6, marginTop: "4px", marginBottom: "8px" }}>
                            In most lab sciences (biology, chemistry, medicine, etc.), <strong>1st author</strong> did the hands-on work and <strong>last author</strong> runs the lab. In many other fields (math, CS, economics, humanities), author order is often alphabetical and doesn&apos;t indicate contribution level. When in doubt, check if the professor lists the paper prominently on their own website — that usually means it&apos;s important to them.
                          </div>
                        </div>
                        {summary.highlights.map((h, i) => (
                          <div key={i} className="finding-border" style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                            <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6 }}>{h.detail}</p>
                            <p style={{ fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic", marginTop: "4px" }}>
                              {h.paper}
                              {h.authorPosition && h.authorPosition !== "unknown" && (
                                <span style={{ fontStyle: "normal", fontSize: "0.75rem", marginLeft: "8px", padding: "2px 8px", borderRadius: "999px", background: h.authorPosition === "first" ? "rgba(45, 90, 61,0.1)" : h.authorPosition === "last" ? "rgba(196, 154, 60,0.1)" : "rgba(149,173,157,0.1)", color: h.authorPosition === "first" ? "#2d5a3d" : h.authorPosition === "last" ? "#A8893E" : "#6b7280" }}>
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
                    {/* Suggested questions — free for logged-in users, gated for anon (Step 3) */}
                    {summary.questions.length > 0 && (
                      !user ? (
                        <div style={{ marginTop: "24px", padding: "20px", background: "rgba(45,90,61,0.04)", border: "1px solid rgba(45,90,61,0.12)", borderRadius: "14px", textAlign: "center" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Questions to Ask</p>
                          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "16px" }}>{summary.questions.length} personalized questions — unlocked after signup</p>
                          <button
                            onClick={() => { setAuthModalCopy("Your summary is ready. Create a free account to check your email before you send it."); setShowAuthModal(true); setAuthMode("signup"); setAuthError(""); }}
                            className="rm-summarize-btn"
                            style={{ width: "100%", justifyContent: "center" }}
                          >
                            Create free account →
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: "24px" }}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Questions to Ask</p>
                          {summary.questions.map((q, i) => (
                            <p key={i} style={{ fontSize: "1rem", color: "#6b7280", paddingLeft: "20px", borderLeft: "3px solid #9dbfaa", marginBottom: "12px", lineHeight: 1.6 }}>{q}</p>
                          ))}
                        </div>
                      )
                    )}
                    {/* Closing tip — only if highlights exist */}
                    {summary.highlights.length > 0 && (
                      <div style={{ marginTop: "24px", padding: "16px 20px", background: "rgba(45, 90, 61,0.15)", border: "1px solid rgba(45, 90, 61,0.3)", borderRadius: "14px" }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Closing Tip</p>
                        <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.6 }}>
                          End your email with: &ldquo;If you&apos;re not currently taking students, is there someone in your group you&apos;d recommend I reach out to?&rdquo;
                        </p>
                      </div>
                    )}
                    {/* Email checker — anon with summary triggers signup (Step 3); logged-in unlocks fully */}
                    {isPaid || (!!summaries[id] && !!user) ? (
                      <button onClick={() => openEmailDraft(author)} className="btn-secondary" style={{ marginTop: "16px", padding: "12px 28px", fontSize: "0.95rem" }}>
                        Draft email to professor &rarr;
                      </button>
                    ) : !user && !!summaries[id] ? (
                      <button
                        onClick={() => { setAuthModalCopy("Your summary is ready. Create a free account to check your email before you send it."); setShowAuthModal(true); setAuthMode("signup"); setAuthError(""); }}
                        className="btn-secondary"
                        style={{ marginTop: "16px", padding: "12px 28px", fontSize: "0.95rem" }}
                      >
                        Check email before you send &rarr;
                      </button>
                    ) : (
                      <div className="rm-locked-row" style={{ marginTop: "16px" }}>
                        <span style={{ fontSize: "0.9rem", opacity: 0.6 }}>&#128274;</span>
                        <span style={{ fontSize: "0.85rem", color: "#6b7280", flex: 1 }}>Email checker</span>
                        <span style={{ fontSize: "0.72rem", color: "#8aaa96", fontStyle: "italic", letterSpacing: "0.02em" }}>Summarize to unlock</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No summary loaded yet — show summarize button (free for all), or upgrade overlay */
                  !user ? (
                    /* Anon users: show real summarize button — full summary is the wow moment */
                    <div style={{ marginTop: "28px" }}>
                      <button onClick={() => loadSummary(author)} disabled={isLoadingSummary} className="rm-summarize-btn">
                        {isLoadingSummary ? (
                          <>
                            <span className="loading-spinner" style={{ fontSize: "1rem" }}>&#127807;</span>
                            Generating summary...
                          </>
                        ) : (
                          <>Summarize research <span style={{ fontSize: "1.1em", marginLeft: "2px" }}>→</span></>
                        )}
                      </button>
                    </div>
                  ) : getSummariesRemaining() <= 0 && !isPaid ? (
                    /* Free user, out of uses */
                    <div style={{ marginTop: "24px", position: "relative", borderRadius: "14px", overflow: "visible" }}>
                      <div style={{ padding: "80px 24px", filter: "blur(6px)", userSelect: "none", pointerEvents: "none", borderRadius: "14px", overflow: "hidden" }}>
                        <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#6b7280" }}>
                          This professor studies the intersection of computational methods and experimental techniques to advance understanding in their field. Their recent work focuses on developing novel approaches that combine interdisciplinary insights.
                        </p>
                      </div>
                      <div className="locked-summary-overlay" style={{ paddingBottom: "28px" }} onClick={() => setShowUpgradeModal(true)}>
                        <span style={{ fontSize: "1.6rem", marginBottom: "10px" }}>&#128274;</span>
                        <p style={{ fontSize: "1rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "6px" }}>
                          You&apos;ve used your free preview
                        </p>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "14px" }}>
                          Upgrade for unlimited access to all professors
                        </p>
                        <span className="locked-upgrade-btn" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
                          Upgrade to Semester
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Has remaining uses: show Summarize button */
                    <div style={{ marginTop: "28px" }}>
                      <button onClick={() => loadSummary(author)} disabled={isLoadingSummary} className="rm-summarize-btn">
                        {isLoadingSummary ? (
                          <>
                            <span className="loading-spinner" style={{ fontSize: "1rem" }}>&#127807;</span>
                            Generating summary...
                          </>
                        ) : (
                          <>Summarize research <span style={{ fontSize: "1.1em", marginLeft: "2px" }}>→</span></>
                        )}
                      </button>
                      {!isPaid && !isLoadingSummary && (
                        <span className="rm-free-hint">
                          {getSummariesRemaining()} free {getSummariesRemaining() === 1 ? "use" : "uses"} remaining {"\u2014"} unlocks all features for this professor
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* LOCKED PROFESSORS PROMPT — shown when there are more than 3 results */}
        {!isPaid && !showSaved && displayList.length > 3 && (
          <div style={{
            marginTop: "8px",
            background: "linear-gradient(135deg, rgba(45,90,61,0.06) 0%, rgba(45,90,61,0.03) 100%)",
            border: "1.5px solid rgba(45,90,61,0.15)",
            borderRadius: "20px",
            padding: "32px 28px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "1.4rem", marginBottom: "12px" }}>🔒</p>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#2d5a3d", marginBottom: "8px" }}>
              {displayList.length - 3} more professor{displayList.length - 3 === 1 ? "" : "s"} found for your search
            </p>
            <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "22px", maxWidth: "420px", margin: "0 auto 22px" }}>
              Upgrade to see all results, get unlimited searches, and access every email tool.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{
                background: "#2d5a3d",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "14px 32px",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(45,90,61,0.25)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(45,90,61,0.35)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(45,90,61,0.25)"; }}
            >
              {`Unlock all ${displayList.length} professors →`}
            </button>
          </div>
        )}

        {/* NEARBY PROFESSORS */}
        {!showSaved && results.length > 0 && (nearbyLoading || nearbyProfs.length > 0) && (
          <div style={{ marginTop: "60px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(45, 90, 61,0.5), transparent)" }} />
              <h2 style={{
                fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d",
                letterSpacing: "-0.01em",
              }}>
                Nearby researchers
              </h2>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(45, 90, 61,0.5), transparent)" }} />
            </div>

            {nearbyLoading && (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <span className="loading-spinner">🍃</span>
                <p style={{ color: "#6b7280", marginTop: "10px", fontSize: "0.9rem" }}>Finding similar researchers...</p>
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
                  {/* Lock overlay for free users who haven't summarized anyone yet */}
                  {isFree && Object.keys(summaries).length === 0 && (
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
                        Summarize a professor to unlock
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "#6b7280", textAlign: "center" }}>
                        Use your free Summarize on any professor above to see nearby researchers
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
                  <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "12px" }}>
                    {formatInstitutionLocation(author.last_known_institutions?.[0])}
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {author.topics?.slice(0, 3).map((t, j) => (
                      <span key={j} className="tag" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>{t.display_name}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "#6b7280" }}>
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
                      <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "#6b7280" }}>
                        {summaries[author.id.split("/").pop()!].summary}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

          </>
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
                    <button onClick={() => { setEmailTarget(null); setEmailDraft(""); setEmailFlags([]); setHasChecked(false); }} style={{ fontSize: "1.5rem", color: "#6b7280", background: "none", border: "none", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => (e.currentTarget.style.transform = "rotate(90deg)")} onMouseLeave={e => (e.currentTarget.style.transform = "rotate(0deg)")}>&times;</button>
                  </div>

                  {/* Check their website banner */}
                  <div style={{ padding: "14px 18px", background: "rgba(45, 90, 61,0.08)", border: "1.5px solid rgba(45, 90, 61,0.18)", borderRadius: "14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>&#128161;</span>
                    <p style={{ fontSize: "0.85rem", color: "#2d5a3d", lineHeight: 1.6 }}>
                      <strong>Before emailing</strong>, check the professor&apos;s faculty page for specific contact instructions. Less than 5% of students do this and it instantly sets you apart.
                    </p>
                  </div>

                  {/* Volunteer framing tip */}
                  <div style={{ padding: "12px 18px", background: "rgba(45, 90, 61,0.12)", border: "1px solid rgba(45, 90, 61,0.25)", borderRadius: "14px", marginBottom: "16px" }}>
                    <p style={{ fontSize: "0.82rem", color: "#2d5a3d", lineHeight: 1.6 }}>
                      <strong>Tip:</strong> Consider saying you&apos;d like to <em>volunteer</em> rather than asking for a position. It lowers the commitment for professors and makes them more likely to say yes.
                    </p>
                  </div>

                  {/* Email Framework toggle — requires account */}
                  <div style={{ marginBottom: "16px" }}>
                    {user ? (
                    <button
                      onClick={() => setShowFramework(v => !v)}
                      style={{
                        width: "100%", padding: "10px 18px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "transparent",
                        border: "1.5px solid rgba(45,90,61,0.35)",
                        borderRadius: "12px", cursor: "pointer",
                        fontFamily: "DM Sans, Inter, sans-serif",
                        fontSize: "0.88rem", fontWeight: 600, color: "#2d5a3d",
                        transition: "background 0.2s",
                      }}
                    >
                      <span>✦ Email Framework</span>
                      <span style={{ fontSize: "0.8rem", transition: "transform 0.2s", transform: showFramework ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>↓</span>
                    </button>
                    ) : (
                    <button
                      onClick={() => { setShowAuthModal(true); setAuthMode("signup"); setAuthError(""); }}
                      style={{
                        width: "100%", padding: "10px 18px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "transparent",
                        border: "1.5px solid rgba(45,90,61,0.2)",
                        borderRadius: "12px", cursor: "pointer",
                        fontFamily: "DM Sans, Inter, sans-serif",
                        fontSize: "0.88rem", fontWeight: 600, color: "#6b7280",
                        transition: "background 0.2s",
                      }}
                    >
                      <span>✦ Email Framework</span>
                      <span style={{ fontSize: "0.72rem", background: "rgba(45,90,61,0.08)", padding: "3px 10px", borderRadius: "999px", color: "#2d5a3d" }}>Free with account</span>
                    </button>
                    )}

                    {showFramework && (
                      <div style={{
                        marginTop: "10px",
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(45,90,61,0.15)",
                        borderRadius: "14px", padding: "20px",
                      }}>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Template</p>
                        <p style={{ fontSize: "0.85rem", lineHeight: 1.8, color: "#1a1a1a", marginBottom: "16px" }}>
                          &ldquo;I came across your recent work on{" "}
                          <span style={{ background: "rgba(45,90,61,0.1)", color: "#2d5a3d", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>[SPECIFIC TOPIC]</span>
                          {" "}and was particularly struck by{" "}
                          <span style={{ background: "rgba(45,90,61,0.1)", color: "#2d5a3d", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>[SPECIFIC FINDING]</span>
                          . This connects directly to my interest in{" "}
                          <span style={{ background: "rgba(45,90,61,0.1)", color: "#2d5a3d", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>[YOUR RESEARCH ANGLE]</span>
                          {" "}because{" "}
                          <span style={{ background: "rgba(45,90,61,0.1)", color: "#2d5a3d", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>[ONE GENUINE REASON]</span>
                          . I&apos;m especially curious whether{" "}
                          <span style={{ background: "rgba(45,90,61,0.1)", color: "#2d5a3d", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>[INTELLIGENT QUESTION]</span>
                          .&rdquo;
                        </p>
                        <div style={{ height: "1px", background: "rgba(45,90,61,0.12)", marginBottom: "14px" }} />
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c45c5c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Avoid These Phrases</p>
                        {[
                          { phrase: "I found your work fascinating", reason: "Name the specific finding instead." },
                          { phrase: "I am highly motivated", reason: "Show it through what you've done." },
                          { phrase: "Your research aligns with my interests", reason: "Explain the specific connection." },
                          { phrase: "I would love to learn from you", reason: "Ask about their research instead." },
                          { phrase: "I am passionate about this field", reason: "Describe what you've actually done." },
                        ].map((item, i) => (
                          <div key={i} style={{ marginBottom: "8px" }}>
                            <p style={{ fontSize: "0.82rem", fontStyle: "italic", color: "#9b2c2c", margin: "0 0 2px" }}>&ldquo;{item.phrase}&rdquo;</p>
                            <p style={{ fontSize: "0.77rem", color: "#9ca3af", margin: 0 }}>{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
                    <button onClick={handleCopy} disabled={!emailDraft.trim()} style={{ fontSize: "1rem", color: "#6b7280", background: "none", border: "none", cursor: emailDraft.trim() ? "pointer" : "default", opacity: emailDraft.trim() ? 1 : 0.3, fontFamily: "var(--font-playfair), Georgia, serif", transition: "color 0.2s" }}
                      onMouseEnter={e => { if (emailDraft.trim()) e.currentTarget.style.color = "#2d5a3d"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#6b7280"; }}
                    >
                      Copy to clipboard
                    </button>
                    <span style={{ marginLeft: "auto", fontSize: "0.9rem", fontWeight: 700, color: wordCount > 200 ? "#c45c5c" : "#6b7280", background: wordCount > 200 ? "rgba(196, 92, 92,0.08)" : "transparent", padding: "6px 14px", borderRadius: "999px", transition: "all 0.3s ease" }}>
                      {wordCount} words
                    </span>
                  </div>
                  {hasChecked && emailFlags.length > 0 && (
                    <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {emailFlags.map((flag, i) => (
                        <div key={i} className={`flag-enter ${flag.type === "error" ? "flag-error" : "flag-warning"}`} style={{ padding: "16px 20px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: flag.type === "error" ? "#c45c5c" : "#A8893E" }}>{flag.type === "error" ? "\u26A0" : "\u25CF"} {flag.issue}</span>
                          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "4px" }}>{flag.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasChecked && emailFlags.length === 0 && (
                    <div className="email-pass" style={{ marginTop: "20px", padding: "20px 24px", textAlign: "center" }}>
                      <p style={{ fontSize: "1.4rem", marginBottom: "6px" }}>&#127881;</p>
                      <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#2d5a3d" }}>Perfect email! No issues found.</p>
                      <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "6px" }}>Copy it and send it with confidence.</p>
                    </div>
                  )}
                  {!hasChecked && emailDraft.trim().length > 0 && !checkingEmail && (
                    <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "#6b7280" }}>Hit &quot;Check my email&quot; when you&apos;re ready for feedback.</p>
                  )}
                </div>
                <div className="modal-sidebar rm-modal-right">
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px" }}>Reference</p>
                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a1a1a" }}>{emailTarget.display_name}</p>
                    <p style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "4px" }}>{formatInstitutionLocation(emailTarget.last_known_institutions?.[0])}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                      {emailTarget.topics?.slice(0, 4).map((t, i) => <span key={i} className="tag" style={{ fontSize: "0.7rem" }}>{t.display_name}</span>)}
                    </div>
                  </div>
                  <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #8aaa96, transparent)", opacity: 0.5, marginBottom: "24px" }} />
                  {isLoadingTargetSummary && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <span className="loading-spinner">&#127807;</span>
                      <p style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "8px" }}>Loading research info...</p>
                    </div>
                  )}
                  {targetSummary && (
                    <>
                      <div style={{ marginBottom: "24px" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Their Research</p>
                        <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.7 }}>{targetSummary.summary}</p>
                      </div>
                      {targetSummary.highlights.length > 0 && (
                        <div style={{ marginBottom: "24px" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Papers to Mention</p>
                          {targetSummary.highlights.map((h, i) => (
                            <div key={i} style={{ marginBottom: "14px" }}>
                              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2d5a3d" }}>
                                {h.paper}
                                {h.doi && (
                                  <a href={h.doi} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 400, fontSize: "0.75rem", marginLeft: "8px", color: "#2d5a3d" }}>
                                    Read →
                                  </a>
                                )}
                              </p>
                              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "3px" }}>{h.detail}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {targetSummary.questions.length > 0 && (
                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Questions to Ask</p>
                          {targetSummary.questions.map((q, i) => (
                            <p key={i} style={{ fontSize: "0.8rem", color: "#6b7280", paddingLeft: "14px", borderLeft: "2px solid #9dbfaa", marginBottom: "12px", lineHeight: 1.6 }}>{q}</p>
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
          <div className="glass-card rm-modal-card" style={{ padding: "40px", maxWidth: "400px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "8px" }}>
              {authMode === "signup" ? "Create your free account" : "Welcome back"}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "24px" }}>
              {authModalCopy || (authMode === "signup" ? "Free access to research summaries, email checker, and more." : "Log in to your account.")}
            </p>
            {authError && <p style={{ fontSize: "0.85rem", color: "#c45c5c", marginBottom: "16px", background: "rgba(196, 92, 92,0.08)", padding: "10px 14px", borderRadius: "10px" }}>{authError}</p>}
            <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: "1rem", border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "12px", background: "rgba(255,255,255,0.5)", color: "#1a1a1a", fontFamily: "inherit", marginBottom: "12px", outline: "none" }} />
            <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: "1rem", border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "12px", background: "rgba(255,255,255,0.5)", color: "#1a1a1a", fontFamily: "inherit", marginBottom: "12px", outline: "none" }} />
            {authMode === "signup" && (
              <input type="text" placeholder="Promo code (optional)" value={authPromoCode} onChange={(e) => setAuthPromoCode(e.target.value)} style={{ width: "100%", padding: "12px 16px", fontSize: "1rem", border: "1.5px solid rgba(45, 90, 61,0.4)", borderRadius: "12px", background: "rgba(255,255,255,0.5)", color: "#1a1a1a", fontFamily: "inherit", marginBottom: "20px", outline: "none" }} />
            )}
            {authMode !== "signup" && <div style={{ marginBottom: "8px" }} />}
            <button disabled={authLoading} onClick={async () => {
              setAuthLoading(true); setAuthError("");
              try {
                if (authMode === "signup") {
                  const { error, promoApplied } = await signUp(authEmail, authPassword, authPromoCode || undefined);
                  if (error) { setAuthError(error.message); } else { setShowAuthModal(false); setAuthPromoCode(""); showToast(promoApplied ? "Account created with Student access! Check your email to confirm." : "Account created! Check your email to confirm."); }
                } else {
                  const { error } = await signIn(authEmail, authPassword);
                  if (error) { setAuthError(error.message); } else { setShowAuthModal(false); showToast("Welcome back!"); }
                }
              } catch (err: unknown) { setAuthError(err instanceof Error ? err.message : "Something went wrong"); }
              finally { setAuthLoading(false); }
            }} className="btn-cta rm-search-btn" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>
              {authLoading ? "Loading..." : authMode === "signup" ? "Sign up" : "Log in"}
            </button>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", textAlign: "center", marginTop: "16px" }}>
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
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(245,240,230,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setShowUpgradeModal(false)}>
          <div className="glass-card rm-modal-card" style={{ padding: "28px 28px 24px", maxWidth: "480px", width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUpgradeModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#9ca3af", lineHeight: 1 }}>✕</button>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2d5a3d", marginBottom: "6px", paddingRight: "24px" }}>{upgradeModalTitle || "Upgrade your plan"}</h3>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "16px" }}>{upgradeModalSubtitle || "Unlimited summaries, email checker, and professor email finder."}</p>

            {/* Lifetime option — featured on top */}
            <div style={{ marginBottom: "12px", padding: "16px", borderRadius: "14px", border: "2px solid rgba(168,137,62,0.5)", boxShadow: "0 0 20px rgba(168,137,62,0.1)", background: "rgba(168,137,62,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#A8893E", textTransform: "uppercase", letterSpacing: "0.1em" }}>Lifetime</p>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #A8893E, #c9a84c)", padding: "3px 9px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Best Value</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "1.7rem", fontWeight: 800, color: "#A8893E" }}>$59</span>
                <span style={{ fontSize: "0.8rem", color: "#A8893E", fontWeight: 600 }}>one-time</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#9b8040", marginBottom: "10px" }}>That&apos;s less than 2 semesters. Never pay again.</p>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "12px" }}>
                {["Everything in Semester, forever", "One payment, lifetime access", "Emails That Worked + Email Template"].map((f) => (
                  <li key={f} style={{ fontSize: "0.8rem", color: "#6b7280", padding: "3px 0", display: "flex", gap: "7px" }}>
                    <span style={{ color: "#A8893E" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={async () => {
                if (!user) { setShowUpgradeModal(false); setShowAuthModal(true); setAuthMode("signup"); return; }
                try {
                  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME || "price_1TIuBBFINW44xCyFoSCtUpFN";
                  const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId, userId: user.id }) });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch { showToast("Something went wrong. Try again."); }
              }} className="btn-cta rm-search-btn" style={{ width: "100%", padding: "12px", fontSize: "0.95rem", background: "linear-gradient(135deg, #A8893E, #c9a84c)" }}>
                Claim Lifetime Access — $59
              </button>
            </div>

            {/* Semester option */}
            <div style={{ padding: "16px", borderRadius: "14px", border: "1.5px solid rgba(45,90,61,0.2)", background: "rgba(45,90,61,0.03)" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#2d5a3d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Semester</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "1.7rem", fontWeight: 800, color: "#2d5a3d" }}>$29</span>
                <span style={{ fontSize: "0.8rem", color: "#2d5a3d", fontWeight: 500 }}>/ 4 months</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "10px" }}>One semester. Everything you need to land a position.</p>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "12px" }}>
                {["Unlimited research summaries", "Email checker with red-flag detection", "Professor email finder", "Professor responsiveness indicator", "Emails That Worked + Email Template"].map((f) => (
                  <li key={f} style={{ fontSize: "0.8rem", color: "#6b7280", padding: "3px 0", display: "flex", gap: "7px" }}>
                    <span style={{ color: "#2d5a3d" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={async () => {
                if (!user) { setShowUpgradeModal(false); setShowAuthModal(true); setAuthMode("signup"); return; }
                try {
                  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTER || "price_1TIuAlFINW44xCyFcxqgQpeV";
                  const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId, userId: user.id }) });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch { showToast("Something went wrong. Try again."); }
              }} className="btn-cta rm-search-btn" style={{ width: "100%", padding: "12px", fontSize: "0.95rem" }}>
                Get Semester Access — $29
              </button>
            </div>

            <p style={{ fontSize: "0.74rem", color: "#9b8040", textAlign: "center", marginTop: "14px", fontWeight: 600 }}>Get a professor reply in 30 days or your money back.</p>
            <p style={{ fontSize: "0.68rem", color: "#9ca3af", textAlign: "center", marginTop: "3px" }}>Powered by Stripe.</p>
          </div>
        </div>
      )}
    </>
  );
}
