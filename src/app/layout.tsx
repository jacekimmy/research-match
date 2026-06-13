import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Hanken_Grotesk, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/lib/auth-context";
import AnalyticsInit from "./AnalyticsInit";

const inter = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://researchmatch.site"),
  verification: {
    google: "s_3kAnRUjvOPzjElpM04zRSPoHf08YAFpfOWvUJDYDw",
  },
  title: "Research Match - Find Research Professors in Minutes",
  description: "Search any research interest and university. Get professor matches, plain-English paper summaries, and an email framework built on advice from real professors.",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <AnalyticsInit />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
