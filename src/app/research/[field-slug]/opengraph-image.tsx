// Per-field social share image for /research/[field-slug]. Pre-rendered at build
// (like the page itself) — the inputs are local, so nothing needs request-time work.
import { RESEARCH_FIELDS, getResearchField, fieldHeadline } from "@/lib/research-fields";
import { brandOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Research Match field guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return RESEARCH_FIELDS.map((f) => ({ "field-slug": f.slug }));
}

type Props = { params: Promise<{ "field-slug": string }> };

export default async function Image({ params }: Props) {
  const { "field-slug": slug } = await params;
  const field = getResearchField(slug);
  return brandOgImage({
    kicker: "Research Field Guide",
    title: field ? fieldHeadline(field.name) : "Find research professors in minutes",
    subtitle: field
      ? `See which ${field.name} professors are publishing right now and how to email them a note that gets a reply.`
      : undefined,
  });
}
