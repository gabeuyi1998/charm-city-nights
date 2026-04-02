import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Charm City Nights — Baltimore's Nightlife App",
  description:
    "Discover live crowds, collect badges, join bar crawls. Baltimore's first nightlife gamification app. Join the waitlist.",
  keywords: [
    "Baltimore nightlife",
    "bar app Baltimore",
    "bar crawl Baltimore",
    "Fells Point bars",
    "Federal Hill nightlife",
    "things to do Baltimore",
  ],
  openGraph: {
    title: "Charm City Nights — Baltimore's Nightlife App",
    description:
      "Discover live crowds, collect badges, join bar crawls. Baltimore's first nightlife gamification app.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Charm City Nights — Baltimore's Nightlife App",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${bebasNeue.variable} ${outfit.variable} bg-[#131313] text-[#E5E2E1] antialiased`}
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#1C1B1B",
              border: "1px solid rgba(255,92,0,0.3)",
              color: "#E5E2E1",
            },
          }}
        />
      </body>
    </html>
  );
}
