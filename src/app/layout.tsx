import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Research Match - Find Research Professors in Minutes",
  description: "Search any research interest and university. Get professor matches, plain-English paper summaries, and an email framework built on advice from real professors.",
  openGraph: {
    title: "Research Match - Find Research Professors in Minutes",
    description: "Search any research interest and university. Get professor matches, plain-English paper summaries, and an email framework built on advice from real professors.",
    type: "website",
    siteName: "Research Match",
  },
  twitter: {
    card: "summary_large_image",
    title: "Research Match - Find Research Professors in Minutes",
    description: "Search any research interest and university. Get professor matches, plain-English paper summaries, and an email framework built on advice from real professors.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
