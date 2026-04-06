import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome Preview - Research Match",
  robots: "noindex, nofollow",
};

export default function WelcomeTestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
