import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cold Emails That Got Professor Replies - Research Match",
  description: "See 2 real cold emails that got responses from professors at Princeton and ASU, broken down line by line with annotations.",
  openGraph: {
    title: "Cold Emails That Got Professor Replies - Research Match",
    description: "See 2 real cold emails that got responses from professors at Princeton and ASU, broken down line by line with annotations.",
    type: "website",
    siteName: "Research Match",
  },
};

export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
