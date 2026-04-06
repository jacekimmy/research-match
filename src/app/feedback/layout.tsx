import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback - Research Match",
  description: "Share your experience with Research Match. Help us build a better tool for students looking for research opportunities.",
  openGraph: {
    title: "Feedback - Research Match",
    description: "Share your experience with Research Match. Help us build a better tool for students looking for research opportunities.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
