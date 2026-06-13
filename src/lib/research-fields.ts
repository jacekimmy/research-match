// Single source of truth for the programmatic /research/[field-slug] SEO pages.
// Used by the fetch + content-generation scripts AND by the page's
// generateStaticParams, so the route set, the data, and the sitemap never drift.

export interface ResearchField {
  /** URL slug, e.g. "machine-learning" → /research/machine-learning */
  slug: string;
  /** Human display name, e.g. "Machine Learning" */
  name: string;
  /** Term used to resolve this field to an OpenAlex topic at fetch time. */
  searchTerm: string;
  /** 3-4 related field slugs for in-body internal links (curated, topical). */
  related: string[];
}

export const RESEARCH_FIELDS: ResearchField[] = [
  { slug: "neuroscience", name: "Neuroscience", searchTerm: "neuroscience",
    related: ["cognitive-science", "psychology", "computational-biology", "biomedical-engineering"] },
  { slug: "computational-biology", name: "Computational Biology", searchTerm: "computational biology",
    related: ["bioinformatics", "genetics", "molecular-biology", "machine-learning"] },
  { slug: "bioinformatics", name: "Bioinformatics", searchTerm: "bioinformatics",
    related: ["computational-biology", "genetics", "molecular-biology", "machine-learning"] },
  { slug: "machine-learning", name: "Machine Learning", searchTerm: "machine learning",
    related: ["computational-biology", "bioinformatics", "cognitive-science", "biomedical-engineering"] },
  { slug: "cancer-biology", name: "Cancer Biology", searchTerm: "cancer biology",
    related: ["molecular-biology", "genetics", "immunology", "public-health"] },
  { slug: "immunology", name: "Immunology", searchTerm: "immunology",
    related: ["molecular-biology", "cancer-biology", "genetics", "public-health"] },
  { slug: "psychology", name: "Psychology", searchTerm: "psychology",
    related: ["cognitive-science", "neuroscience", "public-health", "epidemiology"] },
  { slug: "organic-chemistry", name: "Organic Chemistry", searchTerm: "organic chemistry",
    related: ["materials-science", "molecular-biology", "biomedical-engineering", "cancer-biology"] },
  { slug: "materials-science", name: "Materials Science", searchTerm: "materials science",
    related: ["organic-chemistry", "biomedical-engineering", "machine-learning"] },
  { slug: "genetics", name: "Genetics", searchTerm: "genetics",
    related: ["molecular-biology", "computational-biology", "bioinformatics", "cancer-biology"] },
  { slug: "public-health", name: "Public Health", searchTerm: "public health",
    related: ["epidemiology", "immunology", "psychology"] },
  { slug: "epidemiology", name: "Epidemiology", searchTerm: "epidemiology",
    related: ["public-health", "immunology", "psychology", "computational-biology"] },
  { slug: "molecular-biology", name: "Molecular Biology", searchTerm: "molecular biology",
    related: ["genetics", "cancer-biology", "immunology", "bioinformatics"] },
  { slug: "biomedical-engineering", name: "Biomedical Engineering", searchTerm: "biomedical engineering",
    related: ["materials-science", "machine-learning", "neuroscience", "organic-chemistry"] },
  { slug: "cognitive-science", name: "Cognitive Science", searchTerm: "cognitive science",
    related: ["psychology", "neuroscience", "machine-learning"] },
];

export const RESEARCH_FIELD_SLUGS = RESEARCH_FIELDS.map((f) => f.slug);

export function getResearchField(slug: string): ResearchField | undefined {
  return RESEARCH_FIELDS.find((f) => f.slug === slug);
}
