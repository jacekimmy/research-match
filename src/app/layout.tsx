import type { Metadata } from "next";
import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
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
