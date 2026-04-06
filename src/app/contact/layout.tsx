import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Research Match",
  description: "Get in touch with the Research Match team. Questions, feedback, or partnership inquiries welcome.",
  openGraph: {
    title: "Contact - Research Match",
    description: "Get in touch with the Research Match team. Questions, feedback, or partnership inquiries welcome.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
