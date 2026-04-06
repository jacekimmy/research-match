import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search for Research Professors - Research Match",
  description: "Enter your research interest and university to find professors actively publishing in your area. Get summaries, email guidance, and more.",
  openGraph: {
    title: "Search for Research Professors - Research Match",
    description: "Enter your research interest and university to find professors actively publishing in your area. Get summaries, email guidance, and more.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
