// Per-post social share image for /blog/[slug]. Pre-rendered at build (posts are
// a local array) so unfurl traffic serves cached PNGs instead of invoking satori.
import { posts } from "../posts";
import { brandOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Research Match blog post";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  return brandOgImage({
    kicker: "Research Match Guide",
    title: post?.title ?? "Find research professors in minutes",
    subtitle: post?.description,
  });
}
