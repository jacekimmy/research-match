import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works - Research Match",
  description: "Learn how Research Match helps you find the right professor, understand their research, and write a cold email that gets a reply — in three steps.",
  openGraph: {
    title: "How It Works - Research Match",
    description: "Learn how Research Match helps you find the right professor, understand their research, and write a cold email that gets a reply — in three steps.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
