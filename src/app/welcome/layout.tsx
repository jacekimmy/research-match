import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome - Research Match",
  robots: "noindex, nofollow",
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
