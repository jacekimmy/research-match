import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Profile - Research Match",
  description: "Manage your Research Match account, view your plan, and track your saved professors.",
  openGraph: {
    title: "Your Profile - Research Match",
    description: "Manage your Research Match account, view your plan, and track your saved professors.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
