import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Email Framework - How to Write the Email That Gets a Reply",
  description: "A fill-in-the-blank template for cold emailing professors, built on advice from real professors. Avoid the phrases that get your email deleted.",
  openGraph: {
    title: "Research Email Framework - How to Write the Email That Gets a Reply",
    description: "A fill-in-the-blank template for cold emailing professors, built on advice from real professors. Avoid the phrases that get your email deleted.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function FrameworkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
