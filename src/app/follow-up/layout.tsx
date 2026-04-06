import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Follow-Up Timeline Generator - Research Match",
  description: "Paste your original professor email and get two perfectly-timed follow-up drafts. Never wonder when or what to send again.",
  openGraph: {
    title: "Follow-Up Timeline Generator - Research Match",
    description: "Paste your original professor email and get two perfectly-timed follow-up drafts.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function FollowUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
